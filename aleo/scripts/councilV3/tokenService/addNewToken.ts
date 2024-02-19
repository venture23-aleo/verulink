import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { TsAddToken } from "../../../artifacts/js/types/council_v0003";
import { getTsAddTokenLeo } from "../../../artifacts/js/js2leo/council_v0003";



const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0003Contract({mode: "execute", priorityFee: 10_000});


//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddToken = async (
    tokenAddress: string,
    tokenConnector: string,
    minTransfer: bigint,
    maxTransfer: bigint,
    outgoingPercentage: number,
    timeframe: number,
    maxNoCap: bigint
    ): Promise<number> => {

    console.log(`👍 Proposing to add token: ${tokenAddress}`)
    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 
    const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
        throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    }
    const proposer = council.getAccounts()[0];
    validateProposer(proposer);
  
    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tsAddToken: TsAddToken = {
        id: proposalId,
        token_address: tokenAddress,
        connector: tokenConnector,
        min_transfer: minTransfer,
        max_transfer: maxTransfer,
        outgoing_percentage: outgoingPercentage,
        time: timeframe,
        max_no_cap: maxNoCap
      };
    const tsAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken)); 
    
    const [proposeAddTokenTx] = await council.propose(proposalId, tsAddTokenProposalHash); // 477_914
    
    await council.wait(proposeAddTokenTx);
      
    return proposalId
  };


//////////////////////
///// Execute ////////
//////////////////////
export const execAddToken = async (
    proposalId: number, 
    tokenAddress: string,
    tokenConnector: string,
    minTransfer: bigint,
    maxTransfer: bigint,
    outgoingPercentage: number,
    timeframe: number,
    maxNoCap: bigint,
    signers: string[], 
    signs: string[]) => {

    console.log(`Adding token ${tokenAddress}`)
    const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"; 

    const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
        throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    }

    const tokenServiceOwner = await tokenService.owner_TS(true);
    if (tokenServiceOwner != council.address()) {
        throw Error("Council is not the owner of tokenService program");
    }
  
    const tbAddTokenProposalHash = await council.proposals(proposalId);
    validateExecution(tbAddTokenProposalHash);

    const [addTokenTx] = await council.ts_add_token(
        proposalId, 
        tokenAddress, 
        tokenConnector,
        minTransfer,
        maxTransfer,
        outgoingPercentage,
        timeframe,
        maxNoCap,
        signers, 
        signs);
    await council.wait(addTokenTx);

    const updatedConnector = await tokenService.token_connectors(tokenAddress);
    if (updatedConnector != tokenConnector) {
      throw Error(`❌ Unknown error.`);
    }
  
    console.log(` ✅ Token: ${tokenAddress} added successfully.`)
}