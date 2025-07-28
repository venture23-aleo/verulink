import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, ethTsContractAddr, wusdcFeeRelayerPrivate, wusdcFeeRelayerPublic, wusdcPlatformFeePrivate, wusdcPlatformFeePublic } from "../../../utils/testdata.data";
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
import { arbitrumChainId } from "../../../utils/testdata.data";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";
import { TAG_TS_ADD_CHAIN_TO_ET } from "../../../utils/constants";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddChainToToken = async (
    tokenId: bigint, chain_id: bigint, token_service_address: string, token_address: string, fee_of_platform_public: number, fee_of_platform_private: number, fee_of_relayer_public: bigint,  fee_of_relayer_private: bigint,
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
        tag: TAG_TS_ADD_CHAIN_TO_ET,
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
        pub_platform_fee: fee_of_platform_public,
        pri_platform_fee: fee_of_platform_private,
        pub_relayer_fee: fee_of_relayer_public,
        pri_relayer_fee: fee_of_relayer_private
    };
    const tsAddChainToTokenProposalHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToToken));

    const externalProposal: ExternalProposal = {
            id: proposalId,
            external_program: serviceCouncil.address(),
            proposal_hash: tsAddChainToTokenProposalHash
    }
    const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

    // propose
    const proposeAddChainToTokenTx = await council.propose(proposalId, ExternalProposalHash);
    await proposeAddChainToTokenTx.wait();

    getProposalStatus(ExternalProposalHash);
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
    fee_of_platform_public: number,
    fee_of_platform_private: number,
    fee_of_relayer_public: bigint,
    fee_of_relayer_private: bigint
) => {
    console.log(`👍 Voting to add chain to ${chain_id} to ${tokenId}`)
    // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    // }

    const voter = council.getAccounts()[0];
    const tsAddChainToToken: AddChainExistingToken = {
        tag: TAG_TS_ADD_CHAIN_TO_ET,
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
        pub_platform_fee: fee_of_platform_public,
        pri_platform_fee: fee_of_platform_private,
        pub_relayer_fee: fee_of_relayer_public,
        pri_relayer_fee: fee_of_relayer_private
    };
    const tsAddChainToTokenProposalHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToToken));

    const externalProposal: ExternalProposal = {
            id: proposalId,
            external_program: serviceCouncil.address(),
            proposal_hash: tsAddChainToTokenProposalHash
    }
    const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

    validateVote(ExternalProposalHash, voter);

    // VOTE
    const voteAddChainToTokenTx = await council.vote(ExternalProposalHash, true);
    await voteAddChainToTokenTx.wait();

    getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddChainToToken = async (
    proposalId: number, tokenId: bigint, chain_id: bigint, token_service_address: string, token_address: string, fee_of_platform_public: number, fee_of_platform_private: number, fee_of_relayer_public: bigint,  fee_of_relayer_private: bigint,
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
        tag: TAG_TS_ADD_CHAIN_TO_ET,
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
        pub_platform_fee: fee_of_platform_public,
        pri_platform_fee: fee_of_platform_private,
        pub_relayer_fee: fee_of_relayer_public,
        pri_relayer_fee: fee_of_relayer_private
    };
    const tsAddChainToTokenProposalHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToToken));

    const externalProposal: ExternalProposal = {
            id: proposalId,
            external_program: serviceCouncil.address(),
            proposal_hash: tsAddChainToTokenProposalHash
    }
    const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

    validateExecution(ExternalProposalHash);

    const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
    const addChainTx = await serviceCouncil.ts_add_chain_to_existing_token(
        tsAddChainToToken.id,
        tsAddChainToToken.chain_id,
        tsAddChainToToken.token_id,
        tsAddChainToToken.token_service_address,
        tsAddChainToToken.token_address,
        voters,
        tsAddChainToToken.pub_platform_fee,
        tsAddChainToToken.pri_platform_fee,
        tsAddChainToToken.pub_relayer_fee,
        tsAddChainToToken.pri_relayer_fee,
    )

    await addChainTx.wait();

    // const updatedConnector = await tokenService.token_connectors(tokenAddress);
    // if (updatedConnector != tokenConnector) {
    //   throw Error(`❌ Unknown error.`);
    // }

    console.log(` ✅ Token:Chain ${chain_id} added to ${tokenId} successfully.`)

}


const arbitrumTsContractAddr = "0x2a10bf1bbaac8418bab8a86f94699cfb44146727"
const arbitrumToken_addressAleoUSDC = BigInt("5983142094692128773510225623816045070304444621008302359049788306211838130558");


const arbitrumToken_addressAleoUSDT = BigInt("8260953594890310383870507716927422646335575786500909254294703665587287172223");


const arbitrumToken_addressAleoETH = BigInt("7282192565387792361809088173158053178461960397100960262024562261205950610485");


const arbitrumToken_addressUSDC = "0x22f06bac09f9375e6450f44976a05b7d6d61fcf4";
const arbitrumToken_addressUSDT = "0x555eC249d1eB0db553AE8df14f4baE287F9CE62a";
const arbitrumToken_addressETH = "0x0000000000000000000000000000000000000001";



// (async () => {
//     // const proposal_ID_USDC = await proposeAddChainToToken(arbitrumChainId, arbitrumToken_addressAleoUSDC, arbitrumTsContractAddr, arbitrumToken_addressUSDC, 0, 0, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate);
//     // await execAddChainToToken(proposal_ID_USDC, arbitrumChainId, arbitrumToken_addressAleoUSDC, arbitrumTsContractAddr, arbitrumToken_addressUSDC, 0, 0, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate);

//     // const proposal_ID_USDT = await proposeAddChainToToken(arbitrumChainId, arbitrumToken_addressAleoUSDT, arbitrumTsContractAddr, arbitrumToken_addressUSDT, 0, 0, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate);
//     // await execAddChainToToken(proposal_ID_USDT, arbitrumChainId, arbitrumToken_addressAleoUSDT, arbitrumTsContractAddr, arbitrumToken_addressUSDT, 0, 0, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate);

//     const proposal_ID = await proposeAddChainToToken(arbitrumChainId, arbitrumToken_addressAleoETH, arbitrumTsContractAddr, arbitrumToken_addressETH, 0, 0, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate);
//     await execAddChainToToken(proposal_ID, arbitrumChainId, arbitrumToken_addressAleoETH, arbitrumTsContractAddr, arbitrumToken_addressETH, 0, 0, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate);
// })();