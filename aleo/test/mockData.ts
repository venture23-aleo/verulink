import { encodeNetworkChainId } from "../utils/chainId";

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// // User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// // Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// // User address on Aleo
export const aleoUser1 = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
export const aleoUser2 = "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t"
export const aleoUser3 = "aleo1ashyu96tjwe63u0gtnnv8z5lhapdu4l5pjsl2kha7fv7hvz2eqxs5dz0rg"
export const aleoUser4 = "aleo12ux3gdauck0v60westgcpqj7v8rrcr3v346e4jtq04q7kkt22czsh808v2"
export const aleoUser5 = "aleo18s6w7g80y4tdwhthmg5js7yhmud4xqfeq7qdpsfmg099rrv7vq8qkqq3j7"
export const aleoUser6 = "aleo1zyt7ldc0t3ung0h5sg4k65wjtnmsa6hatagjccxr7s84h93tpuxqf9zse9"
export const aleoUser7 = "aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn"

export const councilThreshold = 1;

export const TOTAL_PROPOSALS_INDEX = 0;

export const normalThreshold = 1; // Any range between 1 and 5
export const lowThreshold = 0; // Any number <= 0
export const highThreshold = 6; // Any number above 5
export const newThreshold = 2;

export const nullError = `Cannot read properties of null (reading 'replace')`;
export const nullError2 = `Cannot read properties of null (reading 'map')`;
export const nullError3 = `Cannot read properties of null (reading 'outgoing_percentage')`;

export const incomingSequence = BigInt(2);
export const amount = BigInt(10000);
export const height = 10;

export const outgoing_percentage_in_time = {"outgoing_percentage": 10000, "timeframe": 1}
export const minimum_transfer = BigInt(100);