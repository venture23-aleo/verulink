import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v5Contract } from "../../../artifacts/js/vlink_council_v5";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD} from "../../../utils/constants";
import { Vlink_token_service_v5Contract } from "../../../artifacts/js/vlink_token_service_v5";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { RemoveRole, SetRoleForToken } from "../../../artifacts/js/types/vlink_token_service_council_v5";
import { getRemoveRoleLeo, getSetRoleForTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v5";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v5Contract } from "../../../artifacts/js/vlink_token_service_council_v5";


const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v5Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v5Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v5Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveRole = async (
  tokenId: bigint,
  account: string
): Promise<number> => {

  console.log(`👍 Proposing to remove role: ${tokenId}`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsRemoveRole: RemoveRole = {
    id: proposalId,
    token_id: tokenId,
    account: account
  };
  const tsRemoveRoleProposalHash = hashStruct(getRemoveRoleLeo(tsRemoveRole));

  const proposeRemoveRoleTx = await council.propose(proposalId, tsRemoveRoleProposalHash);

  await proposeRemoveRoleTx.wait();

  getProposalStatus(tsRemoveRoleProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteRemoveRole = async (
  proposalId: number,
  tokenId: bigint,
  account: string
) => {
  console.log(`👍 Voting to remove role of : ${tokenId}`)

  const voter = council.getAccounts()[0];
  const tsRemoveRole: RemoveRole = {
    id: proposalId,
    token_id: tokenId,
    account: account
  };
  const tsRemoveRoleProposalHash = hashStruct(getRemoveRoleLeo(tsRemoveRole));

  validateVote(tsRemoveRoleProposalHash, voter);

  const voteRemoveRoleTx = await council.vote(tsRemoveRoleProposalHash, true);

  await voteRemoveRoleTx.wait();

  getProposalStatus(tsRemoveRoleProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveRole = async (
  //token_name
  proposalId: number,
  tokenId: bigint,
  account: string
) => {
  console.log(`Remvoing Role for token ${tokenId}`)

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != serviceCouncil.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsRemoveRole: RemoveRole = {
    id: proposalId,
    token_id: tokenId,
    account: account
  };
  const tsRemoveRoleProposalHash = hashStruct(getRemoveRoleLeo(tsRemoveRole));


  validateExecution(tsRemoveRoleProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsRemoveRoleProposalHash), SUPPORTED_THRESHOLD);
  const removeRoleTx = await serviceCouncil.remove_role(
    proposalId,
    tokenId,
    account,
    voters
  )

  await removeRoleTx.wait();

  console.log(` ✅ ROLE has been removed for account ${account}`)

}