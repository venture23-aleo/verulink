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

import * as leo2js from "./common";
export function getProposalSign(proposalSign: ProposalSignLeo): ProposalSign {
  const result: ProposalSign = {
    proposal: leo2js.field(proposalSign.proposal),
    member: leo2js.address(proposalSign.member),
  }
  return result;
}

export function getAddMemberProposal(addMemberProposal: AddMemberProposalLeo): AddMemberProposal {
  const result: AddMemberProposal = {
    new_member: leo2js.address(addMemberProposal.new_member),
    new_threshold: leo2js.u8(addMemberProposal.new_threshold),
  }
  return result;
}

export function getRemoveMemberProposal(removeMemberProposal: RemoveMemberProposalLeo): RemoveMemberProposal {
  const result: RemoveMemberProposal = {
    existing_member: leo2js.address(removeMemberProposal.existing_member),
    new_threshold: leo2js.u8(removeMemberProposal.new_threshold),
  }
  return result;
}

export function getUpdateThresholdProposal(updateThresholdProposal: UpdateThresholdProposalLeo): UpdateThresholdProposal {
  const result: UpdateThresholdProposal = {
    threshold: leo2js.u8(updateThresholdProposal.threshold),
  }
  return result;
}

export function getInitializeBridge(initializeBridge: InitializeBridgeLeo): InitializeBridge {
  const result: InitializeBridge = {
    bridge_threshold: leo2js.u8(initializeBridge.bridge_threshold),
    a1: leo2js.address(initializeBridge.a1),
    a2: leo2js.address(initializeBridge.a2),
    a3: leo2js.address(initializeBridge.a3),
    a4: leo2js.address(initializeBridge.a4),
    a5: leo2js.address(initializeBridge.a5),
  }
  return result;
}

export function getInitializeTokenService(initializeTokenService: InitializeTokenServiceLeo): InitializeTokenService {
  const result: InitializeTokenService = {
    token_service: leo2js.boolean(initializeTokenService.token_service),
  }
  return result;
}

export function getInitializeWrappedToken(initializeWrappedToken: InitializeWrappedTokenLeo): InitializeWrappedToken {
  const result: InitializeWrappedToken = {
    wrapped_token: leo2js.boolean(initializeWrappedToken.wrapped_token),
  }
  return result;
}

export function getSupportToken(supportToken: SupportTokenLeo): SupportToken {
  const result: SupportToken = {
    name: leo2js.array(supportToken.name, leo2js.u8),
    symbol: leo2js.array(supportToken.symbol, leo2js.u8),
    decimals: leo2js.u8(supportToken.decimals),
    origin_chain_id: leo2js.u32(supportToken.origin_chain_id),
    origin_contract_address: leo2js.array(supportToken.origin_contract_address, leo2js.u8),
  }
  return result;
}

export function getEnableToken(enableToken: EnableTokenLeo): EnableToken {
  const result: EnableToken = {
    token_id: leo2js.address(enableToken.token_id),
    min_amount: leo2js.u64(enableToken.min_amount),
  }
  return result;
}

export function getEnableService(enableService: EnableServiceLeo): EnableService {
  const result: EnableService = {
    service: leo2js.address(enableService.service),
  }
  return result;
}

export function getApproveChainBridge(approveChainBridge: ApproveChainBridgeLeo): ApproveChainBridge {
  const result: ApproveChainBridge = {
    chain_id: leo2js.u32(approveChainBridge.chain_id),
  }
  return result;
}

export function getDisapproveChainBridge(disapproveChainBridge: DisapproveChainBridgeLeo): DisapproveChainBridge {
  const result: DisapproveChainBridge = {
    chain_id: leo2js.u32(disapproveChainBridge.chain_id),
  }
  return result;
}

export function getSupportChainTS(supportChainTS: SupportChainTSLeo): SupportChainTS {
  const result: SupportChainTS = {
    chain_id: leo2js.u32(supportChainTS.chain_id),
    token_service: leo2js.array(supportChainTS.token_service, leo2js.u8),
  }
  return result;
}