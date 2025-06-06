import { PrivateKey } from "@aleohq/sdk";
import { Vlink_council_v2Contract } from "../artifacts/js/vlink_council_v2";
import { Vlink_bridge_council_v2Contract } from "../artifacts/js/vlink_bridge_council_v2";
import { Vlink_token_service_council_v2Contract } from "../artifacts/js/vlink_token_service_council_v2";
import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../artifacts/js/vlink_token_service_v2";


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
} from "../artifacts/js/js2leo/vlink_council_v2";
import {
  AddMember,
  RemoveMember,
  UpdateThreshold,
  ProposalVote,
  ProposalVoterKey,
  Withdrawal
} from "../artifacts/js/types/vlink_council_v2";

import { hashStruct } from "../utils/hash";
import { ExecutionMode } from "@doko-js/core";
import { Token_registryContract } from "../artifacts/js/token_registry";
import { Vlink_holding_v2Contract } from "../artifacts/js/vlink_holding_v2";



const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/5_council.test.ts //Al30Devnet

const tokenRegistry = new Token_registryContract({ mode })
const holding = new Vlink_holding_v2Contract({ mode })
const council = new Vlink_council_v2Contract({ mode });
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode });
const tokenService = new Vlink_token_service_v2Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_council_v2Contract({ mode });
const bridge = new Vlink_token_bridge_v2Contract({ mode });


const TIMEOUT = 300000_000;
let tokenID = BigInt("7190692537453907461105790569797103513515746302149567971663963167242253971983");
const ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";


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

  describe.skip("Deployment", () => {
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

    test(
      "Deploy TokenService Council",
      async () => {
        const deployTx = await tokenServiceCouncil.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );
  })

  describe.skip("Initialization", () => {
    test(
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

    test.failing("Reinitialized council should fail", async () => {
      const initializeTx = await council.initialize(
        [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS], initialThreshold
      );
      await initializeTx.wait();
    })

    test("Holding: Initialize", async () => {
      const tx = await holding.initialize_holding(tokenService.address());
      await tx.wait();
    }, TIMEOUT)

  })

  describe.skip("Council Internal Test update threshold", () => {

    const newThreshold = 1;
    let proposalHash: bigint
    let proposalId: number;

    describe("Propose", () => {
      test.skip("Propose from council member", async () => {
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
          id: 1000,
          new_threshold: newThreshold,
        };
        const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

        council.connect(councilMember1)
        const proposeTx = await council.propose(1000, proposalHash);
        expect(await proposeTx.wait()).toStrictEqual([])
      }, TIMEOUT)

      test.skip.failing("Propose from non-council member", async () => {
        const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const updateThresholdProposal: UpdateThreshold = {
          id: proposalId,
          new_threshold: newThreshold,
        };
        const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));
        const newMember = new PrivateKey().to_address().to_string()

        council.connect(newMember)
        const proposeTx = await council.propose(proposalId, proposalHash);
        await proposeTx.wait()
      }, TIMEOUT)

      test.skip.failing("Propose from zero address should fail", async () => {
        const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const updateThresholdProposal: UpdateThreshold = {
          id: proposalId,
          new_threshold: newThreshold,
        };
        const proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

        council.connect(ZERO_ADDRESS)
        const proposeTx = await council.propose(proposalId, proposalHash);
        proposeTx.wait()
      }, TIMEOUT)
    })

    describe.skip("Vote", () => {
      test.failing("Vote from zero address should fail fails", async () => {
        council.connect(ZERO_ADDRESS)
        const voteTx = await council.vote(proposalHash, true);
        voteTx.wait();
      }, TIMEOUT)

      test("Vote from non council member fails", async () => {
        council.connect(aleoUser4)
        const voteTx = await council.vote(proposalHash, true);
        await expect(voteTx.wait()).rejects.toThrow()
      }, TIMEOUT)

      test("Vote from council member1(proposer) fails", async () => {
        council.connect(councilMember1)
        const is_council_member = await council.members(councilMember1);
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
    })

    describe.skip("Execute", () => {
      test("Execute without enough votes fails", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        expect(await council.proposal_executed(proposalHash, false)).toBe(false);
        const updateThresholExecTx = await council.update_threshold(proposalId, newThreshold, signers);
        await expect(updateThresholExecTx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("Vote YES from council member3", async () => {
        const initialVotes = await council.proposal_vote_counts(proposalHash);
        console.log(initialVotes, "initial votes");

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


      test.failing("Execute from non council member should fail", async () => {
        const signers = [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(proposalHash, false)).toBe(false);
        const newMember = new PrivateKey().to_address().to_string()
        council.connect(newMember)
        const updateThresholExecTx = await council.update_threshold(proposalId, newThreshold, signers);
        await updateThresholExecTx.wait();
      }, TIMEOUT);


      test("Execute with all votes", async () => {
        const signers = [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(proposalHash, false)).toBe(false);
        const updateThresholExecTx = await council.update_threshold(proposalId, newThreshold, signers);
        await updateThresholExecTx.wait();

        expect(await council.proposal_executed(proposalHash)).toBe(true);
        expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(newThreshold);
      }, TIMEOUT);
    })
  })

  describe.skip("update threshold edge case", () => {
    const updatedThreshold = 2;
    let proposalHash: bigint
    let proposalId: number

    describe("Threshold 0 should fail", () => {
      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;

        const updateThresholdProposal: UpdateThreshold = {
          id: proposalId,
          new_threshold: 0,
        };
        proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));
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

      test.failing("Execute", async () => {
        const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

        expect(await council.proposal_executed(proposalHash, false)).toBe(false);
        const addMemeberExecTx = await council.update_threshold(proposalId, updatedThreshold, signers);
        await addMemeberExecTx.wait();
      }, TIMEOUT)
    })

    describe("Threshold greater then council member should fail", () => {
      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;

        const updateThresholdProposal: UpdateThreshold = {
          id: proposalId,
          new_threshold: 10,
        };
        proposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));
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

      test.failing("Execute", async () => {
        const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)

        expect(await council.proposal_executed(proposalHash, false)).toBe(false);
        const addMemeberExecTx = await council.update_threshold(proposalId, updatedThreshold, signers);
        await addMemeberExecTx.wait();
      }, TIMEOUT)
    })
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
      expect(initialTotalAttestors).toBeGreaterThanOrEqual(1);
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

  describe.skip("Remove member", () => {
    const oldMember = councilMember2
    const updatedThreshold = 1;
    let proposalHash: bigint
    let proposalId: number

    describe("zero address cannot be removed", () => {
      beforeEach(async () => {
        expect(await council.members(ZERO_ADDRESS)).toBe(true)
      })

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;

        const removeMemberProposal: RemoveMember = {
          id: proposalId,
          existing_member: ZERO_ADDRESS,
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

      test.failing("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        expect(await council.proposal_executed(proposalHash, false)).toBe(false);
        const removeMemberTx = await council.remove_member(proposalId, ZERO_ADDRESS, updatedThreshold, signers);
        await removeMemberTx.wait();
      }, TIMEOUT)
    })

    describe("remove member happy flow", () => {
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
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
        const initialTotalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)
        expect(initialTotalAttestors).toBeGreaterThanOrEqual(1);
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
  })

  describe("Withdraw Fee", () => {
    const receiver_address = 'aleo1xpzgjyps47vqmlrtqf64dwlwrmrc89xtsfmgwj4af5aqdh6q05psnw3n6p';
    let proposalHash: bigint
    let proposalId: number
    let token_id: bigint = tokenID
    let withdraw_amount: bigint = BigInt(100)

    //send fee to contract
    test("Send fee to council contract for withdraw", async () => {
      const tx = await tokenRegistry.register_token(token_id, BigInt('6148332821651876206'), BigInt("1431520323"), 6, BigInt("18446744073709551615"), false, councilMember1);
      await tx.wait();
      const minttx = tokenRegistry.mint_public(token_id, council.address(), BigInt(10000), 4294967295);
      (await minttx).wait()
    }, TIMEOUT)

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
      const data = await council.proposal_executed(proposalHash, false);
      console.log(data, "aaaaaaaaaaaaaaaaaaaaa");

      // expect(await council.proposal_executed(proposalHash, false)).toBe(false);
      const withdrawFeeExecTx = await council.withdraw_fees(proposalId, token_id, receiver_address, withdraw_amount, signers);
      await withdrawFeeExecTx.wait();
      const data1 = await council.proposal_executed(proposalHash, false);
      console.log(data1, "1111111111111111111111111111111");
      // expect(await council.proposal_executed(proposalHash)).toBe(true);
    }, TIMEOUT)
  })
});

