import { hashStruct } from "../../../utils/hash";

import { Vlink_token_bridge_v4Contract } from "../../../artifacts/js/vlink_token_bridge_v4";
import { Vlink_council_v4Contract } from "../../../artifacts/js/vlink_council_v4";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbRemoveAttestorLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v4";
import { TbRemoveAttestor } from "../../../artifacts/js/types/vlink_bridge_council_v4";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_bridge_council_v4Contract } from "../../../artifacts/js/vlink_bridge_council_v4";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Vlink_bridge_council_v4Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v4Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v4Contract({ mode, priorityFee: 10_000 });

export const proposeRemoveAttestor = async (attestor: string, new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to add remove attestor: ${attestor}`)
  const isAttestorSupported = await bridge.attestors(attestor, false);
  if (!isAttestorSupported) {
    throw Error(`Attestor ${attestor} is not attestor!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbRemoveAttestor: TbRemoveAttestor = {
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor));

  const [proposeRemoveAttestorTx] = await council.propose(proposalId, tbRemoveAttestorProposalHash);

  await council.wait(proposeRemoveAttestorTx);

  getProposalStatus(tbRemoveAttestorProposalHash);

  return proposalId
};

export const voteRemoveAttestor = async (proposalId: number, attestor: string, new_threshold: number) => {

  console.log(`👍 Voting to remove attesor: ${attestor}`)
  const isAttestorSupported = await bridge.attestors(attestor, false);
  if (!isAttestorSupported) {
    throw Error(`Attestor ${attestor} is not attestor!`);
  }

  const tbRemoveAttestor: TbRemoveAttestor = {
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor));

  const voter = council.getAccounts()[0];
  validateVote(tbRemoveAttestorProposalHash, voter);

  const [voteRemoveChainTx] = await council.vote(tbRemoveAttestorProposalHash, true);

  await council.wait(voteRemoveChainTx);

  getProposalStatus(tbRemoveAttestorProposalHash);

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

  const tbRemoveAttestor: TbRemoveAttestor = {
    id: proposalId,
    existing_attestor: attestor,
    new_threshold: new_threshold,
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor));

  validateExecution(tbRemoveAttestorProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbRemoveAttestorProposalHash), SUPPORTED_THRESHOLD);
  const [removeAttestorTx] = await bridgeCouncil.tb_remove_attestor(
    tbRemoveAttestor.id,
    tbRemoveAttestor.existing_attestor,
    tbRemoveAttestor.new_threshold,
    voters
  );

  await council.wait(removeAttestorTx);

  isAttestorSupported = await bridge.attestors(attestor, false);
  if (isAttestorSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Attestor: ${attestor} removed successfully.`)

}