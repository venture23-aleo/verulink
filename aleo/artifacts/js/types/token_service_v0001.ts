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

export interface WithdrawalLimit {
  percentage: number;
  duration: number;
  threshold_no_limit: bigint;
}

export const leoWithdrawalLimitSchema = z.object({
  percentage: leoU16Schema,
  duration: leoU32Schema,
  threshold_no_limit: leoU128Schema,
});
export type WithdrawalLimitLeo = z.infer < typeof leoWithdrawalLimitSchema > ;