import {
  ProposalSign,
  ProposalSignLeo,
  AddMemberProposal,
  AddMemberProposalLeo,
  RemoveMemberProposal,
  RemoveMemberProposalLeo,
  UpdateThresholdProposal,
  UpdateThresholdProposalLeo,
  ApproveChainBridgeProposal,
  ApproveChainBridgeProposalLeo,
  EnableServiceProposal,
  EnableServiceProposalLeo,
  DisapproveChainBridge,
  DisapproveChainBridgeLeo,
  SupportChainTS,
  SupportChainTSLeo,
  SupportToken,
  SupportTokenLeo,
  EnableToken,
  EnableTokenLeo,
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
    id: leo2js.u32(addMemberProposal.id),
    new_member: leo2js.address(addMemberProposal.new_member),
    new_threshold: leo2js.u8(addMemberProposal.new_threshold),
  }
  return result;
}

export function getRemoveMemberProposal(removeMemberProposal: RemoveMemberProposalLeo): RemoveMemberProposal {
  const result: RemoveMemberProposal = {
    id: leo2js.u32(removeMemberProposal.id),
    existing_member: leo2js.address(removeMemberProposal.existing_member),
    new_threshold: leo2js.u8(removeMemberProposal.new_threshold),
  }
  return result;
}

export function getUpdateThresholdProposal(updateThresholdProposal: UpdateThresholdProposalLeo): UpdateThresholdProposal {
  const result: UpdateThresholdProposal = {
    id: leo2js.u32(updateThresholdProposal.id),
    new_threshold: leo2js.u8(updateThresholdProposal.new_threshold),
  }
  return result;
}

export function getApproveChainBridgeProposal(approveChainBridgeProposal: ApproveChainBridgeProposalLeo): ApproveChainBridgeProposal {
  const result: ApproveChainBridgeProposal = {
    id: leo2js.u32(approveChainBridgeProposal.id),
    chain_id: leo2js.u32(approveChainBridgeProposal.chain_id),
  }
  return result;
}

export function getEnableServiceProposal(enableServiceProposal: EnableServiceProposalLeo): EnableServiceProposal {
  const result: EnableServiceProposal = {
    id: leo2js.u32(enableServiceProposal.id),
    service: leo2js.address(enableServiceProposal.service),
  }
  return result;
}

export function getDisapproveChainBridge(disapproveChainBridge: DisapproveChainBridgeLeo): DisapproveChainBridge {
  const result: DisapproveChainBridge = {
    id: leo2js.u32(disapproveChainBridge.id),
    chain_id: leo2js.u32(disapproveChainBridge.chain_id),
  }
  return result;
}

export function getSupportChainTS(supportChainTS: SupportChainTSLeo): SupportChainTS {
  const result: SupportChainTS = {
    id: leo2js.u32(supportChainTS.id),
    chain_id: leo2js.u32(supportChainTS.chain_id),
    token_service: leo2js.array(supportChainTS.token_service, leo2js.u8),
  }
  return result;
}

export function getSupportToken(supportToken: SupportTokenLeo): SupportToken {
  const result: SupportToken = {
    id: leo2js.u32(supportToken.id),
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
    id: leo2js.u32(enableToken.id),
    token_id: leo2js.address(enableToken.token_id),
    minimum_transfer: leo2js.u64(enableToken.minimum_transfer),
    outgoing_percentage: leo2js.u16(enableToken.outgoing_percentage),
    time: leo2js.u32(enableToken.time),
  }
  return result;
}