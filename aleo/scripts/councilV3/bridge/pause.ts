import { hashStruct } from "../../../utils/hash";
import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { TbPause } from "../../../artifacts/js/types/council_v0003";
import { getTbPauseLeo } from "../../../artifacts/js/js2leo/council_v0003";

const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposePause = async (): Promise<number> => {

  console.log(`👍 Proposing to pause bridge:`)
  const isBridgePaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgePaused) {
    throw Error(`Bridge is already paused!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbPause: TbPause = {
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause)); 

  const [proposePauseBridgeTx] = await council.propose(proposalId, tbPauseProposalHash); // 477_914
  
  await council.wait(proposePauseBridgeTx);

  return proposalId
};


//////////////////////
///// Execute ////////
//////////////////////
export const execPause = async (proposalId: number, signers: string[], signs: string[]) => {

  console.log(`Pausing bridge`)
  let isBridgePaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgePaused) {
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

  const [pauseBridgeTx] = await council.tb_pause(
    proposalId,
    signers, 
    signs
  ); 

  await council.wait(pauseBridgeTx);

  isBridgePaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgePaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge paused successfully.`)

}