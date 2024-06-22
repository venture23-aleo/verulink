import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { CouncilContract } from "../../../artifacts/js/council";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbAddService } from "../../../artifacts/js/types/bridge_council";
import { getTbAddServiceLeo } from "../../../artifacts/js/js2leo/bridge_council";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Bridge_councilContract } from "../../../artifacts/js/bridge_council";

const mode = ExecutionMode.SnarkExecute;

const council = new CouncilContract({mode, priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode, priorityFee: 10_000});
const bridgeCouncil = new Bridge_councilContract({mode, priorityFee: 10_000});

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
  const tbAddTokenServiceProposalHash = hashStruct(getTbAddServiceLeo(tbAddService)); 

  const [proposeAddTokenServiceTx] = await council.propose(proposalId, tbAddTokenServiceProposalHash); 
  
  await council.wait(proposeAddTokenServiceTx);

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
  const tbAddTokenServiceProposalHash = hashStruct(getTbAddServiceLeo(tbAddService)); 

  const voter = council.getAccounts()[0];
  validateVote(tbAddTokenServiceProposalHash, voter);

  const [voteAddChainTx] = await council.vote(tbAddTokenServiceProposalHash, true); 
  await council.wait(voteAddChainTx);

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
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbAddService: TbAddService = {
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(getTbAddServiceLeo(tbAddService)); 

  validateExecution(tbAddTokenServiceProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbAddTokenServiceProposalHash), SUPPORTED_THRESHOLD);

  const [addServiceTx] = await bridgeCouncil.tb_add_service(
    tbAddService.id,
    tbAddService.service,
    voters
  ) 
  
  await council.wait(addServiceTx);

  isTokenServiceSupported = await bridge.supported_services(tokenService);
  if (!isTokenServiceSupported) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ TokenService: ${tokenService} added successfully.`)

}