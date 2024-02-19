import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { TsRemoveToken } from "../../../artifacts/js/types/council_v0003";
import { getTsRemoveTokenLeo } from "../../../artifacts/js/js2leo/council_v0003";



const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0003Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveToken = async (
    tokenAddress: string,
    ): Promise<number> => {

    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 
    console.log(`👍 Proposing to remove token: ${tokenAddress}`)
    const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
      throw Error(`Token ${tokenAddress} is not added`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tsRemoveToken: TsRemoveToken = {
        id: proposalId,
        token_address: tokenAddress
      };
    const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken)); 
    
    const [proposeRemoveTokenTx] = await council.propose(proposalId, tbRemoveTokenProposalHash);
    
    await council.wait(proposeRemoveTokenTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveToken = async (
    proposalId: number, 
    tokenAddress: string,
    signers: string[], 
    signs: string[]) => {

    console.log(`Removing token ${tokenAddress}`)
    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 

    const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
      throw Error(`Token ${tokenAddress} is not found`);
    }
  
    const tokenServiceOwner = await tokenService.owner_TS(true);
    if (tokenServiceOwner != council.address()) {
      throw Error("Council is not the owner of tokenService program");
    }
  
    const tbRemoveTokenProposalHash = await council.proposals(proposalId);
    validateExecution(tbRemoveTokenProposalHash);


    const [removeTokenTx] = await council.ts_remove_token(
        proposalId,
        tokenAddress,
        signers, 
        signs
      ) // 301_747
    
      await council.wait(removeTokenTx);

      const updatedConnector = await tokenService.token_connectors(tokenAddress, "false");
      if (updatedConnector != "false") {
        throw Error(`❌ Unknown error.`);
      }
    
      console.log(` ✅ Token: ${tokenAddress} removed successfully.`)
}