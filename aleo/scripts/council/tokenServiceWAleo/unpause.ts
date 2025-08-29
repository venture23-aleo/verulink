import { hashStruct } from "../../../utils/hash";
import { Vlink_council_v07Contract } from "../../../artifacts/js/vlink_council_v07";
import { BSC_MAINNET, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/mainnet.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { TsUnpauseToken } from "../../../artifacts/js/types/vlink_token_service_cd_cncl_v07";
import { TAG_TS2_UNPAUSE_TOKEN } from "../../../utils/constants";
import { getTsUnpauseTokenLeo } from "../../../artifacts/js/js2leo/vlink_token_service_cd_cncl_v07";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v07";
import { Vlink_token_service_cd_cncl_v07Contract } from "../../../artifacts/js/vlink_token_service_cd_cncl_v07";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v07";
import { Vlink_token_service_cd_v7Contract } from "../../../artifacts/js/vlink_token_service_cd_v7";

const mode = ExecutionMode.SnarkExecute;

const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const tokenServiceWALEO = new Vlink_token_service_cd_v7Contract({ mode, priorityFee: 10_000 });
const tokenServiceWALEOCouncil = new Vlink_token_service_cd_cncl_v07Contract({ mode, priorityFee: 10_000 });


//////////////////////
///// Propose ////////
//////////////////////
export const proposeUnpauseToken = async (chainId: bigint): Promise<number> => {


  console.log(`👍 Proposing to unpause token service`)

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // making hash
  const tsUnpauseToken: TsUnpauseToken = {
    tag: TAG_TS2_UNPAUSE_TOKEN,
    chain_id: chainId,
    id: proposalId,
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: tokenServiceWALEOCouncil.address(),
    proposal_hash: tsUnpauseTokenHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // propose
  const proposeUnpauseTokenTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeUnpauseTokenTx.wait();

  getProposalStatus(ExternalProposalHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteUnpauseToken = async (proposalId: number, chainId: bigint) => {

  console.log(`👍 Voting to unpause token service`)

  // making hash
  const tsUnpauseToken: TsUnpauseToken = {
    tag: TAG_TS2_UNPAUSE_TOKEN,
    chain_id: chainId,
    id: proposalId,
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: tokenServiceWALEOCouncil.address(),
    proposal_hash: tsUnpauseTokenHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // validate vote
  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // vote
  const voteUnpauseTx = await council.vote(ExternalProposalHash, true);
  await voteUnpauseTx.wait();

  getProposalStatus(ExternalProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execUnpauseToken = async (proposalId: number, chainId: bigint) => {

  console.log(`Unpausing token service`)

  const tsOwner = await tokenServiceWALEO.owner_TS(true);
  if (tsOwner != tokenServiceWALEOCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  // making hash
  const tsUnpauseToken: TsUnpauseToken = {
    tag: TAG_TS2_UNPAUSE_TOKEN,
    chain_id: chainId,
    id: proposalId,
  };
  const tsUnpauseTokenHash = hashStruct(getTsUnpauseTokenLeo(tsUnpauseToken));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: tokenServiceWALEOCouncil.address(),
    proposal_hash: tsUnpauseTokenHash
  }

  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), 5);

  // execute
  const unpauseTokenTx = await tokenServiceWALEOCouncil.ts_unpause_token(
    tsUnpauseToken.id,
    tsUnpauseToken.chain_id,
    voters
  );
  await unpauseTokenTx.wait();

  console.log(` ✅ Token Service unpaused successfully.`)

}


async function run() {
  const proposalId = await proposeUnpauseToken(BSC_MAINNET);
  await execUnpauseToken(proposalId, BSC_MAINNET);
}

run();