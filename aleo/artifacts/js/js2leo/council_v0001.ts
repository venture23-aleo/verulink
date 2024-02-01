import {
  ProposalVote,
  leoProposalVoteSchema,
  ProposalVoteLeo,
  AddMember,
  leoAddMemberSchema,
  AddMemberLeo,
  RemoveMember,
  leoRemoveMemberSchema,
  RemoveMemberLeo,
  UpdateThreshold,
  leoUpdateThresholdSchema,
  UpdateThresholdLeo,
  TbUpdateGovernance,
  leoTbUpdateGovernanceSchema,
  TbUpdateGovernanceLeo,
  TbAddAttestor,
  leoTbAddAttestorSchema,
  TbAddAttestorLeo,
  TbRemoveAttestor,
  leoTbRemoveAttestorSchema,
  TbRemoveAttestorLeo,
  TbUpdateThreshold,
  leoTbUpdateThresholdSchema,
  TbUpdateThresholdLeo,
  TbAddChain,
  leoTbAddChainSchema,
  TbAddChainLeo,
  TbRemoveChain,
  leoTbRemoveChainSchema,
  TbRemoveChainLeo,
  TbAddService,
  leoTbAddServiceSchema,
  TbAddServiceLeo,
  TbRemoveService,
  leoTbRemoveServiceSchema,
  TbRemoveServiceLeo,
  TsTransferOwnership,
  leoTsTransferOwnershipSchema,
  TsTransferOwnershipLeo,
  TsAddToken,
  leoTsAddTokenSchema,
  TsAddTokenLeo,
  TsRemoveToken,
  leoTsRemoveTokenSchema,
  TsRemoveTokenLeo,
  TsUpdateMinTransfer,
  leoTsUpdateMinTransferSchema,
  TsUpdateMinTransferLeo,
  TsUpdateMaxTransfer,
  leoTsUpdateMaxTransferSchema,
  TsUpdateMaxTransferLeo,
  TsUpdateWithdrawalLimit,
  leoTsUpdateWithdrawalLimitSchema,
  TsUpdateWithdrawalLimitLeo,
  HoldingRelease,
  leoHoldingReleaseSchema,
  HoldingReleaseLeo,
  ConnectorUpdate,
  leoConnectorUpdateSchema,
  ConnectorUpdateLeo,
  ExternalProposal,
  leoExternalProposalSchema,
  ExternalProposalLeo
} from "../types";

import {
  js2leo
} from "@aleojs/core";
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

export function getTbAddChainLeo(tbAddChain: TbAddChain): TbAddChainLeo {
  const result: TbAddChainLeo = {
    id: js2leo.u32(tbAddChain.id),
    chain_id: js2leo.u128(tbAddChain.chain_id),
  }
  return result;
}

export function getTbRemoveChainLeo(tbRemoveChain: TbRemoveChain): TbRemoveChainLeo {
  const result: TbRemoveChainLeo = {
    id: js2leo.u32(tbRemoveChain.id),
    chain_id: js2leo.u128(tbRemoveChain.chain_id),
  }
  return result;
}

export function getTbAddServiceLeo(tbAddService: TbAddService): TbAddServiceLeo {
  const result: TbAddServiceLeo = {
    id: js2leo.u32(tbAddService.id),
    service: js2leo.address(tbAddService.service),
  }
  return result;
}

export function getTbRemoveServiceLeo(tbRemoveService: TbRemoveService): TbRemoveServiceLeo {
  const result: TbRemoveServiceLeo = {
    id: js2leo.u32(tbRemoveService.id),
    service: js2leo.address(tbRemoveService.service),
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

export function getTsAddTokenLeo(tsAddToken: TsAddToken): TsAddTokenLeo {
  const result: TsAddTokenLeo = {
    id: js2leo.u32(tsAddToken.id),
    token_id: js2leo.address(tsAddToken.token_id),
    connector: js2leo.address(tsAddToken.connector),
    min_transfer: js2leo.u128(tsAddToken.min_transfer),
    max_transfer: js2leo.u128(tsAddToken.max_transfer),
    outgoing_percentage: js2leo.u16(tsAddToken.outgoing_percentage),
    time: js2leo.u32(tsAddToken.time),
    max_no_cap: js2leo.u128(tsAddToken.max_no_cap),
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

export function getTsUpdateMinTransferLeo(tsUpdateMinTransfer: TsUpdateMinTransfer): TsUpdateMinTransferLeo {
  const result: TsUpdateMinTransferLeo = {
    id: js2leo.u32(tsUpdateMinTransfer.id),
    token_id: js2leo.address(tsUpdateMinTransfer.token_id),
    min_transfer: js2leo.u128(tsUpdateMinTransfer.min_transfer),
  }
  return result;
}

export function getTsUpdateMaxTransferLeo(tsUpdateMaxTransfer: TsUpdateMaxTransfer): TsUpdateMaxTransferLeo {
  const result: TsUpdateMaxTransferLeo = {
    id: js2leo.u32(tsUpdateMaxTransfer.id),
    token_id: js2leo.address(tsUpdateMaxTransfer.token_id),
    max_transfer: js2leo.u128(tsUpdateMaxTransfer.max_transfer),
  }
  return result;
}

export function getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit): TsUpdateWithdrawalLimitLeo {
  const result: TsUpdateWithdrawalLimitLeo = {
    id: js2leo.u32(tsUpdateWithdrawalLimit.id),
    token_id: js2leo.address(tsUpdateWithdrawalLimit.token_id),
    percentage: js2leo.u16(tsUpdateWithdrawalLimit.percentage),
    duration: js2leo.u32(tsUpdateWithdrawalLimit.duration),
    threshold_no_limit: js2leo.u128(tsUpdateWithdrawalLimit.threshold_no_limit),
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