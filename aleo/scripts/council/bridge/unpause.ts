import { hashStruct } from "../../../utils/hash";
import { Vlink_token_bridge_v2Contract } from "../../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/testdata.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbUnpause } from "../../../artifacts/js/types/vlink_bridge_council_v2";
import { getTbUnpauseLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_bridge_council_v2Contract } from "../../../artifacts/js/vlink_bridge_council_v2";
import { TAG_TB_UNPAUSE } from "../../../utils/constants";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });

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

  // proposing
  const tbUnpause: TbUnpause = {
    tag: TAG_TB_UNPAUSE,
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(getTbUnpauseLeo(tbUnpause));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbUnpauseProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // proposing
  const proposeUnpauseBridgeTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeUnpauseBridgeTx.wait();

  getProposalStatus(ExternalProposalHash);

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

  // proposing
  const tbUnpause: TbUnpause = {
    tag: TAG_TB_UNPAUSE,
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(getTbUnpauseLeo(tbUnpause));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbUnpauseProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // vote
  const voteAddChainTx = await council.vote(ExternalProposalHash, true);
  await voteAddChainTx.wait();

  getProposalStatus(ExternalProposalHash);

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

  // proposing
  const tbUnpause: TbUnpause = {
    tag: TAG_TB_UNPAUSE,
    id: proposalId,
  };
  const tbUnpauseProposalHash = hashStruct(getTbUnpauseLeo(tbUnpause));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbUnpauseProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  validateExecution(ExternalProposalHash);

  // execute
  const unpauseBridgeTx = await bridgeCouncil.tb_unpause(
    tbUnpause.id,
    voters
  );
  await unpauseBridgeTx.wait();

  isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (!isBridgeUnpaused) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge unpaused successfully.`)

}


async function run() {
  const proposalId = await proposeUnpauseBridge();
  await execUnpause(proposalId);
}

run();

