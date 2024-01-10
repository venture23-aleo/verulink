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

export interface TSForeignContract {
  chain_id: BigInt;
  contract_address: Array < number > ;
}

export const leoTSForeignContractSchema = z.object({
  chain_id: leoU128Schema,
  contract_address: z.array(leoU8Schema).length(32),
});
export type TSForeignContractLeo = z.infer < typeof leoTSForeignContractSchema > ;

export interface TokenOrigin {
  chain_id: BigInt;
  token_service_address: Array < number > ;
  token_address: Array < number > ;
}

export const leoTokenOriginSchema = z.object({
  chain_id: leoU128Schema,
  token_service_address: z.array(leoU8Schema).length(32),
  token_address: z.array(leoU8Schema).length(32),
});
export type TokenOriginLeo = z.infer < typeof leoTokenOriginSchema > ;