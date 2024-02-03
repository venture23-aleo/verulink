import { encodeNetworkChainId } from "../utils/chainId";

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);
console.log("Sepolia Chain Id", ethChainId)
console.log("Aleo Testnet3 Id", aleoChainId)

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// // User address on Aleo
export const aleoUser1 = "aleo1s567xd2j2ale8t008gf8cx82pn0784l2c22c7uemxtqcuf973cyqc6cz6t";
export const aleoUser2 = "aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn"
export const aleoUser3 = "aleo154t7wtj5putqrkjaep99zztd7za23m7jnkh6csc328aqww8c6srsqcpe8k"
export const aleoUser4 = "aleo1u4y9ntu2yegz29w4rppwvyzddyfw6scnzklf59q4ngjs5h6vqvfqqwad9n"
export const aleoUser5 = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"

export const councilThreshold = 1;