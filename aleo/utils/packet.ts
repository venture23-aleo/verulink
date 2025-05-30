import { Field } from "@aleohq/sdk";
import { InPacket } from "../artifacts/js/types/vlink_token_bridge_v5";
import { evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr } from "./ethAddress";

export const createRandomPacket = (
  receiver: string,
  amount: bigint,
  sourceChainId: bigint,
  destChainId: bigint,
  sourceTsContractAddr: string,
  destTsContractAddr: string,
  destTokenId: bigint,
  version: number,
  sender?: string,
  sequence?: bigint,
  height?: bigint,

): InPacket => {
  let incomingSequence = sequence ?? BigInt(
    Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
  );
  let incomingHeight = height ?? BigInt(Math.round(Math.random() * Math.pow(2, 32) - 1));

  let bridgeVersion = version;

  let senderAddr = sender ?? generateRandomEthAddr();

  // Create a packet
  const packet: InPacket = {
    version: bridgeVersion,
    sequence: incomingSequence,
    source: {
      chain_id: sourceChainId,
      addr: evm2AleoArr(sourceTsContractAddr),
    },
    destination: {
      chain_id: destChainId,
      addr: destTsContractAddr,
    },
    message: {
      dest_token_id: destTokenId,
      sender_address: evm2AleoArr(senderAddr),
      amount,
      receiver_address: receiver,
    },
    height: incomingHeight,
  };

  return packet;
};