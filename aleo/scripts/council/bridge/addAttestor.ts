import { hashStruct } from "../../../utils/hash";

import { Vlink_token_bridge_v3Contract } from "../../../artifacts/js/vlink_token_bridge_v3";
import { Vlink_council_v3Contract } from "../../../artifacts/js/vlink_council_v3";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbAddAttestorLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v3";
import { TbAddAttestor } from "../../../artifacts/js/types/vlink_bridge_council_v3";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v3Contract } from "../../../artifacts/js/vlink_bridge_council_v3";

const mode = ExecutionMode.SnarkExecute;

const bridgeCouncil = new Vlink_bridge_council_v3Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v3Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v3Contract({ mode, priorityFee: 10_000 });

export const proposeAddAttestor = async (newAttestor: string, new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to add new attestor: ${newAttestor}`)
  const isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (isAttestorSupported) {
    throw Error(`newAttestor ${newAttestor} is already attestor!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddAttestor: TbAddAttestor = {
    id: proposalId,
    new_attestor: newAttestor,
    new_threshold: new_threshold,
  };
  const tbAddAttestorProposalHash = hashStruct(getTbAddAttestorLeo(tbAddAttestor));

  const [proposeAddAttestorTx] = await council.propose(proposalId, tbAddAttestorProposalHash);

  await council.wait(proposeAddAttestorTx);

  getProposalStatus(tbAddAttestorProposalHash);

  return proposalId
};

export const voteAddAttestor = async (proposalId: number, newAttestor: string, new_threshold: number) => {

  console.log(`👍 Voting to add attesor: ${newAttestor}`)
  const isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (isAttestorSupported) {
    throw Error(`newAttestor ${newAttestor} is already attestor!`);
  }

  const tbAddAttestor: TbAddAttestor = {
    id: proposalId,
    new_attestor: newAttestor,
    new_threshold: new_threshold,
  };
  const tbAddAttestorProposalHash = hashStruct(getTbAddAttestorLeo(tbAddAttestor));

  const voter = council.getDefaultAccount();
  validateVote(tbAddAttestorProposalHash, voter);

  const [voteAddChainTx] = await council.vote(tbAddAttestorProposalHash, true);

  await council.wait(voteAddChainTx);

  getProposalStatus(tbAddAttestorProposalHash);

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

  const tbAddAttestor: TbAddAttestor = {
    id: proposalId,
    new_attestor: newAttestor,
    new_threshold: new_threshold,
  };
  const tbAddAttestorProposalHash = hashStruct(getTbAddAttestorLeo(tbAddAttestor));

  validateExecution(tbAddAttestorProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbAddAttestorProposalHash), SUPPORTED_THRESHOLD);
  const [addAttestorTx] = await bridgeCouncil.tb_add_attestor(
    tbAddAttestor.id,
    tbAddAttestor.new_attestor,
    tbAddAttestor.new_threshold,
    voters
  )

  await council.wait(addAttestorTx);

  isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (!isAttestorSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Attestor: ${newAttestor} added successfully.`)

}