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
export const wusdcName = BigInt('370798707779');
export const wusdcSymbol = BigInt("508237661251");
export const wusdcDecimals = 6;

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
export const wusdtName = BigInt('370798707796');
export const wusdtSymbol = BigInt("508237661268");
export const wusdtDecimals = 6;

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
export const wethName = BigInt('1447384136');
export const wethSymbol = BigInt('1984255048');
export const wethDecimals = 18;

// const token_name = BigInt('1464161352')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("1464161352") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615