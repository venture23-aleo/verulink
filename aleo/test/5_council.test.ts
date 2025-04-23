import { PrivateKey } from "@aleohq/sdk";
import { Vlink_council_v3Contract } from "../artifacts/js/vlink_council_v3";
import { Vlink_bridge_council_v3Contract } from "../artifacts/js/vlink_bridge_council_v3";
import { Vlink_token_service_council_v3Contract } from "../artifacts/js/vlink_token_service_council_v3";
import { Vlink_token_bridge_v3Contract } from "../artifacts/js/vlink_token_bridge_v3";
import { Vlink_token_service_v3Contract } from "../artifacts/js/vlink_token_service_v3";


import {
  ALEO_ZERO_ADDRESS,
  COUNCIL_THRESHOLD_INDEX,
  COUNCIL_TOTAL_MEMBERS_INDEX,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
} from "../utils/constants";
import {
  getAddMemberLeo,
  getRemoveMemberLeo,
  getUpdateThresholdLeo,
  getProposalVoteLeo,
  getWithdrawalLeo
} from "../artifacts/js/js2leo/vlink_council_v3";
import {
  AddMember,
  RemoveMember,
  UpdateThreshold,
  ProposalVote,
  ProposalVoterKey,
  Withdrawal
} from "../artifacts/js/types/vlink_council_v3";

import { hashStruct } from "../utils/hash";
import { ExecutionMode } from "@doko-js/core";
import { Token_registryContract } from "../artifacts/js/token_registry";
import { Vlink_holding_v3Contract } from "../artifacts/js/vlink_holding_v3";



const mode = ExecutionMode.SnarkExecute;

const tokenRegistry = new Token_registryContract({ mode })
const holding = new Vlink_holding_v3Contract({ mode })
const council = new Vlink_council_v3Contract({ mode });
const bridgeCouncil = new Vlink_bridge_council_v3Contract({ mode });
const tokenService = new Vlink_token_service_v3Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_council_v3Contract({ mode });
const bridge = new Vlink_token_bridge_v3Contract({ mode });


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


describe("Council", () => {
  const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();
  const initialThreshold = 3;

  describe.skip("Deployment and Setup", () => {
    test.skip(
      "Deploy Token registery",
      async () => {
        const deployTx = await tokenRegistry.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );
    test.skip(
      "Deploy Holding",
      async () => {
        const deployTx = await holding.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );

    test.skip(
      "Deploy Bridge",
      async () => {
        const deployTx = await bridge.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );

    test.skip(
      "Deploy Token Service",
      async () => {
        const deployTx = await tokenService.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test.skip(
      "Deploy Council",
      async () => {
        const deployTx = await council.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test.skip(
      "Deploy Bridge Council",
      async () => {
        const deployTx = await bridgeCouncil.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test.skip(
      "Deploy TokenService Council",
      async () => {
        const deployTx = await tokenServiceCouncil.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test.skip(
      "Initialize Council",
      async () => {
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

    test("Holding: Initialize", async () => {
      const tx = await holding.initialize_holding(tokenService.address());
      await tx.wait();
    }, TIMEOUT)

  })

  describe.skip("Council Internal Test", () => {

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
      const proposeTx = await council.propose(proposalId, proposalHash);
      await proposeTx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)
    }, TIMEOUT)

    test("Propose with invalid proposalId", async () => {
      const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      const updateThresholdProposal: UpdateThreshold = {
        id: proposalId,
        new_threshold: newThreshold,
      };
      const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

      council.connect(councilMember1)
      const proposeTx = await council.propose(proposalId, proposalHash);
      await expect(proposeTx.wait()).rejects.toThrow()

    }, TIMEOUT)

    test("Propose from non-council member", async () => {
      const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      const updateThresholdProposal: UpdateThreshold = {
        id: proposalId,
        new_threshold: newThreshold,
      };
      const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

      council.connect(aleoUser4)
      const proposeTx = await council.propose(proposalId, proposalHash);
      await expect(proposeTx.wait()).rejects.toThrow()
    }, TIMEOUT)

    test("Vote from non council member fails", async () => {
      council.connect(aleoUser4)
      const voteTx = await council.vote(proposalHash, true);
      await expect(voteTx.wait()).rejects.toThrow()
    }, TIMEOUT)

    test("Vote from council member1 fails", async () => {
      council.connect(councilMember1)
      const voteTx = await council.vote(proposalHash, true);
      await expect(voteTx.wait()).rejects.toThrow()
    }, TIMEOUT)

    test("Vote NO from council member2", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const voteTx = await council.vote(proposalHash, false);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Vote again from council member2 fails", async () => {
      council.connect(councilMember2)
      const voteTx = await council.vote(proposalHash, true);
      await expect(voteTx.wait()).rejects.toThrow()
    }, TIMEOUT)

    test("Execute without enough votes fails", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const updateThresholExecTx = await council.update_threshold(proposalId, newThreshold, signers);
      await expect(updateThresholExecTx.wait()).rejects.toThrow()
    }, TIMEOUT);

    test("Vote YES from council member3", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember3)
      const voteTx = await council.vote(proposalHash, true);
      await voteTx.wait();

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

    test("Execute with both YES and NO votes fails", async () => {
      const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, councilMember3];
      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const updateThresholExecTx = await council.update_threshold(proposalId, newThreshold, signers);
      await expect(updateThresholExecTx.wait()).rejects.toThrow()
    }, TIMEOUT);

    test("Change vote of council member2 to YES", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const voteTx = await council.update_vote(proposalHash, true);
      await voteTx.wait();

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
      const updateThresholExecTx = await council.update_threshold(proposalId, newThreshold, signers);
      await updateThresholExecTx.wait();

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
      const tx = await council.propose(proposalId, proposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)

    }, TIMEOUT)

    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const voteTx = await council.vote(proposalHash, true);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const addMemeberExecTx = await council.add_member(proposalId, newMember, updatedThreshold, signers);
      await addMemeberExecTx.wait();

      const finalTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash)).toBe(true);
      expect(await council.members(newMember, false)).toBe(true);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(updatedThreshold);
      expect(finalTotalAttestors).toBe(initialTotalAttestors + 1);
    }, TIMEOUT)
  })

  describe("Remove member", () => {
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
      const tx = await council.propose(proposalId, proposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)

    }, TIMEOUT)

    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const voteTx = await council.vote(proposalHash, true);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      // TODO validate again
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const removeMemberTx = await council.remove_member(proposalId, oldMember, updatedThreshold, signers);
      await removeMemberTx.wait();

      const finalTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash)).toBe(true);
      expect(await council.members(oldMember, false)).toBe(false);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(updatedThreshold);
      expect(finalTotalAttestors).toBe(initialTotalAttestors - 1);

    }, TIMEOUT)
  })

  describe("Withdraw Fee", () => {
    const receiver_address = 'aleo1xpzgjyps47vqmlrtqf64dwlwrmrc89xtsfmgwj4af5aqdh6q05psnw3n6p';
    let proposalHash: bigint
    let proposalId: number
    let token_id: bigint = BigInt(1000)
    let withdraw_amount: bigint = BigInt(100)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;

      const withdrawFeeProposal: Withdrawal = {
        id: proposalId,
        token_id: token_id,
        receiver: receiver_address,
        amount: withdraw_amount
      };
      proposalHash = hashStruct(getWithdrawalLeo(withdrawFeeProposal));
      council.connect(councilMember1)
      const tx = await council.propose(proposalId, proposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)

    }, TIMEOUT)

    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const voteTx = await council.vote(proposalHash, true);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const withdrawFeeExecTx = await council.withdraw_fees(proposalId, token_id, receiver_address, withdraw_amount, signers);
      await withdrawFeeExecTx.wait();

      expect(await council.proposal_executed(proposalHash)).toBe(true);
    }, TIMEOUT)
  })
});

