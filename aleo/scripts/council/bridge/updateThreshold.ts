import { hashStruct } from "../../../utils/hash";

import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TB_UPDATE_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";

import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v07Contract } from "../../../artifacts/js/vlink_bridge_council_v07";
import { Vlink_council_v07Contract } from "../../../artifacts/js/vlink_council_v07";
import { Vlink_token_bridge_v7Contract } from "../../../artifacts/js/vlink_token_bridge_v7";
import { TbUpdateThreshold } from "../../../artifacts/js/types/vlink_bridge_council_v07";
import { getTbUpdateThresholdLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v07";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v07";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v07";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Vlink_bridge_council_v07Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v7Contract({ mode, priorityFee: 10_000 });

export const proposeupdateThreshold = async (new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to update threshold: ${new_threshold}`);

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // generating hash
  const tbUpdateThreshold: TbUpdateThreshold = {
    tag: TAG_TB_UPDATE_THRESHOLD,
    id: proposalId,
    new_threshold: new_threshold
  };
  const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbUpdateThresholdProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // proposing
  const proposeUpdateThresholdTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeUpdateThresholdTx.wait();

  getProposalStatus(ExternalProposalHash);

  return proposalId
};

export const voteUpdateThredhold = async (proposalId: number, new_threshold: number) => {

  console.log(`👍 Voting to update threshold: ${new_threshold}`)

  // generating hash
  const tbUpdateThreshold: TbUpdateThreshold = {
    tag: TAG_TB_UPDATE_THRESHOLD,
    id: proposalId,
    new_threshold: new_threshold
  };
  const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbUpdateThresholdProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // voting
  const voteUpdateThresholdTx = await council.vote(ExternalProposalHash, true);
  await voteUpdateThresholdTx.wait();

  getProposalStatus(ExternalProposalHash);

}

export const execUpdateThreshold = async (proposalId: number, new_threshold: number) => {

  console.log(`👍 executing to update threshold: ${new_threshold}`)

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  // generating hash
  const tbUpdateThreshold: TbUpdateThreshold = {
    tag: TAG_TB_UPDATE_THRESHOLD,
    id: proposalId,
    new_threshold: new_threshold
  };
  const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbUpdateThresholdProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  // execute
  const updateThresholdTx = await bridgeCouncil.tb_update_threshold(
    tbUpdateThreshold.id,
    tbUpdateThreshold.new_threshold,
    voters
  )

  await updateThresholdTx.wait();

  const THRESHOLD_INDEX = 1;
  const updatedThreshold = await bridge.bridge_settings(THRESHOLD_INDEX);
  if (updatedThreshold != new_threshold) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Threshold: ${new_threshold} updated successfully.`)

}