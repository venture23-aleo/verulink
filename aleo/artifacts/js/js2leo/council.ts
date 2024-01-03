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
    id: js2leo.u32(addMemberProposal.id),
    new_member: js2leo.address(addMemberProposal.new_member),
    new_threshold: js2leo.u8(addMemberProposal.new_threshold),
  }
  return result;
}

export function getRemoveMemberProposalLeo(removeMemberProposal: RemoveMemberProposal): RemoveMemberProposalLeo {
  const result: RemoveMemberProposalLeo = {
    id: js2leo.u32(removeMemberProposal.id),
    existing_member: js2leo.address(removeMemberProposal.existing_member),
    new_threshold: js2leo.u8(removeMemberProposal.new_threshold),
  }
  return result;
}

export function getUpdateThresholdProposalLeo(updateThresholdProposal: UpdateThresholdProposal): UpdateThresholdProposalLeo {
  const result: UpdateThresholdProposalLeo = {
    id: js2leo.u32(updateThresholdProposal.id),
    new_threshold: js2leo.u8(updateThresholdProposal.new_threshold),
  }
  return result;
}

export function getApproveChainBridgeProposalLeo(approveChainBridgeProposal: ApproveChainBridgeProposal): ApproveChainBridgeProposalLeo {
  const result: ApproveChainBridgeProposalLeo = {
    id: js2leo.u32(approveChainBridgeProposal.id),
    chain_id: js2leo.u32(approveChainBridgeProposal.chain_id),
  }
  return result;
}

export function getEnableServiceProposalLeo(enableServiceProposal: EnableServiceProposal): EnableServiceProposalLeo {
  const result: EnableServiceProposalLeo = {
    id: js2leo.u32(enableServiceProposal.id),
    service: js2leo.address(enableServiceProposal.service),
  }
  return result;
}

export function getDisapproveChainBridgeLeo(disapproveChainBridge: DisapproveChainBridge): DisapproveChainBridgeLeo {
  const result: DisapproveChainBridgeLeo = {
    id: js2leo.u32(disapproveChainBridge.id),
    chain_id: js2leo.u32(disapproveChainBridge.chain_id),
  }
  return result;
}

export function getSupportChainTSLeo(supportChainTS: SupportChainTS): SupportChainTSLeo {
  const result: SupportChainTSLeo = {
    id: js2leo.u32(supportChainTS.id),
    chain_id: js2leo.u32(supportChainTS.chain_id),
    token_service: js2leo.array(supportChainTS.token_service, js2leo.u8),
  }
  return result;
}

export function getSupportTokenLeo(supportToken: SupportToken): SupportTokenLeo {
  const result: SupportTokenLeo = {
    id: js2leo.u32(supportToken.id),
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
    id: js2leo.u32(enableToken.id),
    token_id: js2leo.address(enableToken.token_id),
    min_amount: js2leo.u64(enableToken.min_amount),
  }
  return result;
}