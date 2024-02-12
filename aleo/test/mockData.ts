import { encodeNetworkChainId } from "../utils/chainId";

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79".toLowerCase();

// // User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// // Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0xf2c1447b518b03e1Ab4ae47021365508871f0225".toLocaleLowerCase();