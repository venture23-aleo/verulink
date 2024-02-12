import { hashStruct } from "../../../utils/hash";
import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { Council_v0002Contract } from "../../../artifacts/js/council_v0002";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbPause, TbUnpause } from "../../../artifacts/js/types/council_v0002";
import { getTbPauseLeo, getTbUnpauseLeo } from "../../../artifacts/js/js2leo/council_v0002";

const council = new Council_v0002Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});

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

  const proposePauseBridgeTx = await council.propose(proposalId, tbPauseProposalHash); // 477_914
  
  // @ts-ignore
  await proposePauseBridgeTx.wait()

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

  const votePauseTx = await council.vote(tbPauseProposalHash); // 477_914
  
  // @ts-ignore
  await votePauseTx.wait()

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
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbPause: TbPause = {
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause)); 

  const voter = council.getAccounts()[0];
  validateExecution(tbPauseProposalHash);

  const pauseBridgeTx = await council.tb_unpause(
    tbPause.id,
  ); 

  // @ts-ignore
  await pauseBridgeTx.wait()

  isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgeUnpaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge paused successfully.`)

}