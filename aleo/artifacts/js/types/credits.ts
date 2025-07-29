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

export interface committee_state {
  is_open: boolean;
  commission: number;
}

export const leoCommittee_stateSchema = z.object({
  is_open: leoBooleanSchema,
  commission: leoU8Schema,
});
export type committee_stateLeo = z.infer < typeof leoCommittee_stateSchema > ;

export interface bond_state {
  validator: LeoAddress;
  microcredits: bigint;
}

export const leoBond_stateSchema = z.object({
  validator: leoAddressSchema,
  microcredits: leoU64Schema,
});
export type bond_stateLeo = z.infer < typeof leoBond_stateSchema > ;

export interface unbond_state {
  microcredits: bigint;
  height: number;
}

export const leoUnbond_stateSchema = z.object({
  microcredits: leoU64Schema,
  height: leoU32Schema,
});
export type unbond_stateLeo = z.infer < typeof leoUnbond_stateSchema > ;

export interface credits {
  owner: LeoAddress;
  microcredits: bigint;
  _nonce: bigint;
}

export const leoCreditsSchema = z.object({
  owner: leoAddressSchema,
  microcredits: leoU64Schema,
  _nonce: leoGroupSchema,
});
export type creditsLeo = z.infer < typeof leoCreditsSchema > ;