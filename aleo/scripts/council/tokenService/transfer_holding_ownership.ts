import { TransferOwnershipHolding } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { Vlink_token_service_council_v2Contract } from "../../../artifacts/js/vlink_token_service_council_v2";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v7";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_HOLDING_OWNERSHIP_TRANSFER } from "../../../utils/constants";
import { hashStruct } from "../../../utils/hash";
import { getTransferOwnershipHolding } from "../../../artifacts/js/leo2js/vlink_token_service_council_v2";
import { getTransferOwnershipHoldingLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { Vlink_holding_v2Contract } from "../../../artifacts/js/vlink_holding_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";


const mode = ExecutionMode.SnarkExecute;

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const serviceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });
const holding = new Vlink_holding_v2Contract({ mode, priorityFee: 10_000 });

export const proposeTransferHoldingOnwership = async (new_owner: string): Promise<number> => {

  console.log(`👍 Proposing to transfer ownership of the holding program:`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const transferHolding: TransferOwnershipHolding = {
    tag: TAG_HOLDING_OWNERSHIP_TRANSFER,
    id: proposalId,
    new_owner: new_owner
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTransferOwnershipHoldingLeo(transferHolding));
  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tbRemoveAttestorProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));


  const proposeRemoveAttestorTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeRemoveAttestorTx.wait();

  getProposalStatus(ExternalProposalHash);

  return proposalId
};

export const voteTransferHoldingOwnership = async (proposalId: number, new_owner: string) => {

  console.log(`👍 Voting to add transfer ownership of the holding program`)

  const transferHolding: TransferOwnershipHolding = {
    tag: TAG_HOLDING_OWNERSHIP_TRANSFER,
    id: proposalId,
    new_owner: new_owner
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTransferOwnershipHoldingLeo(transferHolding));
  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tbRemoveAttestorProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  const transferHoldingProposalHashTx = await council.vote(ExternalProposalHash, true);
  await transferHoldingProposalHashTx.wait();

  getProposalStatus(ExternalProposalHash);

}

export const execTransferHoldingOwnership = async (proposalId: number, new_owner: string) => {


  const transferHolding: TransferOwnershipHolding = {
    tag: TAG_HOLDING_OWNERSHIP_TRANSFER,
    id: proposalId,
    new_owner: new_owner
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTransferOwnershipHoldingLeo(transferHolding));
  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: serviceCouncil.address(),
    proposal_hash: tbRemoveAttestorProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  const removeAttestorTx = await serviceCouncil.holding_ownership_transfer(
    transferHolding.id,
    transferHolding.new_owner,
    voters
  );
  await removeAttestorTx.wait();


  console.log(` ✅ Onwership of the holding program changed completely.`)

}

const update = async () => {
  const propId = await proposeTransferHoldingOnwership("aleo1rgak647n3t7ryn9ua5dcetg44c0u9yx8peg4vd37zwrw0rvvtq9szvf50w");
  await execTransferHoldingOwnership(propId, "aleo1rgak647n3t7ryn9ua5dcetg44c0u9yx8peg4vd37zwrw0rvvtq9szvf50w");
}

update();