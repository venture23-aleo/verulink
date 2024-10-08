import { hashStruct } from "../../../utils/hash";

import { Token_bridge_v0003Contract } from "../../../artifacts/js/token_bridge_v0003";
import { CouncilContract } from "../../../artifacts/js/council";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbRemoveService } from "../../../artifacts/js/types/bridge_council";
import { getTbRemoveServiceLeo } from "../../../artifacts/js/js2leo/bridge_council";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Bridge_councilContract } from "../../../artifacts/js/bridge_council";

const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Bridge_councilContract({mode, priorityFee: 10_000});

const council = new CouncilContract({mode, priorityFee: 10_000});
const bridge = new Token_bridge_v0003Contract({mode, priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveService = async (tokenService: string): Promise<number> => {

  console.log(`👍 Proposing to remove token service: ${tokenService}`)
  const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (!isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is not found!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbRemoveService: TbRemoveService = {
    id: proposalId,
    service: tokenService
  };
  const tbRemoveTokenServiceProposalHash = hashStruct(getTbRemoveServiceLeo(tbRemoveService)); 

  const [proposeRemoveTokenServiceTx] = await council.propose(proposalId, tbRemoveTokenServiceProposalHash);
  
  await council.wait(proposeRemoveTokenServiceTx);

  getProposalStatus(tbRemoveTokenServiceProposalHash);

  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteRemoveService = async (proposalId: number, tokenService: string) => {

  console.log(`👍 Voting to remove token service: ${tokenService}`)
  const isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (!isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is not found!`);
  }


  const tbRemoveService: TbRemoveService = {
    id: proposalId,
    service: tokenService
  };
  const tbRemoveTokenServiceProposalHash = hashStruct(getTbRemoveServiceLeo(tbRemoveService)); 

  const voter = council.getAccounts()[0];

  validateVote(tbRemoveTokenServiceProposalHash, voter);

  const [voteRemoveChainTx] = await council.vote(tbRemoveTokenServiceProposalHash, true); 
  
  await council.wait(voteRemoveChainTx);

  getProposalStatus(tbRemoveTokenServiceProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveService = async (proposalId: number, tokenService: string) => {

  console.log(`Removing token service: ${tokenService}`)
  let isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (!isTokenServiceSupported) {
    throw Error(`Service ${tokenService} is not found!`);
  }


  const bridgeOwner = await bridge.owner_TB(true);
  if (bridgeOwner != bridgeCouncil.address()) {
    throw Error("Council is not the owner of bridge program");
  }

  const tbRemoveService: TbRemoveService = {
    id: proposalId,
    service: tokenService
  };
  const tbRemoveTokenServiceProposalHash = hashStruct(getTbRemoveServiceLeo(tbRemoveService)); 

  validateExecution(tbRemoveTokenServiceProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tbRemoveTokenServiceProposalHash), SUPPORTED_THRESHOLD);
  const [removeServiceTx] = await bridgeCouncil.tb_remove_service(
    tbRemoveService.id,
    tbRemoveService.service,
    voters
  );

  await council.wait(removeServiceTx);

  isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ TokenService: ${tokenService} removed successfully.`)

}