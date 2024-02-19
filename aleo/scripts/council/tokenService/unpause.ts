import { hashStruct } from "../../../utils/hash";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, TOKEN_PAUSED_VALUE, TOKEN_UNPAUSED_VALUE } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsUnpauseToken } from "../../../artifacts/js/types/council_v0003";
import { getTsUnpauseTokenLeo } from "../../../artifacts/js/js2leo/council_v0003";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";

const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0003Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUnpauseToken = async (tokenAddr: string): Promise<number> => {

  console.log(`👍 Proposing to unpause token: ${tokenAddr}`)
  const isTokenPaused = (await tokenService.token_status(tokenAddr, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (!isTokenPaused) {
    throw Error(`Token is already paused!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsUnpauseToken: TsUnpauseToken = {
    id: proposalId,
    token_address: tokenAddr
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken)); 

  const [proposeUnpauseTokenTx] = await council.propose(proposalId, tsUnpauseTokenHash); // 477_914
  await council.wait(proposeUnpauseTokenTx);

  getProposalStatus(tsUnpauseTokenHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUnpauseToken = async (proposalId: number, tokenAddr: string) => {

  console.log(`👍 Voting to unpause token: ${tokenAddr}`)
  const isTokenPaused = (await tokenService.token_status(tokenAddr, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (!isTokenPaused) {
    throw Error(`Token is already paused!`);
  }
  const tsUnpauseToken: TsUnpauseToken = {
    id: proposalId,
    token_address: tokenAddr
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken)); 

  const voter = council.getAccounts()[0];
  validateVote(tsUnpauseTokenHash, voter);

  const [voteUnpauseTx] = await council.vote(tsUnpauseTokenHash, true); // 477_914
  
  await council.wait(voteUnpauseTx);

  getProposalStatus(tsUnpauseTokenHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUnpauseToken = async (proposalId: number, tokenAddr: string) => {

  console.log(`Unpausing token ${tokenAddr}`)
  let isTokenPaused = (await tokenService.token_status(tokenAddr, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (!isTokenPaused) {
    throw Error(`Bridge is already paused!`);
  }

  const tsOwner = await tokenService.owner_TS(true);
  if (tsOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tsUnpauseToken: TsUnpauseToken = {
    id: proposalId,
    token_address: tokenAddr
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken)); 

  validateExecution(tsUnpauseTokenHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUnpauseTokenHash), 5);

  const [unpauseTokenTx] = await council.ts_unpause_token(
    tsUnpauseToken.id,
    tsUnpauseToken.token_address,
    voters
  ); 

  await council.wait(unpauseTokenTx);

  isTokenPaused = (await tokenService.token_status(tokenAddr, TOKEN_UNPAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
  if (isTokenPaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Token unpaused successfully.`)

}