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

export const aleoArr2Evm = (decimalArray: number[] ): string => {
  const hexString: string = decimalArray.slice( - EVM_ADDR_SIZE)
    .map((num) => num.toString(16).padStart(2, "0"))
    .join("");
  const hexStringWithPrefix = "0x" + hexString.toLowerCase();
  return hexStringWithPrefix;
};

// console.log(evm2AleoArr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").map((x) => x.toString() + 'u8').join(','))