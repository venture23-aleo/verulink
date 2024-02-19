import { hashStruct } from "../../../utils/hash";
import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { TbUnpause } from "../../../artifacts/js/types/council_v0003";
import { getTbUnpauseLeo } from "../../../artifacts/js/js2leo/council_v0003";

const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposePause = async (): Promise<number> => {

  console.log(`👍 Proposing to unpause bridge:`)
  const isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`Bridge is already paused!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbPause: TbUnpause = {
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbUnpauseLeo(tbPause)); 

  const [proposePauseBridgeTx] = await council.propose(proposalId, tbPauseProposalHash); // 477_914
  
  await council.wait(proposePauseBridgeTx);

  return proposalId
};


//////////////////////
///// Execute ////////
//////////////////////
export const execUnPause = async (proposalId: number, signers: string[], signs: string[]) => {

  console.log(`Pausing bridge`)
  let isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`Bridge is already paused!`);
  }


  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbUnPause: TbUnpause = {
    id: proposalId,
  };
  const tbUnPauseProposalHash = hashStruct(getTbUnpauseLeo(tbUnPause)); 

  const voter = council.getAccounts()[0];
  validateExecution(tbUnPauseProposalHash);

  const [unpauseBridgeTx] = await council.tb_unpause(
    proposalId,
    signers, 
    signs
  ); 

  await council.wait(unpauseBridgeTx);

  isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge unpaused successfully.`)

}