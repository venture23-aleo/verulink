import {
  ProposalSign,
  ProposalSignLeo,
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
  TsUpdateGovernance,
  TsUpdateGovernanceLeo,
  TsSupportChain,
  TsSupportChainLeo,
  TsRemoveChain,
  TsRemoveChainLeo,
  TsSupportToken,
  TsSupportTokenLeo,
  TsRemoveToken,
  TsRemoveTokenLeo,
  TsUpdateMinimumTransfer,
  TsUpdateMinimumTransferLeo,
  TsUpdateOutgoingPercentage,
  TsUpdateOutgoingPercentageLeo,
} from "../types";

import * as leo2js from "./common";
export function getProposalSign(proposalSign: ProposalSignLeo): ProposalSign {
  const result: ProposalSign = {
    proposal: leo2js.field(proposalSign.proposal),
    member: leo2js.address(proposalSign.member),
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
    new_governance: leo2js.address(tbUpdateGovernance.new_governance),
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

export function getTsUpdateGovernance(tsUpdateGovernance: TsUpdateGovernanceLeo): TsUpdateGovernance {
  const result: TsUpdateGovernance = {
    id: leo2js.u32(tsUpdateGovernance.id),
    new_governance: leo2js.address(tsUpdateGovernance.new_governance),
  }
  return result;
}

export function getTsSupportChain(tsSupportChain: TsSupportChainLeo): TsSupportChain {
  const result: TsSupportChain = {
    id: leo2js.u32(tsSupportChain.id),
    chain_id: leo2js.u128(tsSupportChain.chain_id),
    token_service: leo2js.array(tsSupportChain.token_service, leo2js.u8),
  }
  return result;
}

export function getTsRemoveChain(tsRemoveChain: TsRemoveChainLeo): TsRemoveChain {
  const result: TsRemoveChain = {
    id: leo2js.u32(tsRemoveChain.id),
    chain_id: leo2js.u128(tsRemoveChain.chain_id),
  }
  return result;
}

export function getTsSupportToken(tsSupportToken: TsSupportTokenLeo): TsSupportToken {
  const result: TsSupportToken = {
    id: leo2js.u32(tsSupportToken.id),
    token_id: leo2js.address(tsSupportToken.token_id),
    minimum_transfer: leo2js.u64(tsSupportToken.minimum_transfer),
    outgoing_percentage: leo2js.u16(tsSupportToken.outgoing_percentage),
    time: leo2js.u32(tsSupportToken.time),
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

export function getTsUpdateMinimumTransfer(tsUpdateMinimumTransfer: TsUpdateMinimumTransferLeo): TsUpdateMinimumTransfer {
  const result: TsUpdateMinimumTransfer = {
    id: leo2js.u32(tsUpdateMinimumTransfer.id),
    token_id: leo2js.address(tsUpdateMinimumTransfer.token_id),
    minimum_transfer: leo2js.u64(tsUpdateMinimumTransfer.minimum_transfer),
  }
  return result;
}

export function getTsUpdateOutgoingPercentage(tsUpdateOutgoingPercentage: TsUpdateOutgoingPercentageLeo): TsUpdateOutgoingPercentage {
  const result: TsUpdateOutgoingPercentage = {
    id: leo2js.u32(tsUpdateOutgoingPercentage.id),
    token_id: leo2js.address(tsUpdateOutgoingPercentage.token_id),
    outgoing_percentage: leo2js.u16(tsUpdateOutgoingPercentage.outgoing_percentage),
    timeframe: leo2js.u32(tsUpdateOutgoingPercentage.timeframe),
  }
  return result;
}