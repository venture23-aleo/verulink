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
} from "@aleojs/core";

export interface token {
  owner: string;
  amount: bigint;
  _nonce: bigint;
}

export const leoTokenSchema = z.object({
  owner: leoAddressSchema,
  amount: leoU128Schema,
  _nonce: leoGroupSchema,
});
export type tokenLeo = z.infer < typeof leoTokenSchema > ;

export interface Approval {
  approver: string;
  spender: string;
}

export const leoApprovalSchema = z.object({
  approver: leoAddressSchema,
  spender: leoAddressSchema,
});
export type ApprovalLeo = z.infer < typeof leoApprovalSchema > ;

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