import { PrivateKey } from "@aleohq/sdk";

import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
import { CouncilContract } from "../artifacts/js/council";

import { Bridge_councilContract } from "../artifacts/js/bridge_council";
import { Token_service_councilContract } from "../artifacts/js/token_service_council";

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
  getProposalVoteLeo
} from "../artifacts/js/js2leo/council";
import {
  AddMember,
  RemoveMember,
  UpdateThreshold,
  ProposalVote,
  ProposalVoterKey
} from "../artifacts/js/types/council";

import { hashStruct } from "../utils/hash";
import { ExecutionMode} from "@doko-js/core";


const mode = ExecutionMode.SnarkExecute;


const council = new CouncilContract({ mode });
const bridgeCouncil = new Bridge_councilContract({ mode });
const tokenServiceCouncil = new Token_service_councilContract({ mode });
const bridge = new Token_bridge_v0003Contract({ mode });
const tokenService = new Token_service_v0003Contract({ mode });


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

  describe("Deployment and Setup", () => {
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

    test(
      "Deploy TokenService Council",
      async () => {
        const deployTx = await tokenServiceCouncil.deploy();
        await deployTx.wait();
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



  })

  describe("Council Internal Test", () => {

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
      const [proposeTx] = await council.propose(proposalId, proposalHash);
      const result = await proposeTx.wait();
      expect(result.execution).toBeUndefined(); 

    }, TIMEOUT)

    test("Propose from non-council member", async () => {
      const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      const updateThresholdProposal: UpdateThreshold = {
        id: proposalId,
        new_threshold: newThreshold,
      };
      const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

      council.connect(aleoUser4)
      const [proposeTx] = await council.propose(proposalId, proposalHash);
      const result = await proposeTx.wait();
      expect(result.execution).toBeUndefined(); 
    }, TIMEOUT)

    test("Vote from non council member fails", async () => {
      council.connect(aleoUser4)
      const [voteTx] = await council.vote(proposalHash, true);
      const result = await voteTx.wait();
      expect(result.execution).toBeUndefined(); 
    }, TIMEOUT)

    test("Vote from council member1 fails", async () => {
      council.connect(councilMember1)
      const [voteTx] = await council.vote(proposalHash, true);
      const result = await voteTx.wait();
      expect(result.execution).toBeUndefined(); 
    }, TIMEOUT)

    test("Vote NO from council member2", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, false);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Vote again from council member2 fails", async () => {
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, true);
      const result = await voteTx.wait();
      expect(result.execution).toBeUndefined(); 
    }, TIMEOUT)

    test("Execute without enough votes fails", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, signers);
      const result = await updateThresholExecTx.wait();
      expect(result.execution).toBeUndefined(); 
    }, TIMEOUT);

    test("Vote YES from council member3", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember3)
      const [voteTx] = await council.vote(proposalHash, true);
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
      const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, signers);
      const result = await updateThresholExecTx.wait();
      expect(result.execution).toBeUndefined(); 
    }, TIMEOUT);

    test("Change vote of council member2 to YES", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.update_vote(proposalHash, true);
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
      const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, signers);
      await updateThresholExecTx.wait();

      expect(await council.proposal_executed(proposalHash)).toBe(true);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(newThreshold);
    }, TIMEOUT);

  })

  describe("Add member", () => {
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
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)

    }, TIMEOUT)

    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, true);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [addMemeberExecTx] = await council.add_member(proposalId, newMember, updatedThreshold, signers);
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
      const [tx] = await council.propose(proposalId, proposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(proposalHash);
      expect(await council.proposal_vote_counts(proposalHash)).toBe(1)

    }, TIMEOUT)

    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(proposalHash);
      council.connect(councilMember2)
      const [voteTx] = await council.vote(proposalHash, true);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(proposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      // TODO validate again
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const [removeMemberTx] = await council.remove_member(proposalId, oldMember, updatedThreshold, signers);
      await removeMemberTx.wait();

      const finalTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

      expect(await council.proposal_executed(proposalHash)).toBe(true);
      expect(await council.members(oldMember, false)).toBe(false);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(updatedThreshold);
      expect(finalTotalAttestors).toBe(initialTotalAttestors - 1);

    }, TIMEOUT)
  })

});

