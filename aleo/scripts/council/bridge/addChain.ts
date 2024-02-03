import { TbAddChain } from "../../../artifacts/js/types";
import { hashStruct } from "../../../utils/utils";

import * as js2leo from '../../../artifacts/js/js2leo';
import { TOTAL_PROPOSALS_INDEX } from "../../testnet.data";
import { Token_bridge_v0001Contract } from "../../../artifacts/js/token_bridge_v0001";
import { Council_v0001Contract } from "../../../artifacts/js/council_v0001";

const proposeAddChain = async (newChainId: bigint) => {
  const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});

  const proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbEnableChainProposalHash = hashStruct(js2leo.getTbAddChainLeo(tbAddChain)); 
  const proposeAddChainTx = await council.propose(proposalId, tbEnableChainProposalHash); // 477_914
  
  // @ts-ignore
  await proposeAddChainTx.wait()

};

const voteAddChain = async (proposalId: number, newChainId: bigint) => {
  const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const tbAddChainProposalHash = hashStruct(js2leo.getTbAddChainLeo(tbAddChain)); 
  const voteAddChainTx = await council.vote(tbAddChainProposalHash); // 477_914
  
  // @ts-ignore
  await voteAddChainTx.wait()

}

const execAddChain = async (proposalId: number, newChainId: bigint) => {
  const bridge = new Token_bridge_v0001Contract({mode: "execute", priorityFee: 10_000});
  const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});

  const tbAddChain: TbAddChain = {
    id: proposalId,
    chain_id: newChainId
  };
  const addChainTx = await council.tb_add_chain(
    tbAddChain.id,
    tbAddChain.chain_id,
  ) // 301_747

  // @ts-ignore
  await addChainTx.wait()

}