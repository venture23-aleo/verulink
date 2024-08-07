import { hashStruct } from "../../../utils/hash";
import { Token_bridge_dev_v1Contract } from "../../../artifacts/js/token_bridge_dev_v1";
import { Council_dev_v1Contract } from "../../../artifacts/js/council_dev_v1";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbUnpause } from "../../../artifacts/js/types/bridge_council_dev_v1";
import { getTbUnpauseLeo } from "../../../artifacts/js/js2leo/bridge_council_dev_v1";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Bridge_council_dev_v1Contract } from "../../../artifacts/js/bridge_council_dev_v1";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Bridge_council_dev_v1Contract({mode, priorityFee: 10_000});

const council = new Council_dev_v1Contract({mode, priorityFee: 10_000});
const bridge = new Token_bridge_dev_v1Contract({mode, priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUnpauseBridge = async (): Promise<number> => {

  console.log(`👍 Proposing to unpause bridge:`)
  const isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgeUnpaused) {
    throw Error(`Bridge is already unpaused!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbUnpause: TbUnpause = {
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(getTbUnpauseLeo(tbUnpause)); 

  const [proposeUnpauseBridgeTx] = await council.propose(proposalId, tbUnpauseProposalHash); 
  
  await council.wait(proposeUnpauseBridgeTx);

  getProposalStatus(tbUnpauseProposalHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUnpauseBridge = async (proposalId: number) => {

  console.log(`👍 Voting to unpause bridge:`)
  const isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgeUnpaused) {
    throw Error(`Bridge is already unpaused!`);
  }

  const tbUnpause: TbUnpause = {
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(getTbUnpauseLeo(tbUnpause)); 

  const voter = council.getAccounts()[0];
  validateVote(tbUnpauseProposalHash, voter);

  const [voteAddChainTx] = await council.vote(tbUnpauseProposalHash, true); 
  
  await council.wait(voteAddChainTx);

  getProposalStatus(tbUnpauseProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUnpause = async (proposalId: number) => {

  console.log(`Unpausing bridge`)
  let isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgeUnpaused) {
    throw Error(`Bridge is already unpaused!`);
  }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbUnpause: TbUnpause = {
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(getTbUnpauseLeo(tbUnpause)); 

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbUnpauseProposalHash), SUPPORTED_THRESHOLD);
  validateExecution(tbUnpauseProposalHash);

  const [unpauseBridgeTx] = await bridgeCouncil.tb_unpause(
    tbUnpause.id,
    voters
  ); 

  await council.wait(unpauseBridgeTx);

  isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge unpaused successfully.`)

}