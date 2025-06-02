import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, usdcContractAddr } from "../../../utils/constants";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v2";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { SetRoleForToken, UpdateTokenMetadata } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { getSetRoleForTokenLeo, getUpdateTokenMetadataLeo,  } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v2Contract } from "../../../artifacts/js/vlink_token_service_council_v2";


const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAdmin = async (
  tokenId: bigint,
  admin: string,
): Promise<number> => {


  console.log(`👍 Proposing to update admin : ${tokenId}`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsUpdateAdmin: UpdateTokenMetadata = {
    id: proposalId,
    token_id: tokenId,
    admin: admin,
    external_authorization_party: "false"
  };
  const tsUpdateAdminHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateAdmin));

  const proposeUpdateAdminTx = await council.propose(proposalId, tsUpdateAdminHash);

  await proposeUpdateAdminTx.wait();

  getProposalStatus(tsUpdateAdminHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteForAdmin = async (
  proposalId: number,
  tokenId: bigint,
  admin: string
) => {
  console.log(`👍 Voting to update admin : ${tokenId}`)

  const voter = council.getAccounts()[0];
  const tsUpdateAdmin: UpdateTokenMetadata = {
    id: proposalId,
    token_id: tokenId,
    admin: admin,
    external_authorization_party: "false"
  };
  const tsUpdateAdminHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateAdmin));

  validateVote(tsUpdateAdminHash, voter);

  const votUpdateAdminTx = await council.vote(tsUpdateAdminHash, true);

  await votUpdateAdminTx.wait();

  getProposalStatus(tsUpdateAdminHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateAdmin = async (
  //token_name
  proposalId: number,
  tokenId: bigint,
  admin: string
) => {
  console.log(`Update admin of token: ${tokenId}`)

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != serviceCouncil.address()) {
    throw Error("Council is not the owner of tokenService program");
  }
  
  const tsUpdateAdmin: UpdateTokenMetadata = {
    id: proposalId,
    token_id: tokenId,
    admin: admin,
    external_authorization_party: "false"
  };
  const tsUpdateAdminHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateAdmin));



  validateExecution(tsUpdateAdminHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUpdateAdminHash), SUPPORTED_THRESHOLD);
  const updateAdminTx = await serviceCouncil.update_token_metadata(
    proposalId,
    tokenId,
    admin,
    "false",
    voters
  )

  await updateAdminTx.wait();

  console.log(` ✅ Token: ${tokenId} has new admin.`)

}