import { encodeNetworkChainId, evm2AleoArr, string2AleoArr } from "../../aleo/utils/utils";

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);
console.log("Sepolia Chain Id", ethChainId)
console.log("Aleo Testnet3 Id", aleoChainId)

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const wusdcTokenAddr = "aleo1h2hds9hqjjp9swqwvmy0kdarg72myk307kszu2jga7efd04afqfqmcwl4j";
export const wusdcConnectorAddr = "aleo19aner4k7m4nlg9av2t7cl3tpdlvytzc6wgwwp36pm76hmw4jmspsmcqte0";
export const wusdcHoldingAddr = "aleo1qdd7ly83nst3fte50325sxzv9jfwr2sh3fn3gl5tr793djuxgsxsnf37q8"

// User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Token Service Contract Address on Ethereum
export const ethTsContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// Token Service Contract on Aleo
export const aleoTsProgramAddr =
  "aleo1z0fa6zr78sppt6ph4kaardmkjn2vme55n8hq8ej2ds7rayxzvq8s6p9p3y";

// Address of the council Program
export const councilProgramAddr =
  "aleo1d35t6tsp8ne403vj5y9xefjeac8536en5el5f9gpkyt55wuqqqqqpuldsh";

// // User address on Aleo
export const aleoUser1 = "aleo1s567xd2j2ale8t008gf8cx82pn0784l2c22c7uemxtqcuf973cyqc6cz6t";
export const aleoUser2 = "aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn"
export const aleoUser3 = "aleo154t7wtj5putqrkjaep99zztd7za23m7jnkh6csc328aqww8c6srsqcpe8k"
export const aleoUser4 = "aleo1u4y9ntu2yegz29w4rppwvyzddyfw6scnzklf59q4ngjs5h6vqvfqqwad9n"
export const aleoUser5 = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"

export const councilThreshold = 1;

export const TOTAL_PROPOSALS_INDEX = 0;