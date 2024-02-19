import { hashStruct } from "../../../utils/hash";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { Token_service_v0003Contract } from "../../../artifacts/js/token_service_v0003";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsAddToken, TsUpdateMaxTransfer, TsUpdateMinTransfer } from "../../../artifacts/js/types/council_v0003";
import { getTsAddTokenLeo, getTsUpdateMaxTransferLeo, getTsUpdateMinTransferLeo } from "../../../artifacts/js/js2leo/council_v0003";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";

const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0003Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateMaxTransfer = async (
    tokenAddress: string,
    maxTransfer: bigint,
): Promise<number> => {

  console.log(`👍 Proposing to update maximum transfer value of : ${tokenAddress}`)
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
  const tsUpdateMaxTransferHash = hashStruct(getTsUpdateMaxTransferLeo(tsUpdateMaxTransfer)); 

  const [proposeUpdateMaxTransferTx] = await council.propose(proposalId, tsUpdateMaxTransferHash);
  
  await council.wait(proposeUpdateMaxTransferTx);

  getProposalStatus(tsUpdateMaxTransferHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUpdateMaxTransfer = async (
    proposalId: number, 
    tokenAddress: string,
    maxTransfer: bigint,
) => {
  console.log(`👍 Voting to update maximum transfer value of: ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is not found`);
  }

  const voter = council.getAccounts()[0];

  const tsUpdateMaxTransfer: TsUpdateMaxTransfer = {
    id: proposalId,
    token_address: tokenAddress,
    max_transfer: maxTransfer
  };
  const tsUpdateMaxTransferHash = hashStruct(getTsUpdateMaxTransferLeo(tsUpdateMaxTransfer)); 

  validateVote(tsUpdateMaxTransferHash, voter);

  const [voteUpdateMaxTransferTx] = await council.vote(tsUpdateMaxTransferHash, true);
  
  await council.wait(voteUpdateMaxTransferTx);

  getProposalStatus(tsUpdateMaxTransferHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateMinTransfer = async (
    proposalId: number, 
    tokenAddress: string,
    maxTransfer: bigint,
) => {
  console.log(`Updating maximum transfer for ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is not found`);
  }

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsUpdateMaxTransfer: TsUpdateMaxTransfer = {
    id: proposalId,
    token_address: tokenAddress,
    max_transfer: maxTransfer
  };
  const tsUpdateMaxTransferHash = hashStruct(getTsUpdateMaxTransferLeo(tsUpdateMaxTransfer)); 

  validateExecution(tsUpdateMaxTransferHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUpdateMaxTransferHash), SUPPORTED_THRESHOLD);

  const [updateMaxTransferTx] = await council.ts_update_max_transfer(
    tsUpdateMaxTransfer.id,
    tsUpdateMaxTransfer.token_address,
    tsUpdateMaxTransfer.max_transfer,
    voters
  ) 

  await council.wait(updateMaxTransferTx);

  const updatedMaximumTransfer = await tokenService.max_transfers(tokenAddress);
  if (maxTransfer != updatedMaximumTransfer) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Token: ${tokenAddress} maximum transfer value updated successfully.`)

}