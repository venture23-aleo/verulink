// User address on Aleo
export const attestor1 = "aleo1nzn3ma4q4xzmrvnkfs675slta87pdnyn5ctr9lc7ueuzhrvdlgrq38cj7u";
export const attestor2 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const attestor3 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const attestor4 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const attestor5 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc" // Devnet Wallet

// User address on Aleo
export const council1 = "aleo1a0rugumrjvf86gw3aqkzqvun4m73xxxhgfpra3gtkmw2p2uw2y9q0dwz3f";
export const council2 = "aleo1tr9t0ac0h5g6mr8n7xkmmn5264deenjqdxctyce42m9u40hspvxqc27dsu"
export const council3 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const council4 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const council5 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc" // Devnet Wallet

export const councilThreshold = 1;

// vusdc related data
export const wusdcMinTransfer = BigInt(1_000_000);
export const wusdcMaxTransfer = BigInt("3402823669209384634633746074317682114");
export const wusdcOutgoingPercentage = 10_00 // 10%
export const wusdcTimeframe = 28_800; // per 28_800 block
export const wusdcMaxNoCap = BigInt(100_000_000_000);
export const wusdcName = BigInt('3707987077791');
export const wusdcSymbol = BigInt("508237661251");
export const wusdcDecimals = 6;
export const wusdcFeeRelayer = BigInt(500_000);
export const wusdcPlatformFee = 1_00;


// const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

// vusdt related data
export const wusdtMinTransfer = BigInt(1_000_000);
export const wusdtMaxTransfer = BigInt("3402823669209384634633746074317682114");
export const wusdtOutgoingPercentage = 10_00 // 10%
export const wusdtTimeframe = 28_800; // per 28_800 block
export const wusdtMaxNoCap = BigInt(100_000_000_000);
export const wusdtName = BigInt('3707987077961');
export const wusdtSymbol = BigInt("508237661268");
export const wusdtDecimals = 6;
export const wusdtFeeRelayer = BigInt(500_000);
export const wusdtPlatformFee = 1_00;


// const token_name = BigInt('375093675092')//"WUSDT" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("375093675092") //"WUSDT" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

// veth related data
export const wethMinTransfer = BigInt(500_000_000_000_000); //0.0005 = 5*10^14
export const wethMaxTransfer = BigInt("3402823669209384634633746074317682114");
export const wethOutgoingPercentage = 10_00 // 10%
export const wethTimeframe = 28_800; // per block
export const wethMaxNoCap = BigInt("40000000000000000000"); // 40 eth
export const wethName = BigInt('14473841361');
export const wethSymbol = BigInt('1984255048');
export const wethDecimals = 18;
export const wethFeeRelayer = BigInt(26_000_000_000_000);
export const wethPlatformFee = 1_00;


// const token_name = BigInt('1464161352')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("1464161352") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

export const SUPPLY_MANAGER_ROLE = 3;

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
export const ethTsContractAddr = "0xA7d9fD4232b5a5770996832c3edb8198766Add69"
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

export const ethChainId = BigInt(28556963657430695); //eth: chainid sepolia
export const aleoChainId = BigInt(6694886634403); // aleo: chainid
export const baseChainId = BigInt(443067135441324596); //base: chainid 84532n
export const arbitrumChainId = BigInt(438861435819683566); //arbi: chainid 421614n
export const PRIVATE_VERSION = 2;
export const PUBLIC_VERSION = 1;

// max_supply for Tokens, it is the highest u128 value
export const max_supply = BigInt("340282366920938463463374607431768211455");
