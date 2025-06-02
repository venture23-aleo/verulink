import { ExecutionMode } from "@doko-js/core";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "./council/councilUtilsForOld";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../utils/constants";
import { hashStruct } from "../utils/hash";

import { getVotersWithYesVotes, padWithZeroAddress } from "../utils/votersForOld";
import { Vlink_token_service_council_v1Contract } from "../artifacts/js/vlink_token_service_council_v1";
import { Vlink_council_v1Contract } from "../artifacts/js/vlink_council_v1";
import { UpdateTokenMetadata } from "../artifacts/js/types/vlink_token_service_council_v1";
import { getUpdateTokenMetadataLeo } from "../artifacts/js/js2leo/vlink_token_service_council_v1";

const mode = ExecutionMode.SnarkExecute;
// const oldServiceCouncil = new Token_service_council_stg_v2Contract ({ mode: mode });
const oldServiceCouncil = new Vlink_token_service_council_v1Contract({ mode: mode });

// const council = new Council_stg_v2Contract({ mode, priorityFee: 10_000 });
const oldCouncil = new Vlink_council_v1Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeTransferAdmin = async (
    new_admin: string, token_id: bigint, external_authorization_party: string
): Promise<number> => {
    console.log(`👍 Proposing to transfer to admin ${new_admin} `)

    const proposer = oldCouncil.getAccounts()[0];
    validateProposer(proposer);

    const proposalId = parseInt((await oldCouncil.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const updateTokenMetadata : UpdateTokenMetadata  = {
        id: proposalId,
        token_id: token_id,
        admin: new_admin,
        external_authorization_party: external_authorization_party
    };
    const tsTransferOwnershipProposalHash = hashStruct(getUpdateTokenMetadataLeo(updateTokenMetadata));

    const proposeTransferOwnershipTx = await oldCouncil.propose(proposalId, tsTransferOwnershipProposalHash);

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

    const voter = oldCouncil.getAccounts()[0];
    const updateTokenMetadata : UpdateTokenMetadata  = {
        id: proposalId,
        token_id: token_id,
        admin: new_admin,
        external_authorization_party: external_authorization_party
    };
    const tsTransferOwnershipProposalHash = hashStruct(getUpdateTokenMetadataLeo(updateTokenMetadata));

    validateVote(tsTransferOwnershipProposalHash, voter);

    const voteTransferOwnershipTx = await oldCouncil.vote(tsTransferOwnershipProposalHash, true);

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
