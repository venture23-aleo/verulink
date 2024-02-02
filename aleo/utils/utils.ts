import { js2leo as js2leoCommon} from '@aleojs/core';
import { leo2js as leo2jsCommon } from '@aleojs/core';

import { InPacket, InPacketWithScreening, MsgTokenReceive } from '../artifacts/js/types';
import * as js2leo from "../artifacts/js/js2leo";

// Convert EVM address to the representation used in Aleo
// Represented as bytes32 zero-left-padded (Similar to Wormhole address)
// For EVM Chains, 20 bytes is formatted as following:
// [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
const ALEO_ARR_SIZE = 32;
const EVM_ADDR_SIZE = 20;
export const evm2AleoArr = (evmAddr: string) => {
  // TODO: verify valid EthAddress
  // if (evmAddr.length != 22)  {
  //   throw Error("EVM address must have size 20 bytes");
  // }
  const hexArray = evmAddr.slice(2, evmAddr.length).match(/.{2}/g);
  const paddedHexArray = [
    ...Array(ALEO_ARR_SIZE - hexArray.length).fill("00"),
    ...hexArray,
  ];
  const paddedDecimalArray = paddedHexArray.map((hex) => parseInt(hex, 16));
  return paddedDecimalArray;
};

console.log(evm2AleoArr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").map((x) => x.toString() + 'u8').join(','))

export const aleoArr2Evm = (decimalArray: number[] ): string => {
  const hexString: string = decimalArray.slice( - EVM_ADDR_SIZE)
    .map((num) => num.toString(16).padStart(2, "0"))
    .join("");
  const hexStringWithPrefix = "0x" + hexString.toLowerCase();
  return hexStringWithPrefix;
};

// Convert string to array as used in Aleo
// Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
// Example: `USD Coin` is represented as following:
// [55 53 44 20 43 6f 69 6e 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00]
export const string2AleoArr = (input: string, length: number) => {
  const ascii = input.split("").map((char) => char.charCodeAt(0));
  const paddedAscii = [...ascii, ...Array(length - ascii.length).fill(0)];
  return paddedAscii;
};

const verifyNumber = (num: number) => {
  if (parseInt(num.toString()).toString() !== num.toString()) {
    throw Error("Error representing chainId as number. Pass as a BigInt");
  }
};

const ASCII_SEPARATOR = ":".charCodeAt(0).toString(16);

export const encodeNetworkChainId = (
  networkType: string,
  chainId: number | bigint
): bigint => {
  if (typeof chainId == "number") {
    verifyNumber(chainId)
  }
  const asciiNetworkType = networkType
    .split("")
    .map((char) => char.charCodeAt(0).toString(16));
  asciiNetworkType.push(ASCII_SEPARATOR);
  const chainIdHex = chainId.toString(16);
  asciiNetworkType.push(chainIdHex);
  const networkChainId = asciiNetworkType.join("");
  return BigInt("0x" + networkChainId);
};

export const decodeNetworkChainId = (encodedChainId: number | bigint) => {
  if (typeof encodedChainId == "number") {
    verifyNumber(encodedChainId)
  }
  const encodedChainIdHex = encodedChainId.toString(16);
  const hexArray = encodedChainIdHex.match(/.{2}/g);
  const separator = hexArray.indexOf(ASCII_SEPARATOR) + 1;
  const networkNameArray = hexArray
    .slice(0, separator)
    .map((x) => parseInt(x, 16));
  const networkType = String.fromCharCode(...networkNameArray);
  const chainId = BigInt(
    "0x" + encodedChainIdHex.slice(separator * 2, encodedChainIdHex.length)
  );
  return {
    networkType,
    chainId,
  };
};


import { hash } from "aleo-hasher";
export const hashStruct = (struct: any): bigint => {
  const structString= js2leoCommon.json(struct)
  const structHash = hash("bhp256", structString, "field");
  const hashBigInt = leo2jsCommon.field(structHash);
  return hashBigInt
}

import {sign} from "aleo-signer"
export const signPacket = (packet: InPacket, screening_passed: boolean, privateKey: string) => {

    const packetHash = hashStruct(js2leo.getInPacketLeo(packet));
    const packetHashWithScreening: InPacketWithScreening = {
      packet_hash: packetHash,
      screening_passed
    };
    const packetHashWithScreeningHash = hashStruct(js2leo.getInPacketWithScreeningLeo(packetHashWithScreening));
    const signature = sign(privateKey, js2leoCommon.field(packetHashWithScreeningHash))
    return signature
}