import { hashStruct } from "../../../utils/hash";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsAddToken, TsUpdateMinTransfer } from "../../../artifacts/js/types/council_v0003";
import { getTsAddTokenLeo, getTsUpdateMinTransferLeo } from "../../../artifacts/js/js2leo/council_v0003";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";

const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0003Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateMinTransfer = async (
    tokenAddress: string,
    minTransfer: bigint,
): Promise<number> => {

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

  getProposalStatus(TsUpdateMinTransferHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUpdateMinTransfer = async (
    proposalId: number, 
    tokenAddress: string,
    minTransfer: bigint,
) => {
  console.log(`👍 Voting to update minimum transfer of: ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is not found`);
  }

  const voter = council.getAccounts()[0];

  const tsUpdateMinTransfer: TsUpdateMinTransfer = {
    id: proposalId,
    token_address: tokenAddress,
    min_transfer: minTransfer
  };
  const TsUpdateMinTransferHash = hashStruct(getTsUpdateMinTransferLeo(tsUpdateMinTransfer)); 

  validateVote(TsUpdateMinTransferHash, voter);

  const [voteUpdateMinTransferTx] = await council.vote(TsUpdateMinTransferHash, true);
  
  await council.wait(voteUpdateMinTransferTx);

  getProposalStatus(TsUpdateMinTransferHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateMinTransfer = async (
    proposalId: number, 
    tokenAddress: string,
    minTransfer: bigint,
) => {
  console.log(`Updating minimum transfer for ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is not found`);
  }

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsUpdateMinTransfer: TsUpdateMinTransfer = {
    id: proposalId,
    token_address: tokenAddress,
    min_transfer: minTransfer
  };
  const tsUpdateMinTransferHash = hashStruct(getTsUpdateMinTransferLeo(tsUpdateMinTransfer)); 

  validateExecution(tsUpdateMinTransferHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUpdateMinTransferHash), SUPPORTED_THRESHOLD);

  const [updateMinTransferTx] = await council.ts_update_min_transfer(
    tsUpdateMinTransfer.id,
    tsUpdateMinTransfer.token_address,
    tsUpdateMinTransfer.min_transfer,
    voters
  ) 

  await council.wait(updateMinTransferTx);

  const updatedMinimumTransfer = await tokenService.min_transfers(tokenAddress);
  if (minTransfer != updatedMinimumTransfer) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Token: ${tokenAddress} minimum tranfer value updated successfully.`)

}