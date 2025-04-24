import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v4Contract } from "../../../artifacts/js/vlink_council_v4";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, ethTsContractAddr, wethName, wusdcName, wusdtName } from "../../../utils/testdata.data";
import { Vlink_token_service_v4Contract } from "../../../artifacts/js/vlink_token_service_v4";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { AddChainExistingToken, TsAddToken, UpdateTokenServiceAddress } from "../../../artifacts/js/types/vlink_token_service_council_v4";
import { getAddChainExistingTokenLeo, getTsAddTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v4";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode, leo2js } from "@doko-js/core";

import { Vlink_token_service_council_v4Contract } from "../../../artifacts/js/vlink_token_service_council_v4";
import { hash } from "aleo-hasher";
import { evm2AleoArr, evm2AleoArrWithoutPadding } from "../../../utils/ethAddress";
import { baseChainId, baseTsContractAddr } from "../../../utils/testdata.data";
import { getAddChainExistingToken } from "../../../artifacts/js/leo2js/vlink_token_service_council_v4";
import { getUpdateTokenServiceAddress } from "../../../artifacts/js/leo2js/vlink_token_service_council_v2";
import { getUpdateTokenServiceAddressLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v4";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v4Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v4Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v4Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateTokenService = async (
    tokenId: bigint,
    chain_id: bigint,
    token_service_address: string
): Promise<number> => {


    console.log(`👍 Proposing to add chain ${chain_id} to token: ${tokenId}`)
    // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    // }

    const proposer = council.getAccounts()[0];
    validateProposer(proposer);

    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tsUpdateTokenService: UpdateTokenServiceAddress = {
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
    };
    const tsUpdateTokenServiceProposalHash = hashStruct(getUpdateTokenServiceAddressLeo(tsUpdateTokenService));

    const proposeUpdateTokenServiceTx = await council.propose(proposalId, tsUpdateTokenServiceProposalHash);

    await proposeUpdateTokenServiceTx.wait();

    getProposalStatus(tsUpdateTokenServiceProposalHash);
    return proposalId
};

///////////////////
///// Vote ////////
///////////////////
// export const voteAddChainToToken = async (
//     proposalId: number,
//     tokenId: bigint,
//     chain_id: bigint,
//     token_service_address: string,
//     token_address: string,
//     fee_of_platform: number,
//     fee_of_relayer: bigint,
// ) => {
//     console.log(`👍 Voting to add chain to ${chain_id} to ${tokenId}`)
//     // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
//     // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
//     //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
//     // }

//     const voter = council.getAccounts()[0];
//     const tsAddChainToToken: AddChainExistingToken = {
//         id: proposalId,
//         chain_id,
//         token_id: tokenId,
//         token_service_address: evm2AleoArrWithoutPadding(token_service_address),
//         token_address: evm2AleoArrWithoutPadding(token_address),
//         fee_of_platform,
//         fee_of_relayer
//     };
//     const tsAddChainToTokenProposalHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToToken));

//     validateVote(tsAddChainToTokenProposalHash, voter);

//     const voteAddChainToTokenTx = await council.vote(tsAddChainToTokenProposalHash, true);

//     await voteAddChainToTokenTx.wait();

//     getProposalStatus(tsAddChainToTokenProposalHash);

// }

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateTokenService = async (
    proposalId: number,
    tokenId: bigint,
    chain_id: bigint,
    token_service_address: string,
) => {
    console.log(`Updating token service ${token_service_address} to token ${tokenId}`)
    // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    // }

    const tokenServiceOwner = await tokenService.owner_TS(true);
    if (tokenServiceOwner != serviceCouncil.address()) {
        throw Error("Council is not the owner of tokenService program");
    }

    const tsUpdateTokenService: UpdateTokenServiceAddress = {
        id: proposalId,
        chain_id,
        token_id: tokenId,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
    };
    const tsUpdateTokenServiceProposal = hashStruct(getUpdateTokenServiceAddressLeo(tsUpdateTokenService));

    validateExecution(tsUpdateTokenServiceProposal);

    const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUpdateTokenServiceProposal), SUPPORTED_THRESHOLD);
    const updateTokenServiceTx = await serviceCouncil.ts_update_token_service_address(
        tsUpdateTokenService.id,
        tsUpdateTokenService.chain_id,
        tsUpdateTokenService.token_id,
        tsUpdateTokenService.token_service_address,
        voters
    )

    await updateTokenServiceTx.wait();

    console.log(` ✅ Token:Updated ${token_service_address}  to ${tokenId} successfully.`)

}
const wusdc_id = leo2js.field(hash('bhp256', wusdcName.toString() + "u128", "field"));
const wusdt_id = leo2js.field(hash('bhp256', wusdtName.toString() + "u128", 'field'));
const weth_id = leo2js.field(hash('bhp256', wethName.toString() + "u128", 'field'));


async function main() {
    const proposalId = await proposeUpdateTokenService(
        BigInt(weth_id),
        BigInt(ethChainId),
        ethTsContractAddr
    );
    await execUpdateTokenService(
        proposalId,
        BigInt(weth_id),
        BigInt(ethChainId),
        ethTsContractAddr
    );
    const proposalId2 = await proposeUpdateTokenService(
        BigInt(wusdc_id),
        BigInt(ethChainId),
        ethTsContractAddr
    );
    await execUpdateTokenService(
        proposalId2,
        BigInt(wusdc_id),
        BigInt(ethChainId),
        ethTsContractAddr
    );
    const proposalId3 = await proposeUpdateTokenService(
        BigInt(wusdt_id),
        BigInt(ethChainId),
        ethTsContractAddr
    );
    await execUpdateTokenService(
        proposalId3,
        BigInt(wusdt_id),
        BigInt(ethChainId),
        ethTsContractAddr
    );
}

main()