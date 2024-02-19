import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { TbRemoveChain } from "../../../artifacts/js/types/council_v0003";
import { getTbRemoveChainLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveChain = async (newChainId: bigint): Promise<number> => {

    console.log(`👍 Proposing to remove chainId: ${newChainId}`)
    const isChainIdSupported = await bridge.supported_chains(newChainId, false);
    if (!isChainIdSupported) {
      throw Error(`ChainId ${newChainId} is not supported!`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tbRemoveChain: TbRemoveChain = {
      id: proposalId,
      chain_id: newChainId
    };
    const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 
  
    const [proposeRemoveChainTx] = await council.propose(proposalId, tbRemoveChainProposalHash); // 477_914
  
    await council.wait(proposeRemoveChainTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveChain = async (proposalId: number, newChainId: bigint, signers: string[], signs: string[]) => {

    console.log(`👍 Executing to remove chainId: ${newChainId}`)
    let isChainIdSupported = await bridge.supported_chains(newChainId, false);
    if (isChainIdSupported) {
      throw Error(`ChainId ${newChainId} is already supported!`);
    }
  
    const removeProposalHash = await council.proposals(proposalId);
    validateExecution(removeProposalHash);

    const [proposeRemoveChainExecTx] = await council.tb_remove_chain(proposalId, newChainId, signers, signs);
    await council.wait(proposeRemoveChainExecTx);

    isChainIdSupported = await bridge.supported_chains(newChainId, false);
    if (!isChainIdSupported) {
      throw Error('Something went wrong!');
    }
  
    console.log(` ✅ ChainId: ${newChainId} removed successfully.`)
}