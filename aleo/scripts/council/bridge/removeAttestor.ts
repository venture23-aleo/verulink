import { hashStruct } from "../../../utils/hash";

import { Vlink_token_bridge_v2Contract } from "../../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TB_REMOVE_ATTESTOR } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbRemoveAttestorLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v2";
import { TbRemoveAttestor } from "../../../artifacts/js/types/vlink_bridge_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_bridge_council_v2Contract } from "../../../artifacts/js/vlink_bridge_council_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });

export const proposeRemoveAttestor = async (attestor: string, new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to add remove attestor: ${attestor}`)
  const isAttestorSupported = await bridge.attestors(attestor, false);
  if (!isAttestorSupported) {
    throw Error(`Attestor ${attestor} is not attestor!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // generating hash
  const tbRemoveAttestor: TbRemoveAttestor = {
    tag: TAG_TB_REMOVE_ATTESTOR,
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbRemoveAttestorProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // propose
  const proposeRemoveAttestorTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeRemoveAttestorTx.wait();

  getProposalStatus(ExternalProposalHash);

  return proposalId
};

export const voteRemoveAttestor = async (proposalId: number, attestor: string, new_threshold: number) => {

  console.log(`👍 Voting to remove attesor: ${attestor}`)
  const isAttestorSupported = await bridge.attestors(attestor, false);
  if (!isAttestorSupported) {
    throw Error(`Attestor ${attestor} is not attestor!`);
  }

  // generating hash
  const tbRemoveAttestor: TbRemoveAttestor = {
    tag: TAG_TB_REMOVE_ATTESTOR,
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbRemoveAttestorProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // vote
  const voteRemoveChainTx = await council.vote(ExternalProposalHash, true);
  await voteRemoveChainTx.wait();

  getProposalStatus(ExternalProposalHash);

}

export const execRemoveAttestor = async (proposalId: number, attestor: string, new_threshold: number) => {

  console.log(`👍 executing to remove attesor: ${attestor}`)
  let isAttestorSupported = await bridge.attestors(attestor, false);
  if (!isAttestorSupported) {
    throw Error(`Attestor ${attestor} is not attestor!`);
  }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  // generating hash
  const tbRemoveAttestor: TbRemoveAttestor = {
    tag: TAG_TB_REMOVE_ATTESTOR,
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbRemoveAttestorProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  // execute
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  const removeAttestorTx = await bridgeCouncil.tb_remove_attestor(
    tbRemoveAttestor.id,
    tbRemoveAttestor.existing_attestor,
    tbRemoveAttestor.new_threshold,
    voters
  );
  await removeAttestorTx.wait();

  isAttestorSupported = await bridge.attestors(attestor, false);
  if (isAttestorSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Attestor: ${attestor} removed successfully.`)

}