
import { Vlink_council_v1Contract } from "../artifacts/js/vlink_council_v1";

import { getProposalVoteLeo } from "../artifacts/js/js2leo/vlink_council_v1";
import { ProposalVote, ProposalVoterKey } from "../artifacts/js/types/vlink_council_v1";
import { ALEO_ZERO_ADDRESS } from "./constants";
import { hashStruct } from "./hash";
import { ExecutionMode } from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;
const council = new Vlink_council_v1Contract({ mode });

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

export const getVoters = async (proposalHash: bigint): Promise<[string[], boolean[]]> => {
  const totalVoters = await council.proposal_vote_counts(proposalHash);
  const voters = []
  for (let i = 0; i<totalVoters; i++) {
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

const getVotersWithGivenVote = async (proposalHash: bigint, expectedVote: boolean): Promise<string[]> => {
  const [voters, votes] = await getVoters(proposalHash);
  
  const votersWithGivenVote: string[] = []
  for (let i=0; i<votes.length; i++) {
    if (votes[i] == expectedVote) {
      votersWithGivenVote.push(voters[i]);
    }
  }
  return votersWithGivenVote;
}

export const padWithZeroAddress = (voters: string[], toLength: number): string[] => {
  if (voters.length > toLength) {
    throw Error('No place to pad voters');
  } else if (voters.length == toLength) {
    return voters
  } else {
    const paddedArray = Array(toLength - voters.length).fill(ALEO_ZERO_ADDRESS);
    return paddedArray.concat(voters);
  }
}

export const getVotersWithYesVotes = async (proposalHash: bigint): Promise<string[]> => {
  return getVotersWithGivenVote(proposalHash, true);
}

export const getVotersWithNoVotes = async (proposalHash: bigint): Promise<string[]> => {
  return getVotersWithGivenVote(proposalHash, false);
}