import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbRemoveChain } from "../../../artifacts/js/types/council_v0003";
import { getTbRemoveChainLeo } from "../../../artifacts/js/js2leo/council_v0003";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";

const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode: "execute", priorityFee: 10_000});

export const proposeRemoveChain = async (chainId: bigint): Promise<number> => {

  console.log(`👍 Proposing to remove chainId: ${chainId}`)
  const isChainIdSupported = await bridge.supported_chains(chainId, false);
  if (!isChainIdSupported) {
    throw Error(`ChainId ${chainId} is not found!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbRemoveChain: TbRemoveChain = {
    id: proposalId,
    chain_id: chainId
  };
  const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 

  const [proposeRemoveChainTx] = await council.propose(proposalId, tbRemoveChainProposalHash); 
  
  await council.wait(proposeRemoveChainTx);

  getProposalStatus(tbRemoveChainProposalHash);
  
  return proposalId
};

export const voteRemoveChain = async (proposalId: number, chainId: bigint) => {

  console.log(`👍 Voting to remove chainId: ${chainId}`)
  const isChainIdSupported = await bridge.supported_chains(chainId, false);
  if (!isChainIdSupported) {
    throw Error(`ChainId ${chainId} is not found!`);
  }

  const tbRemoveChain: TbRemoveChain = {
    id: proposalId,
    chain_id: chainId
  };
  const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 

  const voter = council.getAccounts()[0];
  validateVote(tbRemoveChainProposalHash, voter);

  const [voteRemoveChainTx] = await council.vote(tbRemoveChainProposalHash, true); 
  
  await council.wait(voteRemoveChainTx);

  getProposalStatus(tbRemoveChainProposalHash);

}

export const execRemoveChain = async (proposalId: number, chainId: bigint) => {

    console.log(`👍 removing chainId: ${chainId}`)
    let isChainIdSupported = await bridge.supported_chains(chainId, false);
    if (!isChainIdSupported) {
      throw Error(`ChainId ${chainId} is not found!`);
    }
  
  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbRemoveChain: TbRemoveChain = {
    id: proposalId,
    chain_id: chainId
  };
  const tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 

  validateExecution(tbRemoveChainProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbRemoveChainProposalHash), SUPPORTED_THRESHOLD);
  const [removeChainTx] = await council.tb_remove_chain(
    tbRemoveChain.id,
    tbRemoveChain.chain_id,
    voters
  )

  await council.wait(removeChainTx);

  isChainIdSupported = await bridge.supported_chains(chainId, false);
  if (isChainIdSupported) {
    throw Error('chainId was deleted!');
  }

  console.log(` ✅ ChainId: ${chainId} removed successfully.`)

}