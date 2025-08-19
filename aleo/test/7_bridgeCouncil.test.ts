import { PrivateKey } from "@aleohq/sdk";

import { Vlink_council_v4Contract } from "../artifacts/js/vlink_council_v4";
import { Vlink_bridge_council_v4Contract } from "../artifacts/js/vlink_bridge_council_v4";
import { Vlink_token_bridge_v4Contract } from "../artifacts/js/vlink_token_bridge_v4";
import { Vlink_token_service_v4Contract } from "../artifacts/js/vlink_token_service_v4";

import {
  ALEO_ZERO_ADDRESS,
  BRIDGE_PAUSABILITY_INDEX,
  BRIDGE_PAUSED_VALUE,
  BRIDGE_THRESHOLD_INDEX,
  BRIDGE_TOTAL_ATTESTORS_INDEX,
  BRIDGE_UNPAUSED_VALUE,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
  OWNER_INDEX,
  ethChainId
} from "../utils/constants";
import {
  getProposalVoteLeo
} from "../artifacts/js/js2leo/vlink_council_v4";
import {
  ProposalVote,
  ProposalVoterKey
} from "../artifacts/js/types/vlink_council_v4";


import { WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v4";

import { hashStruct } from "../utils/hash";
import { ExecutionMode } from "@doko-js/core";
import {
  TbAddChain,
  TbAddAttestor,
  TbAddService,
  TbPause,
  TbRemoveAttestor,
  TbRemoveChain,
  TbRemoveService,
  TbUnpause,
  TbTransferOwnership
} from "../artifacts/js/types/vlink_bridge_council_v4";

import {
  getTbAddChainLeo,
  getTbAddAttestorLeo,
  getTbAddServiceLeo,
  getTbPauseLeo,
  getTbRemoveAttestorLeo,
  getTbRemoveChainLeo,
  getTbRemoveServiceLeo,
  getTbUnpauseLeo,
  getTbTransferOwnershipLeo
} from "../artifacts/js/js2leo/vlink_bridge_council_v4";


const mode = ExecutionMode.SnarkExecute;


const council = new Vlink_council_v4Contract({ mode });
const bridgeCouncil = new Vlink_bridge_council_v4Contract({ mode });
const bridge = new Vlink_token_bridge_v4Contract({ mode });
const tokenService = new Vlink_token_service_v4Contract({ mode });


const TIMEOUT = 300000_000;

const getVoteKeys = (proposalHash: bigint, voters: string[]): bigint[] => {
  const voteKeys = []
  for (let voter of voters) {
    const proposalVote: ProposalVote = {
      proposal: proposalHash,
      member: voter
    }
    const voteKey = hashStruct(getProposalVoteLeo(proposalVote))
    voteKeys.push(voteKey);
  }
  return voteKeys
}

const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();
const aleoUser5 = new PrivateKey().to_address().to_string()
const admin = bridgeCouncil.address();


describe("Bridge", () => {
  const threshold = 1;

  test("Initialize Bridge", async () => {
    const isBridgeInitialized = (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;
    if (!isBridgeInitialized) {
      const initializeTx = await bridge.initialize_tb(
        [councilMember1, councilMember2, councilMember3, aleoUser4, ALEO_ZERO_ADDRESS],
        threshold,
        admin
      );
      await initializeTx.wait();
    }
  },
    TIMEOUT
  );

  test("Ensure proper setup", async () => {
    expect(await bridge.owner_TB(OWNER_INDEX)).toBe(bridgeCouncil.address());
  }, TIMEOUT);

  describe("Add Chain", () => {
    const newChainId = ethChainId;
    console.log("New chain id", newChainId);
    const proposer = councilMember1;
    let proposalId = 0;
    let tbAddChainProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.supported_chains(newChainId, false)).toBe(false);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      console.log("Council address", council.address());
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbAddChain: TbAddChain = {
        id: proposalId,
        chain_id: newChainId
      };
      console.log("Proposal id", proposalId);
      tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain));

      council.connect(councilMember1);
      const tx = await council.propose(proposalId, tbAddChainProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(tbAddChainProposalHash);
      expect(await council.proposal_vote_counts(tbAddChainProposalHash)).toBe(1)
      console.log("Add chain proposal hash", tbAddChainProposalHash);
      console.log("Proposal hash", await council.proposals(proposalId));
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const ans = await council.proposal_executed(tbAddChainProposalHash, false)
      expect(ans).toBe(false);
      console.log("Proposal executed ", ans)
      council.connect(councilMember1);
      const tx = await bridgeCouncil.tb_add_chain(proposalId, newChainId, signers);
      await tx.wait();

      expect(await bridge.supported_chains(newChainId)).toBe(true);
      expect(await council.proposal_executed(tbAddChainProposalHash)).toBe(true);
    }, TIMEOUT)

  })

  describe("Remove Chain", () => {
    const newChainId = ethChainId;
    const proposer = councilMember1;
    let proposalId: number;
    let tbRemoveChainProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.supported_chains(newChainId, false)).toBe(true);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbRemoveChain: TbRemoveChain = {
        id: proposalId,
        chain_id: newChainId
      };
      tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain));
      const tx = await council.propose(proposalId, tbRemoveChainProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(tbRemoveChainProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(tbRemoveChainProposalHash, false)).toBe(false);

      const tx = await bridgeCouncil.tb_remove_chain(proposalId, newChainId, signers);
      await tx.wait();

      const isSupportedChain = await bridge.supported_chains(ethChainId, false);
      expect(isSupportedChain).toBe(false);
      expect(await council.proposal_executed(tbRemoveChainProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Add Attestor", () => {
    const proposer = councilMember1;
    const newAttestor = new PrivateKey().to_address().to_string()
    const newThreshold = 2;
    let proposalId = 0;
    let addAttestorHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.attestors(newAttestor, false)).toBe(false);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const addAttestor: TbAddAttestor = {
        id: proposalId,
        new_attestor: newAttestor,
        new_threshold: newThreshold,
      };
      addAttestorHash = hashStruct(
        getTbAddAttestorLeo(addAttestor)
      );
      const tx = await council.propose(proposalId, addAttestorHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(addAttestorHash);
      expect(await council.proposal_vote_counts(addAttestorHash)).toBe(1)

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);

      expect(await council.proposal_executed(addAttestorHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_add_attestor(proposalId, newAttestor, newThreshold, signers);
      await tx.wait();

      expect(await council.proposal_executed(addAttestorHash)).toBe(true);
      expect(await bridge.attestors(newAttestor)).toBe(true);
      expect(await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)).toBe(newThreshold);
      const finalTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
      expect(finalTotalAttestors).toBe(initialTotalAttestors + 1);
    }, TIMEOUT);

  });

  describe("Remove Attestor", () => {
    const proposer = councilMember1;
    const existingAttestor = councilMember2
    const newThreshold = 1;
    let proposalId = 0;
    let removeAttestorHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.attestors(existingAttestor, false)).toBe(true);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const removeAttestor: TbRemoveAttestor = {
        id: proposalId,
        existing_attestor: existingAttestor,
        new_threshold: newThreshold,
      };
      removeAttestorHash = hashStruct(
        getTbRemoveAttestorLeo(removeAttestor)
      );
      const tx = await council.propose(proposalId, removeAttestorHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(removeAttestorHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);

      expect(await council.proposal_executed(removeAttestorHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_remove_attestor(proposalId, existingAttestor, newThreshold, signers);
      await tx.wait();

      expect(await council.proposal_executed(removeAttestorHash)).toBe(true);
      expect(await bridge.attestors(existingAttestor, false)).toBe(false);
      expect(await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)).toBe(newThreshold);
      const finalTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
      expect(finalTotalAttestors).toBe(initialTotalAttestors - 1);
    }, TIMEOUT);

  });

  describe("Add Service", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let addServiceProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.supported_services(tokenService.address(), false)).toBe(false);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const addServiceProposal: TbAddService = {
        id: proposalId,
        service: tokenService.address(),
      };
      addServiceProposalHash = hashStruct(getTbAddServiceLeo(addServiceProposal));
      const tx = await council.propose(proposalId, addServiceProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(addServiceProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(addServiceProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_add_service(proposalId, tokenService.address(), signers);
      await tx.wait();

      expect(await council.proposal_executed(addServiceProposalHash)).toBe(true);
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
    }, TIMEOUT);

  });


  describe("Remove Service", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let removeServiceProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const reoveServiceProposal: TbRemoveService = {
        id: proposalId,
        service: tokenService.address(),
      };
      removeServiceProposalHash = hashStruct(getTbRemoveServiceLeo(reoveServiceProposal));
      const tx = await council.propose(proposalId, removeServiceProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(removeServiceProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(removeServiceProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_remove_service(proposalId, tokenService.address(), signers);
      await tx.wait();

      expect(await council.proposal_executed(removeServiceProposalHash)).toBe(true);
      expect(await bridge.supported_services(tokenService.address(), false)).toBe(false);
    }, TIMEOUT);

  });

  describe("UnPause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let tbPauseProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_PAUSED_VALUE);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbPause: TbUnpause = {
        id: proposalId,
      };
      tbPauseProposalHash = hashStruct(getTbUnpauseLeo(tbPause));
      const tx = await council.propose(proposalId, tbPauseProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(tbPauseProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(tbPauseProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_unpause(proposalId, signers);
      await tx.wait();

      expect(await council.proposal_executed(tbPauseProposalHash)).toBe(true);
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Pause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let tbPauseProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbPause: TbPause = {
        id: proposalId,
      };
      tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause));
      const tx = await council.propose(proposalId, tbPauseProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(tbPauseProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(tbPauseProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_pause(proposalId, signers);
      await tx.wait();

      expect(await council.proposal_executed(tbPauseProposalHash)).toBe(true);

      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Transfer Ownership", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let tbTransferOwnershipProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.owner_TB(true)).toBe(bridgeCouncil.address());
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbTransferOwnership: TbTransferOwnership = {
        id: proposalId,
        new_owner: aleoUser5,
      }
      tbTransferOwnershipProposalHash = hashStruct(getTbTransferOwnershipLeo(tbTransferOwnership));

      const tx = await council.propose(proposalId, tbTransferOwnershipProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(tbTransferOwnershipProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(tbTransferOwnershipProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_transfer_ownership(proposalId, aleoUser5, signers);
      await tx.wait();

      expect(await council.proposal_executed(tbTransferOwnershipProposalHash)).toBe(true);
      expect(await bridge.owner_TB(true)).toBe(aleoUser5);
    }, TIMEOUT);
  })

});