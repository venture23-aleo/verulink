import { InPacket } from "../artifacts/js/types/token_bridge_v0002";
import { BRIDGE_VERSION } from "./constants";
import { evm2AleoArr, generateRandomEthAddr } from "./ethAddress";

export const createRandomPacket = (
  receiver: string,
  amount: bigint,
  sourceChainId: bigint,
  destChainId: bigint,
  sourceTsContractAddr: string,
  destTsContractAddr: string,
  destTokenAddr: string,
  sender?: string,
  sequence?: bigint,
  height?: bigint,
  version?: number
): InPacket => {
  let incomingSequence = sequence ?? BigInt(
    Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
  );
  let incomingHeight = height ?? BigInt(Math.round(Math.random() * Math.pow(2, 32) - 1));

  let bridgeVersion = version ?? BRIDGE_VERSION ;

  let senderAddr = sender ?? generateRandomEthAddr() ;

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
    message: {
      dest_token_address: destTokenAddr,
      sender_address: evm2AleoArr(senderAddr),
      amount,
      receiver_address: receiver,
    },
    sequence: incomingSequence,
    height: incomingHeight,
  };

  return packet;
};