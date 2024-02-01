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

export interface AleoProgram {
  chain_id: bigint;
  addr: string;
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

export interface MsgTokenReceive {
  token: string;
  sender: Array < number > ;
  receiver: string;
  amount: bigint;
}

export const leoMsgTokenReceiveSchema = z.object({
  token: leoAddressSchema,
  sender: z.array(leoU8Schema).length(32),
  receiver: leoAddressSchema,
  amount: leoU128Schema,
});
export type MsgTokenReceiveLeo = z.infer < typeof leoMsgTokenReceiveSchema > ;

export interface MsgTokenSend {
  token: Array < number > ;
  sender: string;
  receiver: Array < number > ;
  amount: bigint;
}

export const leoMsgTokenSendSchema = z.object({
  token: z.array(leoU8Schema).length(32),
  sender: leoAddressSchema,
  receiver: z.array(leoU8Schema).length(32),
  amount: leoU128Schema,
});
export type MsgTokenSendLeo = z.infer < typeof leoMsgTokenSendSchema > ;

export interface InPacket {
  version: number;
  sequence: bigint;
  source: ForeignContract;
  destination: AleoProgram;
  message: MsgTokenReceive;
  height: number;
}

export const leoInPacketSchema = z.object({
  version: leoU8Schema,
  sequence: leoU64Schema,
  source: leoForeignContractSchema,
  destination: leoAleoProgramSchema,
  message: leoMsgTokenReceiveSchema,
  height: leoU32Schema,
});
export type InPacketLeo = z.infer < typeof leoInPacketSchema > ;

export interface OutPacket {
  version: number;
  sequence: bigint;
  source: AleoProgram;
  destination: ForeignContract;
  message: MsgTokenSend;
  height: number;
}

export const leoOutPacketSchema = z.object({
  version: leoU8Schema,
  sequence: leoU64Schema,
  source: leoAleoProgramSchema,
  destination: leoForeignContractSchema,
  message: leoMsgTokenSendSchema,
  height: leoU32Schema,
});
export type OutPacketLeo = z.infer < typeof leoOutPacketSchema > ;

export interface PacketId {
  chain_id: bigint;
  sequence: bigint;
}

export const leoPacketIdSchema = z.object({
  chain_id: leoU128Schema,
  sequence: leoU64Schema,
});
export type PacketIdLeo = z.infer < typeof leoPacketIdSchema > ;

export interface PacketIdWithAttestor {
  chain_id: bigint;
  sequence: bigint;
  attestor: string;
}

export const leoPacketIdWithAttestorSchema = z.object({
  chain_id: leoU128Schema,
  sequence: leoU64Schema,
  attestor: leoAddressSchema,
});
export type PacketIdWithAttestorLeo = z.infer < typeof leoPacketIdWithAttestorSchema > ;

export interface InPacketWithScreening {
  packet_hash: bigint;
  screening_passed: boolean;
}

export const leoInPacketWithScreeningSchema = z.object({
  packet_hash: leoFieldSchema,
  screening_passed: leoBooleanSchema,
});
export type InPacketWithScreeningLeo = z.infer < typeof leoInPacketWithScreeningSchema > ;