import { PrivateKey } from "@aleohq/sdk";

import { Vlink_council_v2Contract } from "../artifacts/js/vlink_council_v2";
import { Vlink_bridge_council_v2Contract } from "../artifacts/js/vlink_bridge_council_v2";
import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../artifacts/js/vlink_token_service_v2";

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
  getExternalProposalLeo,
  getProposalVoteLeo
} from "../artifacts/js/js2leo/vlink_council_v2";
import {
  ExternalProposal,
  ProposalVote,
  ProposalVoterKey
} from "../artifacts/js/types/vlink_council_v2";


import { WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v2";

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
} from "../artifacts/js/types/vlink_bridge_council_v2";

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
} from "../artifacts/js/js2leo/vlink_bridge_council_v2";
import { Vlink_holding_v2Contract } from "../artifacts/js/vlink_holding_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";
import { TbUpdateThreshold } from "../artifacts/js/types/vlink_bridge_council_v2";
import { getTbUpdateThreshold } from "../artifacts/js/leo2js/vlink_bridge_council_v2";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX } from "../utils/testdata.data";
import { getTbUpdateThresholdLeo } from "../artifacts/js/js2leo/vlink_bridge_council_v2";


const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/7_bridgeCouncil.test.ts

const council = new Vlink_council_v2Contract({ mode });
const holding = new Vlink_holding_v2Contract({ mode })
const tokenRegistry = new Token_registryContract({ mode })
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode });
const bridge = new Vlink_token_bridge_v2Contract({ mode });
const tokenService = new Vlink_token_service_v2Contract({ mode });

const TAG_TB_TRANSFER_OWNERSHIP = 1;
const TAG_TB_ADD_ATTESTOR = 2;
const TAG_TB_REMOVE_ATTESTOR = 3;
const TAG_TB_UPDATE_THRESHOLD = 4;
const TAG_TB_ADD_CHAIN = 5;
const TAG_TB_REMOVE_CHAIN = 6;
const TAG_TB_ADD_SERVICE = 7;
const TAG_TB_REMOVE_SERVICE = 8;
const TAG_TB_PAUSE = 9;
const TAG_TB_UNPAUSE = 10;


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
  let aleo_sequence = BigInt(500);
  let eth_sequence = BigInt(750);

  describe("deployment", () => {
    test(
      "Deploy Token registery",
      async () => {
        const deployTx = await tokenRegistry.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );
    test(
      "Deploy Holding",
      async () => {
        const deployTx = await holding.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );

    test(
      "Deploy Bridge",
      async () => {
        const deployTx = await bridge.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );

    test(
      "Deploy Token Service",
      async () => {
        const deployTx = await tokenService.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test(
      "Deploy Council",
      async () => {
        const deployTx = await council.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test(
      "Deploy Bridge Council",
      async () => {
        const deployTx = await bridgeCouncil.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );
  })

  describe("Initialization", () => {
    test("Initialize Bridge", async () => {
      const isBridgeInitialized = (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;
      if (!isBridgeInitialized) {
        const initializeTx = await bridge.initialize_tb(
          [councilMember1, councilMember2, councilMember3, aleoUser4, ALEO_ZERO_ADDRESS],
          threshold,
          admin,
          aleo_sequence,
          eth_sequence
        );
        await initializeTx.wait();
      }
    },
      TIMEOUT
    );

    test(
      "Initialize Council",
      async () => {
        const initialThreshold = 1;
        let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;
        if (!isCouncilInitialized) {
          const initializeTx = await council.initialize(
            [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS], initialThreshold
          );
          await initializeTx.wait();
          expect(await council.members(councilMember1)).toBe(true);
          expect(await council.members(councilMember2)).toBe(true);
          expect(await council.members(councilMember3)).toBe(true);
          expect(await council.members(ALEO_ZERO_ADDRESS)).toBe(true);
          expect(await council.members(aleoUser4, false)).toBe(false);
          expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(initialThreshold);
          expect(await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)).toBe(3);
          expect(await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toBe(BigInt(0));
        }
      },
      TIMEOUT
    );

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(bridgeCouncil.address());
    }, TIMEOUT);
  })

  describe("Add Chain", () => {
    const newChainId = ethChainId;
    console.log("New chain id", newChainId);
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

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
        tag: TAG_TB_ADD_CHAIN,
        id: proposalId,
        chain_id: newChainId
      };
      const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: tbAddChainProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      council.connect(councilMember1);
      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
      expect(await council.proposal_vote_counts(ExternalProposalHash)).toBe(1)
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const ans = await council.proposal_executed(ExternalProposalHash, false)
      expect(ans).toBe(false);
      console.log("Proposal executed ", ans)
      council.connect(councilMember1);
      const tx = await bridgeCouncil.tb_add_chain(proposalId, newChainId, signers);
      await tx.wait();

      expect(await bridge.supported_chains(newChainId)).toBe(true);
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT)

  })

  describe("Remove Chain", () => {
    const newChainId = ethChainId;
    const proposer = councilMember1;
    let proposalId: number;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.supported_chains(newChainId, false)).toBe(true);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbRemoveChain: TbRemoveChain = {
        tag: TAG_TB_REMOVE_CHAIN,
        id: proposalId,
        chain_id: newChainId
      };
      const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: tbRemoveChainProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);

      const tx = await bridgeCouncil.tb_remove_chain(proposalId, newChainId, signers);
      await tx.wait();

      const isSupportedChain = await bridge.supported_chains(ethChainId, false);
      expect(isSupportedChain).toBe(false);
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Add Attestor", () => {
    const proposer = councilMember1;
    const newAttestor = new PrivateKey().to_address().to_string()
    const newThreshold = 2;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.attestors(newAttestor, false)).toBe(false);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const addAttestor: TbAddAttestor = {
        tag: TAG_TB_ADD_ATTESTOR,
        id: proposalId,
        new_attestor: newAttestor,
        new_threshold: newThreshold,
      };
      const addAttestorHash = hashStruct(
        getTbAddAttestorLeo(addAttestor)
      );

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: addAttestorHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
      expect(await council.proposal_vote_counts(ExternalProposalHash)).toBe(1)

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_add_attestor(proposalId, newAttestor, newThreshold, signers);
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
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
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.attestors(existingAttestor, false)).toBe(true);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const removeAttestor: TbRemoveAttestor = {
        tag: TAG_TB_REMOVE_ATTESTOR,
        id: proposalId,
        existing_attestor: existingAttestor,
        new_threshold: newThreshold,
      };
      const removeAttestorHash = hashStruct(
        getTbRemoveAttestorLeo(removeAttestor)
      );

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: removeAttestorHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_remove_attestor(proposalId, existingAttestor, newThreshold, signers);
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await bridge.attestors(existingAttestor, false)).toBe(false);
      expect(await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)).toBe(newThreshold);
      const finalTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
      expect(finalTotalAttestors).toBe(initialTotalAttestors - 1);
    }, TIMEOUT);

  });

  describe("Add Service", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.supported_services(tokenService.address(), false)).toBe(false);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const addServiceProposal: TbAddService = {
        tag: TAG_TB_ADD_SERVICE,
        id: proposalId,
        service: tokenService.address(),
      };
      const addServiceProposalHash = hashStruct(getTbAddServiceLeo(addServiceProposal));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: addServiceProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_add_service(proposalId, tokenService.address(), signers);
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
    }, TIMEOUT);

  });


  describe("Remove Service", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const reoveServiceProposal: TbRemoveService = {
        tag: TAG_TB_REMOVE_SERVICE,
        id: proposalId,
        service: tokenService.address(),
      };
      const removeServiceProposalHash = hashStruct(getTbRemoveServiceLeo(reoveServiceProposal));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: removeServiceProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_remove_service(proposalId, tokenService.address(), signers);
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await bridge.supported_services(tokenService.address(), false)).toBe(false);
    }, TIMEOUT);

  });

  describe("UnPause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_PAUSED_VALUE);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbPause: TbUnpause = {
        tag: TAG_TB_UNPAUSE,
        id: proposalId,
      };
      const tbPauseProposalHash = hashStruct(getTbUnpauseLeo(tbPause));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: tbPauseProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
      expect(await council.proposal_vote_counts(ExternalProposalHash)).toBe(1)
      let current_threshold_index: number = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
      console.log(current_threshold_index, "current_threshold_index");
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_unpause(proposalId, signers);
      await tx.wait();

      // expect(await council.proposal_executed(tbPauseProposalHash)).toBe(true);
      // expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Pause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbPause: TbPause = {
        tag: TAG_TB_PAUSE,
        id: proposalId,
      };
      const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: tbPauseProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_pause(proposalId, signers);
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);

      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Update thereshold", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    let new_threshold = 2;

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.owner_TB(true)).toBe(bridgeCouncil.address());
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)


    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbUpdateThreshold: TbUpdateThreshold = {
        tag: TAG_TB_UPDATE_THRESHOLD,
        id: proposalId,
        new_threshold,
      }
      console.log(tbUpdateThreshold, "tb update threshold");

      const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: tbUpdateThresholdProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_update_threshold(proposalId, new_threshold, signers);
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      let current_threshold_index: number = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
      expect(current_threshold_index).toBe(new_threshold);
    }, TIMEOUT);
  })

  describe("Transfer Ownership", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await bridge.owner_TB(true)).toBe(bridgeCouncil.address());
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tbTransferOwnership: TbTransferOwnership = {
        tag: TAG_TB_TRANSFER_OWNERSHIP,
        id: proposalId,
        new_owner: aleoUser5,
      }
      const tbTransferOwnershipProposalHash = hashStruct(getTbTransferOwnershipLeo(tbTransferOwnership));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: bridgeCouncil.address(),
        proposal_hash: tbTransferOwnershipProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await bridgeCouncil.tb_transfer_ownership(proposalId, aleoUser5, signers);
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await bridge.owner_TB(true)).toBe(aleoUser5);
    }, TIMEOUT);
  })
});