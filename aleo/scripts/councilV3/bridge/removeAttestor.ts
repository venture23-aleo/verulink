import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { TbRemoveAttestor } from "../../../artifacts/js/types/council_v0003";
import { getTbRemoveAttestorLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveAttestor = async (newAttestor: string, new_threshold: number): Promise<number> => {

    console.log(`👍 Proposing to remove new attestor: ${newAttestor}`)
    const isAttestorSupported = await bridge.attestors(newAttestor, false);
    if (isAttestorSupported) {
      throw Error(`newAttestor ${newAttestor} is already attestor!`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tbRemoveAttestor: TbRemoveAttestor = {
      id: proposalId,
      existing_attestor: newAttestor,
      new_threshold: new_threshold,
    };
    const tbRemoveAttestorProposalHash = hashStruct(getTbRemoveAttestorLeo(tbRemoveAttestor)); 
  
    const [proposeRemoveAttestorTx] = await council.propose(proposalId, tbRemoveAttestorProposalHash); // 477_914
    
    await council.wait(proposeRemoveAttestorTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveAttestor = async (proposalId: number, newAttestor: string, new_threshold: number, signers: string[], signs: string[]) => {

    console.log(`👍 Executing to remove new attestor: ${newAttestor}`)
    let isAttestorSupported = await bridge.attestors(newAttestor, false);
    if (isAttestorSupported) {
      throw Error(`newAttestor ${newAttestor} is already attestor!`);
    }
  
    const removeProposalHash = await council.proposals(proposalId);
    validateExecution(removeProposalHash);

    const [proposeRemoveAttestorExecTx] = await council.tb_remove_attestor(proposalId, newAttestor, new_threshold, signers, signs);
    await council.wait(proposeRemoveAttestorExecTx);

    isAttestorSupported = await bridge.attestors(newAttestor, false);
    if (isAttestorSupported) {
      throw Error('Something went wrong!');
    }
  
    console.log(` ✅ Attestor: ${newAttestor} removed successfully.`)
}