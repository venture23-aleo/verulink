import { Wallet, getBytes, isAddress } from "ethers";

// Convert EVM address to the representation used in Aleo
// Represented as bytes32 zero-left-padded (Similar to Wormhole address)
// For EVM Chains, 20 bytes is formatted as following:
// [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
const ALEO_ARR_SIZE = 32;
const EVM_ADDR_SIZE = 20;
export const evm2AleoArr = (evmAddr: string): number[] => {
  // TODO: verify valid EthAddress
  // if (evmAddr.length != 22)  {
  //   throw Error("EVM address must have size 20 bytes");
  // }
  if (!isAddress(evmAddr)) {
    throw Error("Not a valid Ethereum Address");
  }
  const array = Array.from(getBytes(evmAddr))
  const paddedArray = [
    ...Array(ALEO_ARR_SIZE - array.length).fill(0),
    ...array,
  ];
  return paddedArray;
};

export const evm2AleoArrWithoutPadding = (evmAddr: string): number[] => {
  // TODO: verify valid EthAddress
  // if (evmAddr.length != 22)  {
  //   throw Error("EVM address must have size 20 bytes");
  // }
  if (!isAddress(evmAddr)) {
    throw Error("Not a valid Ethereum Address");
  }
  const array = Array.from(getBytes(evmAddr))
  const paddedArray = [
    ...array,
  ];
  return paddedArray;
};

export const aleoArr2Evm = (decimalArray: number[]): string => {
  const hexString: string = Array.from(Uint8Array.from(decimalArray)).slice(- EVM_ADDR_SIZE)
    .map((num) => num.toString(16).padStart(2, "0"))
    .join("");
  const hexStringWithPrefix = "0x" + hexString.toLowerCase();
  if (!isAddress(hexStringWithPrefix)) {
    throw Error("Not a valid Ethereum Address");
  }
  return hexStringWithPrefix;
};

export const generateRandomEthAddr = (): string => {
  return Wallet.createRandom().address
}

// console.log(aleoArr2Evm(evm2AleoArr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")))
// console.log(evm2AleoArr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").map((x) => x.toString() + 'u8').join(','))