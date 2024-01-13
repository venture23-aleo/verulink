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

export interface UpdateGovernance {
  new_governance: string;
}

export const leoUpdateGovernanceSchema = z.object({
  new_governance: leoAddressSchema,
});
export type UpdateGovernanceLeo = z.infer < typeof leoUpdateGovernanceSchema > ;

export interface WUsdcRelease {
  receiver: string;
  amount: bigint;
}

export const leoWUsdcReleaseSchema = z.object({
  receiver: leoAddressSchema,
  amount: leoU64Schema,
});
export type WUsdcReleaseLeo = z.infer < typeof leoWUsdcReleaseSchema > ;