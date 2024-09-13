// User address on Aleo
export const attestor1 = "aleo1eslxvrgwtev68t9y6l0nxtts86exewrucgj33aw309k20tch45ps6pex24";
export const attestor2 = "aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf"
export const attestor3 = "aleo1j4zawcfr63f7h0r97vck9xd2y2dycvgagh6n6w9f8tf9n47muggq6kgeza"
export const attestor4 = "aleo1jelsappz5y0cy54cdqukc6xyvz45f35t99mgmlmu3uu7pndvayyqmnx5za"
export const attestor5 = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px" // Devnet Wallet

// User address on Aleo
export const council1 = "aleo1eslxvrgwtev68t9y6l0nxtts86exewrucgj33aw309k20tch45ps6pex24";
export const council2 = "aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf"
export const council3 = "aleo1j4zawcfr63f7h0r97vck9xd2y2dycvgagh6n6w9f8tf9n47muggq6kgeza"
export const council4 = "aleo1fcg4k0sacadavag292p7x9ggm6889aay6wn9m8ftnmynh67cg5xsx8ycu8"
export const council5 = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px" // Devnet Wallet

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
export const wethMaxNoCap = BigInt(40_000_000_000_000_000_000); // 40 eth
export const wethName = BigInt('1447384136');
export const wethSymbol = BigInt('1984255048');
export const wethDecimals = 18;

// const token_name = BigInt('1464161352')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("1464161352") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615