import { ProposalVote, TbAddChain, TsAddToken } from "../../../artifacts/js/types";
import { hashStruct } from "../../../utils/hash";

import * as js2leo from '../../../artifacts/js/js2leo';
import { Council_v0001Contract } from "../../../artifacts/js/council_v0001";
import { ALEO_ZERO_ADDRESS, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { Token_service_v0001Contract } from "../../../artifacts/js/token_service_v0001";

const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0001Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddToken = async (
    tokenAddress: string,
    tokenConnector: string,
    minTransfer: bigint,
    maxTransfer: bigint,
    outgoingPercentage: number,
    timeframe: number,
    maxNoCap: bigint

): Promise<number> => {

  console.log(`👍 Proposing to add token: ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  }

  const voter = council.getAccounts()[0];
  const isMember = await council.members(voter, false);
  if (!isMember) {
    throw Error(`${voter} is not a valid council member`);
  }

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsAddToken: TsAddToken = {
    id: proposalId,
    token_address: tokenAddress,
    connector: tokenConnector,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap
  };
  const tbAddTokenProposalHash = hashStruct(js2leo.getTsAddTokenLeo(tsAddToken)); 

  const proposeAddChainTx = await council.propose(proposalId, tbAddTokenProposalHash);
  
  // @ts-ignore
  await proposeAddChainTx.wait()

  const addTokenVotes = await council.proposal_vote_counts(tbAddTokenProposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);
  const totalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX);
  console.log(`Votes: ${addTokenVotes} / ${totalAttestors} total votes`);
  console.log(`Votes: ${addTokenVotes} / ${threshold} for execution`);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteAddToken = async (
    proposalId: number, 
    tokenAddress: string,
    tokenConnector: string,
    minTransfer: bigint,
    maxTransfer: bigint,
    outgoingPercentage: number,
    timeframe: number,
    maxNoCap: bigint
) => {
  console.log(`👍 Voting to add token: ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  }

  const voter = council.getAccounts()[0];
  const isMember = await council.members(voter, false);
  if (!isMember) {
    throw Error(`${voter} is not a valid council member`);
  }

  const tsAddToken: TsAddToken = {
    id: proposalId,
    token_address: tokenAddress,
    connector: tokenConnector,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap
  };
  const tsAddTokenProposalHash = hashStruct(js2leo.getTsAddTokenLeo(tsAddToken)); 

  const tsAddTokenVote: ProposalVote = {
    proposal: tsAddTokenProposalHash,
    member: voter
  }
  const tsAddTokenVoteHash = hashStruct(js2leo.getProposalVoteLeo(tsAddTokenVote));
  const hasAlreadyVoted = await council.proposal_votes(tsAddTokenVoteHash);

  if (hasAlreadyVoted) {
    throw Error(`${voter} has already voted the proposal`);
  }

  const voteAddTokenTx = await council.vote(tsAddTokenProposalHash);
  
  // @ts-ignore
  await voteAddTokenTx.wait()

  const addTokenVotes = await council.proposal_vote_counts(tsAddTokenProposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);
  const totalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX);
  console.log(`Votes: ${addTokenVotes} / ${totalAttestors} total votes`);
  console.log(`Votes: ${addTokenVotes} / ${threshold} for execution`);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddToken = async (
    proposalId: number, 
    tokenAddress: string,
    tokenConnector: string,
    minTransfer: bigint,
    maxTransfer: bigint,
    outgoingPercentage: number,
    timeframe: number,
    maxNoCap: bigint
) => {

  console.log(`Adding token ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  }

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsAddToken: TsAddToken = {
    id: proposalId,
    token_address: tokenAddress,
    connector: tokenConnector,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap
  };
  const tsAddTokenProposalHash = hashStruct(js2leo.getTsAddTokenLeo(tsAddToken)); 

  const addTokenVotes = await council.proposal_vote_counts(tsAddTokenProposalHash, 0);
  if (addTokenVotes == 0) {
    throw Error("Proposal not found");
  }

  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);

  const canExecuteProposal = addTokenVotes >= threshold;

  if (!canExecuteProposal) {
    throw Error(`Threshold not met. Need at least ${threshold} - ${addTokenVotes} more votes.`);
  }

  const proposalAlreadyExecuted = await council.proposal_executed(tsAddTokenProposalHash, false);
  if (proposalAlreadyExecuted) {
    throw Error(`Proposal has already been executed`);
  }

  const addChainTx = await council.ts_add_token(
    tsAddToken.id,
    tsAddToken.token_address,
    tsAddToken.connector,
    tsAddToken.min_transfer,
    tsAddToken.max_transfer,
    tsAddToken.outgoing_percentage,
    tsAddToken.time,
    tsAddToken.max_no_cap
  ) // 301_747

  // @ts-ignore
  await addChainTx.wait()

  const updatedConnector = await tokenService.token_connectors(tokenAddress);
  if (updatedConnector != tokenConnector) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Token: ${tokenAddress} added successfully.`)

}