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
  LeoArray,
  LeoAddress,
  ExternalRecord,
  tx
} from "@doko-js/core";

export interface TokenMetadata {
  token_id: bigint;
  name: bigint;
  symbol: bigint;
  decimals: number;
  supply: bigint;
  max_supply: bigint;
  admin: LeoAddress;
  external_authorization_required: boolean;
  external_authorization_party: LeoAddress;
}

export const leoTokenMetadataSchema = z.object({
  token_id: leoFieldSchema,
  name: leoU128Schema,
  symbol: leoU128Schema,
  decimals: leoU8Schema,
  supply: leoU128Schema,
  max_supply: leoU128Schema,
  admin: leoAddressSchema,
  external_authorization_required: leoBooleanSchema,
  external_authorization_party: leoAddressSchema,
});
export type TokenMetadataLeo = z.infer < typeof leoTokenMetadataSchema > ;

export interface TokenOwner {
  account: LeoAddress;
  token_id: bigint;
}

export const leoTokenOwnerSchema = z.object({
  account: leoAddressSchema,
  token_id: leoFieldSchema,
});
export type TokenOwnerLeo = z.infer < typeof leoTokenOwnerSchema > ;

export interface Image {
  pre_image: bigint;
  receiver: LeoAddress;
}

export const leoImageSchema = z.object({
  pre_image: leoFieldSchema,
  receiver: leoAddressSchema,
});
export type ImageLeo = z.infer < typeof leoImageSchema > ;

export interface Holder {
  account: LeoAddress;
  token_id: bigint;
}

export const leoHolderSchema = z.object({
  account: leoAddressSchema,
  token_id: leoFieldSchema,
});
export type HolderLeo = z.infer < typeof leoHolderSchema > ;

export interface AleoProgram {
  chain_id: bigint;
  addr: LeoAddress;
}

export const leoAleoProgramSchema = z.object({
  chain_id: leoU128Schema,
  addr: leoAddressSchema,
});
export type AleoProgramLeo = z.infer < typeof leoAleoProgramSchema > ;

export interface ForeignContract {
  chain_id: bigint;
  addr: Array < number > ;
}

export const leoForeignContractSchema = z.object({
  chain_id: leoU128Schema,
  addr: z.array(leoU8Schema).length(32),
});
export type ForeignContractLeo = z.infer < typeof leoForeignContractSchema > ;

export interface OutTokenMessage {
  sender_address: LeoAddress;
  dest_token_address: Array < number > ;
  amount: bigint;
  receiver_address: Array < number > ;
}

export const leoOutTokenMessageSchema = z.object({
  sender_address: leoAddressSchema,
  dest_token_address: z.array(leoU8Schema).length(32),
  amount: leoU128Schema,
  receiver_address: z.array(leoU8Schema).length(32),
});
export type OutTokenMessageLeo = z.infer < typeof leoOutTokenMessageSchema > ;

export interface InTokenMessage {
  sender_address: Array < number > ;
  dest_token_id: bigint;
  amount: bigint;
  receiver_address: LeoAddress;
}

export const leoInTokenMessageSchema = z.object({
  sender_address: z.array(leoU8Schema).length(32),
  dest_token_id: leoFieldSchema,
  amount: leoU128Schema,
  receiver_address: leoAddressSchema,
});
export type InTokenMessageLeo = z.infer < typeof leoInTokenMessageSchema > ;

export interface WithdrawalLimit {
  percentage: number;
  duration: number;
  threshold_no_limit: bigint;
}

export const leoWithdrawalLimitSchema = z.object({
  percentage: leoU32Schema,
  duration: leoU32Schema,
  threshold_no_limit: leoU128Schema,
});
export type WithdrawalLimitLeo = z.infer < typeof leoWithdrawalLimitSchema > ;

export interface ChainToken {
  chain_id: bigint;
  token_id: bigint;
}

export const leoChainTokenSchema = z.object({
  chain_id: leoU128Schema,
  token_id: leoFieldSchema,
});
export type ChainTokenLeo = z.infer < typeof leoChainTokenSchema > ;