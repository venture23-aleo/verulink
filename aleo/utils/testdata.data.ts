import { hashStruct } from "./hash";

// User address on Aleo
export const attestor1 = "aleo1eslxvrgwtev28t9y6l0nxtts86exewrucgj33aw309k20tch45ps6pex24";
export const attestor2 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const attestor3 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const attestor4 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const attestor5 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc" // Devnet Wallet

// User address on Aleo
export const council1 = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
export const council2 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const council3 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const council4 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
export const council5 = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc" // Devnet Wallet

export const councilThreshold = 1;

// vusdc related data
export const wusdcMinTransfer = BigInt(1_000_000);
export const wusdcMaxTransfer = BigInt("3402823669209384634633746074317682114");
export const wusdcOutgoingPercentage = 10_000 // 10%
export const wusdcTimeframe = 3_600; // per 28_800 block
export const wusdcMaxNoCap = BigInt(100_000_000_000);
export const wusdcName = BigInt('3707987077795');
export const wusdcSymbol = BigInt("508237661255");
export const wusdcDecimals = 6;
export const wusdcFeeRelayerPublic = BigInt(150_000);
export const wusdcPlatformFeePublic = 17;
export const wusdcFeeRelayerPrivate = BigInt(250_000);
export const wusdcPlatformFeePrivate = 34;

// export const token_name = BigInt('6148332821651876206')
// export const tokenID = hashStruct(token_name);


// const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

// vusdt related data
export const wusdtMinTransfer = BigInt(1_000_000);
export const wusdtMaxTransfer = BigInt("3402823669209384634633746074317682114");
export const wusdtOutgoingPercentage = 10_000 // 10%
export const wusdtTimeframe = 3_600; // per 28_800 block
export const wusdtMaxNoCap = BigInt(100_000_000_000);
export const wusdtName = BigInt('3707987077965');
export const wusdtSymbol = BigInt("508237661265");
export const wusdtDecimals = 6;
export const wusdtFeeRelayerPublic = BigInt(100_000);
export const wusdtPlatformFeePublic = 17;
export const wusdtFeeRelayerPrivate = BigInt(200_000);
export const wusdtPlatformFeePrivate = 34;


// const token_name = BigInt('375093675092')//"WUSDT" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("375093675092") //"WUSDT" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

// veth related data
export const wethMinTransfer = BigInt(1_000_000_000_000_000); //0.0005 = 1*10^15
export const wethMaxTransfer = BigInt("3402823669209384634633746074317682114");
export const wethOutgoingPercentage = 10_000 // 10%
export const wethTimeframe = 3_600; // per block
export const wethMaxNoCap = BigInt("40000000000000000000"); // 40 eth
export const wethName = BigInt('14473841365');
export const wethSymbol = BigInt('1984255045');
export const wethDecimals = 18;
export const wethFeeRelayerPublic = BigInt(100_000_000_000_000);
export const wethPlatformFeePublic = 17;
export const wethFeeRelayerPrivate = BigInt(200_000_000_000_000);
export const wethPlatformFeePrivate = 34;


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

// Token Address on Ethereum Network
export const ethUsdcContractAddr = "0x532842De9470816Cf7cc7Cee2d15f19593fBaf64"
export const ethUsdtContractAddr = "0x26FC611307b28f347eE66D057f1E3F3a903B3630"
export const ethEthContractAddr = "0x0000000000000000000000000000000000000001"

// Token Address on Base Network
export const baseUsdcContractAddr = "0x555eC249d1eB0db553AE8df14f4baE287F9CE62a"
export const baseUsdtContractAddr = "0x22F06bac09F9375E6450F44976a05b7d6d61fcf4"
export const baseEthContractAddr = "0x0000000000000000000000000000000000000001"

// Token Address on Arbitrum Network
export const arbitrumUsdcContractAddr = "0x22F06bac09F9375E6450F44976a05b7d6d61fcf4"
export const arbitrumUsdtContractAddr = "0x555eC249d1eB0db553AE8df14f4baE287F9CE62a"
export const arbitrumEthContractAddr = "0x0000000000000000000000000000000000000001"

// Token Address on Holesky Network
export const ethHoleskyUsdcContractAddr = "0x82e349a83D954A5cA049d4256B8dF3a7c8d5AB9b"
export const ethHoleskyUsdtContractAddr = "0xB675520eB99c86f602a454F2288eb0722c2C520B"
export const ethHoleskyEthContractAddr = "0x0000000000000000000000000000000000000001"

// Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0x5d2fe549d3b7c35f0ed3f4f8a3870e476622b303"
export const ethTsRandomContractAddress = "0x76072f7484BFe15307940dF1DF69cd4635F91E85"
export const ethTsRandomContractAddress2 = "0x1ef1fb5555a4F57F3c28805d5e48Fe57A81a3Fa6"

// Token Service Contract Address on Base
export const baseTsContractAddr = "0x9bDd97D4016b332331290BEb1fc32276Ab09cB75"
export const baseTsRandomContractAddress = "0x76072f7484BFe15307940dF1DF69cd4635F91E85"
export const baseTsRandomContractAddress2 = "0x1ef1fb5555a4F57F3c28805d5e48Fe57A81a3Fa6"

// Token Service Contract Address on Arbitrum
export const arbitrumTsContractAddr = "0x3394E0dbe35F8b6beAC08e1E4aC5Af31930fa5D4"
export const arbitrumTsRandomContractAddress = "0x76072f7484BFe15307940dF1DF69cd4635F91E85"
export const arbitrumTsRandomContractAddress2 = "0x1ef1fb5555a4F57F3c28805d5e48Fe57A81a3Fa6"

// Token Service Contract Address on Holesky
export const ethHoleskyTsContractAddr = "0x08aE9cB3B80a1E45dE62b5a1b299d2058fFa55F7"


// Token Service Contract Address on Ethereum
// export const ethTsContractAddr2 = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79"

// export const ethTsContractAddr3 = "0x258A773B19fcC8958E0cE1B1b13c830a50bA7c11"

export const ethChainId = BigInt("28556963657430695"); //eth: chainid sepolia
export const aleoChainId = BigInt("6694886634401"); // aleo: chainid
export const baseChainId = BigInt("443067135441324596"); //base: chainid 84532n
export const arbitrumChainId = BigInt("438861435819683566"); //arbi: chainid 421614n
export const ethHoleskyChainId = BigInt("111550639260264") // eth: chainid 17000
export const PRIVATE_VERSION = 2;
export const PUBLIC_VERSION = 1;

// max_supply for Tokens, it is the highest u128 value
export const max_supply = BigInt("340282366920938463463374607431768211455");


export const VERSION_PUBLIC_NORELAYER_NOPREDICATE = 1;
export const VERSION_PUBLIC_RELAYER_NOPREDICATE = 2;
export const VERSION_PUBLIC_NORELAYER_PREDICATE = 3;
export const VERSION_PUBLIC_RELAYER_PREDICATE = 4;

export const VERSION_PRIVATE_NORELAYER_NOPREDICATE = 11;
export const VERSION_PRIVATE_RELAYER_NOPREDICATE = 12;
export const VERSION_PRIVATE_NORELAYER_PREDICATE = 13;
export const VERSION_PRIVATE_RELAYER_PREDICATE = 14;


export const aleoSeq = BigInt(1);
export const ethSeq = BigInt(1);
