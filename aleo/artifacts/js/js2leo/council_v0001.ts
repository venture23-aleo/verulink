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
  TsSupportToken,
  TsSupportTokenLeo,
  TsRemoveToken,
  TsRemoveTokenLeo,
  TsUpdateMinimumTransfer,
  TsUpdateMinimumTransferLeo,
  TsUpdateOutgoingPercentage,
  TsUpdateOutgoingPercentageLeo,
  HoldingRelease,
  HoldingReleaseLeo,
  ConnectorUpdate,
  ConnectorUpdateLeo,
  ExternalProposal,
  ExternalProposalLeo,
} from "../types";

import * as js2leo from "./common";
export function getProposalVoteLeo(proposalVote: ProposalVote): ProposalVoteLeo {
  const result: ProposalVoteLeo = {
    proposal: js2leo.field(proposalVote.proposal),
    member: js2leo.address(proposalVote.member),
  }
  return result;
}

export function getAddMemberLeo(addMember: AddMember): AddMemberLeo {
  const result: AddMemberLeo = {
    id: js2leo.u32(addMember.id),
    new_member: js2leo.address(addMember.new_member),
    new_threshold: js2leo.u8(addMember.new_threshold),
  }
  return result;
}

export function getRemoveMemberLeo(removeMember: RemoveMember): RemoveMemberLeo {
  const result: RemoveMemberLeo = {
    id: js2leo.u32(removeMember.id),
    existing_member: js2leo.address(removeMember.existing_member),
    new_threshold: js2leo.u8(removeMember.new_threshold),
  }
  return result;
}

export function getUpdateThresholdLeo(updateThreshold: UpdateThreshold): UpdateThresholdLeo {
  const result: UpdateThresholdLeo = {
    id: js2leo.u32(updateThreshold.id),
    new_threshold: js2leo.u8(updateThreshold.new_threshold),
  }
  return result;
}

export function getTbUpdateGovernanceLeo(tbUpdateGovernance: TbUpdateGovernance): TbUpdateGovernanceLeo {
  const result: TbUpdateGovernanceLeo = {
    id: js2leo.u32(tbUpdateGovernance.id),
    new_owner: js2leo.address(tbUpdateGovernance.new_owner),
  }
  return result;
}

export function getTbAddAttestorLeo(tbAddAttestor: TbAddAttestor): TbAddAttestorLeo {
  const result: TbAddAttestorLeo = {
    id: js2leo.u32(tbAddAttestor.id),
    new_attestor: js2leo.address(tbAddAttestor.new_attestor),
    new_threshold: js2leo.u8(tbAddAttestor.new_threshold),
  }
  return result;
}

export function getTbRemoveAttestorLeo(tbRemoveAttestor: TbRemoveAttestor): TbRemoveAttestorLeo {
  const result: TbRemoveAttestorLeo = {
    id: js2leo.u32(tbRemoveAttestor.id),
    existing_attestor: js2leo.address(tbRemoveAttestor.existing_attestor),
    new_threshold: js2leo.u8(tbRemoveAttestor.new_threshold),
  }
  return result;
}

export function getTbUpdateThresholdLeo(tbUpdateThreshold: TbUpdateThreshold): TbUpdateThresholdLeo {
  const result: TbUpdateThresholdLeo = {
    id: js2leo.u32(tbUpdateThreshold.id),
    new_threshold: js2leo.u8(tbUpdateThreshold.new_threshold),
  }
  return result;
}

export function getTbEnableChainLeo(tbEnableChain: TbEnableChain): TbEnableChainLeo {
  const result: TbEnableChainLeo = {
    id: js2leo.u32(tbEnableChain.id),
    chain_id: js2leo.u128(tbEnableChain.chain_id),
  }
  return result;
}

export function getTbDisableChainLeo(tbDisableChain: TbDisableChain): TbDisableChainLeo {
  const result: TbDisableChainLeo = {
    id: js2leo.u32(tbDisableChain.id),
    chain_id: js2leo.u128(tbDisableChain.chain_id),
  }
  return result;
}

export function getTbEnableServiceLeo(tbEnableService: TbEnableService): TbEnableServiceLeo {
  const result: TbEnableServiceLeo = {
    id: js2leo.u32(tbEnableService.id),
    service: js2leo.address(tbEnableService.service),
  }
  return result;
}

export function getTbDisableServiceLeo(tbDisableService: TbDisableService): TbDisableServiceLeo {
  const result: TbDisableServiceLeo = {
    id: js2leo.u32(tbDisableService.id),
    service: js2leo.address(tbDisableService.service),
  }
  return result;
}

export function getTsTransferOwnershipLeo(tsTransferOwnership: TsTransferOwnership): TsTransferOwnershipLeo {
  const result: TsTransferOwnershipLeo = {
    id: js2leo.u32(tsTransferOwnership.id),
    new_owner: js2leo.address(tsTransferOwnership.new_owner),
  }
  return result;
}

export function getTsSupportTokenLeo(tsSupportToken: TsSupportToken): TsSupportTokenLeo {
  const result: TsSupportTokenLeo = {
    id: js2leo.u32(tsSupportToken.id),
    token_id: js2leo.address(tsSupportToken.token_id),
    connector: js2leo.address(tsSupportToken.connector),
    minimum_transfer: js2leo.u128(tsSupportToken.minimum_transfer),
    outgoing_percentage: js2leo.u16(tsSupportToken.outgoing_percentage),
    time: js2leo.u32(tsSupportToken.time),
  }
  return result;
}

export function getTsRemoveTokenLeo(tsRemoveToken: TsRemoveToken): TsRemoveTokenLeo {
  const result: TsRemoveTokenLeo = {
    id: js2leo.u32(tsRemoveToken.id),
    token_id: js2leo.address(tsRemoveToken.token_id),
  }
  return result;
}

export function getTsUpdateMinimumTransferLeo(tsUpdateMinimumTransfer: TsUpdateMinimumTransfer): TsUpdateMinimumTransferLeo {
  const result: TsUpdateMinimumTransferLeo = {
    id: js2leo.u32(tsUpdateMinimumTransfer.id),
    token_id: js2leo.address(tsUpdateMinimumTransfer.token_id),
    minimum_transfer: js2leo.u128(tsUpdateMinimumTransfer.minimum_transfer),
  }
  return result;
}

export function getTsUpdateOutgoingPercentageLeo(tsUpdateOutgoingPercentage: TsUpdateOutgoingPercentage): TsUpdateOutgoingPercentageLeo {
  const result: TsUpdateOutgoingPercentageLeo = {
    id: js2leo.u32(tsUpdateOutgoingPercentage.id),
    token_id: js2leo.address(tsUpdateOutgoingPercentage.token_id),
    outgoing_percentage: js2leo.u16(tsUpdateOutgoingPercentage.outgoing_percentage),
    timeframe: js2leo.u32(tsUpdateOutgoingPercentage.timeframe),
  }
  return result;
}

export function getHoldingReleaseLeo(holdingRelease: HoldingRelease): HoldingReleaseLeo {
  const result: HoldingReleaseLeo = {
    id: js2leo.u32(holdingRelease.id),
    token_id: js2leo.address(holdingRelease.token_id),
    connector: js2leo.address(holdingRelease.connector),
    receiver: js2leo.address(holdingRelease.receiver),
    amount: js2leo.u128(holdingRelease.amount),
  }
  return result;
}

export function getConnectorUpdateLeo(connectorUpdate: ConnectorUpdate): ConnectorUpdateLeo {
  const result: ConnectorUpdateLeo = {
    id: js2leo.u32(connectorUpdate.id),
    token_id: js2leo.address(connectorUpdate.token_id),
    connector: js2leo.address(connectorUpdate.connector),
    new_connector: js2leo.address(connectorUpdate.new_connector),
  }
  return result;
}

export function getExternalProposalLeo(externalProposal: ExternalProposal): ExternalProposalLeo {
  const result: ExternalProposalLeo = {
    id: js2leo.u32(externalProposal.id),
    external_program: js2leo.address(externalProposal.external_program),
    proposal_hash: js2leo.field(externalProposal.proposal_hash),
  }
  return result;
}