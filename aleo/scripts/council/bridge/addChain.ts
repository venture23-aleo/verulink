import { hashStruct } from "../../../utils/hash";

import { Vlink_token_bridge_v2Contract } from "../../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/testdata.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbAddChainLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v2";
import { TbAddChain } from "../../../artifacts/js/types/vlink_bridge_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v2Contract } from "../../../artifacts/js/vlink_bridge_council_v2";
import { TAG_TB_ADD_CHAIN } from "../../../utils/constants";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";

const mode = ExecutionMode.SnarkExecute;
const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });

export const proposeAddChain = async (newChainId: bigint): Promise<number> => {

  console.log(`👍 Proposing to add chainId: ${newChainId}`)
  const isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddChain: TbAddChain = {
    tag: TAG_TB_ADD_CHAIN,
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain));


  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbAddChainProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // propose
  const proposeAddChainTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeAddChainTx.wait();

  getProposalStatus(ExternalProposalHash);

  return proposalId
};

export const voteAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`👍 Voting to add chainId: ${newChainId}`)
  const isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const tbAddChain: TbAddChain = {
    tag: TAG_TB_ADD_CHAIN,
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain));


  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbAddChainProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getDefaultAccount();
  validateVote(ExternalProposalHash, voter);

  // vote
  const voteAddChainTx = await council.vote(ExternalProposalHash, true);
  await voteAddChainTx.wait();

  getProposalStatus(ExternalProposalHash);

}

export const execAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`Adding chainId ${newChainId}`)
  let isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbAddChain: TbAddChain = {
    tag: TAG_TB_ADD_CHAIN,
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain));


  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbAddChainProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  
  // execute
  const addChainTx = await bridgeCouncil.tb_add_chain(
    tbAddChain.id,
    tbAddChain.chain_id,
    voters
  )
  await addChainTx.wait();

  isChainIdSupported = await bridge.supported_chains(newChainId);
  if (!isChainIdSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ ChainId: ${newChainId} added successfully.`)

}