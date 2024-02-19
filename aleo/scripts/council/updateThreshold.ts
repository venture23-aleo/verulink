import { hashStruct } from "../../utils/hash";

import { Council_v0003Contract } from "../../artifacts/js/council_v0003";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer } from "./councilUtils";
import { UpdateThreshold } from "../../artifacts/js/types/council_v0003";
import { getUpdateThresholdLeo } from "../../artifacts/js/js2leo/council_v0003";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});

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

  console.log(`👍 Proposing to update Threshold: ${newThreshold}`)
  const isOldThreshold = await council.settings(COUNCIL_THRESHOLD_INDEX, 0);
  if (isOldThreshold == newThreshold || newThreshold == 0) {
    throw Error(`${newThreshold} is invalid!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

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
export const execUpdateThreshold = async (proposalId: number, newThreshold: number, ) => {

    console.log(`👍 Proposing to update Threshold: ${newThreshold}`)
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