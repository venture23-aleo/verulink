// Convert EVM address to the representation used in Aleo
// Represented as bytes32 zero-left-padded (Similar to Wormhole address)
// For EVM Chains, 20 bytes is formatted as following:
// [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
const evm2AleoArr = (evmAddr: string) => {
    // TODO: verify valid EthAddress
    const hexArray = evmAddr.slice(2,evmAddr.length).match(/.{2}/g);
    const paddedHexArray = [...Array(32 - hexArray.length).fill("00"), ...hexArray];
    const paddedDecimalArray = paddedHexArray.map(hex => parseInt(hex, 16));
    return paddedDecimalArray
}

const aleoArr2Evm = (decimalArray) => {
    const hexString = decimalArray.map(num => num.toString(16).padStart(2, '0')).join('');
    const hexStringWithPrefix = '0x' + hexString.toUpperCase();
    return hexStringWithPrefix
}

// Convert string to array as used in Aleo
// Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
// Example: `USD Coin` is represented as following:
// [55 53 44 20 43 6f 69 6e 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00]
const string2AleoArr = (input: string, length: number) => {
    const ascii = input.split("").map(char => char.charCodeAt(0));
    const paddedAscii = [...ascii, ...Array(length - ascii.length).fill(0)]
    console.log(ascii)
    console.log(paddedAscii)
    return paddedAscii
}

export {aleoArr2Evm, evm2AleoArr, string2AleoArr}