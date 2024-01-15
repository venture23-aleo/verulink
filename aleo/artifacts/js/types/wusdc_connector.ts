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

export interface UpdateConnector {
  new_connector: string;
}

export const leoUpdateConnectorSchema = z.object({
  new_connector: leoAddressSchema,
});
export type UpdateConnectorLeo = z.infer < typeof leoUpdateConnectorSchema > ;

export interface WUsdcRelease {
  receiver: string;
  amount: bigint;
}

export const leoWUsdcReleaseSchema = z.object({
  receiver: leoAddressSchema,
  amount: leoU64Schema,
});
export type WUsdcReleaseLeo = z.infer < typeof leoWUsdcReleaseSchema > ;