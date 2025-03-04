import { Field } from "@aleohq/sdk";
import { InPacket } from "../artifacts/js/types/vlink_token_bridge_v2";
import { PACKET_VERSION } from "./constants";
import { evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr } from "./ethAddress";

export const createRandomPacket = (
  receiver: string,
  amount: bigint,
  sourceChainId: bigint,
  destChainId: bigint,
  sourceTsContractAddr: string,
  destTsContractAddr: string,
  destTokenId: bigint,
  sender?: string,
  version?: number,
  sequence?: bigint,
  height?: bigint,

): InPacket => {
  let incomingSequence = BigInt(10446744073709551615);
  let incomingHeight = height ?? BigInt(Math.round(Math.random() * Math.pow(2, 32) - 1));

  let bridgeVersion = version;

  let senderAddr = sender ?? generateRandomEthAddr();

  // Create a packet
  const packet: InPacket = {
    version: bridgeVersion,
    source: {
      chain_id: sourceChainId,
      addr: evm2AleoArr(sourceTsContractAddr),
    },
    destination: {
      chain_id: destChainId,
      addr: destTsContractAddr,
    },
    sequence: incomingSequence,
    message: {
      sender_address: evm2AleoArr(senderAddr),
      dest_token_id: destTokenId,
      amount,
      receiver_address: receiver,
    },
    height: incomingHeight,
  };

  return packet;
};


export const createFailedChainPacket = (
  receiver: string,
  amount: bigint,
  sourceChainId: bigint,
  destChainId: bigint,
  sourceTsContractAddr: string,
  destTsContractAddr: string,
  destTokenId: bigint,
  sender?: string,
  sequence?: bigint,
  height?: bigint,
  version?: number
): InPacket => {
  let incomingSequence = sequence ?? BigInt(
    Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
  );
  let incomingHeight = height ?? BigInt(Math.round(Math.random() * Math.pow(2, 32) - 1));

  let bridgeVersion = version ?? PACKET_VERSION;

  let senderAddr = sender ?? generateRandomEthAddr();

  // Create a packet
  const packet: InPacket = {
    version: bridgeVersion,
    source: {
      chain_id: sourceChainId,
      addr: evm2AleoArr(sourceTsContractAddr),
    },
    destination: {
      chain_id: destChainId,
      addr: destTsContractAddr,
    },
    sequence: incomingSequence,
    message: {
      sender_address: evm2AleoArr(senderAddr),
      dest_token_id: destTokenId,
      amount,
      receiver_address: receiver,
    },
    height: incomingHeight,
  };

  return packet;
};