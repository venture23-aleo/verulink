import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TS_UP_OUTGOING_PERCENT } from "../../../utils/constants";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v7";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsUpdateWithdrawalLimit } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { getTsUpdateWithdrawalLimitLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
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
export const proposeUpdateOutPercentage = async (
  tokenId: bigint,
  percentage: number,
  duration: number,
  threshold_no_limit: bigint
): Promise<number> => {

  console.log(`👍 Proposing to update outgoing percentage of : ${tokenId}`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // GENERATE HASH
  const tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit = {
    tag: TAG_TS_UP_OUTGOING_PERCENT,
    id: proposalId,
    token_id: tokenId,
    percentage: percentage,
    duration: duration,
    threshold_no_limit: threshold_no_limit
  };
  const tsUpdateWithdrawalLimitHash = hashStruct(getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateWithdrawalLimitHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // PROPOSE
  const proposeUpdateOutPercentageTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeUpdateOutPercentageTx.wait();

  getProposalStatus(ExternalProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUpdateOutPercentage = async (
  proposalId: number,
  tokenId: bigint,
  percentage: number,
  duration: number,
  threshold_no_limit: bigint
) => {
  console.log(`👍 Voting to update outgoing percentage of: ${tokenId}`)

  const voter = council.getAccounts()[0];

  // GENERATE HASH
  const tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit = {
    tag: TAG_TS_UP_OUTGOING_PERCENT,
    id: proposalId,
    token_id: tokenId,
    percentage: percentage,
    duration: duration,
    threshold_no_limit: threshold_no_limit
  };
  const tsUpdateWithdrawalLimitHash = hashStruct(getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateWithdrawalLimitHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // VOTE
  validateVote(ExternalProposalHash, voter);

  const voteUpdateWithdrawalLimitTx = await council.vote(ExternalProposalHash, true);
  await voteUpdateWithdrawalLimitTx.wait();

  getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateWithdrawalLimit = async (
  proposalId: number,
  tokenId: bigint,
  percentage: number,
  duration: number,
  threshold_no_limit: bigint
) => {
  console.log(`Updating outgoing percentage of ${tokenId}`)

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != serviceCouncil.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  // GENERATE HASH
  const tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit = {
    tag: TAG_TS_UP_OUTGOING_PERCENT,
    id: proposalId,
    token_id: tokenId,
    percentage: percentage,
    duration: duration,
    threshold_no_limit: threshold_no_limit
  };
  const tsUpdateWithdrawalLimitHash = hashStruct(getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsUpdateWithdrawalLimitHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  // EXECUTE
  const updateWithdrawalLimitTx = await serviceCouncil.ts_update_outgoing_percentage(
    tsUpdateWithdrawalLimit.id,
    tsUpdateWithdrawalLimit.token_id,
    tsUpdateWithdrawalLimit.percentage,
    tsUpdateWithdrawalLimit.duration,
    tsUpdateWithdrawalLimit.threshold_no_limit,
    voters
  )

  await updateWithdrawalLimitTx.wait();

  const new_outgoing_percentage = {
    percentage: percentage,
    duration: duration,
    threshold_no_limit: threshold_no_limit
  };

  const updatedWithdrawalLimit = await tokenService.token_withdrawal_limits(tokenId);
  if (new_outgoing_percentage.percentage != updatedWithdrawalLimit.percentage) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Token: ${tokenId} minimum tranfer value updated successfully.`)

}