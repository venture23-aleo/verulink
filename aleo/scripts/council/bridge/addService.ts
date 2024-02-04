import { ProposalVote, TbAddChain, TbAddService } from "../../../artifacts/js/types";
import { hashStruct } from "../../../utils/hash";

import * as js2leo from '../../../artifacts/js/js2leo';
import { Token_bridge_v0001Contract } from "../../../artifacts/js/token_bridge_v0001";
import { Council_v0001Contract } from "../../../artifacts/js/council_v0001";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";

const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});
const bridge = new Token_bridge_v0001Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddService = async (tokenService: string): Promise<number> => {

  console.log(`👍 Proposing to add token service: ${tokenService}`)
  const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is already added!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddService: TbAddService = {
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(js2leo.getTbAddServiceLeo(tbAddService)); 

  const proposeAddTokenServiceTx = await council.propose(proposalId, tbAddTokenServiceProposalHash); // 477_914
  
  // @ts-ignore
  await proposeAddTokenServiceTx.wait()

  getProposalStatus(tbAddTokenServiceProposalHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteAddService = async (proposalId: number, tokenService: string) => {

  console.log(`👍 Voting to add token service: ${tokenService}`)
  const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is already added!`);
  }

  const tbAddService: TbAddService = {
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(js2leo.getTbAddServiceLeo(tbAddService)); 

  const voter = council.getAccounts()[0];

  validateVote(tbAddTokenServiceProposalHash, voter);

  const voteAddChainTx = await council.vote(tbAddTokenServiceProposalHash); // 477_914
  
  // @ts-ignore
  await voteAddChainTx.wait()

  getProposalStatus(tbAddTokenServiceProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execAddService = async (proposalId: number, tokenService: string) => {

  console.log(`Adding token service: ${tokenService}`)
  let isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is already added!`);
  }


  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != council.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbAddService: TbAddService = {
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(js2leo.getTbAddServiceLeo(tbAddService)); 

  validateExecution(tbAddTokenServiceProposalHash);

  const addServiceTx = await council.tb_add_service(
    tbAddService.id,
    tbAddService.service,
  ) // 301_747

  // @ts-ignore
  await addServiceTx.wait()

  isTokenServiceSupported = await bridge.supported_services(tokenService);
  if (!isTokenServiceSupported) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ TokenService: ${tokenService} added successfully.`)

}