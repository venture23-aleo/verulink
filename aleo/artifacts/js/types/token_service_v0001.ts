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

export interface OutgoingPercentageInTime {
  outgoing_percentage: number;
  timeframe: number;
  max_no_cap: bigint;
}

export const leoOutgoingPercentageInTimeSchema = z.object({
  outgoing_percentage: leoU16Schema,
  timeframe: leoU32Schema,
  max_no_cap: leoU128Schema,
});
export type OutgoingPercentageInTimeLeo = z.infer < typeof leoOutgoingPercentageInTimeSchema > ;