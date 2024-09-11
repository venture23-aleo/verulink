import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { CouncilContract } from "../../../artifacts/js/council";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbUpdateThresholdLeo } from "../../../artifacts/js/js2leo/bridge_council";
import { TbUpdateThreshold } from "../../../artifacts/js/types/bridge_council";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Bridge_councilContract } from "../../../artifacts/js/bridge_council";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Bridge_councilContract({mode, priorityFee: 10_000});

const council = new CouncilContract({mode, priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode, priorityFee: 10_000});

export const proposeupdateThreshold = async (new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to update threshold: ${new_threshold}`);

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbUpdateThreshold: TbUpdateThreshold = {
    id: proposalId,
    new_threshold: new_threshold
  };
  const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold)); 

  const [proposeUpdateThresholdTx] = await council.propose(proposalId, tbUpdateThresholdProposalHash);
  
  await council.wait(proposeUpdateThresholdTx);

  getProposalStatus(tbUpdateThresholdProposalHash);
  
  return proposalId
};

export const voteUpdateThredhold = async (proposalId: number, new_threshold: number) => {

  console.log(`👍 Voting to update threshold: ${new_threshold}`)

  const tbUpdateThreshold: TbUpdateThreshold = {
    id: proposalId,
    new_threshold: new_threshold
  };
  const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold)); 

  const voter = council.getAccounts()[0];
  validateVote(tbUpdateThresholdProposalHash, voter);

  const [voteUpdateThresholdTx] = await council.vote(tbUpdateThresholdProposalHash, true);
  
  await council.wait(voteUpdateThresholdTx);

  getProposalStatus(tbUpdateThresholdProposalHash);

}

export const execUpdateThreshold = async (proposalId: number, new_threshold: number) => {

  console.log(`👍 executing to update threshold: ${new_threshold}`)

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbUpdateThreshold: TbUpdateThreshold = {
    id: proposalId,
    new_threshold: new_threshold
  };
  const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold)); 

  validateExecution(tbUpdateThresholdProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbUpdateThresholdProposalHash), SUPPORTED_THRESHOLD);

  const [updateThresholdTx] = await bridgeCouncil.tb_update_threshold(
    tbUpdateThreshold.id,
    tbUpdateThreshold.new_threshold,
    voters
  )

  await council.wait(updateThresholdTx);

  const THRESHOLD_INDEX = 1;
  const updatedThreshold = await bridge.bridge_settings(THRESHOLD_INDEX);
  if (updatedThreshold != new_threshold) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Threshold: ${new_threshold} updated successfully.`)

}