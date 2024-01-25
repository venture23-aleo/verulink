import {
  ProposalVote,
  ProposalVoteLeo,
  AddMember,
  AddMemberLeo,
  RemoveMember,
  RemoveMemberLeo,
  UpdateThreshold,
  UpdateThresholdLeo,
  TbUpdateGovernance,
  TbUpdateGovernanceLeo,
  TbAddAttestor,
  TbAddAttestorLeo,
  TbRemoveAttestor,
  TbRemoveAttestorLeo,
  TbUpdateThreshold,
  TbUpdateThresholdLeo,
  TbEnableChain,
  TbEnableChainLeo,
  TbDisableChain,
  TbDisableChainLeo,
  TbEnableService,
  TbEnableServiceLeo,
  TbDisableService,
  TbDisableServiceLeo,
  TsTransferOwnership,
  TsTransferOwnershipLeo,
  TsAddToken,
  TsAddTokenLeo,
  TsRemoveToken,
  TsRemoveTokenLeo,
  TsUpdateMinTransfer,
  TsUpdateMinTransferLeo,
  TsUpdateMaxTransfer,
  TsUpdateMaxTransferLeo,
  TsUpdateOutgoingPercentage,
  TsUpdateOutgoingPercentageLeo,
  HoldingRelease,
  HoldingReleaseLeo,
  ConnectorUpdate,
  ConnectorUpdateLeo,
  ExternalProposal,
  ExternalProposalLeo,
} from "../types";

import * as leo2js from "./common";
export function getProposalVote(proposalVote: ProposalVoteLeo): ProposalVote {
  const result: ProposalVote = {
    proposal: leo2js.field(proposalVote.proposal),
    member: leo2js.address(proposalVote.member),
  }
  return result;
}

export function getAddMember(addMember: AddMemberLeo): AddMember {
  const result: AddMember = {
    id: leo2js.u32(addMember.id),
    new_member: leo2js.address(addMember.new_member),
    new_threshold: leo2js.u8(addMember.new_threshold),
  }
  return result;
}

export function getRemoveMember(removeMember: RemoveMemberLeo): RemoveMember {
  const result: RemoveMember = {
    id: leo2js.u32(removeMember.id),
    existing_member: leo2js.address(removeMember.existing_member),
    new_threshold: leo2js.u8(removeMember.new_threshold),
  }
  return result;
}

export function getUpdateThreshold(updateThreshold: UpdateThresholdLeo): UpdateThreshold {
  const result: UpdateThreshold = {
    id: leo2js.u32(updateThreshold.id),
    new_threshold: leo2js.u8(updateThreshold.new_threshold),
  }
  return result;
}

export function getTbUpdateGovernance(tbUpdateGovernance: TbUpdateGovernanceLeo): TbUpdateGovernance {
  const result: TbUpdateGovernance = {
    id: leo2js.u32(tbUpdateGovernance.id),
    new_owner: leo2js.address(tbUpdateGovernance.new_owner),
  }
  return result;
}

export function getTbAddAttestor(tbAddAttestor: TbAddAttestorLeo): TbAddAttestor {
  const result: TbAddAttestor = {
    id: leo2js.u32(tbAddAttestor.id),
    new_attestor: leo2js.address(tbAddAttestor.new_attestor),
    new_threshold: leo2js.u8(tbAddAttestor.new_threshold),
  }
  return result;
}

export function getTbRemoveAttestor(tbRemoveAttestor: TbRemoveAttestorLeo): TbRemoveAttestor {
  const result: TbRemoveAttestor = {
    id: leo2js.u32(tbRemoveAttestor.id),
    existing_attestor: leo2js.address(tbRemoveAttestor.existing_attestor),
    new_threshold: leo2js.u8(tbRemoveAttestor.new_threshold),
  }
  return result;
}

export function getTbUpdateThreshold(tbUpdateThreshold: TbUpdateThresholdLeo): TbUpdateThreshold {
  const result: TbUpdateThreshold = {
    id: leo2js.u32(tbUpdateThreshold.id),
    new_threshold: leo2js.u8(tbUpdateThreshold.new_threshold),
  }
  return result;
}

export function getTbEnableChain(tbEnableChain: TbEnableChainLeo): TbEnableChain {
  const result: TbEnableChain = {
    id: leo2js.u32(tbEnableChain.id),
    chain_id: leo2js.u128(tbEnableChain.chain_id),
  }
  return result;
}

export function getTbDisableChain(tbDisableChain: TbDisableChainLeo): TbDisableChain {
  const result: TbDisableChain = {
    id: leo2js.u32(tbDisableChain.id),
    chain_id: leo2js.u128(tbDisableChain.chain_id),
  }
  return result;
}

export function getTbEnableService(tbEnableService: TbEnableServiceLeo): TbEnableService {
  const result: TbEnableService = {
    id: leo2js.u32(tbEnableService.id),
    service: leo2js.address(tbEnableService.service),
  }
  return result;
}

export function getTbDisableService(tbDisableService: TbDisableServiceLeo): TbDisableService {
  const result: TbDisableService = {
    id: leo2js.u32(tbDisableService.id),
    service: leo2js.address(tbDisableService.service),
  }
  return result;
}

export function getTsTransferOwnership(tsTransferOwnership: TsTransferOwnershipLeo): TsTransferOwnership {
  const result: TsTransferOwnership = {
    id: leo2js.u32(tsTransferOwnership.id),
    new_owner: leo2js.address(tsTransferOwnership.new_owner),
  }
  return result;
}

export function getTsAddToken(tsAddToken: TsAddTokenLeo): TsAddToken {
  const result: TsAddToken = {
    id: leo2js.u32(tsAddToken.id),
    token_id: leo2js.address(tsAddToken.token_id),
    connector: leo2js.address(tsAddToken.connector),
    min_transfer: leo2js.u128(tsAddToken.min_transfer),
    max_transfer: leo2js.u128(tsAddToken.max_transfer),
    outgoing_percentage: leo2js.u16(tsAddToken.outgoing_percentage),
    time: leo2js.u32(tsAddToken.time),
    max_no_cap: leo2js.u128(tsAddToken.max_no_cap),
  }
  return result;
}

export function getTsRemoveToken(tsRemoveToken: TsRemoveTokenLeo): TsRemoveToken {
  const result: TsRemoveToken = {
    id: leo2js.u32(tsRemoveToken.id),
    token_id: leo2js.address(tsRemoveToken.token_id),
  }
  return result;
}

export function getTsUpdateMinTransfer(tsUpdateMinTransfer: TsUpdateMinTransferLeo): TsUpdateMinTransfer {
  const result: TsUpdateMinTransfer = {
    id: leo2js.u32(tsUpdateMinTransfer.id),
    token_id: leo2js.address(tsUpdateMinTransfer.token_id),
    min_transfer: leo2js.u128(tsUpdateMinTransfer.min_transfer),
  }
  return result;
}

export function getTsUpdateMaxTransfer(tsUpdateMaxTransfer: TsUpdateMaxTransferLeo): TsUpdateMaxTransfer {
  const result: TsUpdateMaxTransfer = {
    id: leo2js.u32(tsUpdateMaxTransfer.id),
    token_id: leo2js.address(tsUpdateMaxTransfer.token_id),
    max_transfer: leo2js.u128(tsUpdateMaxTransfer.max_transfer),
  }
  return result;
}

export function getTsUpdateOutgoingPercentage(tsUpdateOutgoingPercentage: TsUpdateOutgoingPercentageLeo): TsUpdateOutgoingPercentage {
  const result: TsUpdateOutgoingPercentage = {
    id: leo2js.u32(tsUpdateOutgoingPercentage.id),
    token_id: leo2js.address(tsUpdateOutgoingPercentage.token_id),
    outgoing_percentage: leo2js.u16(tsUpdateOutgoingPercentage.outgoing_percentage),
    timeframe: leo2js.u32(tsUpdateOutgoingPercentage.timeframe),
    max_no_cap: leo2js.u128(tsUpdateOutgoingPercentage.max_no_cap),
  }
  return result;
}

export function getHoldingRelease(holdingRelease: HoldingReleaseLeo): HoldingRelease {
  const result: HoldingRelease = {
    id: leo2js.u32(holdingRelease.id),
    token_id: leo2js.address(holdingRelease.token_id),
    connector: leo2js.address(holdingRelease.connector),
    receiver: leo2js.address(holdingRelease.receiver),
    amount: leo2js.u128(holdingRelease.amount),
  }
  return result;
}

export function getConnectorUpdate(connectorUpdate: ConnectorUpdateLeo): ConnectorUpdate {
  const result: ConnectorUpdate = {
    id: leo2js.u32(connectorUpdate.id),
    token_id: leo2js.address(connectorUpdate.token_id),
    connector: leo2js.address(connectorUpdate.connector),
    new_connector: leo2js.address(connectorUpdate.new_connector),
  }
  return result;
}

export function getExternalProposal(externalProposal: ExternalProposalLeo): ExternalProposal {
  const result: ExternalProposal = {
    id: leo2js.u32(externalProposal.id),
    external_program: leo2js.address(externalProposal.external_program),
    proposal_hash: leo2js.field(externalProposal.proposal_hash),
  }
  return result;
}