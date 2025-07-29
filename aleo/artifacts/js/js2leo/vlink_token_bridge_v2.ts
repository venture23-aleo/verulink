import {
  AleoProgram,
  AleoProgramLeo,
  ForeignContract,
  ForeignContractLeo,
  OutTokenMessage,
  OutTokenMessageLeo,
  InTokenMessage,
  InTokenMessageLeo,
  OutPacket,
  OutPacketLeo,
  InPacket,
  InPacketLeo,
  PacketId,
  PacketIdLeo,
  InPacketWithScreening,
  InPacketWithScreeningLeo
} from "../types/vlink_token_bridge_v2";
import {
  js2leo
} from "@doko-js/core";


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

export function getOutTokenMessageLeo(outTokenMessage: OutTokenMessage): OutTokenMessageLeo {
  const result: OutTokenMessageLeo = {
    sender_address: js2leo.address(outTokenMessage.sender_address),
    dest_token_address: js2leo.array(outTokenMessage.dest_token_address, js2leo.u8),
    amount: js2leo.u128(outTokenMessage.amount),
    receiver_address: js2leo.array(outTokenMessage.receiver_address, js2leo.u8),
  }
  return result;
}

export function getInTokenMessageLeo(inTokenMessage: InTokenMessage): InTokenMessageLeo {
  const result: InTokenMessageLeo = {
    sender_address: js2leo.array(inTokenMessage.sender_address, js2leo.u8),
    dest_token_id: js2leo.field(inTokenMessage.dest_token_id),
    amount: js2leo.u128(inTokenMessage.amount),
    receiver_address: js2leo.address(inTokenMessage.receiver_address),
  }
  return result;
}

export function getOutPacketLeo(outPacket: OutPacket): OutPacketLeo {
  const result: OutPacketLeo = {
    version: js2leo.u8(outPacket.version),
    sequence: js2leo.u64(outPacket.sequence),
    source: getAleoProgramLeo(outPacket.source),
    destination: getForeignContractLeo(outPacket.destination),
    message: getOutTokenMessageLeo(outPacket.message),
    height: js2leo.u64(outPacket.height),
  }
  return result;
}

export function getInPacketLeo(inPacket: InPacket): InPacketLeo {
  const result: InPacketLeo = {
    version: js2leo.u8(inPacket.version),
    sequence: js2leo.u64(inPacket.sequence),
    source: getForeignContractLeo(inPacket.source),
    destination: getAleoProgramLeo(inPacket.destination),
    message: getInTokenMessageLeo(inPacket.message),
    height: js2leo.u64(inPacket.height),
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

export function getInPacketWithScreeningLeo(inPacketWithScreening: InPacketWithScreening): InPacketWithScreeningLeo {
  const result: InPacketWithScreeningLeo = {
    packet_hash: js2leo.field(inPacketWithScreening.packet_hash),
    screening_passed: js2leo.boolean(inPacketWithScreening.screening_passed),
  }
  return result;
}