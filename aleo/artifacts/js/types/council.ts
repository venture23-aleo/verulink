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
  member: string;
}

export const leoAddMemberProposalSchema = z.object({
  member: leoAddressSchema,
});
export type AddMemberProposalLeo = z.infer < typeof leoAddMemberProposalSchema > ;

export interface RemoveMemberProposal {
  member: string;
}

export const leoRemoveMemberProposalSchema = z.object({
  member: leoAddressSchema,
});
export type RemoveMemberProposalLeo = z.infer < typeof leoRemoveMemberProposalSchema > ;

export interface UpdateThresholdProposal {
  threshold: number;
}

export const leoUpdateThresholdProposalSchema = z.object({
  threshold: leoU8Schema,
});
export type UpdateThresholdProposalLeo = z.infer < typeof leoUpdateThresholdProposalSchema > ;

export interface InitializeBridge {
  bridge_threshold: number;
  a1: string;
  a2: string;
  a3: string;
  a4: string;
  a5: string;
}

export const leoInitializeBridgeSchema = z.object({
  bridge_threshold: leoU8Schema,
  a1: leoAddressSchema,
  a2: leoAddressSchema,
  a3: leoAddressSchema,
  a4: leoAddressSchema,
  a5: leoAddressSchema,
});
export type InitializeBridgeLeo = z.infer < typeof leoInitializeBridgeSchema > ;

export interface InitializeTokenService {
  token_service: boolean;
}

export const leoInitializeTokenServiceSchema = z.object({
  token_service: leoBooleanSchema,
});
export type InitializeTokenServiceLeo = z.infer < typeof leoInitializeTokenServiceSchema > ;

export interface InitializeWrappedToken {
  wrapped_token: boolean;
}

export const leoInitializeWrappedTokenSchema = z.object({
  wrapped_token: leoBooleanSchema,
});
export type InitializeWrappedTokenLeo = z.infer < typeof leoInitializeWrappedTokenSchema > ;

export interface SupportToken {
  name: Array < number > ;
  symbol: Array < number > ;
  decimals: number;
  origin_chain_id: number;
  origin_contract_address: Array < number > ;
}

export const leoSupportTokenSchema = z.object({
  name: z.array(leoU8Schema).length(32),
  symbol: z.array(leoU8Schema).length(16),
  decimals: leoU8Schema,
  origin_chain_id: leoU32Schema,
  origin_contract_address: z.array(leoU8Schema).length(32),
});
export type SupportTokenLeo = z.infer < typeof leoSupportTokenSchema > ;

export interface EnableToken {
  token_id: string;
  min_amount: BigInt;
}

export const leoEnableTokenSchema = z.object({
  token_id: leoAddressSchema,
  min_amount: leoU64Schema,
});
export type EnableTokenLeo = z.infer < typeof leoEnableTokenSchema > ;

export interface EnableService {
  service: string;
}

export const leoEnableServiceSchema = z.object({
  service: leoAddressSchema,
});
export type EnableServiceLeo = z.infer < typeof leoEnableServiceSchema > ;

export interface ApproveChainBridge {
  chain_id: number;
}

export const leoApproveChainBridgeSchema = z.object({
  chain_id: leoU32Schema,
});
export type ApproveChainBridgeLeo = z.infer < typeof leoApproveChainBridgeSchema > ;

export interface DisapproveChainBridge {
  chain_id: number;
}

export const leoDisapproveChainBridgeSchema = z.object({
  chain_id: leoU32Schema,
});
export type DisapproveChainBridgeLeo = z.infer < typeof leoDisapproveChainBridgeSchema > ;

export interface SupportChainTS {
  chain_id: number;
  token_service: Array < number > ;
}

export const leoSupportChainTSSchema = z.object({
  chain_id: leoU32Schema,
  token_service: z.array(leoU8Schema).length(32),
});
export type SupportChainTSLeo = z.infer < typeof leoSupportChainTSSchema > ;