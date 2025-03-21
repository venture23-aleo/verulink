import { hashStruct } from "../../utils/hash";

import { Vlink_council_v3Contract } from "../../artifacts/js/vlink_council_v3";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX } from "../../utils/testdata.data";
import { ProposalVote } from "../../artifacts/js/types/vlink_council_v3";
import { getProposalVoteLeo } from "../../artifacts/js/js2leo/vlink_council_v3";
import { ExecutionMode } from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;

const council = new Vlink_council_v3Contract({ mode, priorityFee: 10_000 });

export const validateProposer = async (proposer: string) => {
  const isMember = await council.members(proposer, false);
  if (!isMember) {
    throw Error(`${proposer} is not a valid council member`);
  }
};

export const validateVote = async (proposalHash: bigint, voter: string) => {

  const isMember = await council.members(voter, false);
  if (!isMember) {
    throw Error(`${voter} is not a valid council member`);
  }

  const votes = await council.proposal_vote_counts(proposalHash, 0);
  if (votes == 0) {
    throw Error("Proposal not found");
  }

  const proposalVote: ProposalVote = {
    proposal: proposalHash,
    member: voter
  }
  const tbAddChainVoteHash = hashStruct(getProposalVoteLeo(proposalVote));
  const hasAlreadyVoted = await council.proposal_votes(tbAddChainVoteHash);

  if (hasAlreadyVoted) {
    throw Error(`${voter} has already voted the proposal`);
  }
}

export const validateExecution = async (proposalHash: bigint) => {

  const votes = await council.proposal_vote_counts(proposalHash, 0);
  if (votes == 0) {
    throw Error("Proposal not found");
  }

  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);

  const canExecuteProposal = votes >= threshold;

  if (!canExecuteProposal) {
    throw Error(`Threshold not met. Need at least ${threshold} - ${votes} more votes.`);
  }

  const proposalAlreadyExecuted = await council.proposal_executed(proposalHash, false);
  if (proposalAlreadyExecuted) {
    throw Error(`Proposal has already been executed`);
  }

}

export const getProposalStatus = async (proposalHash: bigint) => {
  const addChainVotes = await council.proposal_vote_counts(proposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);
  const totalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX);
  console.log(`Votes: ${addChainVotes} / ${totalAttestors} total votes`);
  console.log(`Votes: ${addChainVotes} / ${threshold} for execution`);
}