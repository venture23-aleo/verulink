import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { AddMember, TbAddChain } from "../../../artifacts/js/types/council_v0003";
import { getAddMemberLeo, getTbAddChainLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddChain = async (newChainId: bigint): Promise<number> => {

    console.log(`👍 Proposing to add chainId: ${newChainId}`)
    const isChainIdSupported = await bridge.supported_chains(newChainId, false);
    if (isChainIdSupported) {
      throw Error(`ChainId ${newChainId} is already supported!`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tbAddChain: TbAddChain = {
      id: proposalId,
      chain_id: newChainId
    };
    const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 
  
    const [proposeAddChainTx] = await council.propose(proposalId, tbAddChainProposalHash); // 477_914
  
    await council.wait(proposeAddChainTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execAddChain = async (proposalId: number,newChainId: bigint, signers: string[], signs: string[]) => {

    console.log(`👍 Executing to add chainId: ${newChainId}`)
    let isChainIdSupported = await bridge.supported_chains(newChainId, false);
    if (isChainIdSupported) {
      throw Error(`ChainId ${newChainId} is already supported!`);
    }
  
    const addProposalHash = await council.proposals(proposalId);
    validateExecution(addProposalHash);

    const [proposeAddChainExecTx] = await council.tb_add_chain(proposalId, newChainId, signers, signs);
    await council.wait(proposeAddChainExecTx);

    isChainIdSupported = await bridge.supported_chains(newChainId, false);
    if (!isChainIdSupported) {
      throw Error('Something went wrong!');
    }
  
    console.log(` ✅ ChainId: ${newChainId} added successfully.`)
}