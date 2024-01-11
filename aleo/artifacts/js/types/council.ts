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

export interface AddMember {
  id: number;
  new_member: string;
  new_threshold: number;
}

export const leoAddMemberSchema = z.object({
  id: leoU32Schema,
  new_member: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type AddMemberLeo = z.infer < typeof leoAddMemberSchema > ;

export interface RemoveMember {
  id: number;
  existing_member: string;
  new_threshold: number;
}

export const leoRemoveMemberSchema = z.object({
  id: leoU32Schema,
  existing_member: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type RemoveMemberLeo = z.infer < typeof leoRemoveMemberSchema > ;

export interface UpdateThreshold {
  id: number;
  new_threshold: number;
}

export const leoUpdateThresholdSchema = z.object({
  id: leoU32Schema,
  new_threshold: leoU8Schema,
});
export type UpdateThresholdLeo = z.infer < typeof leoUpdateThresholdSchema > ;

export interface TbUpdateGovernance {
  id: number;
  new_governance: string;
}

export const leoTbUpdateGovernanceSchema = z.object({
  id: leoU32Schema,
  new_governance: leoAddressSchema,
});
export type TbUpdateGovernanceLeo = z.infer < typeof leoTbUpdateGovernanceSchema > ;

export interface TbAddAttestor {
  id: number;
  new_attestor: string;
  new_threshold: number;
}

export const leoTbAddAttestorSchema = z.object({
  id: leoU32Schema,
  new_attestor: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type TbAddAttestorLeo = z.infer < typeof leoTbAddAttestorSchema > ;

export interface TbRemoveAttestor {
  id: number;
  existing_attestor: string;
  new_threshold: number;
}

export const leoTbRemoveAttestorSchema = z.object({
  id: leoU32Schema,
  existing_attestor: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type TbRemoveAttestorLeo = z.infer < typeof leoTbRemoveAttestorSchema > ;

export interface TbUpdateThreshold {
  id: number;
  new_threshold: number;
}

export const leoTbUpdateThresholdSchema = z.object({
  id: leoU32Schema,
  new_threshold: leoU8Schema,
});
export type TbUpdateThresholdLeo = z.infer < typeof leoTbUpdateThresholdSchema > ;

export interface TbEnableChain {
  id: number;
  chain_id: BigInt;
}

export const leoTbEnableChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type TbEnableChainLeo = z.infer < typeof leoTbEnableChainSchema > ;

export interface TbDisableChain {
  id: number;
  chain_id: BigInt;
}

export const leoTbDisableChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type TbDisableChainLeo = z.infer < typeof leoTbDisableChainSchema > ;

export interface TbEnableService {
  id: number;
  service: string;
}

export const leoTbEnableServiceSchema = z.object({
  id: leoU32Schema,
  service: leoAddressSchema,
});
export type TbEnableServiceLeo = z.infer < typeof leoTbEnableServiceSchema > ;

export interface TbDisableService {
  id: number;
  service: string;
}

export const leoTbDisableServiceSchema = z.object({
  id: leoU32Schema,
  service: leoAddressSchema,
});
export type TbDisableServiceLeo = z.infer < typeof leoTbDisableServiceSchema > ;

export interface WtUpdateGovernance {
  id: number;
  new_governance: string;
}

export const leoWtUpdateGovernanceSchema = z.object({
  id: leoU32Schema,
  new_governance: leoAddressSchema,
});
export type WtUpdateGovernanceLeo = z.infer < typeof leoWtUpdateGovernanceSchema > ;

export interface WtAddToken {
  id: number;
  name: Array < number > ;
  symbol: Array < number > ;
  decimals: number;
  origin_chain_id: BigInt;
  origin_contract_address: Array < number > ;
}

export const leoWtAddTokenSchema = z.object({
  id: leoU32Schema,
  name: z.array(leoU8Schema).length(32),
  symbol: z.array(leoU8Schema).length(16),
  decimals: leoU8Schema,
  origin_chain_id: leoU128Schema,
  origin_contract_address: z.array(leoU8Schema).length(32),
});
export type WtAddTokenLeo = z.infer < typeof leoWtAddTokenSchema > ;

export interface TsSupportChain {
  id: number;
  chain_id: BigInt;
  token_service: Array < number > ;
}

export const leoTsSupportChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
  token_service: z.array(leoU8Schema).length(32),
});
export type TsSupportChainLeo = z.infer < typeof leoTsSupportChainSchema > ;

export interface TsRemoveChain {
  id: number;
  chain_id: BigInt;
}

export const leoTsRemoveChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type TsRemoveChainLeo = z.infer < typeof leoTsRemoveChainSchema > ;

export interface TsSupportToken {
  id: number;
  token_id: string;
  minimum_transfer: BigInt;
  outgoing_percentage: number;
  time: number;
}

export const leoTsSupportTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  minimum_transfer: leoU64Schema,
  outgoing_percentage: leoU16Schema,
  time: leoU32Schema,
});
export type TsSupportTokenLeo = z.infer < typeof leoTsSupportTokenSchema > ;

export interface TsRemoveToken {
  id: number;
  token_id: string;
}

export const leoTsRemoveTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
});
export type TsRemoveTokenLeo = z.infer < typeof leoTsRemoveTokenSchema > ;

export interface TsUpdateMinimumTransfer {
  id: number;
  token_id: string;
  minimum_transfer: BigInt;
}

export const leoTsUpdateMinimumTransferSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  minimum_transfer: leoU64Schema,
});
export type TsUpdateMinimumTransferLeo = z.infer < typeof leoTsUpdateMinimumTransferSchema > ;

export interface TsUpdateOutgoingPercentage {
  id: number;
  token_id: string;
  outgoing_percentage: number;
  timeframe: number;
}

export const leoTsUpdateOutgoingPercentageSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  outgoing_percentage: leoU16Schema,
  timeframe: leoU32Schema,
});
export type TsUpdateOutgoingPercentageLeo = z.infer < typeof leoTsUpdateOutgoingPercentageSchema > ;