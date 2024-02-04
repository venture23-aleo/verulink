import { TbUnpause } from "../../../artifacts/js/types";
import { hashStruct } from "../../../utils/hash";

import * as js2leo from '../../../artifacts/js/js2leo';
import { Token_bridge_v0001Contract } from "../../../artifacts/js/token_bridge_v0001";
import { Council_v0001Contract } from "../../../artifacts/js/council_v0001";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";

const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0001Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUnpause = async (): Promise<number> => {

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
  const tbUnpauseProposalHash = hashStruct(js2leo.getTbUnpauseLeo(tbUnpause)); 

  const proposeUnpauseBridgeTx = await council.propose(proposalId, tbUnpauseProposalHash); // 477_914
  
  // @ts-ignore
  await proposeUnpauseBridgeTx.wait()

  getProposalStatus(tbUnpauseProposalHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUnpause = async (proposalId: number) => {

  console.log(`👍 Voting to unpause bridge:`)
  const isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgeUnpaused) {
    throw Error(`Bridge is already unpaused!`);
  }

  const tbUnpause: TbUnpause = {
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(js2leo.getTbUnpauseLeo(tbUnpause)); 

  const voter = council.getAccounts()[0];
  validateVote(tbUnpauseProposalHash, voter);

  const voteAddChainTx = await council.vote(tbUnpauseProposalHash); // 477_914
  
  // @ts-ignore
  await voteAddChainTx.wait()

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
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbUnpause: TbUnpause = {
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(js2leo.getTbUnpauseLeo(tbUnpause)); 

  const voter = council.getAccounts()[0];
  validateExecution(tbUnpauseProposalHash);

  const unpauseBridgeTx = await council.tb_unpause(
    tbUnpause.id,
  ); 

  // @ts-ignore
  await unpauseBridgeTx.wait()

  isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge unpaused successfully.`)

}