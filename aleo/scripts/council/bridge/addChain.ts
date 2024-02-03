import { ProposalVote, TbAddChain } from "../../../artifacts/js/types";
import { hashStruct } from "../../../utils/hash";

import * as js2leo from '../../../artifacts/js/js2leo';
import { Token_bridge_v0001Contract } from "../../../artifacts/js/token_bridge_v0001";
import { Council_v0001Contract } from "../../../artifacts/js/council_v0001";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";

const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0001Contract({mode: "execute", priorityFee: 10_000});

const proposeAddChain = async (newChainId: bigint) => {

  console.log(`Proposing to add ${newChainId}`)
  const isChainIdSupported = await bridge.supported_chains(newChainId);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const voter = council.getAccounts()[0];
  const isMember = await council.members(voter);
  if (!isMember) {
    throw Error(`${voter} is not a valid council member`);
  }

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(js2leo.getTbAddChainLeo(tbAddChain)); 

  const proposeAddChainTx = await council.propose(proposalId, tbAddChainProposalHash); // 477_914
  
  // @ts-ignore
  await proposeAddChainTx.wait()

  const addChainVotes = await council.proposal_vote_counts(tbAddChainProposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);
  const totalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX);
  console.log(`Votes: ${addChainVotes} / ${totalAttestors} total votes`);
  console.log(`Votes: ${addChainVotes} / ${threshold} for execution`);
};

const voteAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`Voting to add ${newChainId}`)
  const isChainIdSupported = await bridge.supported_chains(newChainId);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(js2leo.getTbAddChainLeo(tbAddChain)); 

  const voter = council.getAccounts()[0];
  const isMember = await council.members(voter);
  if (!isMember) {
    throw Error(`${voter} is not a valid council member`);
  }

  const tbAddChainVote: ProposalVote = {
    proposal: tbAddChainProposalHash,
    member: voter
  }
  const tbAddChainVoteHash = hashStruct(js2leo.getProposalVoteLeo(tbAddChainVote));
  const hasAlreadyVoted = await council.proposal_votes(tbAddChainVoteHash);

  if (hasAlreadyVoted) {
    throw Error(`${voter} has already voted the proposal`);
  }

  const voteAddChainTx = await council.vote(tbAddChainProposalHash); // 477_914
  
  // @ts-ignore
  await voteAddChainTx.wait()

  const addChainVotes = await council.proposal_vote_counts(tbAddChainProposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);
  const totalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX);
  console.log(`Votes: ${addChainVotes} / ${totalAttestors} total votes`);
  console.log(`Votes: ${addChainVotes} / ${threshold} for execution`);

}

const execAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`Adding chainId ${newChainId}`)
  let isChainIdSupported = await bridge.supported_chains(newChainId);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(js2leo.getTbAddChainLeo(tbAddChain)); 
  const addChainVotes = await council.proposal_vote_counts(tbAddChainProposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);

  const canExecuteProposal = addChainVotes >= threshold;

  if (!canExecuteProposal) {
    throw Error(`Threshold not met. Need at least ${threshold} - ${addChainVotes} more votes.`);
  }

  const proposalAlreadyExecuted = await council.proposal_executed(tbAddChainProposalHash);
  if (proposalAlreadyExecuted) {
    throw Error(`Proposal has already been executed`);
  }

  const addChainTx = await council.tb_add_chain(
    tbAddChain.id,
    tbAddChain.chain_id,
  ) // 301_747

  // @ts-ignore
  await addChainTx.wait()

  isChainIdSupported = await bridge.supported_chains(newChainId);
  if (!isChainIdSupported) {
    throw Error('Something went wrong!');
  }


}