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

export interface Token {
  owner: LeoAddress;
  amount: bigint;
  token_id: bigint;
  external_authorization_required: boolean;
  authorized_until: number;
  _nonce: bigint;
}

export const leoTokenSchema = z.object({
  owner: leoAddressSchema,
  amount: leoU128Schema,
  token_id: leoFieldSchema,
  external_authorization_required: leoBooleanSchema,
  authorized_until: leoU32Schema,
  _nonce: leoGroupSchema,
});
export type TokenLeo = z.infer < typeof leoTokenSchema > ;

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

export interface Balance {
  token_id: bigint;
  account: LeoAddress;
  balance: bigint;
  authorized_until: number;
}

export const leoBalanceSchema = z.object({
  token_id: leoFieldSchema,
  account: leoAddressSchema,
  balance: leoU128Schema,
  authorized_until: leoU32Schema,
});
export type BalanceLeo = z.infer < typeof leoBalanceSchema > ;

export interface Allowance {
  account: LeoAddress;
  spender: LeoAddress;
  token_id: bigint;
}

export const leoAllowanceSchema = z.object({
  account: leoAddressSchema,
  spender: leoAddressSchema,
  token_id: leoFieldSchema,
});
export type AllowanceLeo = z.infer < typeof leoAllowanceSchema > ;