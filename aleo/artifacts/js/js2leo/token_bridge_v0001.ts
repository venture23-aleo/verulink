import {
  AleoProgram,
  AleoProgramLeo,
  ForeignContract,
  ForeignContractLeo,
  MsgTokenReceive,
  MsgTokenReceiveLeo,
  MsgTokenSend,
  MsgTokenSendLeo,
  InPacket,
  InPacketLeo,
  OutPacket,
  OutPacketLeo,
  PacketId,
  PacketIdLeo,
  PacketIdWithAttestor,
  PacketIdWithAttestorLeo,
  InPacketWithScreening,
  InPacketWithScreeningLeo,
} from "../types";

import * as js2leo from "./common";
export function getAleoProgramLeo(aleoProgram: AleoProgram): AleoProgramLeo {
  const result: AleoProgramLeo = {
    chain_id: js2leo.u128(aleoProgram.chain_id),
    addr: js2leo.address(aleoProgram.addr),
  }
  return result;
}

export function getForeignContractLeo(foreignContract: ForeignContract): ForeignContractLeo {
  const result: ForeignContractLeo = {
    chain_id: js2leo.u128(foreignContract.chain_id),
    addr: js2leo.array(foreignContract.addr, js2leo.u8),
  }
  return result;
}

export function getMsgTokenReceiveLeo(msgTokenReceive: MsgTokenReceive): MsgTokenReceiveLeo {
  const result: MsgTokenReceiveLeo = {
    token: js2leo.address(msgTokenReceive.token),
    sender: js2leo.array(msgTokenReceive.sender, js2leo.u8),
    receiver: js2leo.address(msgTokenReceive.receiver),
    amount: js2leo.u128(msgTokenReceive.amount),
  }
  return result;
}

export function getMsgTokenSendLeo(msgTokenSend: MsgTokenSend): MsgTokenSendLeo {
  const result: MsgTokenSendLeo = {
    token: js2leo.array(msgTokenSend.token, js2leo.u8),
    sender: js2leo.address(msgTokenSend.sender),
    receiver: js2leo.array(msgTokenSend.receiver, js2leo.u8),
    amount: js2leo.u128(msgTokenSend.amount),
  }
  return result;
}

export function getInPacketLeo(inPacket: InPacket): InPacketLeo {
  const result: InPacketLeo = {
    version: js2leo.u8(inPacket.version),
    sequence: js2leo.u64(inPacket.sequence),
    source: getForeignContractLeo(inPacket.source),
    destination: getAleoProgramLeo(inPacket.destination),
    message: getMsgTokenReceiveLeo(inPacket.message),
    height: js2leo.u32(inPacket.height),
  }
  return result;
}

export function getOutPacketLeo(outPacket: OutPacket): OutPacketLeo {
  const result: OutPacketLeo = {
    version: js2leo.u8(outPacket.version),
    sequence: js2leo.u64(outPacket.sequence),
    source: getAleoProgramLeo(outPacket.source),
    destination: getForeignContractLeo(outPacket.destination),
    message: getMsgTokenSendLeo(outPacket.message),
    height: js2leo.u32(outPacket.height),
  }
  return result;
}

export function getPacketIdLeo(packetId: PacketId): PacketIdLeo {
  const result: PacketIdLeo = {
    chain_id: js2leo.u128(packetId.chain_id),
    sequence: js2leo.u64(packetId.sequence),
  }
  return result;
}

export function getPacketIdWithAttestorLeo(packetIdWithAttestor: PacketIdWithAttestor): PacketIdWithAttestorLeo {
  const result: PacketIdWithAttestorLeo = {
    chain_id: js2leo.u128(packetIdWithAttestor.chain_id),
    sequence: js2leo.u64(packetIdWithAttestor.sequence),
    attestor: js2leo.address(packetIdWithAttestor.attestor),
  }
  return result;
}

export function getInPacketWithScreeningLeo(inPacketWithScreening: InPacketWithScreening): InPacketWithScreeningLeo {
  const result: InPacketWithScreeningLeo = {
    packet_hash: js2leo.field(inPacketWithScreening.packet_hash),
    screening_passed: js2leo.boolean(inPacketWithScreening.screening_passed),
  }
  return result;
}