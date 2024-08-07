import { hashStruct } from "../../../utils/hash";
import { Council_v1Contract } from "../../../artifacts/js/council_v1";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { Token_service_v1Contract } from "../../../artifacts/js/token_service_v1";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsRemoveToken } from "../../../artifacts/js/types/token_service_council_v1";
import { getTsRemoveTokenLeo } from "../../../artifacts/js/js2leo/token_service_council_v1";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Token_service_council_v1Contract } from "../../../artifacts/js/token_service_council_v1";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Token_service_council_v1Contract({mode, priorityFee: 10_000});

const council = new Council_v1Contract({mode, priorityFee: 10_000});
const tokenService = new Token_service_v1Contract({mode, priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveToken = async (
    tokenId: bigint
): Promise<number> => {

  console.log(`👍 Proposing to remove token: ${tokenId}`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsRemoveToken: TsRemoveToken = {
    id: proposalId,
    token_id: tokenId
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken)); 

  const [proposeRemoveTokenTx] = await council.propose(proposalId, tbRemoveTokenProposalHash);

  await council.wait(proposeRemoveTokenTx);

  getProposalStatus(tbRemoveTokenProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteRemoveToken = async (
    proposalId: number, 
    tokenId: bigint,
) => {
  console.log(`👍 Voting to remove token: ${tokenId}`)

  const voter = council.getAccounts()[0];

  const tsRemoveToken: TsRemoveToken = {
    id: proposalId,
    token_id: tokenId
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken)); 

  validateVote(tbRemoveTokenProposalHash, voter);

  const [voteRemoveTokenTx] = await council.vote(tbRemoveTokenProposalHash, true);

  await council.wait(voteRemoveTokenTx);

  getProposalStatus(tbRemoveTokenProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveToken = async (
    proposalId: number, 
    tokenId: bigint,
) => {
  console.log(`Adding token ${tokenId}`)

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsRemoveToken: TsRemoveToken = {
    id: proposalId,
    token_id: tokenId
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken)); 

  validateExecution(tbRemoveTokenProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbRemoveTokenProposalHash), SUPPORTED_THRESHOLD);
  const [removeTokenTx] = await serviceCouncil.ts_remove_token(
    tsRemoveToken.id,
    tsRemoveToken.token_id,
    voters
  ) 

  await council.wait(removeTokenTx);

  console.log(` ✅ Token: ${tokenId} removed successfully.`)

}