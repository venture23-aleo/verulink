import { hashStruct } from "../../../utils/hash";

import { Vlink_token_bridge_v2Contract } from "../../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TB_ADD_ATTESTOR } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbAddAttestorLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v2";
import { TbAddAttestor } from "../../../artifacts/js/types/vlink_bridge_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v2Contract } from "../../../artifacts/js/vlink_bridge_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";

const mode = ExecutionMode.SnarkExecute;

const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });

export const proposeAddAttestor = async (newAttestor: string, new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to add new attestor: ${newAttestor}`)
  const isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (isAttestorSupported) {
    throw Error(`newAttestor ${newAttestor} is already attestor!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // generating hash
  const tbAddAttestor: TbAddAttestor = {
    tag: TAG_TB_ADD_ATTESTOR,
    id: proposalId,
    new_attestor: newAttestor,
    new_threshold: new_threshold,
  };
  const tbAddAttestorProposalHash = hashStruct(getTbAddAttestorLeo(tbAddAttestor));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbAddAttestorProposalHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // proposing
  const proposeAddAttestorTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeAddAttestorTx.wait();

  getProposalStatus(ExternalProposalHash);

  return proposalId
};

export const voteAddAttestor = async (proposalId: number, newAttestor: string, new_threshold: number) => {

  console.log(`👍 Voting to add attesor: ${newAttestor}`)
  const isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (isAttestorSupported) {
    throw Error(`newAttestor ${newAttestor} is already attestor!`);
  }

  // generating hash
  const tbAddAttestor: TbAddAttestor = {
    tag: TAG_TB_ADD_ATTESTOR,
    id: proposalId,
    new_attestor: newAttestor,
    new_threshold: new_threshold,
  };
  const tbAddAttestorProposalHash = hashStruct(getTbAddAttestorLeo(tbAddAttestor));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbAddAttestorProposalHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getDefaultAccount();
  validateVote(ExternalProposalHash, voter);

  // voting
  const voteAddChainTx = await council.vote(ExternalProposalHash, true);
  await voteAddChainTx.wait();

  getProposalStatus(ExternalProposalHash);

}

export const execAddAttestor = async (proposalId: number, newAttestor: string, new_threshold: number) => {

  console.log(`👍 executing to add attesor: ${newAttestor}`)
  let isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (isAttestorSupported) {
    throw Error(`newAttestor ${newAttestor} is already attestor!`);
  }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  // generating hash
  const tbAddAttestor: TbAddAttestor = {
    tag: TAG_TB_ADD_ATTESTOR,
    id: proposalId,
    new_attestor: newAttestor,
    new_threshold: new_threshold,
  };
  const tbAddAttestorProposalHash = hashStruct(getTbAddAttestorLeo(tbAddAttestor));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbAddAttestorProposalHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  // executing
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  const addAttestorTx = await bridgeCouncil.tb_add_attestor(
    tbAddAttestor.id,
    tbAddAttestor.new_attestor,
    tbAddAttestor.new_threshold,
    voters
  )
  await addAttestorTx.wait();

  isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (!isAttestorSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Attestor: ${newAttestor} added successfully.`)

}