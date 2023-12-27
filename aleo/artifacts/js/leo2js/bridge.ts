import {
  AleoProgram,
  AleoProgramLeo,
  ForeignContract,
  ForeignContractLeo,
  MsgTokenReceive,
  MsgTokenReceiveLeo,
  MsgTokenSend,
  MsgTokenSendLeo,
  InPacketFull,
  InPacketFullLeo,
  InPacket,
  InPacketLeo,
  OutPacket,
  OutPacketLeo,
  PacketId,
  PacketIdLeo,
  InPacketFullAttestorKey,
  InPacketFullAttestorKeyLeo,
} from "../types";

import * as leo2js from "./common";
export function getAleoProgram(aleoProgram: AleoProgramLeo): AleoProgram {
  const result: AleoProgram = {
    chain_id: leo2js.u32(aleoProgram.chain_id),
    addr: leo2js.address(aleoProgram.addr),
  }
  return result;
}

export function getForeignContract(foreignContract: ForeignContractLeo): ForeignContract {
  const result: ForeignContract = {
    chain_id: leo2js.u32(foreignContract.chain_id),
    addr: leo2js.array(foreignContract.addr, leo2js.u8),
  }
  return result;
}

export function getMsgTokenReceive(msgTokenReceive: MsgTokenReceiveLeo): MsgTokenReceive {
  const result: MsgTokenReceive = {
    token: leo2js.address(msgTokenReceive.token),
    sender: leo2js.array(msgTokenReceive.sender, leo2js.u8),
    receiver: leo2js.address(msgTokenReceive.receiver),
    amount: leo2js.u64(msgTokenReceive.amount),
  }
  return result;
}

export function getMsgTokenSend(msgTokenSend: MsgTokenSendLeo): MsgTokenSend {
  const result: MsgTokenSend = {
    token: leo2js.array(msgTokenSend.token, leo2js.u8),
    sender: leo2js.address(msgTokenSend.sender),
    receiver: leo2js.array(msgTokenSend.receiver, leo2js.u8),
    amount: leo2js.u64(msgTokenSend.amount),
  }
  return result;
}

export function getInPacketFull(inPacketFull: InPacketFullLeo): InPacketFull {
  const result: InPacketFull = {
    version: leo2js.u8(inPacketFull.version),
    sequence: leo2js.u32(inPacketFull.sequence),
    source: getForeignContract(inPacketFull.source),
    destination: getAleoProgram(inPacketFull.destination),
    message: getMsgTokenReceive(inPacketFull.message),
    height: leo2js.u32(inPacketFull.height),
  }
  return result;
}

export function getInPacket(inPacket: InPacketLeo): InPacket {
  const result: InPacket = {
    version: leo2js.u8(inPacket.version),
    sequence: leo2js.u32(inPacket.sequence),
    source: getForeignContract(inPacket.source),
    destination: getAleoProgram(inPacket.destination),
    msg_hash: leo2js.field(inPacket.msg_hash),
    height: leo2js.u32(inPacket.height),
  }
  return result;
}

export function getOutPacket(outPacket: OutPacketLeo): OutPacket {
  const result: OutPacket = {
    version: leo2js.u8(outPacket.version),
    sequence: leo2js.u32(outPacket.sequence),
    source: getAleoProgram(outPacket.source),
    destination: getForeignContract(outPacket.destination),
    message: getMsgTokenSend(outPacket.message),
    height: leo2js.u32(outPacket.height),
  }
  return result;
}

export function getPacketId(packetId: PacketIdLeo): PacketId {
  const result: PacketId = {
    chain_id: leo2js.u32(packetId.chain_id),
    sequence: leo2js.u32(packetId.sequence),
  }
  return result;
}

export function getInPacketFullAttestorKey(inPacketFullAttestorKey: InPacketFullAttestorKeyLeo): InPacketFullAttestorKey {
  const result: InPacketFullAttestorKey = {
    packet_hash: leo2js.field(inPacketFullAttestorKey.packet_hash),
    attestor: leo2js.address(inPacketFullAttestorKey.attestor),
  }
  return result;
}