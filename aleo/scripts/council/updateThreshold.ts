import { hashStruct } from "../../utils/hash";

import { Vlink_council_v4Contract } from "../../artifacts/js/vlink_council_v4";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer } from "./councilUtils";
import { UpdateThreshold } from "../../artifacts/js/types/vlink_council_v4";
import { getUpdateThresholdLeo } from "../../artifacts/js/js2leo/vlink_council_v4";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;


const council = new Vlink_council_v4Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateThreshold = async (newThreshold: number): Promise<number> => {

  console.log(`👍 Proposing to update Threshold: ${newThreshold}`)
  const isOldThreshold = await council.settings(COUNCIL_THRESHOLD_INDEX, 0);
  if (isOldThreshold == newThreshold || newThreshold == 0) {
    throw Error(`${newThreshold} is invalid!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const updateThresholdProposal: UpdateThreshold = {
    id: proposalId,
    new_threshold: newThreshold,
  };
  const updateThresholdProposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));
  const [updateThresholdTx] = await council.propose(proposalId, updateThresholdProposalHash);
  await council.wait(updateThresholdTx);

  return proposalId
};

//////////////////////
///// Vote ////////
//////////////////////
export const voteUpdateThreshold = async (proposalId: number, newThreshold: number) => {

  console.log(`👍 Voting to update Threshold: ${newThreshold}`)
  const isOldThreshold = await council.settings(COUNCIL_THRESHOLD_INDEX, 0);
  if (isOldThreshold == newThreshold || newThreshold == 0) {
    throw Error(`${newThreshold} is invalid!`);
  }
  council.connect("aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf");
  const voter = council.getAccounts()[0];
  console.log(voter);
  // validateProposer(voter);

  const updateThresholdProposal: UpdateThreshold = {
    id: proposalId,
    new_threshold: newThreshold,
  };
  const updateThresholdProposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));

  const [updateThresholdTx] = await council.vote(updateThresholdProposalHash, true);
  await council.wait(updateThresholdTx);

  getProposalStatus(updateThresholdProposalHash);

  return proposalId
};


//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateThreshold = async (proposalId: number, newThreshold: number,) => {

  console.log(`👍 Executing to update Threshold: ${newThreshold}`)
  const isOldThreshold = await council.settings(COUNCIL_THRESHOLD_INDEX, 0);
  if (isOldThreshold == newThreshold || newThreshold == 0) {
    throw Error(`${newThreshold} is invalid!`);
  }

  const updateThresholdProposalHash = await council.proposals(proposalId);
  validateExecution(updateThresholdProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(updateThresholdProposalHash), SUPPORTED_THRESHOLD);
  const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, voters);
  await council.wait(updateThresholExecTx);

  const isNewThreshold = await council.settings(COUNCIL_THRESHOLD_INDEX, 0);
  if (isNewThreshold != newThreshold || newThreshold == 0) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Threshold update successfully.`)
}


const update = async () => {
  // const propid = await proposeUpdateThreshold(1);
  // await voteUpdateThreshold(19, 1);
  await execUpdateThreshold(19, 1);

}

update();
