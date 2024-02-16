import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { Token_service_v0002Contract } from "../../../artifacts/js/token_service_v0002";
import { TsRemoveToken, TsUpdateMinTransfer } from "../../../artifacts/js/types/council_v0003";
import { getTsRemoveTokenLeo, getTsUpdateMinTransferLeo } from "../../../artifacts/js/js2leo/council_v0003";



const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0002Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateMinTransfer = async (
    tokenAddress: string,
    minTransfer: bigint
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
    const tsUpdateMinTransfer: TsUpdateMinTransfer = {
        id: proposalId,
        token_address: tokenAddress,
        min_transfer: minTransfer
      };
      const TsUpdateMinTransferHash = hashStruct(getTsUpdateMinTransferLeo(tsUpdateMinTransfer)); 
    
      const [proposeUpdateMinTransferTx] = await council.propose(proposalId, TsUpdateMinTransferHash);
      
      await council.wait(proposeUpdateMinTransferTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateMinTransfer = async (
    proposalId: number, 
    tokenAddress: string,
    minTransfer: bigint,
    signers: string[], 
    signs: string[]) => 
{

    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 
    console.log(`Updating minimum transfer for ${tokenAddress}`)
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


    const [tsUpdateMinTransfer] = await council.ts_update_min_transfer(
        proposalId,
        tokenAddress,
        minTransfer,
        signers, 
        signs
      ) // 301_747
    
      await council.wait(tsUpdateMinTransfer);

      const updatedMinimumTransfer = await tokenService.min_transfers(tokenAddress);
      if (minTransfer != updatedMinimumTransfer) {
        throw Error(`❌ Unknown error.`);
      }
    
      console.log(` ✅ Token: ${tokenAddress} minimum tranfer value updated successfully.`)
}