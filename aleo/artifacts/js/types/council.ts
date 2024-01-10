import {
  z
} from "zod";
import {
  leoAddressSchema,
  leoPrivateKeySchema,
  leoViewKeySchema,
  leoTxIdSchema,
  leoScalarSchema,
  leoFieldSchema,
  leoBooleanSchema,
  leoU8Schema,
  leoU16Schema,
  leoU32Schema,
  leoU64Schema,
  leoU128Schema,
  leoGroupSchema,
  leoRecordSchema,
  leoTxSchema,
  leoSignatureSchema,
  LeoArray
} from "./leo-types";

export interface ProposalSign {
  proposal: BigInt;
  member: string;
}

export const leoProposalSignSchema = z.object({
  proposal: leoFieldSchema,
  member: leoAddressSchema,
});
export type ProposalSignLeo = z.infer < typeof leoProposalSignSchema > ;

export interface AddMemberProposal {
  id: number;
  new_member: string;
  new_threshold: number;
}

export const leoAddMemberProposalSchema = z.object({
  id: leoU32Schema,
  new_member: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type AddMemberProposalLeo = z.infer < typeof leoAddMemberProposalSchema > ;

export interface RemoveMemberProposal {
  id: number;
  existing_member: string;
  new_threshold: number;
}

export const leoRemoveMemberProposalSchema = z.object({
  id: leoU32Schema,
  existing_member: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type RemoveMemberProposalLeo = z.infer < typeof leoRemoveMemberProposalSchema > ;

export interface UpdateThresholdProposal {
  id: number;
  new_threshold: number;
}

export const leoUpdateThresholdProposalSchema = z.object({
  id: leoU32Schema,
  new_threshold: leoU8Schema,
});
export type UpdateThresholdProposalLeo = z.infer < typeof leoUpdateThresholdProposalSchema > ;

export interface ApproveChainBridgeProposal {
  id: number;
  chain_id: BigInt;
}

export const leoApproveChainBridgeProposalSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type ApproveChainBridgeProposalLeo = z.infer < typeof leoApproveChainBridgeProposalSchema > ;

export interface EnableServiceProposal {
  id: number;
  service: string;
}

export const leoEnableServiceProposalSchema = z.object({
  id: leoU32Schema,
  service: leoAddressSchema,
});
export type EnableServiceProposalLeo = z.infer < typeof leoEnableServiceProposalSchema > ;

export interface DisapproveChainBridge {
  id: number;
  chain_id: BigInt;
}

export const leoDisapproveChainBridgeSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type DisapproveChainBridgeLeo = z.infer < typeof leoDisapproveChainBridgeSchema > ;

export interface SupportChainTS {
  id: number;
  chain_id: BigInt;
  token_service: Array < number > ;
}

export const leoSupportChainTSSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
  token_service: z.array(leoU8Schema).length(32),
});
export type SupportChainTSLeo = z.infer < typeof leoSupportChainTSSchema > ;

export interface SupportToken {
  id: number;
  name: Array < number > ;
  symbol: Array < number > ;
  decimals: number;
  origin_chain_id: BigInt;
  origin_contract_address: Array < number > ;
}

export const leoSupportTokenSchema = z.object({
  id: leoU32Schema,
  name: z.array(leoU8Schema).length(32),
  symbol: z.array(leoU8Schema).length(16),
  decimals: leoU8Schema,
  origin_chain_id: leoU128Schema,
  origin_contract_address: z.array(leoU8Schema).length(32),
});
export type SupportTokenLeo = z.infer < typeof leoSupportTokenSchema > ;

export interface EnableToken {
  id: number;
  token_id: string;
  minimum_transfer: BigInt;
  outgoing_percentage: number;
  time: number;
}

export const leoEnableTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  minimum_transfer: leoU64Schema,
  outgoing_percentage: leoU16Schema,
  time: leoU32Schema,
});
export type EnableTokenLeo = z.infer < typeof leoEnableTokenSchema > ;