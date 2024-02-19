import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { TsUpdateMaxTransfer } from "../../../artifacts/js/types/council_v0003";
import { getTsUpdateMaxTransferLeo } from "../../../artifacts/js/js2leo/council_v0003";



const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0003Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateMaxTransfer = async (
    tokenAddress: string,
    maxTransfer: bigint
    ): Promise<number> => {

    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 
    console.log(`👍 Proposing to update minimum transfer of : ${tokenAddress}`)
    const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
      throw Error(`Token ${tokenAddress} is not found`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tsUpdateMaxTransfer: TsUpdateMaxTransfer = {
        id: proposalId,
        token_address: tokenAddress,
        max_transfer: maxTransfer
      };
      const TsUpdateMaxTransferHash = hashStruct(getTsUpdateMaxTransferLeo(tsUpdateMaxTransfer)); 
    
      const [proposeUpdateMaxTransferTx] = await council.propose(proposalId, TsUpdateMaxTransferHash);
      
      await council.wait(proposeUpdateMaxTransferTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateMaxTransfer = async (
    proposalId: number, 
    tokenAddress: string,
    maxTransfer: bigint,
    signers: string[], 
    signs: string[]) => 
{

    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 
    console.log(`Updating maximum transfer for ${tokenAddress}`)
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


    const [tsUpdateMaxTransfer] = await council.ts_update_max_transfer(
        proposalId,
        tokenAddress,
        maxTransfer,
        signers, 
        signs
      ) // 301_747
    
      await council.wait(tsUpdateMaxTransfer);

      const updatedMaximumTransfer = await tokenService.max_transfers(tokenAddress);
      if (maxTransfer != updatedMaximumTransfer) {
        throw Error(`❌ Unknown error.`);
      }
    
      console.log(` ✅ Token: ${tokenAddress} maximum tranfer value updated successfully.`)
}