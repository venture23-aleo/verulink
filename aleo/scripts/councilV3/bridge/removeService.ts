import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { TbAddService, TbRemoveService } from "../../../artifacts/js/types/council_v0003";
import { getTbAddServiceLeo, getTbRemoveServiceLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveService = async (tokenService: string): Promise<number> => {

    console.log(`👍 Proposing to remove token service: ${tokenService}`)
    const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
    if (isTokenServiceSupported) {
      throw Error(`Service ${tokenService} is already removed!`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tbRemoveService: TbRemoveService = {
        id: proposalId,
        service: tokenService
      };
      const tbRemoveTokenServiceProposalHash = hashStruct(getTbRemoveServiceLeo(tbRemoveService)); 
    
    const [proposeRemoveTokenServiceTx] = await council.propose(proposalId, tbRemoveTokenServiceProposalHash); // 477_914
    
    await council.wait(proposeRemoveTokenServiceTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveChain = async (proposalId: number, tokenService: string, signers: string[], signs: string[]) => {

    console.log(`👍 Proposing to remove token service: ${tokenService}`)
    let isTokenServiceSupported = await bridge.supported_services(tokenService, false);
    if (isTokenServiceSupported) {
      throw Error(`Service ${tokenService} is already removed!`);
    }
  
    const tbRemoveTokenServiceProposalHash = await council.proposals(proposalId);
    validateExecution(tbRemoveTokenServiceProposalHash);

    const [removeTokenServiceTx] = await council.tb_remove_service(proposalId, tokenService, signers, signs);
    await council.wait(removeTokenServiceTx);

    isTokenServiceSupported = await bridge.supported_services(tokenService, false);
    if (isTokenServiceSupported) {
      throw Error(`❌ Unknown error.`);
    }

    console.log(` ✅ TokenService: ${tokenService} removed successfully.`)
}