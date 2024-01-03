import {
  ProposalSign,
  ProposalSignLeo,
  AddMemberProposal,
  AddMemberProposalLeo,
  RemoveMemberProposal,
  RemoveMemberProposalLeo,
  UpdateThresholdProposal,
  UpdateThresholdProposalLeo,
  InitializeBridge,
  InitializeBridgeLeo,
  InitializeTokenService,
  InitializeTokenServiceLeo,
  InitializeWrappedToken,
  InitializeWrappedTokenLeo,
  SupportToken,
  SupportTokenLeo,
  EnableToken,
  EnableTokenLeo,
  EnableService,
  EnableServiceLeo,
  ApproveChainBridge,
  ApproveChainBridgeLeo,
  DisapproveChainBridge,
  DisapproveChainBridgeLeo,
  SupportChainTS,
  SupportChainTSLeo,
} from "../types";

import * as js2leo from "./common";
export function getProposalSignLeo(proposalSign: ProposalSign): ProposalSignLeo {
  const result: ProposalSignLeo = {
    proposal: js2leo.field(proposalSign.proposal),
    member: js2leo.address(proposalSign.member),
  }
  return result;
}

export function getAddMemberProposalLeo(addMemberProposal: AddMemberProposal): AddMemberProposalLeo {
  const result: AddMemberProposalLeo = {
    new_member: js2leo.address(addMemberProposal.new_member),
    new_threshold: js2leo.u8(addMemberProposal.new_threshold),
  }
  return result;
}

export function getRemoveMemberProposalLeo(removeMemberProposal: RemoveMemberProposal): RemoveMemberProposalLeo {
  const result: RemoveMemberProposalLeo = {
    existing_member: js2leo.address(removeMemberProposal.existing_member),
    new_threshold: js2leo.u8(removeMemberProposal.new_threshold),
  }
  return result;
}

export function getUpdateThresholdProposalLeo(updateThresholdProposal: UpdateThresholdProposal): UpdateThresholdProposalLeo {
  const result: UpdateThresholdProposalLeo = {
    threshold: js2leo.u8(updateThresholdProposal.threshold),
  }
  return result;
}

export function getInitializeBridgeLeo(initializeBridge: InitializeBridge): InitializeBridgeLeo {
  const result: InitializeBridgeLeo = {
    bridge_threshold: js2leo.u8(initializeBridge.bridge_threshold),
    a1: js2leo.address(initializeBridge.a1),
    a2: js2leo.address(initializeBridge.a2),
    a3: js2leo.address(initializeBridge.a3),
    a4: js2leo.address(initializeBridge.a4),
    a5: js2leo.address(initializeBridge.a5),
  }
  return result;
}

export function getInitializeTokenServiceLeo(initializeTokenService: InitializeTokenService): InitializeTokenServiceLeo {
  const result: InitializeTokenServiceLeo = {
    token_service: js2leo.boolean(initializeTokenService.token_service),
  }
  return result;
}

export function getInitializeWrappedTokenLeo(initializeWrappedToken: InitializeWrappedToken): InitializeWrappedTokenLeo {
  const result: InitializeWrappedTokenLeo = {
    wrapped_token: js2leo.boolean(initializeWrappedToken.wrapped_token),
  }
  return result;
}

export function getSupportTokenLeo(supportToken: SupportToken): SupportTokenLeo {
  const result: SupportTokenLeo = {
    name: js2leo.array(supportToken.name, js2leo.u8),
    symbol: js2leo.array(supportToken.symbol, js2leo.u8),
    decimals: js2leo.u8(supportToken.decimals),
    origin_chain_id: js2leo.u32(supportToken.origin_chain_id),
    origin_contract_address: js2leo.array(supportToken.origin_contract_address, js2leo.u8),
  }
  return result;
}

export function getEnableTokenLeo(enableToken: EnableToken): EnableTokenLeo {
  const result: EnableTokenLeo = {
    token_id: js2leo.address(enableToken.token_id),
    min_amount: js2leo.u64(enableToken.min_amount),
  }
  return result;
}

export function getEnableServiceLeo(enableService: EnableService): EnableServiceLeo {
  const result: EnableServiceLeo = {
    service: js2leo.address(enableService.service),
  }
  return result;
}

export function getApproveChainBridgeLeo(approveChainBridge: ApproveChainBridge): ApproveChainBridgeLeo {
  const result: ApproveChainBridgeLeo = {
    chain_id: js2leo.u32(approveChainBridge.chain_id),
  }
  return result;
}

export function getDisapproveChainBridgeLeo(disapproveChainBridge: DisapproveChainBridge): DisapproveChainBridgeLeo {
  const result: DisapproveChainBridgeLeo = {
    chain_id: js2leo.u32(disapproveChainBridge.chain_id),
  }
  return result;
}

export function getSupportChainTSLeo(supportChainTS: SupportChainTS): SupportChainTSLeo {
  const result: SupportChainTSLeo = {
    chain_id: js2leo.u32(supportChainTS.chain_id),
    token_service: js2leo.array(supportChainTS.token_service, js2leo.u8),
  }
  return result;
}