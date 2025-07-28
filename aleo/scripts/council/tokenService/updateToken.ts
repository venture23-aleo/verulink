import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_UPDATE_TOKEN_METADATA, ethChainId, usdcContractAddr } from "../../../utils/constants";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v2";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { SetRoleForToken, UpdateTokenMetadata } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { getSetRoleForTokenLeo, getUpdateTokenMetadataLeo,  } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v2Contract } from "../../../artifacts/js/vlink_token_service_council_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";


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
    tag: TAG_UPDATE_TOKEN_METADATA,
    id: proposalId,
    token_id: tokenId,
    admin: admin,
    external_authorization_party: "false"
  };
  const tsUpdateAdminHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateAdmin));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateAdminHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // PROPOSE
  const proposeUpdateAdminTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeUpdateAdminTx.wait();

  getProposalStatus(ExternalProposalHash);
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

  // GENERATE HASH
  const tsUpdateAdmin: UpdateTokenMetadata = {
    tag: TAG_UPDATE_TOKEN_METADATA,
    id: proposalId,
    token_id: tokenId,
    admin: admin,
    external_authorization_party: "false"
  };
  const tsUpdateAdminHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateAdmin));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateAdminHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // VOTE
  validateVote(ExternalProposalHash, voter);

  const voteUpdateAdminTx = await council.vote(ExternalProposalHash, true);
  await voteUpdateAdminTx.wait();

  getProposalStatus(ExternalProposalHash);

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
  
  // GENERATE HASH
  const tsUpdateAdmin: UpdateTokenMetadata = {
    tag: TAG_UPDATE_TOKEN_METADATA,
    id: proposalId,
    token_id: tokenId,
    admin: admin,
    external_authorization_party: "false"
  };
  const tsUpdateAdminHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateAdmin));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateAdminHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  // EXECUTE
  const updateAdminTx = await serviceCouncil.update_token_metadata(tsUpdateAdmin.id, tsUpdateAdmin.token_id, tsUpdateAdmin.admin, tsUpdateAdmin.external_authorization_party, voters);
  await updateAdminTx.wait();

  console.log(` ✅ Token: ${tokenId} has new admin.`)

}