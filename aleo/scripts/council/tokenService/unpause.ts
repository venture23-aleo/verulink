import { hashStruct } from "../../../utils/hash";
import { Vlink_token_service_v7Contract } from "../../../artifacts/js/vlink_token_service_v7";
import { Vlink_council_v07Contract } from "../../../artifacts/js/vlink_council_v07";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, TOKEN_PAUSED_VALUE, TOKEN_UNPAUSED_VALUE } from "../../../utils/testdata.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsUnpauseToken } from "../../../artifacts/js/types/vlink_token_service_council_v07";
import { getTsUnpauseTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v07";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v07Contract } from "../../../artifacts/js/vlink_token_service_council_v07";
import { hash } from "aleo-hasher";
import { TAG_TS_UNPAUSE_TOKEN } from "../../../utils/constants";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v07";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v07";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v07Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v7Contract({ mode, priorityFee: 10_000 });


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUnpauseToken = async (token_id: bigint): Promise<number> => {

  console.log(`👍 Proposing to unpause token: ${token_id}`)
  const isTokenPaused = (await tokenService.token_status(token_id, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (!isTokenPaused) {
    throw Error(`Token is already unpaused!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // GENERATE HASH
  const tsUnpauseToken: TsUnpauseToken = {
    tag: TAG_TS_UNPAUSE_TOKEN,
    id: proposalId,
    token_id
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUnpauseTokenHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // PROPOSE
  const proposeUnpauseTokenTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeUnpauseTokenTx.wait();

  getProposalStatus(ExternalProposalHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUnpauseToken = async (proposalId: number, token_id: bigint) => {

  console.log(`👍 Voting to unpause token: ${token_id}`)
  const isTokenPaused = (await tokenService.token_status(token_id, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (!isTokenPaused) {
    throw Error(`Token is already paused!`);
  }

  // GENERATE HASH
  const tsUnpauseToken: TsUnpauseToken = {
    tag: TAG_TS_UNPAUSE_TOKEN,
    id: proposalId,
    token_id
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUnpauseTokenHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // VOTE
  const voteUnpauseTx = await council.vote(ExternalProposalHash, true);
  await voteUnpauseTx.wait();

  getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUnpauseToken = async (proposalId: number, token_id: bigint) => {

  console.log(`Unpausing token ${token_id}`)
  let isTokenPaused = (await tokenService.token_status(token_id, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (!isTokenPaused) {
    throw Error(`Bridge is already paused!`);
  }

  const tsOwner = await tokenService.owner_TS(true);
  if (tsOwner != serviceCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  // GENERATE HASH
  const tsUnpauseToken: TsUnpauseToken = {
    tag: TAG_TS_UNPAUSE_TOKEN,
    id: proposalId,
    token_id
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUnpauseTokenHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), 5);

  // EXECUTE
  const unpauseTokenTx = await serviceCouncil.ts_unpause_token(
    tsUnpauseToken.id,
    tsUnpauseToken.token_id,
    voters
  );
  await unpauseTokenTx.wait();

  isTokenPaused = (await tokenService.token_status(token_id, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (isTokenPaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Token unpaused successfully.`)

}