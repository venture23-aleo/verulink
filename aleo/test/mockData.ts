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

// // USDC Contract Address on Ethereum

export const usdcContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const wusdcTokenAddr = "aleo1qg0azcck30ys6598lpmfx9xpfazj9w7ma973g7l5p7eka0p4jq9s2c3vk2";

console.log(evm2AleoArr(usdcContractAddr))

export const wusdcConnectorAddr = "aleo1l9a39hr7kyuccdw5m3lmz45qjzx3v3mz5a2jfveqkztyr0u0p58s79tre8";
export const wusdcHoldingAddr = "aleo16dyvhwsrfmx5eru9kffhn6df8cr3v3h06apqzsrphl6h03wa2crq43djr6"

// // User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// // Token Service Contract Address on Ethereum
export const ethTsContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// // Token Service Contract on Aleo
export const aleoTsContract =
  "aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3";

// // Address of the council Program
export const councilProgram =
  "aleo17kz55dul4jmqmw7j3c83yh3wh82hlxnz7v2y5ccqzzj7r6yyeupq4447kp";

// // User address on Aleo
export const aleoUser1 = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
export const aleoUser2 = "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t"
export const aleoUser3 = "aleo1ashyu96tjwe63u0gtnnv8z5lhapdu4l5pjsl2kha7fv7hvz2eqxs5dz0rg"
export const aleoUser4 = "aleo12ux3gdauck0v60westgcpqj7v8rrcr3v346e4jtq04q7kkt22czsh808v2"
export const aleoUser5 = "aleo18s6w7g80y4tdwhthmg5js7yhmud4xqfeq7qdpsfmg099rrv7vq8qkqq3j7"

export const councilThreshold = 1;

export const TOTAL_PROPOSALS_INDEX = 0;