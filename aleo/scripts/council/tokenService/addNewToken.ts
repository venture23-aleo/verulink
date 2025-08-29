import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v07Contract } from "../../../artifacts/js/vlink_council_v07";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, ethTsContractAddr } from "../../../utils/testdata.data";
import { Vlink_token_service_v7Contract } from "../../../artifacts/js/vlink_token_service_v7";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsAddToken } from "../../../artifacts/js/types/vlink_token_service_council_v07";
import { getTsAddTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v07";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v07Contract } from "../../../artifacts/js/vlink_token_service_council_v07";
import { hash } from "aleo-hasher";
import { evm2AleoArr, evm2AleoArrWithoutPadding } from "../../../utils/ethAddress";
import { TAG_TS_ADD_TOKEN } from "../../../utils/constants";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v07";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v07";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v07Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v7Contract({ mode, priorityFee: 10_000 });

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
  chain_id: bigint,
  tokenServiceAddress: string,
  fee_of_platform_public: number, fee_of_relayer_public: bigint, fee_of_platform_private: number, fee_of_relayer_private: bigint,
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
    tag: TAG_TS_ADD_TOKEN,
    id: proposalId,
    token_id: tokenId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    pub_platform_fee: fee_of_platform_public,
    pri_platform_fee: fee_of_platform_private,
    pub_relayer_fee: fee_of_relayer_public,
    pri_relayer_fee: fee_of_relayer_private
  };
  const tsAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsAddTokenProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // propose
  const proposeAddChainTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeAddChainTx.wait();

  getProposalStatus(ExternalProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
// TODO: Need to edit this to work correctly
export const voteAddToken = async (
  proposalId: number,
  tokenAddress: string,
  minTransfer: bigint,
  maxTransfer: bigint,
  outgoingPercentage: number,
  timeframe: number,
  maxNoCap: bigint,
  tokenContractAddr,
  tokenId: bigint,
  chain_id: bigint,
  tokenServiceAddress: string,
  fee_of_platform_public: number, fee_of_relayer_public: bigint, fee_of_platform_private: number, fee_of_relayer_private: bigint,

) => {
  console.log(`👍 Voting to add token: ${tokenAddress}`)
  // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
  //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  // }

  const voter = council.getAccounts()[0];
  const tsAddToken: TsAddToken = {
    tag: TAG_TS_ADD_TOKEN,
    id: proposalId,
    token_id: tokenId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    pub_platform_fee: fee_of_platform_public,
    pri_platform_fee: fee_of_platform_private,
    pub_relayer_fee: fee_of_relayer_public,
    pri_relayer_fee: fee_of_relayer_private
  };
  const tsAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsAddTokenProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateVote(ExternalProposalHash, voter);

  // VOTE
  const voteAddTokenTx = await council.vote(ExternalProposalHash, true);
  await voteAddTokenTx.wait();

  getProposalStatus(ExternalProposalHash);

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
  chain_id: bigint,
  tokenServiceAddress: string,
  fee_of_platform_public: number, fee_of_relayer_public: bigint, fee_of_platform_private: number, fee_of_relayer_private: bigint
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
    tag: TAG_TS_ADD_TOKEN,
    id: proposalId,
    token_id: tokenId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    outgoing_percentage: outgoingPercentage,
    time: timeframe,
    max_no_cap: maxNoCap,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    pub_platform_fee: fee_of_platform_public,
    pri_platform_fee: fee_of_platform_private,
    pub_relayer_fee: fee_of_relayer_public,
    pri_relayer_fee: fee_of_relayer_private
  };
  const tsAddTokenProposalHash = hashStruct(getTsAddTokenLeo(tsAddToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tsAddTokenProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  // EXECUTE
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
    evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    fee_of_platform_public,
    fee_of_platform_private,
    fee_of_relayer_public,
    fee_of_relayer_private
  )
  await addChainTx.wait();

  // const updatedConnector = await tokenService.token_connectors(tokenAddress);
  // if (updatedConnector != tokenConnector) {
  //   throw Error(`❌ Unknown error.`);
  // }

  console.log(` ✅ Token: ${tokenId} added successfully.`)

}