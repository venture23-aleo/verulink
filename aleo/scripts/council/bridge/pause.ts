import { hashStruct } from "../../../utils/hash";
import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { CouncilContract } from "../../../artifacts/js/council";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbPause, TbUnpause } from "../../../artifacts/js/types/bridge_council";
import { getTbPauseLeo, getTbUnpauseLeo } from "../../../artifacts/js/js2leo/bridge_council";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Bridge_councilContract } from "../../../artifacts/js/bridge_council";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Bridge_councilContract({mode, priorityFee: 10_000});

const council = new CouncilContract({mode, priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode, priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposePause = async (): Promise<number> => {

  console.log(`👍 Proposing to pause bridge:`)
  const isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`Bridge is already paused!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbPause: TbPause = {
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause)); 

  const [proposePauseBridgeTx] = await council.propose(proposalId, tbPauseProposalHash); 
  
  await council.wait(proposePauseBridgeTx);

  getProposalStatus(tbPauseProposalHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const votePause = async (proposalId: number) => {

  console.log(`👍 Voting to pause bridge:`)
  const isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`Bridge is already paused!`);
  }

  const tbPause: TbPause = {
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause)); 

  const voter = council.getAccounts()[0];
  validateVote(tbPauseProposalHash, voter);

  const [votePauseTx] = await council.vote(tbPauseProposalHash, true);
  
  await council.wait(votePauseTx);

  getProposalStatus(tbPauseProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execPause = async (proposalId: number) => {

  console.log(`Pausing bridge`)
  let isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`Bridge is already paused!`);
  }


  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbPause: TbPause = {
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause)); 

  const voter = council.getAccounts()[0];
  validateExecution(tbPauseProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbPauseProposalHash), SUPPORTED_THRESHOLD);
  const [pauseBridgeTx] = await bridgeCouncil.tb_unpause(
    tbPause.id,
    voters
  ); 

  await council.wait(pauseBridgeTx);

  isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgeUnpaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge paused successfully.`)

}