import { Field } from "@aleohq/sdk";
import { InPacket } from "../artifacts/js/types/token_bridge_v0003";
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
  sequence?: bigint,
  height?: bigint,
  version?: number
): InPacket => {
  let incomingSequence = sequence ?? BigInt(
    Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
  );
  let incomingHeight = height ?? BigInt(Math.round(Math.random() * Math.pow(2, 32) - 1));

  let bridgeVersion = version ?? PACKET_VERSION ;

  let senderAddr = sender ?? generateRandomEthAddr() ;

  // Create a packet
  const packet: InPacket = {
    version: bridgeVersion,
    sequence: incomingSequence,
    source: {
      chain_id: sourceChainId,
      addr: evm2AleoArrWithoutPadding(sourceTsContractAddr),
    },
    destination: {
      chain_id: destChainId,
      addr: destTsContractAddr,
    },
    message: {
      dest_token_id: destTokenId,
      sender_address: evm2AleoArrWithoutPadding(senderAddr),
      amount,
      receiver_address: receiver,
    },
    height: incomingHeight,
  };

  return packet;
};