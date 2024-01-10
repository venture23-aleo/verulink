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

export interface AleoProgram {
  chain_id: BigInt;
  addr: string;
}

export const leoAleoProgramSchema = z.object({
  chain_id: leoU128Schema,
  addr: leoAddressSchema,
});
export type AleoProgramLeo = z.infer < typeof leoAleoProgramSchema > ;

export interface ForeignContract {
  chain_id: BigInt;
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
  amount: BigInt;
}

export const leoMsgTokenReceiveSchema = z.object({
  token: leoAddressSchema,
  sender: z.array(leoU8Schema).length(32),
  receiver: leoAddressSchema,
  amount: leoU64Schema,
});
export type MsgTokenReceiveLeo = z.infer < typeof leoMsgTokenReceiveSchema > ;

export interface MsgTokenSend {
  token: Array < number > ;
  sender: string;
  receiver: Array < number > ;
  amount: BigInt;
}

export const leoMsgTokenSendSchema = z.object({
  token: z.array(leoU8Schema).length(32),
  sender: leoAddressSchema,
  receiver: z.array(leoU8Schema).length(32),
  amount: leoU64Schema,
});
export type MsgTokenSendLeo = z.infer < typeof leoMsgTokenSendSchema > ;

export interface InPacketFull {
  version: number;
  sequence: number;
  source: ForeignContract;
  destination: AleoProgram;
  message: MsgTokenReceive;
  height: number;
}

export const leoInPacketFullSchema = z.object({
  version: leoU8Schema,
  sequence: leoU32Schema,
  source: leoForeignContractSchema,
  destination: leoAleoProgramSchema,
  message: leoMsgTokenReceiveSchema,
  height: leoU32Schema,
});
export type InPacketFullLeo = z.infer < typeof leoInPacketFullSchema > ;

export interface InPacket {
  version: number;
  sequence: number;
  source: ForeignContract;
  destination: AleoProgram;
  msg_hash: BigInt;
  height: number;
}

export const leoInPacketSchema = z.object({
  version: leoU8Schema,
  sequence: leoU32Schema,
  source: leoForeignContractSchema,
  destination: leoAleoProgramSchema,
  msg_hash: leoFieldSchema,
  height: leoU32Schema,
});
export type InPacketLeo = z.infer < typeof leoInPacketSchema > ;

export interface OutPacket {
  version: number;
  sequence: number;
  source: AleoProgram;
  destination: ForeignContract;
  message: MsgTokenSend;
  height: number;
}

export const leoOutPacketSchema = z.object({
  version: leoU8Schema,
  sequence: leoU32Schema,
  source: leoAleoProgramSchema,
  destination: leoForeignContractSchema,
  message: leoMsgTokenSendSchema,
  height: leoU32Schema,
});
export type OutPacketLeo = z.infer < typeof leoOutPacketSchema > ;

export interface PacketId {
  chain_id: BigInt;
  sequence: number;
}

export const leoPacketIdSchema = z.object({
  chain_id: leoU128Schema,
  sequence: leoU32Schema,
});
export type PacketIdLeo = z.infer < typeof leoPacketIdSchema > ;

export interface InPacketFullAttestorKey {
  packet_hash: BigInt;
  attestor: string;
}

export const leoInPacketFullAttestorKeySchema = z.object({
  packet_hash: leoFieldSchema,
  attestor: leoAddressSchema,
});
export type InPacketFullAttestorKeyLeo = z.infer < typeof leoInPacketFullAttestorKeySchema > ;

export interface InPacketFullScreeningKey {
  packet_hash: BigInt;
  screening_passed: boolean;
}

export const leoInPacketFullScreeningKeySchema = z.object({
  packet_hash: leoFieldSchema,
  screening_passed: leoBooleanSchema,
});
export type InPacketFullScreeningKeyLeo = z.infer < typeof leoInPacketFullScreeningKeySchema > ;