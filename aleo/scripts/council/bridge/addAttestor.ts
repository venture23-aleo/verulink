import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { Council_v0002Contract } from "../../../artifacts/js/council_v0002";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbAddAttestorLeo, getTbAddChainLeo } from "../../../artifacts/js/js2leo/council_v0002";
import { TbAddAttestor, TbAddChain } from "../../../artifacts/js/types/council_v0002";
import { Address } from "@aleohq/sdk";
import { getTbAddAttestor } from "../../../artifacts/js/leo2js/council_v0002";

const council = new Council_v0002Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});

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

  const proposeAddAttestorTx = await council.propose(proposalId, tbAddAttestorProposalHash); // 477_914
  
  // @ts-ignore
  await proposeAddAttestorTx.wait()

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

  const voter = council.getAccounts()[0];
  validateVote(tbAddAttestorProposalHash, voter);

  const voteAddChainTx = await council.vote(tbAddAttestorProposalHash); // 477_914
  
  // @ts-ignore
  await voteAddChainTx.wait()

  getProposalStatus(tbAddAttestorProposalHash);

}

export const execAddAttestor = async (proposalId: number,newAttestor: string, new_threshold: number) => {

    console.log(`👍 executing to add attesor: ${newAttestor}`)
    let isAttestorSupported = await bridge.attestors(newAttestor, false);
    if (isAttestorSupported) {
      throw Error(`newAttestor ${newAttestor} is already attestor!`);
    }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbAddAttestor: TbAddAttestor = {
    id: proposalId,
    new_attestor: newAttestor,
    new_threshold: new_threshold,
  };
  const tbAddAttestorProposalHash = hashStruct(getTbAddAttestorLeo(tbAddAttestor)); 

  validateExecution(tbAddAttestorProposalHash);

  const addAttestorTx = await council.tb_add_attestor(
    tbAddAttestor.id,
    tbAddAttestor.new_attestor,
    tbAddAttestor.new_threshold
  ) // 301_747

  // @ts-ignore
  await addAttestorTx.wait()

  isAttestorSupported = await bridge.attestors(newAttestor, false);
  if (!isAttestorSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Attestor: ${newAttestor} added successfully.`)

}