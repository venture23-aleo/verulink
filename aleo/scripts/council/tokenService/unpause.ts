import { hashStruct } from "../../../utils/hash";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { CouncilContract } from "../../../artifacts/js/council";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, TOKEN_PAUSED_VALUE, TOKEN_UNPAUSED_VALUE } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsUnpauseToken } from "../../../artifacts/js/types/token_service_council";
import { getTsUnpauseTokenLeo } from "../../../artifacts/js/js2leo/token_service_council";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Token_service_councilContract } from "../../../artifacts/js/token_service_council";
import { hash } from "aleo-hasher";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Token_service_councilContract({ mode, priorityFee: 10_000 });

const council = new CouncilContract({ mode, priorityFee: 10_000 });
const tokenService = new Token_service_v0003Contract({ mode, priorityFee: 10_000 });


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUnpauseToken = async (token_id: bigint): Promise<number> => {

  console.log(`👍 Proposing to unpause token: ${token_id}`)
  const isTokenPaused = (await tokenService.token_status(token_id, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (!isTokenPaused) {
    throw Error(`Token is already paused!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsUnpauseToken: TsUnpauseToken = {
    id: proposalId,
    token_id
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const [proposeUnpauseTokenTx] = await council.propose(proposalId, tsUnpauseTokenHash);
  await council.wait(proposeUnpauseTokenTx);

  getProposalStatus(tsUnpauseTokenHash);

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
  const tsUnpauseToken: TsUnpauseToken = {
    id: proposalId,
    token_id
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const voter = council.getAccounts()[0];
  validateVote(tsUnpauseTokenHash, voter);

  const [voteUnpauseTx] = await council.vote(tsUnpauseTokenHash, true);

  await council.wait(voteUnpauseTx);

  getProposalStatus(tsUnpauseTokenHash);

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

  const tsUnpauseToken: TsUnpauseToken = {
    id: proposalId,
    token_id
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  validateExecution(tsUnpauseTokenHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUnpauseTokenHash), 5);

  const [unpauseTokenTx] = await serviceCouncil.ts_unpause_token(
    tsUnpauseToken.id,
    tsUnpauseToken.token_id,
    voters
  );

  await council.wait(unpauseTokenTx);

  isTokenPaused = (await tokenService.token_status(token_id, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (isTokenPaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Token unpaused successfully.`)

}