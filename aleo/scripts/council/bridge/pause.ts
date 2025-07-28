import { hashStruct } from "../../../utils/hash";
import { Vlink_token_bridge_v2Contract } from "../../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_UNPAUSED_VALUE, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TB_PAUSE } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbPause, TbUnpause } from "../../../artifacts/js/types/vlink_bridge_council_v2";
import { getTbPauseLeo, getTbUnpauseLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v2Contract } from "../../../artifacts/js/vlink_bridge_council_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });

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

  // generating hash
  const tbPause: TbPause = {
    tag: TAG_TB_PAUSE,
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause));

  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbPauseProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // propose
  const proposePauseBridgeTx = await council.propose(proposalId, ExternalProposalHash);
  await proposePauseBridgeTx.wait();

  getProposalStatus(ExternalProposalHash);

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

  // generating hash
  const tbPause: TbPause = {
    tag: TAG_TB_PAUSE,
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause));

  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbPauseProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // vote
  const votePauseTx = await council.vote(ExternalProposalHash, true);
  await votePauseTx.wait();

  getProposalStatus(ExternalProposalHash);

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

  // generating hash
  const tbPause: TbPause = {
    tag: TAG_TB_PAUSE,
    id: proposalId,
  };
  const tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause));

  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbPauseProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateExecution(ExternalProposalHash);

  // execute
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  const pauseBridgeTx = await bridgeCouncil.tb_unpause(
    tbPause.id,
    voters
  );

  await pauseBridgeTx.wait();

  isBridgeUnpaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_UNPAUSED_VALUE;
  if (isBridgeUnpaused) {
    console.log(`❌ Unknown error.`);
  }

  console.log(` ✅ Bridge paused successfully.`)

}