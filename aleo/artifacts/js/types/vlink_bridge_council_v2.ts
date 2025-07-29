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

export interface TbTransferOwnership {
  id: number;
  new_owner: LeoAddress;
}

export const leoTbTransferOwnershipSchema = z.object({
  id: leoU32Schema,
  new_owner: leoAddressSchema,
});
export type TbTransferOwnershipLeo = z.infer < typeof leoTbTransferOwnershipSchema > ;

export interface TbAddAttestor {
  id: number;
  new_attestor: LeoAddress;
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
  existing_attestor: LeoAddress;
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

export interface TbAddChain {
  id: number;
  chain_id: bigint;
}

export const leoTbAddChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type TbAddChainLeo = z.infer < typeof leoTbAddChainSchema > ;

export interface TbRemoveChain {
  id: number;
  chain_id: bigint;
}

export const leoTbRemoveChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type TbRemoveChainLeo = z.infer < typeof leoTbRemoveChainSchema > ;

export interface TbAddService {
  id: number;
  service: LeoAddress;
}

export const leoTbAddServiceSchema = z.object({
  id: leoU32Schema,
  service: leoAddressSchema,
});
export type TbAddServiceLeo = z.infer < typeof leoTbAddServiceSchema > ;

export interface TbRemoveService {
  id: number;
  service: LeoAddress;
}

export const leoTbRemoveServiceSchema = z.object({
  id: leoU32Schema,
  service: leoAddressSchema,
});
export type TbRemoveServiceLeo = z.infer < typeof leoTbRemoveServiceSchema > ;

export interface TbPause {
  id: number;
}

export const leoTbPauseSchema = z.object({
  id: leoU32Schema,
});
export type TbPauseLeo = z.infer < typeof leoTbPauseSchema > ;

export interface TbUnpause {
  id: number;
}

export const leoTbUnpauseSchema = z.object({
  id: leoU32Schema,
});
export type TbUnpauseLeo = z.infer < typeof leoTbUnpauseSchema > ;