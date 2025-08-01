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

export const VERSION_PUBLIC_NORELAYER_NOPREDICATE = 1;
export const VERSION_PUBLIC_RELAYER_NOPREDICATE = 2;
export const VERSION_PUBLIC_NORELAYER_PREDICATE = 3;
export const VERSION_PUBLIC_RELAYER_PREDICATE = 4;

export const VERSION_PRIVATE_NORELAYER_NOPREDICATE = 11;
export const VERSION_PRIVATE_RELAYER_NOPREDICATE = 12;
export const VERSION_PRIVATE_NORELAYER_PREDICATE = 13;
export const VERSION_PRIVATE_RELAYER_PREDICATE = 14;


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
export const testnetBNB = BigInt(97);

export const PRIVATE_VERSION = 2;
export const PUBLIC_VERSION = 1;

// max_supply for Tokens, it is the highest u128 value
export const max_supply = BigInt("340282366920938463463374607431768211455");


export const TAG_TB_TRANSFER_OWNERSHIP = 1;
export const TAG_TB_ADD_ATTESTOR = 2;
export const TAG_TB_REMOVE_ATTESTOR = 3;
export const TAG_TB_UPDATE_THRESHOLD = 4;
export const TAG_TB_ADD_CHAIN = 5;
export const TAG_TB_REMOVE_CHAIN = 6;
export const TAG_TB_ADD_SERVICE = 7;
export const TAG_TB_REMOVE_SERVICE = 8;
export const TAG_TB_PAUSE = 9;
export const TAG_TB_UNPAUSE = 10;

export const TAG_TS_TRANSFER_OWNERSHIP = 1;
export const TAG_TS_ADD_TOKEN = 2;
export const TAG_TS_REMOVE_TOKEN = 3;
export const TAG_TS_UPDATE_MAX_MIN_TRANSFER = 4;
export const TAG_TS_PAUSE_TOKEN = 5;
export const TAG_TS_UNPAUSE_TOKEN = 6
export const TAG_TS_UP_OUTGOING_PERCENT = 7;
export const TAG_HOLDING_RELEASE = 8;
export const TAG_HOLDING_RELEASE_PRIVATE = 9;
export const TAG_HOLDING_OWNERSHIP_TRANSFER = 10;
export const TAG_TS_REGISTER_TOKEN = 11;
export const TAG_UPDATE_TOKEN_METADATA = 12;
export const TAG_SET_ROLE_TOKEN = 13;
export const TAG_TS_UP_TS_SETTING = 14;
export const TAG_TS_ADD_CHAIN_TO_ET = 15;
export const TAG_TS_REMOVE_OTHER_CHAIN_ADD = 16;
export const TAG_TS_UPDATE_FEES = 17;
export const TAG_REMOVE_ROLE = 18;

export const TAG_ADD_MEMBER = 1;
export const TAG_REMOVE_MEMBER = 2;
export const TAG_WITHDRAW_FEES = 3;
export const TAG_UPDATE_THRESHOLD = 4;


export const TAG_TS2_TRANSFER_OWNERSHIP = 1;
export const TAG_TS2_ADD_TOKEN= 2;
export const TAG_TS2_UPDATE_MAX_MIN_TRANSFER = 3;
export const TAG_TS2_PAUSE_TOKEN = 4;
export const TAG_TS2_UNPAUSE_TOKEN = 5; 
export const TAG_HOLDING2_RELEASE= 6;
export const TAG_HOLDING2_OWNERSHIP_TRANSFER = 7;
export const TAG_TS2_REGISTER_TOKEN = 8;
export const TAG_TS2_UP_TS_SETTING = 9;
export const TAG_TS2_ADD_CHAIN_TO_ET = 10;
export const TAG_TS2_REMOVE_OTHER_CHAIN_ADD = 11;
export const TAG_TS2_UPDATE_FEES = 12;