import { hashStruct } from "../../../utils/hash";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TS_REMOVE_TOKEN } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_council_v2Contract } from "../../../artifacts/js/vlink_token_service_council_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v2";
import { TsRemoveToken } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { getTsRemoveTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";


const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v2Contract({mode, priorityFee: 10_000});

const council = new Vlink_council_v2Contract({mode, priorityFee: 10_000});
const tokenService = new Vlink_token_service_v2Contract({mode, priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveToken = async (
    tokenId: bigint,
    chainID: bigint
): Promise<number> => {

  console.log(`👍 Proposing to remove token: ${tokenId}`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsRemoveToken: TsRemoveToken = {
    tag: TAG_TS_REMOVE_TOKEN,
    id: proposalId,
    chain_id: chainID,
    token_id: tokenId
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken));
  
  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: serviceCouncil.address(),
          proposal_hash: tbRemoveTokenProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // propose
  const proposeRemoveTokenTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeRemoveTokenTx.wait();

  getProposalStatus(ExternalProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteRemoveToken = async (
    proposalId: number, 
    tokenId: bigint,
    chainID: bigint
) => {
  console.log(`👍 Voting to remove token: ${tokenId}`)

  const voter = council.getAccounts()[0];

  const tsRemoveToken: TsRemoveToken = {
    tag: TAG_TS_REMOVE_TOKEN,
    id: proposalId,
    chain_id: chainID,
    token_id: tokenId
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken));
  
  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: serviceCouncil.address(),
          proposal_hash: tbRemoveTokenProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateVote(ExternalProposalHash, voter);

  // vote
  const voteRemoveTokenTx = await council.vote(ExternalProposalHash, true);
  await voteRemoveTokenTx.wait();

  getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveToken = async (
    proposalId: number, 
    tokenId: bigint,
    chainID: bigint 
) => {
  console.log(`Adding token ${tokenId}`)

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsRemoveToken: TsRemoveToken = {
    tag: TAG_TS_REMOVE_TOKEN,
    id: proposalId,
    chain_id: chainID,
    token_id: tokenId
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken));
  
  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: serviceCouncil.address(),
          proposal_hash: tbRemoveTokenProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  // execute
  const removeTokenTx = await serviceCouncil.ts_remove_token(
    tsRemoveToken.id,
    tsRemoveToken.chain_id,
    tsRemoveToken.token_id,
    voters
  ) 
  await removeTokenTx.wait();

  console.log(` ✅ Token: ${tokenId} removed successfully.`)

}