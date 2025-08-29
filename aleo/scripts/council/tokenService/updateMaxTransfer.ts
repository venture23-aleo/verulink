import { hashStruct } from "../../../utils/hash";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TS_UPDATE_MAX_MIN_TRANSFER } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";

import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v07Contract } from "../../../artifacts/js/vlink_token_service_council_v07";
import { Vlink_token_service_v7Contract } from "../../../artifacts/js/vlink_token_service_v7";
import { Vlink_council_v07Contract } from "../../../artifacts/js/vlink_council_v07";
import { TsUpdateMaxMinTransfer } from "../../../artifacts/js/types/vlink_token_service_council_v07";
import { getTsUpdateMaxMinTransferLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v07";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v07";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v07";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v07Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v7Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateMaxTransfer = async (
  tokenId: bigint,
  maxTransfer: bigint,
  minTransfer: bigint,
): Promise<number> => {

  console.log(`👍 Proposing to update maximum, minimum transfer value of token: ${tokenId}`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  // GENERATE HASH
  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsUpdateMaxTransfer: TsUpdateMaxMinTransfer = {
    tag: TAG_TS_UPDATE_MAX_MIN_TRANSFER,
    id: proposalId,
    token_id: tokenId,
    max_transfer: maxTransfer,
    min_transfer: minTransfer,
  };
  const tsUpdateMaxTransferHash = hashStruct(getTsUpdateMaxMinTransferLeo(tsUpdateMaxTransfer));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateMaxTransferHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // PROPOSE
  const proposeUpdateMaxTransferTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeUpdateMaxTransferTx.wait();

  getProposalStatus(ExternalProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUpdateMaxTransfer = async (
  proposalId: number,
  tokenId: bigint,
  maxTransfer: bigint,
  minTransfer: bigint,
) => {
  console.log(`👍 Voting to update maximum, minimum transfer value of token: ${tokenId}`)

  const voter = council.getAccounts()[0];

  // GENERATE HASH
  const tsUpdateMaxTransfer: TsUpdateMaxMinTransfer = {
    tag: TAG_TS_UPDATE_MAX_MIN_TRANSFER,
    id: proposalId,
    token_id: tokenId,
    max_transfer: maxTransfer,
    min_transfer: minTransfer,
  };
  const tsUpdateMaxTransferHash = hashStruct(getTsUpdateMaxMinTransferLeo(tsUpdateMaxTransfer));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateMaxTransferHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // VOTE
  validateVote(ExternalProposalHash, voter);

  const voteUpdateMaxTransferTx = await council.vote(ExternalProposalHash, true);
  await voteUpdateMaxTransferTx.wait();

  getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateMinTransfer = async (
  proposalId: number,
  tokenId: bigint,
  maxTransfer: bigint,
  minTransfer: bigint,
) => {
  console.log(`Updating maximum, minimum transfer value of token: ${tokenId}`)


  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  // GENERATE HASH
  const tsUpdateMaxTransfer: TsUpdateMaxMinTransfer = {
    tag: TAG_TS_UPDATE_MAX_MIN_TRANSFER,
    id: proposalId,
    token_id: tokenId,
    max_transfer: maxTransfer,
    min_transfer: minTransfer,
  };
  const tsUpdateMaxTransferHash = hashStruct(getTsUpdateMaxMinTransferLeo(tsUpdateMaxTransfer));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateMaxTransferHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  // EXECUTE
  const updateMaxTransferTx = await serviceCouncil.ts_update_max_min_transfer(
    tsUpdateMaxTransfer.id,
    tsUpdateMaxTransfer.token_id,
    tsUpdateMaxTransfer.max_transfer,
    tsUpdateMaxTransfer.min_transfer,
    voters
  )

  await updateMaxTransferTx.wait();

  console.log(` ✅ Token: ${tokenId} maximum, minimum transfer value updated successfully.`)

}