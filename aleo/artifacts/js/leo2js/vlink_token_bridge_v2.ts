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
  leo2js,
  tx,
  parseJSONLikeString
} from "@doko-js/core";
import {
  PrivateKey
} from "@provablehq/sdk"


export function getAleoProgram(aleoProgram: AleoProgramLeo): AleoProgram {
  const result: AleoProgram = {
    chain_id: leo2js.u128(aleoProgram.chain_id),
    addr: leo2js.address(aleoProgram.addr),
  }
  return result;
}

export function getForeignContract(foreignContract: ForeignContractLeo): ForeignContract {
  const result: ForeignContract = {
    chain_id: leo2js.u128(foreignContract.chain_id),
    addr: leo2js.array(foreignContract.addr, leo2js.u8),
  }
  return result;
}

export function getOutTokenMessage(outTokenMessage: OutTokenMessageLeo): OutTokenMessage {
  const result: OutTokenMessage = {
    sender_address: leo2js.address(outTokenMessage.sender_address),
    dest_token_address: leo2js.array(outTokenMessage.dest_token_address, leo2js.u8),
    amount: leo2js.u128(outTokenMessage.amount),
    receiver_address: leo2js.array(outTokenMessage.receiver_address, leo2js.u8),
  }
  return result;
}

export function getInTokenMessage(inTokenMessage: InTokenMessageLeo): InTokenMessage {
  const result: InTokenMessage = {
    sender_address: leo2js.array(inTokenMessage.sender_address, leo2js.u8),
    dest_token_id: leo2js.field(inTokenMessage.dest_token_id),
    amount: leo2js.u128(inTokenMessage.amount),
    receiver_address: leo2js.address(inTokenMessage.receiver_address),
  }
  return result;
}

export function getOutPacket(outPacket: OutPacketLeo): OutPacket {
  const result: OutPacket = {
    version: leo2js.u8(outPacket.version),
    sequence: leo2js.u64(outPacket.sequence),
    source: getAleoProgram(outPacket.source),
    destination: getForeignContract(outPacket.destination),
    message: getOutTokenMessage(outPacket.message),
    height: leo2js.u64(outPacket.height),
  }
  return result;
}

export function getInPacket(inPacket: InPacketLeo): InPacket {
  const result: InPacket = {
    version: leo2js.u8(inPacket.version),
    sequence: leo2js.u64(inPacket.sequence),
    source: getForeignContract(inPacket.source),
    destination: getAleoProgram(inPacket.destination),
    message: getInTokenMessage(inPacket.message),
    height: leo2js.u64(inPacket.height),
  }
  return result;
}

export function getPacketId(packetId: PacketIdLeo): PacketId {
  const result: PacketId = {
    chain_id: leo2js.u128(packetId.chain_id),
    sequence: leo2js.u64(packetId.sequence),
  }
  return result;
}

export function getInPacketWithScreening(inPacketWithScreening: InPacketWithScreeningLeo): InPacketWithScreening {
  const result: InPacketWithScreening = {
    packet_hash: leo2js.field(inPacketWithScreening.packet_hash),
    screening_passed: leo2js.boolean(inPacketWithScreening.screening_passed),
  }
  return result;
}