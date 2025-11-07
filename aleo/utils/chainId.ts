const verifyNumber = (num: number) => {
  if (parseInt(num.toString()).toString() !== num.toString()) {
    throw Error("Error representing chainId as number. Pass as a BigInt");
  }
};

const ASCII_SEPARATOR = ":".charCodeAt(0).toString(16);

// Step by step:
// "eth" → ASCII: [101, 116, 104] → Hex: ["65", "74", "68"]
// ":" → ASCII: [58] → Hex: ["3a"]
// 11155111 → Hex: ["2aacb87"]
// Joined: "65746873a2aacb87"
// As BigInt: 0x65746873a2aacb87n

// Result: 7381162886968824711n
export const encodeNetworkChainId = (
  networkType: string,
  chainId: number | bigint
): bigint => {
  if (typeof chainId == "number") {
    verifyNumber(chainId);
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
    verifyNumber(encodedChainId);
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
