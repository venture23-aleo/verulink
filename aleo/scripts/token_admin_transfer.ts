import { ExecutionMode } from "@doko-js/core";
import { Token_service_council_stg_v2Contract } from "../artifacts/js/token_service_council_stg_v2";
import { Vlink_council_v5Contract } from "../artifacts/js/vlink_council_v5";
import { Vlink_token_service_v5Contract } from "../artifacts/js/vlink_token_service_v5";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "./council/councilUtils";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../utils/constants";
import { UpdateTokenMetadata } from "../artifacts/js/types/token_service_council_stg_v2";
import { hashStruct } from "../utils/hash";
import { getUpdateTokenMetadataLeo } from "../artifacts/js/js2leo/token_service_council_stg_v2";
import { Council_stg_v2Contract } from "../artifacts/js/council_stg_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../utils/voters";

const mode = ExecutionMode.SnarkExecute;
const oldServiceCouncil = new Token_service_council_stg_v2Contract ({ mode: mode });

const council = new Council_stg_v2Contract({ mode, priorityFee: 10_000 });
const newtokenServiceCouncil = new Vlink_token_service_v5Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeTransferAdmin = async (
    new_admin: string, token_id: bigint, external_authorization_party: string
): Promise<number> => {
    console.log(`👍 Proposing to transfer to admin ${new_admin} `)

    const proposer = council.getAccounts()[0];
    validateProposer(proposer);

    const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const updateTokenMetadata : UpdateTokenMetadata  = {
        id: proposalId,
        token_id: token_id,
        admin: new_admin,
        external_authorization_party: external_authorization_party
    };
    const tsTransferOwnershipProposalHash = hashStruct(getUpdateTokenMetadataLeo(updateTokenMetadata));

    const proposeTransferOwnershipTx = await council.propose(proposalId, tsTransferOwnershipProposalHash);

    await proposeTransferOwnershipTx.wait();

    getProposalStatus(tsTransferOwnershipProposalHash);
    return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteTranferAdmin = async (
    proposalId: number,
    new_admin: string,
    token_id: bigint,
    external_authorization_party: string
) => {
    console.log(`👍 Voting to transfer to new admin ${new_admin}`)

    const voter = council.getAccounts()[0];
    const updateTokenMetadata : UpdateTokenMetadata  = {
        id: proposalId,
        token_id: token_id,
        admin: new_admin,
        external_authorization_party: external_authorization_party
    };
    const tsTransferOwnershipProposalHash = hashStruct(getUpdateTokenMetadataLeo(updateTokenMetadata));

    validateVote(tsTransferOwnershipProposalHash, voter);

    const voteTransferOwnershipTx = await council.vote(tsTransferOwnershipProposalHash, true);

    await voteTransferOwnershipTx.wait();

    getProposalStatus(tsTransferOwnershipProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execTranferAdmin = async (
    proposalId: number,
    new_admin: string,
    token_id: bigint,
    external_authorization_party: string
) => {
    console.log(`Transfering admin rights to  ${new_admin}`)

    const updateTokenMetadata : UpdateTokenMetadata  = {
        id: proposalId,
        token_id: token_id,
        admin: new_admin,
        external_authorization_party: external_authorization_party
    };
    const tsTransferOwnershipProposalHash = hashStruct(getUpdateTokenMetadataLeo(updateTokenMetadata));

    validateExecution(tsTransferOwnershipProposalHash);

    const voters = padWithZeroAddress(await getVotersWithYesVotes(tsTransferOwnershipProposalHash), SUPPORTED_THRESHOLD);
    const tranferAdminTx = await oldServiceCouncil.update_token_metadata(
        updateTokenMetadata.id,
        updateTokenMetadata.token_id,
        updateTokenMetadata.admin,
        updateTokenMetadata.external_authorization_party,
        voters
    )

    await tranferAdminTx.wait();

    console.log(` ✅ Sucessfull`)

}
