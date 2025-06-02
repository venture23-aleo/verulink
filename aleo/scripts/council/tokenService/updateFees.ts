import { hashStruct } from "../../../utils/hash";
import { Vlink_token_service_v2Contract } from "../../../artifacts/js/vlink_token_service_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { arbitrumChainId, COUNCIL_TOTAL_PROPOSALS_INDEX, ethHoleskyChainId, TOKEN_PAUSED_VALUE, TOKEN_UNPAUSED_VALUE, wusdcFeeRelayerPrivate, wusdcFeeRelayerPublic } from "../../../utils/testdata.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TsUnpauseToken, UpdateFees } from "../../../artifacts/js/types/vlink_token_service_council_v2";
import { getTsUnpauseTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Vlink_token_service_council_v2Contract } from "../../../artifacts/js/vlink_token_service_council_v2";
import { hash } from "aleo-hasher";
import { Vlink_token_service_council_v2Ts_update_feesTransition } from "../../../artifacts/js/transitions/vlink_token_service_council_v2";
import { getUpdateFeesLeo } from "../../../artifacts/js/js2leo/vlink_token_service_council_v5";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUpdateFees = async (
    chain_id: bigint, token_id: bigint, public_relayer_fee: bigint, private_relayer_fee: bigint, public_platform_fee: number, private_platform_fee: number
): Promise<number> => {

  console.log(`👍 Proposing to update fees: ${token_id}`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsUpdateFee: UpdateFees = {
    id: proposalId,
    chain_id: chain_id,
    token_id: token_id,
    public_relayer_fee: public_relayer_fee,
    private_relayer_fee: private_relayer_fee,
    public_platform_fee: public_platform_fee,
    private_platform_fee: private_platform_fee
  };
  const tsUpdateFeeHash = hashStruct(getUpdateFeesLeo(tsUpdateFee));

  const proposeUpdateFeeTx = await council.propose(proposalId, tsUpdateFeeHash);
  await proposeUpdateFeeTx.wait();

  getProposalStatus(tsUpdateFeeHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
// export const voteUpdateFees = async (
//     proposalId: number, chain_id: bigint, token_id: bigint, public_relayer_fee: bigint, private_relayer_fee: bigint, public_platform_fee: number, private_platform_fee: number) => {

//   console.log(`👍 Voting to update fees: ${token_id}`)

//   const tsUpdateFee: UpdateFees = {
//     id: proposalId,
//     chain_id: chain_id,
//     token_id: token_id,
//     public_relayer_fee: public_relayer_fee,
//     private_relayer_fee: private_relayer_fee,
//     public_platform_fee: public_platform_fee,
//     private_platform_fee: private_platform_fee
//   };
//   const tsUpdateFeeHash = hashStruct(getTsUnpauseTokenLeo(tsUpdateFee));

//   const voter = council.getAccounts()[0];
//   validateVote(tsUpdateFeeHash, voter);

//   const voteUpdateFees = await council.vote(tsUpdateFeeHash, true);

//   await voteUpdateFees.wait();

//   getProposalStatus(tsUpdateFeeHash);

// }

//////////////////////
///// Execute ////////
//////////////////////
export const execUpdateFees = async (
    proposalId: number, chain_id: bigint, token_id: bigint, public_relayer_fee: bigint, private_relayer_fee: bigint, public_platform_fee: number, private_platform_fee: number) => {

  console.log(`Updating fees ${token_id}`)

  const tsOwner = await tokenService.owner_TS(true);
  if (tsOwner != serviceCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tsUpdateFee: UpdateFees = {
    id: proposalId,
    chain_id: chain_id,
    token_id: token_id,
    public_relayer_fee: public_relayer_fee,
    private_relayer_fee: private_relayer_fee,
    public_platform_fee: public_platform_fee,
    private_platform_fee: private_platform_fee
  };
  const tsUpdateFeeHash = hashStruct(getUpdateFeesLeo(tsUpdateFee));

  validateExecution(tsUpdateFeeHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsUpdateFeeHash), 5);

  const unUpdateFeesTx = await serviceCouncil.ts_update_fees(
    tsUpdateFee.id,
    tsUpdateFee.chain_id,
    tsUpdateFee.token_id,
    tsUpdateFee.public_relayer_fee,
    tsUpdateFee.private_relayer_fee,
    tsUpdateFee.public_platform_fee,
    tsUpdateFee.private_platform_fee,
    voters
  );

  await unUpdateFeesTx.wait();
  // TODO CHECK IF THE FEES WERE UPDATED
  
  console.log(` ✅ Token Updated successfully.`)

}

const usdc = BigInt("5983142094692128773510225623816045070304444621008302359049788306211838130558");
const public_platform_fee = 18;
const private_platform_fee = 36;


const update = async () => {
const proposal_id = await proposeUpdateFees(arbitrumChainId, usdc, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate, public_platform_fee, private_platform_fee);
execUpdateFees(proposal_id, arbitrumChainId, usdc, wusdcFeeRelayerPublic, wusdcFeeRelayerPrivate, public_platform_fee, private_platform_fee)
}

update();

