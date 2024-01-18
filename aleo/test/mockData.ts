// import { getWrappedTokenInfoLeo } from "../artifacts/js/js2leo";
// import {
//   TokenInfo,
//   WTForeignContract,
//   WrappedTokenInfo,
// } from "../artifacts/js/types";
// import * as js2leoCommon from "../artifacts/js/js2leo/common";
// import * as leo2jsCommon from "../artifacts/js/leo2js/common";
import { encodeNetworkChainId, evm2AleoArr, string2AleoArr } from "../utils/utils";
// import { hash } from "aleo-hasher";

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const wusdcTokenAddr = "aleo1h2hds9hqjjp9swqwvmy0kdarg72myk307kszu2jga7efd04afqfqmcwl4j";
export const wusdcConnectorAddr = "aleo19aner4k7m4nlg9av2t7cl3tpdlvytzc6wgwwp36pm76hmw4jmspsmcqte0";
export const wusdcHoldingAddr = "aleo1qdd7ly83nst3fte50325sxzv9jfwr2sh3fn3gl5tr793djuxgsxsnf37q8"

// // User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// // Token Service Contract Address on Ethereum
export const ethTsContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// Token Service Contract on Aleo
export const aleoTsProgramAddr =
  "aleo1z0fa6zr78sppt6ph4kaardmkjn2vme55n8hq8ej2ds7rayxzvq8s6p9p3y";

// Address of the council Program
export const councilProgramAddr =
  "aleo1d35t6tsp8ne403vj5y9xefjeac8536en5el5f9gpkyt55wuqqqqqpuldsh";

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

export const THRESHOLD_INDEX = true;
export const TOTAL_MEMBERS_INDEX = false;

export const TOTAL_ATTESTORS_INDEX = false;

export const nullError = `Cannot read properties of null (reading 'replace')`;
export const nullError2 = `Cannot read properties of null (reading 'map')`;
export const nullError3 = `Cannot read properties of null (reading 'outgoing_percentage')`;

export const incomingSequence = BigInt(2);
export const amount = BigInt(10000);
export const height = 10;

export const outgoing_percentage_in_time = {"outgoing_percentage": 10000, "timeframe": 1}
export const minimum_transfer = BigInt(100);


