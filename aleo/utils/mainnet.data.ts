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
export const wusdcMinTransfer = BigInt(10);
export const wusdcMaxTransfer = BigInt(100_000_000_000);
export const wusdcOutgoingPercentage = 10_00 // 10%
export const wusdcTimeframe = 300; // per 300 block
export const wusdcMaxNoCap = BigInt(990_000_000);
export const wusdcName = BigInt('683507597663000007791607934265902');
export const wusdcSymbol = BigInt("6220970012935411249");
export const wusdcDecimals = 6;

// const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

// vusdt related data
export const wusdtMinTransfer = BigInt(10);
export const wusdtMaxTransfer = BigInt(100_000_000_000);
export const wusdtOutgoingPercentage = 10_00 // 10%
export const wusdtTimeframe = 300; // per 300 block
export const wusdtMaxNoCap = BigInt(990_000_000);
export const wusdtName = BigInt('683507597663000007791607934267602');
export const wusdtSymbol = BigInt("6220970013220623921");
export const wusdtDecimals = 6;

// const token_name = BigInt('375093675092')//"WUSDT" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("375093675092") //"WUSDT" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

// veth related data
export const wethMinTransfer = BigInt(100);
export const wethMaxTransfer = BigInt(100_000_000_000_000_000_000);
export const wethOutgoingPercentage = 10_00 // 10%
export const wethTimeframe = 1; // per block
export const wethMaxNoCap = BigInt(1_000_000_000_000_000_000);
export const wethName = BigInt('683507597663000007791609520647202');
export const wethSymbol = BigInt('24283076290893361');
export const wethDecimals = 18;

// const token_name = BigInt('1464161352')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
// const symbol = BigInt("1464161352") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
// const decimals = 6
// const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615