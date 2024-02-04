import { ProposalVote, TbAddChain, TbAddService } from "../../../artifacts/js/types";
import { hashStruct } from "../../../utils/hash";

import * as js2leo from '../../../artifacts/js/js2leo';
import { Token_bridge_v0001Contract } from "../../../artifacts/js/token_bridge_v0001";
import { Council_v0001Contract } from "../../../artifacts/js/council_v0001";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";

const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0001Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddService = async (tokenService: string): Promise<number> => {

  console.log(`👍 Proposing to add token service: ${tokenService}`)
  const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is already added!`);
  }

  const voter = council.getAccounts()[0];
  const isMember = await council.members(voter, false);
  if (!isMember) {
    throw Error(`${voter} is not a valid council member`);
  }

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddService: TbAddService = {
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(js2leo.getTbAddServiceLeo(tbAddService)); 

  const proposeAddTokenServiceTx = await council.propose(proposalId, tbAddTokenServiceProposalHash); // 477_914
  
  // @ts-ignore
  await proposeAddTokenServiceTx.wait()

  const addTokenServiceVotes = await council.proposal_vote_counts(tbAddTokenServiceProposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);
  const totalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX);
  console.log(`Votes: ${addTokenServiceVotes} / ${totalAttestors} total votes`);
  console.log(`Votes: ${addTokenServiceVotes} / ${threshold} for execution`);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteAddService = async (proposalId: number, tokenService: string) => {

  console.log(`👍 Voting to add token service: ${tokenService}`)
  const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is already added!`);
  }

  const tbAddService: TbAddService = {
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(js2leo.getTbAddServiceLeo(tbAddService)); 


  const voter = council.getAccounts()[0];
  const isMember = await council.members(voter, false);
  if (!isMember) {
    throw Error(`${voter} is not a valid council member`);
  }

  const tbAddChainVote: ProposalVote = {
    proposal: tbAddTokenServiceProposalHash,
    member: voter
  }
  const tbAddChainVoteHash = hashStruct(js2leo.getProposalVoteLeo(tbAddChainVote));
  const hasAlreadyVoted = await council.proposal_votes(tbAddChainVoteHash);

  if (hasAlreadyVoted) {
    throw Error(`${voter} has already voted the proposal`);
  }

  const voteAddChainTx = await council.vote(tbAddTokenServiceProposalHash); // 477_914
  
  // @ts-ignore
  await voteAddChainTx.wait()

  const addTokenServiceVotes = await council.proposal_vote_counts(tbAddTokenServiceProposalHash);
  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);
  const totalAttestors = await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX);
  console.log(`Votes: ${addTokenServiceVotes} / ${totalAttestors} total votes`);
  console.log(`Votes: ${addTokenServiceVotes} / ${threshold} for execution`);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddService = async (proposalId: number, tokenService: string) => {

  console.log(`Adding token service: ${tokenService}`)
  let isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is already added!`);
  }


  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbAddService: TbAddService = {
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(js2leo.getTbAddServiceLeo(tbAddService)); 

  const addTokenServiceVotes = await council.proposal_vote_counts(tbAddTokenServiceProposalHash, 0);
  if (addTokenServiceVotes == 0) {
    throw Error("Proposal not found");
  }

  const threshold = await council.settings(COUNCIL_THRESHOLD_INDEX);

  const canExecuteProposal = addTokenServiceVotes >= threshold;

  if (!canExecuteProposal) {
    throw Error(`Threshold not met. Need at least ${threshold} - ${addTokenServiceVotes} more votes.`);
  }

  const proposalAlreadyExecuted = await council.proposal_executed(tbAddTokenServiceProposalHash, false);
  if (proposalAlreadyExecuted) {
    throw Error(`Proposal has already been executed`);
  }

  const addServiceTx = await council.tb_add_service(
    tbAddService.id,
    tbAddService.service,
  ) // 301_747

  // @ts-ignore
  await addServiceTx.wait()

  isTokenServiceSupported = await bridge.supported_services(tokenService);
  if (!isTokenServiceSupported) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ TokenService: ${tokenService} added successfully.`)

}