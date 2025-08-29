import { hashStruct } from "../../../utils/hash";

import { Vlink_token_bridge_v7Contract } from "../../../artifacts/js/vlink_token_bridge_v7";
import { Vlink_council_v07Contract } from "../../../artifacts/js/vlink_council_v07";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../../utils/testdata.data";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { TbAddService } from "../../../artifacts/js/types/vlink_bridge_council_v07";
import { getTbAddServiceLeo } from "../../../artifacts/js/js2leo/vlink_bridge_council_v07";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_bridge_council_v07Contract } from "../../../artifacts/js/vlink_bridge_council_v07";
import { TAG_TB_ADD_SERVICE } from "../../../utils/constants";
import { ExternalProposal } from "../../../artifacts/js/types/vlink_council_v07";
import { getExternalProposalLeo } from "../../../artifacts/js/js2leo/vlink_council_v07";
import { Vlink_token_service_cd_v7Contract } from "../../../artifacts/js/vlink_token_service_cd_v7";

const mode = ExecutionMode.SnarkExecute;

const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const bridge = new Vlink_token_bridge_v7Contract({ mode, priorityFee: 10_000 });
const bridgeCouncil = new Vlink_bridge_council_v07Contract({ mode, priorityFee: 10_000 });
const tokenServiceWAleo = new Vlink_token_service_cd_v7Contract({ mode: mode });


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

  // generating hash
  const tbAddService: TbAddService = {
    tag: TAG_TB_ADD_SERVICE,
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(getTbAddServiceLeo(tbAddService));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbAddTokenServiceProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  // proposing
  const proposeAddTokenServiceTx = await council.propose(proposalId, ExternalProposalHash);
  await proposeAddTokenServiceTx.wait();

  getProposalStatus(ExternalProposalHash);

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

  // generating hash
  const tbAddService: TbAddService = {
    tag: TAG_TB_ADD_SERVICE,
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(getTbAddServiceLeo(tbAddService));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbAddTokenServiceProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  const voter = council.getAccounts()[0];
  validateVote(ExternalProposalHash, voter);

  // vote
  const voteAddChainTx = await council.vote(ExternalProposalHash, true);
  await voteAddChainTx.wait();

  getProposalStatus(ExternalProposalHash);

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

  // generating hash
  const tbAddService: TbAddService = {
    tag: TAG_TB_ADD_SERVICE,
    id: proposalId,
    service: tokenService
  };
  const tbAddTokenServiceProposalHash = hashStruct(getTbAddServiceLeo(tbAddService));

  const externalProposal: ExternalProposal = {
    id: proposalId,
    external_program: bridgeCouncil.address(),
    proposal_hash: tbAddTokenServiceProposalHash
  }
  const ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

  validateExecution(ExternalProposalHash);
  const voters = padWithZeroAddress(await getVotersWithYesVotes(ExternalProposalHash), SUPPORTED_THRESHOLD);

  // execute
  const addServiceTx = await bridgeCouncil.tb_add_service(
    tbAddService.id,
    tbAddService.service,
    voters
  )

  await addServiceTx.wait();

  isTokenServiceSupported = await bridge.supported_services(tokenService);
  if (!isTokenServiceSupported) {
    throw Error(`❌ Unknown error.`);
  }

  console.log(` ✅ TokenService: ${tokenService} added successfully.`)

}



async function run() {
  const proposalId = await proposeAddService(tokenServiceWAleo.address());
  await execAddService(proposalId, tokenServiceWAleo.address());
}

run();