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

export interface wrapped_token {
  owner: string;
  token_id: string;
  amount: BigInt;
  _nonce: BigInt;
}

export const leoWrapped_tokenSchema = z.object({
  owner: leoAddressSchema,
  token_id: leoAddressSchema,
  amount: leoU64Schema,
  _nonce: leoGroupSchema,
});
export type wrapped_tokenLeo = z.infer < typeof leoWrapped_tokenSchema > ;

export interface WTForeignContract {
  chain_id: BigInt;
  contract_address: Array < number > ;
}

export const leoWTForeignContractSchema = z.object({
  chain_id: leoU128Schema,
  contract_address: z.array(leoU8Schema).length(32),
});
export type WTForeignContractLeo = z.infer < typeof leoWTForeignContractSchema > ;

export interface TokenInfo {
  name: Array < number > ;
  symbol: Array < number > ;
  decimals: number;
}

export const leoTokenInfoSchema = z.object({
  name: z.array(leoU8Schema).length(32),
  symbol: z.array(leoU8Schema).length(16),
  decimals: leoU8Schema,
});
export type TokenInfoLeo = z.infer < typeof leoTokenInfoSchema > ;

export interface WrappedTokenInfo {
  token_info: TokenInfo;
  origin: WTForeignContract;
}

export const leoWrappedTokenInfoSchema = z.object({
  token_info: leoTokenInfoSchema,
  origin: leoWTForeignContractSchema,
});
export type WrappedTokenInfoLeo = z.infer < typeof leoWrappedTokenInfoSchema > ;

export interface TokenAccount {
  user: string;
  token_id: string;
}

export const leoTokenAccountSchema = z.object({
  user: leoAddressSchema,
  token_id: leoAddressSchema,
});
export type TokenAccountLeo = z.infer < typeof leoTokenAccountSchema > ;