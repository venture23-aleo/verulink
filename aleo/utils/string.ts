// Convert string to array as used in Aleo
// Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
// Example: `USD Coin` is represented as following:
// [55 53 44 20 43 6f 69 6e 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00]
export const string2AleoArr = (input: string, length: number) => {
  const ascii = input.split("").map((char) => char.charCodeAt(0));
  const paddedAscii = [...ascii, ...Array(length - ascii.length).fill(0)];
  return paddedAscii;
};
