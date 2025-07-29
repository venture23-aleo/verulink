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

export interface AleoProgram {
  chain_id: bigint;
  addr: LeoAddress;
}

export const leoAleoProgramSchema = z.object({
  chain_id: leoU128Schema,
  addr: leoAddressSchema,
});
export type AleoProgramLeo = z.infer < typeof leoAleoProgramSchema > ;

export interface ForeignContract {
  chain_id: bigint;
  addr: Array < number > ;
}

export const leoForeignContractSchema = z.object({
  chain_id: leoU128Schema,
  addr: z.array(leoU8Schema).length(32),
});
export type ForeignContractLeo = z.infer < typeof leoForeignContractSchema > ;

export interface OutTokenMessage {
  sender_address: LeoAddress;
  dest_token_address: Array < number > ;
  amount: bigint;
  receiver_address: Array < number > ;
}

export const leoOutTokenMessageSchema = z.object({
  sender_address: leoAddressSchema,
  dest_token_address: z.array(leoU8Schema).length(32),
  amount: leoU128Schema,
  receiver_address: z.array(leoU8Schema).length(32),
});
export type OutTokenMessageLeo = z.infer < typeof leoOutTokenMessageSchema > ;

export interface InTokenMessage {
  sender_address: Array < number > ;
  dest_token_id: bigint;
  amount: bigint;
  receiver_address: LeoAddress;
}

export const leoInTokenMessageSchema = z.object({
  sender_address: z.array(leoU8Schema).length(32),
  dest_token_id: leoFieldSchema,
  amount: leoU128Schema,
  receiver_address: leoAddressSchema,
});
export type InTokenMessageLeo = z.infer < typeof leoInTokenMessageSchema > ;

export interface OutPacket {
  version: number;
  sequence: bigint;
  source: AleoProgram;
  destination: ForeignContract;
  message: OutTokenMessage;
  height: bigint;
}

export const leoOutPacketSchema = z.object({
  version: leoU8Schema,
  sequence: leoU64Schema,
  source: leoAleoProgramSchema,
  destination: leoForeignContractSchema,
  message: leoOutTokenMessageSchema,
  height: leoU64Schema,
});
export type OutPacketLeo = z.infer < typeof leoOutPacketSchema > ;

export interface InPacket {
  version: number;
  sequence: bigint;
  source: ForeignContract;
  destination: AleoProgram;
  message: InTokenMessage;
  height: bigint;
}

export const leoInPacketSchema = z.object({
  version: leoU8Schema,
  sequence: leoU64Schema,
  source: leoForeignContractSchema,
  destination: leoAleoProgramSchema,
  message: leoInTokenMessageSchema,
  height: leoU64Schema,
});
export type InPacketLeo = z.infer < typeof leoInPacketSchema > ;

export interface PacketId {
  chain_id: bigint;
  sequence: bigint;
}

export const leoPacketIdSchema = z.object({
  chain_id: leoU128Schema,
  sequence: leoU64Schema,
});
export type PacketIdLeo = z.infer < typeof leoPacketIdSchema > ;

export interface InPacketWithScreening {
  packet_hash: bigint;
  screening_passed: boolean;
}

export const leoInPacketWithScreeningSchema = z.object({
  packet_hash: leoFieldSchema,
  screening_passed: leoBooleanSchema,
});
export type InPacketWithScreeningLeo = z.infer < typeof leoInPacketWithScreeningSchema > ;