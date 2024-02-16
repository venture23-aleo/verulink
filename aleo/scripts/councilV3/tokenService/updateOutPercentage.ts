import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { Token_service_v0002Contract } from "../../../artifacts/js/token_service_v0002";
import { TsUpdateMaxTransfer } from "../../../artifacts/js/types/council_v0003";
import { getTsUpdateMaxTransferLeo, getTsUpdateWithdrawalLimitLeo } from "../../../artifacts/js/js2leo/council_v0003";
import { TsUpdateWithdrawalLimit } from "../../../artifacts/js/types/council_v0002";



const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0002Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateOutPercentage = async (
    tokenAddress: string,
    percentage: number,
    duration: number,
    threshold_no_limit: bigint
    ): Promise<number> => 
{

    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 
    console.log(`👍 Proposing to update outgoing percentage of : ${tokenAddress}`)
    const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
      throw Error(`Token ${tokenAddress} is not found`);
    }
  
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit = {
        id: proposalId,
        token_address: tokenAddress,
        percentage: percentage,
        duration: duration,
        threshold_no_limit: threshold_no_limit
      };
    const tsUpdateWithdrawalLimitHash = hashStruct(getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit)); 
    
    const [proposeUpdateOutPercentageTx] = await council.propose(proposalId, tsUpdateWithdrawalLimitHash);
      
    await council.wait(proposeUpdateOutPercentageTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateWithdrawalLimit = async (
    proposalId: number, 
    tokenAddress: string,
    percentage: number,
    duration: number,
    threshold_no_limit: bigint,
    signers: string[], 
    signs: string[]) => 
{

    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 
    console.log(`Updating outgoing percentage of ${tokenAddress}`)
    const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
      throw Error(`Token ${tokenAddress} is not found`);
    }
  
    const tokenServiceOwner = await tokenService.owner_TS(true);
    if (tokenServiceOwner != council.address()) {
      throw Error("Council is not the owner of tokenService program");
    }

    const tbUpdateWithdrawalLimitHash = await council.proposals(proposalId);
    validateExecution(tbUpdateWithdrawalLimitHash);


    const [updateWithdrawalLimitTx] = await council.ts_update_outgoing_percentage(
        proposalId,
        tokenAddress,
        percentage,
        duration,
        threshold_no_limit,
        signers, 
        signs
      ) // 301_747
    
      await council.wait(updateWithdrawalLimitTx);

      const new_outgoing_percentage = {
        percentage: percentage,
        duration: duration,
        threshold_no_limit: threshold_no_limit
      };

      const updatedWithdrawalLimit = await tokenService.token_withdrawal_limits(tokenAddress);
      if (new_outgoing_percentage.percentage != updatedWithdrawalLimit.percentage) {
        throw Error(`❌ Unknown error.`);
      }
    
      console.log(` ✅ Token: ${tokenAddress} minimum tranfer value updated successfully.`)
}