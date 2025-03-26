import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v3Contract } from "../../../artifacts/js/vlink_council_v3";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { Vlink_token_service_v3Contract } from "../../../artifacts/js/vlink_token_service_v3";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsAddToken, TsUpdateMinTransfer, TsUpdateWithdrawalLimit } from "../../../artifacts/js/types/vlink_token_service_council_v3";
import { getTsAddTokenLeo, getTsUpdateMinTransferLeo, getTsUpdateWithdrawalLimitLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v3";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_council_v3Contract } from "../../../artifacts/js/vlink_token_service_council_v3";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v3Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v3Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v3Contract({ mode, priorityFee: 10_000 });

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
  const tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit = {
    id: proposalId,
    token_id: tokenId,
    percentage: percentage,
    duration: duration,
    threshold_no_limit: threshold_no_limit
  };
  const tsUpdateWithdrawalLimitHash = hashStruct(getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit));

  const [proposeUpdateOutPercentageTx] = await council.propose(proposalId, tsUpdateWithdrawalLimitHash);

  await council.wait(proposeUpdateOutPercentageTx);

  getProposalStatus(tsUpdateWithdrawalLimitHash);
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

  const tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit = {
    id: proposalId,
    token_id: tokenId,
    percentage: percentage,
    duration: duration,
    threshold_no_limit: threshold_no_limit
  };
  const tsUpdateWithdrawalLimitHash = hashStruct(getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit));

  validateVote(tsUpdateWithdrawalLimitHash, voter);

  const [voteUpdateWithdrawalLimitTx] = await council.vote(tsUpdateWithdrawalLimitHash, true);

  await council.wait(voteUpdateWithdrawalLimitTx);

  getProposalStatus(tsUpdateWithdrawalLimitHash);

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

  const tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit = {
    id: proposalId,
    token_id: tokenId,
    percentage: percentage,
    duration: duration,
    threshold_no_limit: threshold_no_limit
  };
  const tsUpdateWithdrawalLimitHash = hashStruct(getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit));

  validateExecution(tsUpdateWithdrawalLimitHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUpdateWithdrawalLimitHash), SUPPORTED_THRESHOLD);

  const [updateWithdrawalLimitTx] = await serviceCouncil.ts_update_outgoing_percentage(
    tsUpdateWithdrawalLimit.id,
    tsUpdateWithdrawalLimit.token_id,
    tsUpdateWithdrawalLimit.percentage,
    tsUpdateWithdrawalLimit.duration,
    tsUpdateWithdrawalLimit.threshold_no_limit,
    voters
  )

  await council.wait(updateWithdrawalLimitTx);

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