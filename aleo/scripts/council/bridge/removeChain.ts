import { hashStruct } from "../../../utils/hash";


import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TB_REMOVE_CHAIN } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";

import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v2Contract } from "../../../artifacts/js/vlink_bridge_council_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { Vlink_token_bridge_v2Contract } from "../../../artifacts/js/vlink_token_bridge_v2";
import { TbRemoveChain } from "../../../artifacts/js/types/vlink_bridge_council_v2";
import { getTbRemoveChainLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";


const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Vlink_bridge_council_v2Contract({mode, priorityFee: 10_000});

const council = new Vlink_council_v2Contract({mode, priorityFee: 10_000});
const bridge = new Vlink_token_bridge_v2Contract({mode, priorityFee: 10_000});

export const proposeRemoveChain = async (chainId: bigint): Promise<number> => {

  console.log(`👍 Proposing to remove chainId: ${chainId}`)
  const isChainIdSupported = await bridge.supported_chains(chainId, false);
  if (!isChainIdSupported) {
    throw Error(`ChainId ${chainId} is not found!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;

  // generating hash
  const tbRemoveChain: TbRemoveChain = {
    tag: TAG_TB_REMOVE_CHAIN,
    id: proposalId,
    chain_id: chainId
  };
  const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 

  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbRemoveChainProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // proposing
  const proposeRemoveChainTx = await council.propose(proposalId, ExternalProposalHash); 
  await proposeRemoveChainTx.wait();

  getProposalStatus(ExternalProposalHash);
  
  return proposalId
};

export const voteRemoveChain = async (proposalId: number, chainId: bigint) => {

  console.log(`👍 Voting to remove chainId: ${chainId}`)
  const isChainIdSupported = await bridge.supported_chains(chainId, false);
  if (!isChainIdSupported) {
    throw Error(`ChainId ${chainId} is not found!`);
  }

  // generating hash
  const tbRemoveChain: TbRemoveChain = {
    tag: TAG_TB_REMOVE_CHAIN,
    id: proposalId,
    chain_id: chainId
  };
  const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 

  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbRemoveChainProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));
 

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // vote
  const voteRemoveChainTx = await council.vote(ExternalProposalHash, true); 
  await voteRemoveChainTx.wait();

  getProposalStatus(ExternalProposalHash);

}

export const execRemoveChain = async (proposalId: number, chainId: bigint) => {

    console.log(`👍 removing chainId: ${chainId}`)
    let isChainIdSupported = await bridge.supported_chains(chainId, false);
    if (!isChainIdSupported) {
      throw Error(`ChainId ${chainId} is not found!`);
    }
  
  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  // generating hash
  const tbRemoveChain: TbRemoveChain = {
    tag: TAG_TB_REMOVE_CHAIN,
    id: proposalId,
    chain_id: chainId
  };
  const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 

  const externalProposal: ExternalProposal = {
          id: proposalId,
          external_program: bridgeCouncil.address(),
          proposal_hash: tbRemoveChainProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));


  validateExecution(ExternalProposalHash);
  // execute
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  const removeChainTx = await bridgeCouncil.tb_remove_chain(
    tbRemoveChain.id,
    tbRemoveChain.chain_id,
    voters
  )
  await removeChainTx.wait();

  isChainIdSupported = await bridge.supported_chains(chainId, false);
  if (isChainIdSupported) {
    throw Error('chainId was deleted!');
  }

  console.log(` ✅ ChainId: ${chainId} removed successfully.`)

}