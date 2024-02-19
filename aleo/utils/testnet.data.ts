import { encodeNetworkChainId } from "./chainId";

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79"

// User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c"

// User address on Aleo
export const aleoUser1 = "aleo1s567xd2j2ale8t008gf8cx82pn0784l2c22c7uemxtqcuf973cyqc6cz6t";
export const aleoUser2 = "aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn"
export const aleoUser3 = "aleo154t7wtj5putqrkjaep99zztd7za23m7jnkh6csc328aqww8c6srsqcpe8k"
export const aleoUser4 = "aleo1u4y9ntu2yegz29w4rppwvyzddyfw6scnzklf59q4ngjs5h6vqvfqqwad9n"
export const aleoUser5 = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px" // Devnet Wallet

export const councilThreshold = 1;

export const wusdcMinTransfer = BigInt(100);
export const wusdcMaxTransfer = BigInt(100_000);
export const wusdcOutgoingPercentage = 10_00 // 10%
export const wusdcTimeframe = 1; // per block
export const wusdcMaxNoCap = BigInt(100_000);