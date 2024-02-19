import { hashStruct } from "../../../utils/hash";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
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
  const tbAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken)); 

  const [proposeAddChainTx] = await council.propose(proposalId, tbAddTokenProposalHash);
  
  await council.wait(proposeAddChainTx);

  getProposalStatus(tbAddTokenProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteAddToken = async (
    proposalId: number, 
    tokenAddress: string,
    tokenConnector: string,
    minTransfer: bigint,
    maxTransfer: bigint,
    outgoingPercentage: number,
    timeframe: number,
    maxNoCap: bigint
) => {
  console.log(`👍 Voting to add token: ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  }

  const voter = council.getAccounts()[0];
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

  validateVote(tsAddTokenProposalHash, voter);

  const [voteAddTokenTx] = await council.vote(tsAddTokenProposalHash);
  
  await council.wait(voteAddTokenTx);

  getProposalStatus(tsAddTokenProposalHash);

}

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
    maxNoCap: bigint
) => {
  console.log(`Adding token ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  }

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

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

  validateExecution(tsAddTokenProposalHash);

  const [addChainTx] = await council.ts_add_token(
    tsAddToken.id,
    tsAddToken.token_address,
    tsAddToken.connector,
    tsAddToken.min_transfer,
    tsAddToken.max_transfer,
    tsAddToken.outgoing_percentage,
    tsAddToken.time,
    tsAddToken.max_no_cap
  ) // 301_747

  await council.wait(addChainTx);

  const updatedConnector = await tokenService.token_connectors(tokenAddress);
  if (updatedConnector != tokenConnector) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Token: ${tokenAddress} added successfully.`)

}