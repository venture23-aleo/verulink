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

export const PACKET_VERSION_PUBLIC = 1;
export const PACKET_VERSION_PRIVATE = 2;

export const ALEO_ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";

export const OWNER_INDEX = true;

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
export const usdtContractAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
export const ethContractAddr = "0x0000000000000000000000000000000000000001"

// Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0xde75761d5d9d1c2c782FE414FFe2B3ED24de2FFc"
export const ethTsRandomContractAddress = "0x76072f7484BFe15307940dF1DF69cd4635F91E85"
export const ethTsRandomContractAddress2 = "0x1ef1fb5555a4F57F3c28805d5e48Fe57A81a3Fa6"

// Token Service Contract Address on Base
export const baseTsContractAddr = "0xA7d9fD4232b5a5770996832c3edb8198766Add69"
export const baseTsRandomContractAddress = "0x76072f7484BFe15307940dF1DF69cd4635F91E85"
export const baseTsRandomContractAddress2 = "0x1ef1fb5555a4F57F3c28805d5e48Fe57A81a3Fa6"

// Token Service Contract Address on Arbitrum
export const arbitrumTsContractAddr = "0xA7d9fD4232b5a5770996832c3edb8198766Add69"
export const arbitrumTsRandomContractAddress = "0x76072f7484BFe15307940dF1DF69cd4635F91E85"
export const arbitrumTsRandomContractAddress2 = "0x1ef1fb5555a4F57F3c28805d5e48Fe57A81a3Fa6"


// Token Service Contract Address on Ethereum
// export const ethTsContractAddr2 = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79"

// export const ethTsContractAddr3 = "0x258A773B19fcC8958E0cE1B1b13c830a50bA7c11"

const mainnetChainId = 1
export const ethChainId = BigInt(27234042785);
export const aleoChainId = BigInt(6694886634401);
export const baseChainId = BigInt(84532);
export const arbitrumChainId = BigInt(421614);

export const PRIVATE_VERSION = 2;
export const PUBLIC_VERSION = 1;

// max_supply for Tokens, it is the highest u128 value
export const max_supply = BigInt("340282366920938463463374607431768211455");
