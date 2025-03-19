import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, ethTsContractAddr } from "../../../utils/constants";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v2";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { AddChainExistingToken, TsAddToken } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { getAddChainExistingTokenLeo, getTsAddTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v2Contract } from "../../../artifacts/js/vlink_token_service_council_v2";
import { hash } from "aleo-hasher";
import { evm2AleoArr, evm2AleoArrWithoutPadding } from "../../../utils/ethAddress";
import { baseChainId, baseTsContractAddr } from "../../../utils/testdata.data";
import { getAddChainExistingToken } from "../../../artifacts/js/leo2js/vlink_token_service_council_v2";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddChainToToken = async (
    tokenId: bigint,
    chain_id: bigint,
    token_service_address: string,
    token_address: string,
    fee_of_platform: number,
    fee_of_relayer: bigint,
): Promise<number> => {


    console.log(`👍 Proposing to add chain ${chain_id} to token: ${tokenId}`)
    // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    // }

    const proposer = council.getAccounts()[0];
    validateProposer(proposer);

    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tsAddChainToToken: AddChainExistingToken = {
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
        fee_of_platform,
        fee_of_relayer
    };
    const tbAddChainToTokenProposalHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToToken));

    const proposeAddChainToTokenTx = await council.propose(proposalId, tbAddChainToTokenProposalHash);

    await proposeAddChainToTokenTx.wait();

    getProposalStatus(tbAddChainToTokenProposalHash);
    return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteAddChainToToken = async (
    proposalId: number,
    tokenId: bigint,
    chain_id: bigint,
    token_service_address: string,
    token_address: string,
    fee_of_platform: number,
    fee_of_relayer: bigint,
) => {
    console.log(`👍 Voting to add chain to ${chain_id} to ${tokenId}`)
    // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    // }

    const voter = council.getAccounts()[0];
    const tsAddChainToToken: AddChainExistingToken = {
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
        fee_of_platform,
        fee_of_relayer
    };
    const tsAddChainToTokenProposalHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToToken));

    validateVote(tsAddChainToTokenProposalHash, voter);

    const voteAddChainToTokenTx = await council.vote(tsAddChainToTokenProposalHash, true);

    await voteAddChainToTokenTx.wait();

    getProposalStatus(tsAddChainToTokenProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddChainToToken = async (
    proposalId: number,
    tokenId: bigint,
    chain_id: bigint,
    token_service_address: string,
    token_address: string,
    fee_of_platform: number,
    fee_of_relayer: bigint,
) => {
    console.log(`Adding chain ${chain_id} to token ${tokenId}`)
    // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    // }

    const tokenServiceOwner = await tokenService.owner_TS(true);
    if (tokenServiceOwner != serviceCouncil.address()) {
        throw Error("Council is not the owner of tokenService program");
    }

    const tsAddChainToToken: AddChainExistingToken = {
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
        fee_of_platform,
        fee_of_relayer
    };
    const tsAddChainToTokenProposalHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToToken));

    validateExecution(tsAddChainToTokenProposalHash);

    const voters = padWithZeroAddress(await getVotersWithYesVotes(tsAddChainToTokenProposalHash), SUPPORTED_THRESHOLD);
    const addChainTx = await serviceCouncil.ts_add_chain_to_existing_token(
        tsAddChainToToken.id,
        tsAddChainToToken.chain_id,
        tsAddChainToToken.token_id,
        tsAddChainToToken.token_service_address,
        tsAddChainToToken.token_address,
        voters,
        tsAddChainToToken.fee_of_platform,
        tsAddChainToToken.fee_of_relayer
    )

    await addChainTx.wait();

    // const updatedConnector = await tokenService.token_connectors(tokenAddress);
    // if (updatedConnector != tokenConnector) {
    //   throw Error(`❌ Unknown error.`);
    // }

    console.log(` ✅ Token:Chain ${chain_id} added to ${tokenId} successfully.`)

}