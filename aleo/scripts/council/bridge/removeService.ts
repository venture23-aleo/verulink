import { hashStruct } from "../../../utils/hash";


import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, TAG_TB_REMOVE_SERVICE } from "../../../utils/constants";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";

import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v2Contract } from "../../../artifacts/js/vlink_bridge_council_v2";
import { Vlink_council_v2Contract } from "../../../artifacts/js/vlink_council_v2";
import { Vlink_token_bridge_v2Contract } from "../../../artifacts/js/vlink_token_bridge_v2";
import { TbRemoveService } from "../../../artifacts/js/types/vlink_bridge_council_v2";
import { getTbRemoveServiceLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v2";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v2";


const mode = ExecutionMode.SnarkExecute;
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });

const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });


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

  // generating hash
  const tbRemoveService: TbRemoveService = {
    tag: TAG_TB_REMOVE_SERVICE,
    id: proposalId,
    service: tokenService
  };
  const tbRemoveTokenServiceProposalHash = hashStruct(getTbRemoveServiceLeo(tbRemoveService));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbRemoveTokenServiceProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // proposing
  const proposeRemoveTokenServiceTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeRemoveTokenServiceTx.wait();

  getProposalStatus(ExternalProposalHash);

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


  // generating hash
  const tbRemoveService: TbRemoveService = {
    tag: TAG_TB_REMOVE_SERVICE,
    id: proposalId,
    service: tokenService
  };
  const tbRemoveTokenServiceProposalHash = hashStruct(getTbRemoveServiceLeo(tbRemoveService));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbRemoveTokenServiceProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];

  validateVote(ExternalProposalHash, voter);

  // vote
  const voteRemoveChainTx = await council.vote(ExternalProposalHash, true);
  await council.wait(voteRemoveChainTx);

  getProposalStatus(ExternalProposalHash);

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

  // generating hash
  const tbRemoveService: TbRemoveService = {
    tag: TAG_TB_REMOVE_SERVICE,
    id: proposalId,
    service: tokenService
  };
  const tbRemoveTokenServiceProposalHash = hashStruct(getTbRemoveServiceLeo(tbRemoveService));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbRemoveTokenServiceProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);
  const removeServiceTx = await bridgeCouncil.tb_remove_service(
    tbRemoveService.id,
    tbRemoveService.service,
    voters
  );

  await removeServiceTx.wait();

  isTokenServiceSupported = await bridge.supported_services(tokenService, false);
  if (isTokenServiceSupported) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ TokenService: ${tokenService} removed successfully.`)

}