import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { TbAddAttestor } from "../../../artifacts/js/types/council_v0003";
import { getTbAddAttestorLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
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
  
    const [proposeAddAttestorTx] = await council.propose(proposalId, tbAddAttestorProposalHash); // 477_914
    
    await council.wait(proposeAddAttestorTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execAddAttestor = async (proposalId: number, newAttestor: string, new_threshold: number, signers: string[], signs: string[]) => {

    console.log(`👍 Executing to add new attestor: ${newAttestor}`)
    let isAttestorSupported = await bridge.attestors(newAttestor, false);
    if (isAttestorSupported) {
      throw Error(`newAttestor ${newAttestor} is already attestor!`);
    }
  
    const addProposalHash = await council.proposals(proposalId);
    validateExecution(addProposalHash);

    const [proposeAddAttestorExecTx] = await council.tb_add_attestor(proposalId, newAttestor, new_threshold, signers, signs);
    await council.wait(proposeAddAttestorExecTx);

    isAttestorSupported = await bridge.attestors(newAttestor, false);
    if (!isAttestorSupported) {
      throw Error('Something went wrong!');
    }
  
    console.log(` ✅ Attestor: ${newAttestor} added successfully.`)
}