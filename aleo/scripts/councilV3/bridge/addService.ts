import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { TbAddService } from "../../../artifacts/js/types/council_v0003";
import { getTbAddServiceLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddService = async (tokenService: string): Promise<number> => {

    console.log(`👍 Proposing to add token service: ${tokenService}`)
    const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
    if (isTokenServiceSupported) {
      throw Error(`Service ${tokenService} is already added!`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tbAddService: TbAddService = {
        id: proposalId,
        service: tokenService
      };
      const tbAddTokenServiceProposalHash = hashStruct(getTbAddServiceLeo(tbAddService)); 
    
    const [proposeAddTokenServiceTx] = await council.propose(proposalId, tbAddTokenServiceProposalHash); // 477_914
    
    await council.wait(proposeAddTokenServiceTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execAddService = async (proposalId: number, tokenService: string, signers: string[], signs: string[]) => {

    console.log(`👍 Proposing to add token service: ${tokenService}`)
    let isTokenServiceSupported = await bridge.supported_services(tokenService, false);
    if (isTokenServiceSupported) {
      throw Error(`Service ${tokenService} is already added!`);
    }
  
    const tbAddTokenServiceProposalHash = await council.proposals(proposalId);
    validateExecution(tbAddTokenServiceProposalHash);

    const [addTokenServiceTx] = await council.tb_add_service(proposalId, tokenService, signers, signs);
    await council.wait(addTokenServiceTx);

    isTokenServiceSupported = await bridge.supported_services(tokenService, false);
    if (!isTokenServiceSupported) {
      throw Error(`❌ Unknown error.`);
    }
  
    console.log(` ✅ TokenService: ${tokenService} added successfully.`)
}