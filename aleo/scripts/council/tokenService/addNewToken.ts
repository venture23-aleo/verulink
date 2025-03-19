import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, ethTsContractAddr } from "../../../utils/constants";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v2";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsAddToken } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { getTsAddTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v2Contract } from "../../../artifacts/js/vlink_token_service_council_v2";
import { hash } from "aleo-hasher";
import { evm2AleoArr, evm2AleoArrWithoutPadding } from "../../../utils/ethAddress";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddToken = async (
  tokenId: bigint,
  minTransfer: bigint,
  maxTransfer: bigint,
  outgoingPercentage: number,
  timeframe: number,
  maxNoCap: bigint,
  tokenContractAddr: string,
  fee_of_platform: number,
  fee_of_relayer: bigint,
): Promise<number> => {


  console.log(`👍 Proposing to add token: ${tokenId}`)
  // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
  //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  // }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsAddToken: TsAddToken = {
    id: proposalId,
    token_id: tokenId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(ethTsContractAddr),
    chain_id: ethChainId,
    fee_of_platform: fee_of_platform,
    fee_of_relayer: fee_of_relayer
  };
  const tbAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken));

  const proposeAddChainTx = await council.propose(proposalId, tbAddTokenProposalHash);

  await proposeAddChainTx.wait();

  getProposalStatus(tbAddTokenProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteAddToken = async (
  proposalId: number,
  tokenAddress: string,
  minTransfer: bigint,
  maxTransfer: bigint,
  outgoingPercentage: number,
  timeframe: number,
  maxNoCap: bigint,
  tokenContractAddr,
  fee_of_platform: number,
  fee_of_relayer: bigint,
) => {
  console.log(`👍 Voting to add token: ${tokenAddress}`)
  // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
  //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  // }

  const voter = council.getAccounts()[0];
  const tsAddToken: TsAddToken = {
    id: proposalId,
    token_id: BigInt(hash('bhp256', '6148332821651876206', "field")),
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(ethTsContractAddr),
    chain_id: ethChainId,
    fee_of_platform,
    fee_of_relayer
  };
  const tsAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken));

  validateVote(tsAddTokenProposalHash, voter);

  const voteAddTokenTx = await council.vote(tsAddTokenProposalHash, true);

  await voteAddTokenTx.wait();

  getProposalStatus(tsAddTokenProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddToken = async (
  //token_name
  tokenId: bigint,
  proposalId: number,
  minTransfer: bigint,
  maxTransfer: bigint,
  outgoingPercentage: number,
  timeframe: number,
  maxNoCap: bigint,
  tokenContractAddr: string,
  fee_of_platform: number,
  fee_of_relayer: bigint,
) => {
  console.log(`Adding token ${tokenId}`)
  // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
  //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  // }

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != serviceCouncil.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsAddToken: TsAddToken = {
    id: proposalId,
    token_id: tokenId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(ethTsContractAddr),
    chain_id: ethChainId,
    fee_of_platform,
    fee_of_relayer
  };
  const tsAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken));

  validateExecution(tsAddTokenProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsAddTokenProposalHash), SUPPORTED_THRESHOLD);
  const addChainTx = await serviceCouncil.ts_add_token(
    tsAddToken.id,
    tsAddToken.token_id,
    tsAddToken.min_transfer,
    tsAddToken.max_transfer,
    tsAddToken.outgoing_percentage,
    tsAddToken.time,
    tsAddToken.max_no_cap,
    voters,
    evm2AleoArrWithoutPadding(tokenContractAddr),
    evm2AleoArrWithoutPadding(ethTsContractAddr),
    ethChainId,
    fee_of_platform,
    fee_of_relayer
  )

  await addChainTx.wait();

  // const updatedConnector = await tokenService.token_connectors(tokenAddress);
  // if (updatedConnector != tokenConnector) {
  //   throw Error(`❌ Unknown error.`);
  // }

  console.log(` ✅ Token: ${tokenId} added successfully.`)

}