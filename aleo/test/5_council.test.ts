import { PrivateKey } from "@aleohq/sdk";

import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
import { Council_v0003Contract } from "../artifacts/js/council_v0003";
import { Wusdc_connector_v0003_0Contract } from "../artifacts/js/wusdc_connector_v0003_0";
import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003";

import {
  ALEO_ZERO_ADDRESS,
  BRIDGE_PAUSABILITY_INDEX,
  BRIDGE_PAUSED_VALUE,
  BRIDGE_THRESHOLD_INDEX,
  BRIDGE_TOTAL_ATTESTORS_INDEX,
  BRIDGE_UNPAUSED_VALUE,
  COUNCIL_THRESHOLD_INDEX,
  COUNCIL_TOTAL_MEMBERS_INDEX,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
  OWNER_INDEX,
  TOKEN_PAUSED_VALUE,
  TOKEN_UNPAUSED_VALUE,
  ethChainId
} from "../utils/constants";
import {
  getAddMemberLeo,
  getRemoveMemberLeo,
  getTbAddAttestorLeo,
  getTbAddChainLeo,
  getTbAddServiceLeo,
  getTbPauseLeo,
  getTbRemoveAttestorLeo,
  getTbRemoveChainLeo,
  getTbRemoveServiceLeo,
  getTbUnpauseLeo,
  getTsAddTokenLeo,
  getTsRemoveTokenLeo,
  getTsUpdateMaxTransferLeo,
  getTsUpdateMinTransferLeo,
  getTsUpdateWithdrawalLimitLeo,
  getUpdateThresholdLeo,
  getTsPauseTokenLeo,
  getTsUnpauseTokenLeo,
  getProposalVoteLeo
} from "../artifacts/js/js2leo/council_v0003";
import {
  AddMember,
  RemoveMember,
  TbAddAttestor,
  TbAddChain,
  TbAddService,
  TbPause,
  TbRemoveAttestor,
  TbRemoveChain,
  TbRemoveService,
  TbUnpause,
  TsAddToken,
  TsRemoveToken,
  TsUpdateMaxTransfer,
  TsUpdateMinTransfer,
  TsUpdateWithdrawalLimit,
  UpdateThreshold,
  ProposalVote,
  ProposalVoterKey,
  TsPauseToken,
  TsUnpauseToken,
} from "../artifacts/js/types/council_v0003";

import { WithdrawalLimit } from "../artifacts/js/types/token_service_v0003";

import { hashStruct } from "../utils/hash";

const council = new Council_v0003Contract({ mode: "execute" });
const bridge = new Token_bridge_v0003Contract({ mode: "execute" });
const tokenService = new Token_service_v0003Contract({ mode: "execute" });
const wusdcConnector = new Wusdc_connector_v0003_0Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0003Contract({ mode: "execute" });


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

const getVoters = async (proposalHash: bigint): Promise<[string[], boolean[]]> => {
  const totalVoters = await council.proposal_vote_counts(proposalHash);
  const voters = []
  for (let i = 0; i < totalVoters; i++) {
    const ithVoterKey: ProposalVoterKey = {
      proposal: proposalHash,
      index: i
    }
    const ithVoter = await council.proposal_voters(ithVoterKey);
    voters.push(ithVoter);
  }

  const voteKeys = getVoteKeys(proposalHash, voters);
  const votes = []
  for (let voteKey of voteKeys) {
    const vote = await council.proposal_votes(voteKey)
    votes.push(vote)
  }
  return [voters, votes]
}


describe.skip("Council", () => {
  const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();
  const admin = council.address();
  const initialThreshold = 3;

  describe("Deployment and Setup", () => {
    test(
      "Deploy Bridge",
      async () => {
        const deployTx = await bridge.deploy();
        await bridge.wait(deployTx)
      },
      TIMEOUT
    );

    test(
      "Deploy Token Service",
      async () => {
        const deployTx = await tokenService.deploy();
        await tokenService.wait(deployTx);
      },
      TIMEOUT
    );

    test(
      "Deploy Council",
      async () => {
        const deployTx = await council.deploy();
        await council.wait(deployTx);
      },
      TIMEOUT
    );

    test(
      "Initialize Council",
      async () => {
        let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;
        if (!isCouncilInitialized) {
          const [initializeTx] = await council.initialize(
            [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS], initialThreshold
          );
          await council.wait(initializeTx);
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



  })

  describe("Update threshold", () => {

    const newThreshold = 1;
    let proposalHash: bigint
    let proposalId: number;

    test("Propose from council member", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const updateThresholdProposal: UpdateThreshold = {
        id: proposalId,
        new_threshold: newThreshold,
      };
      proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

      council.connect(councilMember1)
      const [proposeTx] = await council.propose(proposalId, proposalHash);
      await council.wait(proposeTx);

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)
    }, TIMEOUT)

    test.failing("Propose with invalid proposalId", async () => {
      const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      const updateThresholdProposal: UpdateThreshold = {
        id: proposalId,
        new_threshold: newThreshold,
      };
      const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

      council.connect(councilMember1)
      const [proposeTx] = await council.propose(proposalId, proposalHash);
      await council.wait(proposeTx);

    }, TIMEOUT)

    test.failing("Propose from non-council member", async () => {
      const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      const updateThresholdProposal: UpdateThreshold = {
        id: proposalId,
        new_threshold: newThreshold,
      };
      const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

      council.connect(aleoUser4)
      const [proposeTx] = await council.propose(proposalId, proposalHash);
      await council.wait(proposeTx);

    }, TIMEOUT)

    test.failing("Vote from non council member fails", async () => {
      council.connect(aleoUser4)
      const [voteTx] = await council.vote(proposalHash, true);
      await council.wait(voteTx);
    }, TIMEOUT)

    test.failing("Vote from council member1 fails", async () => {
      // This fails because propose is counted as a vote
      council.connect(councilMember1)
      const [voteTx] = await council.vote(proposalHash, true);
      await council.wait(voteTx);
    }, TIMEOUT)

    test("Vote NO from council member2", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, false);
      await council.wait(voteTx);

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test.failing("Vote again from council member2 fails", async () => {
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, true);
      await council.wait(voteTx);
    }, TIMEOUT)

    test.failing("Execute without enough votes fails", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, signers);
      await council.wait(updateThresholExecTx);
    }, TIMEOUT);

    test("Vote YES from council member3", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember3)
      const [voteTx] = await council.vote(proposalHash, true);
      await council.wait(voteTx);

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Get voters", async () => {
      const [voters, votes] = await getVoters(proposalHash);
      expect(voters.length).toBe(3)
      expect(votes.length).toBe(3)

      expect(voters[0]).toBe(councilMember1);
      expect(voters[1]).toBe(councilMember2);
      expect(voters[2]).toBe(councilMember3);

      expect(votes[0]).toBe(true);
      expect(votes[1]).toBe(false);
      expect(votes[2]).toBe(true);
    })

    test.failing("Execute with both YES and NO votes fails", async () => {
      const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, councilMember3];
      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, signers);
      await council.wait(updateThresholExecTx);
    }, TIMEOUT);

    test("Change vote of council member2 to YES", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.update_vote(proposalHash, true);
      await council.wait(voteTx);

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes);

      const [voters, votes] = await getVoters(proposalHash);
      expect(voters.length).toBe(3)
      expect(votes.length).toBe(3)

      expect(voters[0]).toBe(councilMember1);
      expect(voters[1]).toBe(councilMember2);
      expect(voters[2]).toBe(councilMember3);

      expect(votes[0]).toBe(true);
      expect(votes[1]).toBe(true);
      expect(votes[2]).toBe(true);
    }, TIMEOUT)


    test("Execute with all votes", async () => {
      const signers = [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, signers);
      await council.wait(updateThresholExecTx);

      expect(await council.proposal_executed(proposalHash)).toBe(true);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(newThreshold);
    }, TIMEOUT);

  })

  describe.skip("Add member", () => {
    const newMember = new PrivateKey().to_address().to_string()
    const updatedThreshold = 1;
    let proposalHash: bigint
    let proposalId: number

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;

      const addMemeberProposal: AddMember = {
        id: proposalId,
        new_member: newMember,
        new_threshold: updatedThreshold,
      };
      proposalHash = hashStruct(getAddMemberLeo(addMemeberProposal));
      council.connect(councilMember1)
      const [tx] = await council.propose(proposalId, proposalHash);
      await council.wait(tx);

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)

    }, TIMEOUT)

    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, true);
      await council.wait(voteTx);

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [addMemeberExecTx] = await council.add_member(proposalId, newMember, updatedThreshold, signers);
      await council.wait(addMemeberExecTx);

      const finalTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash)).toBe(true);
      expect(await council.members(newMember, false)).toBe(true);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(updatedThreshold);
      expect(finalTotalAttestors).toBe(initialTotalAttestors + 1);
    }, TIMEOUT)
  })

  describe.skip("Remove member", () => {
    const oldMember = councilMember2
    const updatedThreshold = 1;
    let proposalHash: bigint
    let proposalId: number

    beforeEach(async () => {
      expect(await council.members(oldMember)).toBe(true)
    })

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;

      const removeMemberProposal: RemoveMember = {
        id: proposalId,
        existing_member: oldMember,
        new_threshold: updatedThreshold,
      };
      proposalHash = hashStruct(getRemoveMemberLeo(removeMemberProposal));
      council.connect(councilMember1)
      const [tx] = await council.propose(proposalId, proposalHash);
      await council.wait(tx);

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)

    }, TIMEOUT)

    test.skip("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, true);
      await council.wait(voteTx);

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      // TODO validate again
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [removeMemberTx] = await council.remove_member(proposalId, oldMember, updatedThreshold, signers);
      await council.wait(removeMemberTx);

      const finalTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash)).toBe(true);
      expect(await council.members(oldMember, false)).toBe(false);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(updatedThreshold);
      expect(finalTotalAttestors).toBe(initialTotalAttestors - 1);

    }, TIMEOUT)
  })

  describe.skip("Bridge", () => {
    const threshold = 1;

    test("Initialize Bridge", async () => {
      const isBridgeInitialized = (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;
      if (!isBridgeInitialized) {
        const [initializeTx] = await bridge.initialize_tb(
          [councilMember1, councilMember2, councilMember3, aleoUser4, ALEO_ZERO_ADDRESS],
          threshold,
          admin
        );
        await bridge.wait(initializeTx);
      }
    },
      TIMEOUT
    );

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(council.address());
    }, TIMEOUT);

    describe("Add Chain", () => {
      const newChainId = ethChainId;
      const proposer = councilMember1;
      let proposalId = 0;
      let tbAddChainProposalHash = BigInt(0);

      beforeEach(async () => {
        council.connect(proposer);
        expect(await bridge.supported_chains(newChainId, false)).toBe(false);
        expect(await council.members(councilMember1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const tbAddChain: TbAddChain = {
          id: proposalId,
          chain_id: newChainId
        };
        tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain));

        council.connect(councilMember1);
        const [tx] = await council.propose(proposalId, tbAddChainProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(tbAddChainProposalHash);
        expect(await council.proposal_vote_counts(tbAddChainProposalHash)).toBe(1)

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        expect(await council.proposal_executed(tbAddChainProposalHash, false)).toBe(false);

        council.connect(councilMember1);
        const [tx] = await council.tb_add_chain(proposalId, newChainId, signers);
        await council.wait(tx);

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
        const [tx] = await council.propose(proposalId, tbRemoveChainProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(tbRemoveChainProposalHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        expect(await council.proposal_executed(tbRemoveChainProposalHash, false)).toBe(false);

        const [tx] = await council.tb_remove_chain(proposalId, newChainId, signers);
        await council.wait(tx);

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
        const [tx] = await council.propose(proposalId, addAttestorHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(addAttestorHash);
        expect(await council.proposal_vote_counts(addAttestorHash)).toBe(1)

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        const initialTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);

        expect(await council.proposal_executed(addAttestorHash, false)).toBe(false);
        const [tx] = await council.tb_add_attestor(proposalId, newAttestor, newThreshold, signers);
        await council.wait(tx);

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
        const [tx] = await council.propose(proposalId, removeAttestorHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(removeAttestorHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        const initialTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);

        expect(await council.proposal_executed(removeAttestorHash, false)).toBe(false);
        const [tx] = await council.tb_remove_attestor(proposalId, existingAttestor, newThreshold, signers);
        await council.wait(tx);

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
        const [tx] = await council.propose(proposalId, addServiceProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(addServiceProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(addServiceProposalHash, false)).toBe(false);
        const [tx] = await council.tb_add_service(proposalId, tokenService.address(), signers);
        await council.wait(tx);

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
        const [tx] = await council.propose(proposalId, removeServiceProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(removeServiceProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(removeServiceProposalHash, false)).toBe(false);
        const [tx] = await council.tb_remove_service(proposalId, tokenService.address(), signers);
        await council.wait(tx);

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
        const [tx] = await council.propose(proposalId, tbPauseProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(tbPauseProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(tbPauseProposalHash, false)).toBe(false);
        const [tx] = await council.tb_unpause(proposalId, signers);
        await council.wait(tx);

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
        const [tx] = await council.propose(proposalId, tbPauseProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(tbPauseProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(tbPauseProposalHash, false)).toBe(false);
        const [tx] = await council.tb_pause(proposalId, signers);
        await council.wait(tx);

        expect(await council.proposal_executed(tbPauseProposalHash)).toBe(true);

        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_PAUSED_VALUE);
      }, TIMEOUT);

    });

  });

  describe.skip("Token Service", () => {

    test("Initialize Token Service", async () => {
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isTokenServiceInitialized) {
        const [initializeTx] = await tokenService.initialize_ts(
          admin
        );
        await tokenService.wait(initializeTx);
      }
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(council.address());
    },
      TIMEOUT
    );

    describe("Add Token", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let addTokenProposalHash = BigInt(0);

      const minTransfer = BigInt(100)
      const maxTransfer = BigInt(100)
      const thresholdNoLimit = BigInt(100)
      const outgoingPercentage = 10_00
      const time = 1

      beforeEach(async () => {
        council.connect(proposer);
        expect(await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)).toBe(ALEO_ZERO_ADDRESS);
        expect(await council.members(councilMember1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const tsSupportToken: TsAddToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
          connector: wusdcConnector.address(),
          min_transfer: minTransfer,
          max_transfer: maxTransfer,
          outgoing_percentage: outgoingPercentage,
          time,
          max_no_cap: thresholdNoLimit
        };
        addTokenProposalHash = hashStruct(getTsAddTokenLeo(tsSupportToken));
        const [tx] = await council.propose(proposalId, addTokenProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(addTokenProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(addTokenProposalHash, false)).toBe(false);
        const [tx] = await council.ts_add_token(
          proposalId,
          wusdcToken.address(),
          wusdcConnector.address(),
          minTransfer,
          maxTransfer,
          outgoingPercentage,
          time,
          thresholdNoLimit,
          signers,
        );
        await council.wait(tx);

        expect(await council.proposal_executed(addTokenProposalHash)).toBe(true);
        expect(await tokenService.token_connectors(wusdcToken.address())).toBe(wusdcConnector.address());
      }, TIMEOUT);

    });

    describe("Update minimum transfer", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let TsUpdateMinimumTransferHash = BigInt(0);
      const newMinTransfer = BigInt(1000)

      beforeEach(async () => {
        council.connect(proposer);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const TsUpdateMinimumTransfer: TsUpdateMinTransfer = {
          id: proposalId,
          token_address: wusdcToken.address(),
          min_transfer: newMinTransfer,
        };
        TsUpdateMinimumTransferHash = hashStruct(getTsUpdateMinTransferLeo(TsUpdateMinimumTransfer));
        const [tx] = await council.propose(proposalId, TsUpdateMinimumTransferHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(TsUpdateMinimumTransferHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(TsUpdateMinimumTransferHash, false)).toBe(false);
        const [tx] = await council.ts_update_min_transfer(
          proposalId,
          wusdcToken.address(),
          newMinTransfer,
          signers,
        );
        await council.wait(tx);
        expect(await council.proposal_executed(TsUpdateMinimumTransferHash)).toBe(true);
        expect(await tokenService.min_transfers(wusdcToken.address())).toBe(newMinTransfer);
      }, TIMEOUT);

    });

    describe("Update maximum transfer", () => {
      let proposalId = 0;
      let TsUpdateMaximumTransferHash = BigInt(0);
      const newMaxTransfer = BigInt(100_000)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const TsUpdateMaximumTransfer: TsUpdateMaxTransfer = {
          id: proposalId,
          token_address: wusdcToken.address(),
          max_transfer: newMaxTransfer,
        };
        TsUpdateMaximumTransferHash = hashStruct(
          getTsUpdateMaxTransferLeo(TsUpdateMaximumTransfer)
        );
        const [tx] = await council.propose(proposalId, TsUpdateMaximumTransferHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(TsUpdateMaximumTransferHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(TsUpdateMaximumTransferHash, false)).toBe(false);
        const [tx] = await council.ts_update_max_transfer(
          proposalId,
          wusdcToken.address(),
          newMaxTransfer,
          signers,
        );
        await council.wait(tx);
        expect(await council.proposal_executed(TsUpdateMaximumTransferHash)).toBe(true);
        expect(await tokenService.max_transfers(wusdcToken.address())).toBe(newMaxTransfer);
      }, TIMEOUT);

    });

    describe("Update withdrawal limit", () => {
      let proposalId = 0;
      let TsUpdateOutgoingHash = BigInt(0);

      const newLimit: WithdrawalLimit = {
        percentage: 90_00, // 90%
        duration: 2, // per block
        threshold_no_limit: BigInt(200)
      };

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const TsUpdateOutgoing: TsUpdateWithdrawalLimit = {
          id: proposalId,
          token_address: wusdcToken.address(),
          percentage: newLimit.percentage,
          duration: newLimit.duration,
          threshold_no_limit: newLimit.threshold_no_limit
        };
        TsUpdateOutgoingHash = hashStruct(getTsUpdateWithdrawalLimitLeo(TsUpdateOutgoing));
        const [tx] = await council.propose(proposalId, TsUpdateOutgoingHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(TsUpdateOutgoingHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(TsUpdateOutgoingHash, false)).toBe(false);
        const [tx] = await council.ts_update_outgoing_percentage(
          proposalId,
          wusdcToken.address(),
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit,
          signers,
        );
        await council.wait(tx);
        expect(await council.proposal_executed(TsUpdateOutgoingHash)).toBe(true);
        expect(await tokenService.token_withdrawal_limits(wusdcToken.address())).toStrictEqual(newLimit);
      }, TIMEOUT);

    });

    describe("Unpause", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let unpauseTokenProposalHash = BigInt(0);

      beforeEach(async () => {
        council.connect(proposer);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_PAUSED_VALUE);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const unpauseTokenProposal: TsUnpauseToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
        };
        unpauseTokenProposalHash = hashStruct(getTsUnpauseTokenLeo(unpauseTokenProposal));
        const [tx] = await council.propose(proposalId, unpauseTokenProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(unpauseTokenProposalHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(unpauseTokenProposalHash, false)).toBe(false);
        const [tx] = await council.ts_unpause_token(
          proposalId,
          wusdcToken.address(),
          signers
        );
        await council.wait(tx);
        expect(await council.proposal_executed(unpauseTokenProposalHash)).toBe(true);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_UNPAUSED_VALUE);
      }, TIMEOUT);

    });

    describe("Pause", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let pauseTokenProposalHash = BigInt(0);

      beforeEach(async () => {
        council.connect(proposer);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_UNPAUSED_VALUE);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const pauseTokenProposal: TsPauseToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
        };
        pauseTokenProposalHash = hashStruct(getTsPauseTokenLeo(pauseTokenProposal));
        const [tx] = await council.propose(proposalId, pauseTokenProposalHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(pauseTokenProposalHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(pauseTokenProposalHash, false)).toBe(false);
        const [tx] = await council.ts_pause_token(
          proposalId,
          wusdcToken.address(),
          signers
        );
        await council.wait(tx);
        expect(await council.proposal_executed(pauseTokenProposalHash)).toBe(true);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_PAUSED_VALUE);
      }, TIMEOUT);

    });

    describe("Remove Token", () => {
      let proposalId = 0;
      let RemoveTokenHash = BigInt(0);

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const RemoveToken: TsRemoveToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
        };
        RemoveTokenHash = hashStruct(getTsRemoveTokenLeo(RemoveToken));
        const [tx] = await council.propose(proposalId, RemoveTokenHash);
        await council.wait(tx);

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(RemoveTokenHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(RemoveTokenHash, false)).toBe(false);
        const [tx] = await council.ts_remove_token(
          proposalId,
          wusdcToken.address(),
          signers,
        );
        await council.wait(tx);
        expect(await council.proposal_executed(RemoveTokenHash)).toBe(true);
        expect(await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)).toBe(ALEO_ZERO_ADDRESS)
        expect(await tokenService.min_transfers(wusdcToken.address(), BigInt(-1))).toBe(BigInt(-1))
        expect(await tokenService.max_transfers(wusdcToken.address(), BigInt(-1))).toBe(BigInt(-1))
      }, TIMEOUT);
    });

  });

});

describe("Transition Test cases", () => {

  const council = new Council_v0003Contract({ mode: "evaluate" });
  const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();

  describe("Initialize Fail Case", () => {
    test.failing("Threshold more than unique member number should fail", async () => {
      const threshold = 5;
      console.log(councilMember1, councilMember2, councilMember3, aleoUser4, ALEO_ZERO_ADDRESS)
      await council.initialize(
        [councilMember1, councilMember2, councilMember3, aleoUser4, ALEO_ZERO_ADDRESS],
        threshold
      );
    })

    test.failing("Threshold cannot be less than 1", async () => {
      const threshold = 0;
      await council.initialize(
        [councilMember1, councilMember2, councilMember3, aleoUser4, ALEO_ZERO_ADDRESS],
        threshold
      );

    })
  })

  test.failing("Add member with threshold less than 1 (Must fail)", async () => {
    const newMember = new PrivateKey().to_address().to_string()
    const updatedThreshold = 0;
    const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
    await council.add_member(1, newMember, updatedThreshold, signers);
  })

  test.failing("Removing ZERO ADDRESS user should fail", async () => {
    const updatedThreshold = 1;
    const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
    await council.remove_member(1, ALEO_ZERO_ADDRESS, updatedThreshold, signers);
  })


})