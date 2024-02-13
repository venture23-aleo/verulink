import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0002Contract } from "../../../artifacts/js/token_bridge_v0002";
import { Council_v0002Contract } from "../../../artifacts/js/council_v0002";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { getTbAddChainLeo } from "../../../artifacts/js/js2leo/council_v0002";
import { TbAddChain } from "../../../artifacts/js/types/council_v0002";

const council = new Council_v0002Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});

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
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 

  const [proposeAddChainTx] = await council.propose(proposalId, tbAddChainProposalHash); // 477_914

  await council.wait(proposeAddChainTx);

  getProposalStatus(tbAddChainProposalHash);
  
  return proposalId
};

export const voteAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`👍 Voting to add chainId: ${newChainId}`)
  const isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 

  const voter = council.getAccounts()[0];
  validateVote(tbAddChainProposalHash, voter);

  const [voteAddChainTx] = await council.vote(tbAddChainProposalHash); // 477_914
  
  await council.wait(voteAddChainTx);

  getProposalStatus(tbAddChainProposalHash);

}

export const execAddChain = async (proposalId: number, newChainId: bigint) => {

  console.log(`Adding chainId ${newChainId}`)
  let isChainIdSupported = await bridge.supported_chains(newChainId, false);
  if (isChainIdSupported) {
    throw Error(`ChainId ${newChainId} is already supported!`);
  }

  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 

  validateExecution(tbAddChainProposalHash);

  const [addChainTx] = await council.tb_add_chain(
    tbAddChain.id,
    tbAddChain.chain_id,
  ) // 301_747

  await council.wait(addChainTx);

  isChainIdSupported = await bridge.supported_chains(newChainId);
  if (!isChainIdSupported) {
    throw Error('Something went wrong!');
  }

  console.log(` ✅ ChainId: ${newChainId} added successfully.`)

}