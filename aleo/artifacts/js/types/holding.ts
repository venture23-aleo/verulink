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

export interface TokenAcc {
  user: string;
  token_id: string;
}

export const leoTokenAccSchema = z.object({
  user: leoAddressSchema,
  token_id: leoAddressSchema,
});
export type TokenAccLeo = z.infer < typeof leoTokenAccSchema > ;