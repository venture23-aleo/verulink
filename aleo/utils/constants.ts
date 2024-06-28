import { encodeNetworkChainId } from "./chainId";

export const COUNCIL_THRESHOLD_INDEX = true;
export const COUNCIL_TOTAL_MEMBERS_INDEX = false;
export const COUNCIL_TOTAL_PROPOSALS_INDEX = 0;

export const SUPPORTED_THRESHOLD = 5;

export const BRIDGE_THRESHOLD_INDEX = 1;
export const BRIDGE_TOTAL_ATTESTORS_INDEX = 2;
export const BRIDGE_PAUSABILITY_INDEX = 3;

export const BRIDGE_PAUSED_VALUE = 0;
export const BRIDGE_UNPAUSED_VALUE = 1;

export const TOKEN_PAUSED_VALUE = true;
export const TOKEN_UNPAUSED_VALUE = false;

export const PACKET_VERSION = 1;

export const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";

export const OWNER_INDEX = true;

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79"

// Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c"

// Token Service Contract Address on Ethereum
export const ethTsContractAddr2 = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79"

export const ethTsContractAddr3 = "0x258A773B19fcC8958E0cE1B1b13c830a50bA7c11"

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);
