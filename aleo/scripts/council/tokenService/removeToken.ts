import { hashStruct } from "../../../utils/hash";
import { Council_v0002Contract } from "../../../artifacts/js/council_v0002";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { Token_service_v0002Contract } from "../../../artifacts/js/token_service_v0002";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsAddToken, TsRemoveToken } from "../../../artifacts/js/types/council_v0002";
import { getTsAddTokenLeo, getTsRemoveTokenLeo } from "../../../artifacts/js/js2leo/council_v0002";

const council = new Council_v0002Contract({mode: "execute", priorityFee: 10_000});
const tokenService = new Token_service_v0002Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveToken = async (
    tokenAddress: string
): Promise<number> => {

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

  const proposeRemoveTokenTx = await council.propose(proposalId, tbRemoveTokenProposalHash);
  
  // @ts-ignore
  await proposeRemoveTokenTx.wait()

  getProposalStatus(tbRemoveTokenProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteRemoveToken = async (
    proposalId: number, 
    tokenAddress: string,
) => {
  console.log(`👍 Voting to remove token: ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is not added`);
  }

  const voter = council.getAccounts()[0];

  const tsRemoveToken: TsRemoveToken = {
    id: proposalId,
    token_address: tokenAddress
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken)); 

  validateVote(tbRemoveTokenProposalHash, voter);

  const voteRemoveTokenTx = await council.vote(tbRemoveTokenProposalHash);
  
  // @ts-ignore
  await voteRemoveTokenTx.wait()

  getProposalStatus(tbRemoveTokenProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddToken = async (
    proposalId: number, 
    tokenAddress: string,
) => {
  console.log(`Adding token ${tokenAddress}`)
  const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  if (storedTokenConnector == ALEO_ZERO_ADDRESS) {
    throw Error(`Token ${tokenAddress} is not added`);
  }

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != council.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsRemoveToken: TsRemoveToken = {
    id: proposalId,
    token_address: tokenAddress
  };
  const tbRemoveTokenProposalHash = hashStruct(getTsRemoveTokenLeo(tsRemoveToken)); 

  validateExecution(tbRemoveTokenProposalHash);

  const removeTokenTx = await council.ts_remove_token(
    tsRemoveToken.id,
    tsRemoveToken.token_address,
  ) // 301_747

  // @ts-ignore
  await removeTokenTx.wait();

  const updatedConnector = await tokenService.token_connectors(tokenAddress, "false");
  if (updatedConnector != "false") {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ Token: ${tokenAddress} removed successfully.`)

}