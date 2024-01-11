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

import * as js2leo from "./common";
export function getProposalSignLeo(proposalSign: ProposalSign): ProposalSignLeo {
  const result: ProposalSignLeo = {
    proposal: js2leo.field(proposalSign.proposal),
    member: js2leo.address(proposalSign.member),
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
    new_governance: js2leo.address(tbUpdateGovernance.new_governance),
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

export function getWtUpdateGovernanceLeo(wtUpdateGovernance: WtUpdateGovernance): WtUpdateGovernanceLeo {
  const result: WtUpdateGovernanceLeo = {
    id: js2leo.u32(wtUpdateGovernance.id),
    new_governance: js2leo.address(wtUpdateGovernance.new_governance),
  }
  return result;
}

export function getWtAddTokenLeo(wtAddToken: WtAddToken): WtAddTokenLeo {
  const result: WtAddTokenLeo = {
    id: js2leo.u32(wtAddToken.id),
    name: js2leo.array(wtAddToken.name, js2leo.u8),
    symbol: js2leo.array(wtAddToken.symbol, js2leo.u8),
    decimals: js2leo.u8(wtAddToken.decimals),
    origin_chain_id: js2leo.u128(wtAddToken.origin_chain_id),
    origin_contract_address: js2leo.array(wtAddToken.origin_contract_address, js2leo.u8),
  }
  return result;
}

export function getTsSupportChainLeo(tsSupportChain: TsSupportChain): TsSupportChainLeo {
  const result: TsSupportChainLeo = {
    id: js2leo.u32(tsSupportChain.id),
    chain_id: js2leo.u128(tsSupportChain.chain_id),
    token_service: js2leo.array(tsSupportChain.token_service, js2leo.u8),
  }
  return result;
}

export function getTsRemoveChainLeo(tsRemoveChain: TsRemoveChain): TsRemoveChainLeo {
  const result: TsRemoveChainLeo = {
    id: js2leo.u32(tsRemoveChain.id),
    chain_id: js2leo.u128(tsRemoveChain.chain_id),
  }
  return result;
}

export function getTsManageTokenLeo(tsManageToken: TsManageToken): TsManageTokenLeo {
  const result: TsManageTokenLeo = {
    id: js2leo.u32(tsManageToken.id),
    token_id: js2leo.address(tsManageToken.token_id),
    minimum_transfer: js2leo.u64(tsManageToken.minimum_transfer),
    outgoing_percentage: js2leo.u16(tsManageToken.outgoing_percentage),
    time: js2leo.u32(tsManageToken.time),
  }
  return result;
}