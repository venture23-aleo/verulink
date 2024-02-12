import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { Council_v0002Contract } from "../../../artifacts/js/council_v0002";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbAddAttestorLeo, getTbAddChainLeo, getTbUpdateThresholdLeo } from "../../../artifacts/js/js2leo/council_v0002";
import { TbAddAttestor, TbAddChain, TbUpdateThreshold } from "../../../artifacts/js/types/council_v0002";
import { Address } from "@aleohq/sdk";
import { getTbAddAttestor } from "../../../artifacts/js/leo2js/council_v0002";

const council = new Council_v0002Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});

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

  const proposeUpdateThresholdTx = await council.propose(proposalId, tbUpdateThresholdProposalHash); // 477_914
  
  // @ts-ignore
  await proposeUpdateThresholdTx.wait()

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

  const voteUpdateThresholdTx = await council.vote(tbUpdateThresholdProposalHash); // 477_914
  
  // @ts-ignore
  await voteUpdateThresholdTx.wait()

  getProposalStatus(tbUpdateThresholdProposalHash);

}

export const execUpdateThreshold = async (proposalId: number, new_threshold: number) => {

    console.log(`👍 executing to update threshold: ${new_threshold}`)

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbUpdateThreshold: TbUpdateThreshold = {
    id: proposalId,
    new_threshold: new_threshold
  };
  const tbUpdateThresholdProposalHash = hashStruct(getTbUpdateThresholdLeo(tbUpdateThreshold)); 

  validateExecution(tbUpdateThresholdProposalHash);

  const updateThresholdTx = await council.tb_update_threshold(
    tbUpdateThreshold.id,
    tbUpdateThreshold.new_threshold
  ) // 301_747

  // @ts-ignore
  await updateThresholdTx.wait()

  const THRESHOLD_INDEX = 1;
  const updatedThreshold = await bridge.bridge_settings(THRESHOLD_INDEX);
  if (updatedThreshold != new_threshold) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Threshold: ${new_threshold} updated successfully.`)

}