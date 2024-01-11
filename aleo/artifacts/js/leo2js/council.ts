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
  WtUpdateGovernance,
  WtUpdateGovernanceLeo,
  WtAddToken,
  WtAddTokenLeo,
  TsSupportChain,
  TsSupportChainLeo,
  TsRemoveChain,
  TsRemoveChainLeo,
  TsManageToken,
  TsManageTokenLeo,
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

export function getWtUpdateGovernance(wtUpdateGovernance: WtUpdateGovernanceLeo): WtUpdateGovernance {
  const result: WtUpdateGovernance = {
    id: leo2js.u32(wtUpdateGovernance.id),
    new_governance: leo2js.address(wtUpdateGovernance.new_governance),
  }
  return result;
}

export function getWtAddToken(wtAddToken: WtAddTokenLeo): WtAddToken {
  const result: WtAddToken = {
    id: leo2js.u32(wtAddToken.id),
    name: leo2js.array(wtAddToken.name, leo2js.u8),
    symbol: leo2js.array(wtAddToken.symbol, leo2js.u8),
    decimals: leo2js.u8(wtAddToken.decimals),
    origin_chain_id: leo2js.u128(wtAddToken.origin_chain_id),
    origin_contract_address: leo2js.array(wtAddToken.origin_contract_address, leo2js.u8),
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

export function getTsManageToken(tsManageToken: TsManageTokenLeo): TsManageToken {
  const result: TsManageToken = {
    id: leo2js.u32(tsManageToken.id),
    token_id: leo2js.address(tsManageToken.token_id),
    minimum_transfer: leo2js.u64(tsManageToken.minimum_transfer),
    outgoing_percentage: leo2js.u16(tsManageToken.outgoing_percentage),
    time: leo2js.u32(tsManageToken.time),
  }
  return result;
}