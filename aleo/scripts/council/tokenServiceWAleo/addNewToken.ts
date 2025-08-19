import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { BSC_PLATFORM_FEE, BSC_TESTNET, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, waleoBSCTokenAddress, waleoBSCTokenService, waleoMaxTranfer, waleoMinTranfer } from "../../../utils/testdata.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { evm2AleoArrWithoutPadding } from "../../../utils/ethAddress";
import { TsAddTokenInfo } from "../../../artifacts/js/types/vlink_token_service_cd_cuncl_v2";
import { TAG_TS2_ADD_TOKEN } from "../../../utils/constants";
import { getTsAddTokenInfoLeo } from "../../../artifacts/js/js2leo/vlink_token_service_cd_cuncl_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../../../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";
import { Vlink_token_service_cd_v2Contract } from "../../../artifacts/js/vlink_token_service_cd_v2";

const mode = ExecutionMode.SnarkExecute;

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const tokenServiceWALEO = new Vlink_token_service_cd_v2Contract({ mode, priorityFee: 10_000 });
const tokenServiceWALEOCouncil = new Vlink_token_service_cd_cuncl_v2Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddTokenInfo = async (
  minTransfer: bigint,
  maxTransfer: bigint,
  tokenContractAddr: string,
  tokenServiceAddress: string,
  chain_id: bigint,
  fee_of_platform: number
): Promise<number> => {


  console.log(`👍 Proposing to add token Info in WALEO`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // generating hash
  const tsAddTokenInfo: TsAddTokenInfo = {
    tag: TAG_TS2_ADD_TOKEN,
    id: proposalId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    fee_platform: fee_of_platform
  };
  const tbAddTokenProposalHash = hashStruct(getTsAddTokenInfoLeo(tsAddTokenInfo));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: tokenServiceWALEOCouncil.address(),
    proposal_hash: tbAddTokenProposalHash
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
  minTransfer: bigint,
  maxTransfer: bigint,
  tokenContractAddr: string,
  chain_id: bigint,
  tokenServiceAddress: string,
  fee_of_platform: number
) => {
  console.log(`👍 Voting to add token Info`)

  const voter = council.getAccounts()[0];
  // generating hash
  const tsAddTokenInfo: TsAddTokenInfo = {
    tag: TAG_TS2_ADD_TOKEN,
    id: proposalId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    fee_platform: fee_of_platform
  };
  const tbAddTokenProposalHash = hashStruct(getTsAddTokenInfoLeo(tsAddTokenInfo));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: tokenServiceWALEOCouncil.address(),
    proposal_hash: tbAddTokenProposalHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateVote(ExternalProposalHash, voter);

  // vote
  const voteAddTokenTx = await council.vote(ExternalProposalHash, true);
  await voteAddTokenTx.wait();

  // get status
  getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddTokenInfo = async (
  proposalId: number,
  minTransfer: bigint,
  maxTransfer: bigint,
  tokenContractAddr: string,
  tokenServiceAddress: string,
  chain_id: bigint,
  fee_of_platform: number
) => {
  console.log(`Adding token Info`)

  const tokenServiceOwner = await tokenServiceWALEO.owner_TS(true);
  if (tokenServiceOwner != tokenServiceWALEOCouncil.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  // generating hash
  const tsAddTokenInfo: TsAddTokenInfo = {
    tag: TAG_TS2_ADD_TOKEN,
    id: proposalId,
    min_transfer: minTransfer,
    max_transfer: maxTransfer,
    token_address: evm2AleoArrWithoutPadding(tokenContractAddr),
    token_service: evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    fee_platform: fee_of_platform
  };
  const tbAddTokenProposalHash = hashStruct(getTsAddTokenInfoLeo(tsAddTokenInfo));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: tokenServiceWALEOCouncil.address(),
    proposal_hash: tbAddTokenProposalHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  const addChainTx = await tokenServiceWALEOCouncil.ts_add_token_info(
    tsAddTokenInfo.id,
    tsAddTokenInfo.min_transfer,
    tsAddTokenInfo.max_transfer,
    voters,
    evm2AleoArrWithoutPadding(tokenContractAddr),
    evm2AleoArrWithoutPadding(tokenServiceAddress),
    chain_id,
    fee_of_platform
  )

  await addChainTx.wait();

  console.log(` ✅ Token info added successfully.`)

}




async function run() {
  const proposalId = await proposeAddTokenInfo(waleoMinTranfer, waleoMaxTranfer, waleoBSCTokenAddress, waleoBSCTokenService, BSC_TESTNET, BSC_PLATFORM_FEE);
  await execAddTokenInfo(proposalId, waleoMinTranfer, waleoMaxTranfer, waleoBSCTokenAddress, waleoBSCTokenService, BSC_TESTNET, BSC_PLATFORM_FEE);
}

run();




