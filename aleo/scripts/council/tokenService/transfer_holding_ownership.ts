import { TransferOwnershipHolding } from "../../../artifacts/js/types/vlink_token_service_council_v3";
import { Vlink_token_service_council_v3Contract } from "../../../artifacts/js/vlink_token_service_council_v3";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_council_v3Contract } from "../../../artifacts/js/vlink_council_v3";
import { Vlink_token_service_v3Contract } from "../../../artifacts/js/vlink_token_service_v3";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { hashStruct } from "../../../utils/hash";
import { getTransferOwnershipHolding } from "../../../artifacts/js/leo2js/vlink_token_service_council_v3";
import { getTransferOwnershipHoldingLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v3";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { Vlink_holding_v3Contract } from "../../../artifacts/js/vlink_holding_v3";


const mode = ExecutionMode.SnarkExecute;

const council = new Vlink_council_v3Contract({ mode, priorityFee: 10_000 });
const serviceCouncil = new Vlink_token_service_council_v3Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v3Contract({ mode, priorityFee: 10_000 });
const holding = new Vlink_holding_v3Contract({ mode, priorityFee: 10_000 });

export const proposeTransferHoldingOnwership = async (new_owner: string): Promise<number> => {

  console.log(`👍 Proposing to transfer ownership of the holding program:`)

  const proposer = council.getAccounts()[0];
  //   validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const transferHolding: TransferOwnershipHolding = {
    id: proposalId,
    new_owner: new_owner
  };
  const tbRemoveAttestorProposalHash = hashStruct(getTransferOwnershipHoldingLeo(transferHolding));

  const [proposeRemoveAttestorTx] = await council.propose(proposalId, tbRemoveAttestorProposalHash);

  await council.wait(proposeRemoveAttestorTx);

  getProposalStatus(tbRemoveAttestorProposalHash);

  return proposalId
};

export const voteTransferHoldingOwnership = async (proposalId: number, owner: string) => {

  console.log(`👍 Voting to add transfer ownership of the holding program`)

  const transferHolding: TransferOwnershipHolding = {
    id: proposalId,
    new_owner: owner
  };
  const transferHoldingProposalHash = hashStruct(getTransferOwnershipHoldingLeo(transferHolding));

  const voter = council.getAccounts()[0];
  validateVote(transferHoldingProposalHash, voter);

  const [transferHoldingProposalHashTx] = await council.vote(transferHoldingProposalHash, true);

  await council.wait(transferHoldingProposalHashTx);

  getProposalStatus(transferHoldingProposalHash);

}

export const execTransferHoldingOwnership = async (proposalId: number, owner: string) => {


  const transferHolding: TransferOwnershipHolding = {
    id: proposalId,
    new_owner: owner
  };
  const transferHoldingProposalHash = hashStruct(getTransferOwnershipHoldingLeo(transferHolding));

  validateExecution(transferHoldingProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(transferHoldingProposalHash), SUPPORTED_THRESHOLD);
  const [removeAttestorTx] = await serviceCouncil.holding_ownership_transfer(
    transferHolding.id,
    transferHolding.new_owner,
    voters
  );

  await council.wait(removeAttestorTx);

  const new_owner = await holding.owner_holding(true);
  if (new_owner != "aleo1rgak647n3t7ryn9ua5dcetg44c0u9yx8peg4vd37zwrw0rvvtq9szvf50w") {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ Onwership of the holding program changed completely.`)

}

const update = async () => {
  const propId = await proposeTransferHoldingOnwership("aleo1rgak647n3t7ryn9ua5dcetg44c0u9yx8peg4vd37zwrw0rvvtq9szvf50w");
  await execTransferHoldingOwnership(propId, "aleo1rgak647n3t7ryn9ua5dcetg44c0u9yx8peg4vd37zwrw0rvvtq9szvf50w");
}

update();