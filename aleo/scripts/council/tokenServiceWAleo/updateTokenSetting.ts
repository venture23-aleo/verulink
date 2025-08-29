import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v07Contract } from "../../../artifacts/js/vlink_council_v07";
import { BSC_TESTNET, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, ethTsContractAddr, waleoBSCTokenAddress, waleoBSCTokenService, wethName, wusdcName, wusdtName } from "../../../utils/testdata.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { evm2AleoArrWithoutPadding } from "../../../utils/ethAddress";

import { TAG_TS2_UP_TS_SETTING } from "../../../utils/constants";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v07";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v07";
import { Vlink_token_service_cd_v7Contract } from "../../../artifacts/js/vlink_token_service_cd_v7";
import { UpdateTokenServiceSetting } from "../../../artifacts/js/types/vlink_token_service_cd_cncl_v07";
import { getUpdateTokenServiceSettingLeo } from "../../../artifacts/js/js2leo/vlink_token_service_cd_cncl_v07";
import { Vlink_token_service_cd_cncl_v07Contract } from "../../../artifacts/js/vlink_token_service_cd_cncl_v07";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_cd_cncl_v07Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_cd_v7Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateTokenServiceSetting = async (
    chain_id: bigint,
    token_service_address: string,
    token_address: string
): Promise<number> => {


    console.log(`👍 Proposing to update TokenService`)

    const proposer = council.getAccounts()[0];
    validateProposer(proposer);

    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const tsUpdateTokenService: UpdateTokenServiceSetting = {
        tag: TAG_TS2_UP_TS_SETTING,
        id: proposalId,
        chain_id,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
    };
    const tsUpdateTokenServiceProposalHash = hashStruct(getUpdateTokenServiceSettingLeo(tsUpdateTokenService));

    const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: serviceCouncil.address(),
        proposal_hash: tsUpdateTokenServiceProposalHash
    }
    const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

    // PROPOSE
    const proposeUpdateTokenServiceTx = await council.propose(proposalId, ExternalProposalHash);
    await proposeUpdateTokenServiceTx.wait();

    getProposalStatus(ExternalProposalHash);
    return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUpdateTokenServiceSetting = async (
    proposalId: number,
    chain_id: bigint,
    token_service_address: string,
    token_address: string,
) => {
    console.log(`👍 Voting to update token Service`)

    const voter = council.getAccounts()[0];

    // GENERATE HASH
    const tsUpdateTokenService: UpdateTokenServiceSetting = {
        tag: TAG_TS2_UP_TS_SETTING,
        id: proposalId,
        chain_id,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
    };
    const tsUpdateTokenServiceProposalHash = hashStruct(getUpdateTokenServiceSettingLeo(tsUpdateTokenService));

    const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: serviceCouncil.address(),
        proposal_hash: tsUpdateTokenServiceProposalHash
    }
    const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

    // VOTE
    validateVote(ExternalProposalHash, voter);

    const voteAddChainToTokenTx = await council.vote(ExternalProposalHash, true);
    await voteAddChainToTokenTx.wait();

    getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateTokenService = async (
    proposalId: number,
    chain_id: bigint,
    token_service_address: string,
    token_address: string
) => {
    console.log(`Updating token service`)
    // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
    // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
    //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
    // }

    const tokenServiceOwner = await tokenService.owner_TS(true);
    if (tokenServiceOwner != serviceCouncil.address()) {
        throw Error("Council is not the owner of tokenService program");
    }

    // GENERATE HASH
    const tsUpdateTokenService: UpdateTokenServiceSetting = {
        tag: TAG_TS2_UP_TS_SETTING,
        id: proposalId,
        chain_id,
        token_service_address: evm2AleoArrWithoutPadding(token_service_address),
        token_address: evm2AleoArrWithoutPadding(token_address),
    };
    const tsUpdateTokenServiceProposalHash = hashStruct(getUpdateTokenServiceSettingLeo(tsUpdateTokenService));

    const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: serviceCouncil.address(),
        proposal_hash: tsUpdateTokenServiceProposalHash
    }
    const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

    validateExecution(ExternalProposalHash);

    const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

    // EXECUTE
    const updateTokenServiceTx = await serviceCouncil.ts_update_token_service_setting(
        tsUpdateTokenService.id,
        tsUpdateTokenService.chain_id,
        tsUpdateTokenService.token_service_address,
        tsUpdateTokenService.token_address,
        voters
    )

    await updateTokenServiceTx.wait();

    console.log(` ✅ Token:Updated ${token_service_address} successfully.`)

}



async function run() {
    const proposalId = await proposeUpdateTokenServiceSetting(BSC_TESTNET, waleoBSCTokenService, waleoBSCTokenAddress);
    await execUpdateTokenService(proposalId, BSC_TESTNET, waleoBSCTokenService, waleoBSCTokenAddress);
}

run();

