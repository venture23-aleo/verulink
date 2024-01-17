import { encodeNetworkChainId, evm2AleoArr, string2AleoArr } from "../utils/utils";

const sepoliaChainId = 11155111
export const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);
export const aleoChainId = encodeNetworkChainId("aleo", 3);

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const wusdcTokenAddr = "aleo1qg0azcck30ys6598lpmfx9xpfazj9w7ma973g7l5p7eka0p4jq9s2c3vk2";

export const wusdcConnectorAddr = "aleo1l9a39hr7kyuccdw5m3lmz45qjzx3v3mz5a2jfveqkztyr0u0p58s79tre8";
export const wusdcHoldingAddr = "aleo16dyvhwsrfmx5eru9kffhn6df8cr3v3h06apqzsrphl6h03wa2crq43djr6"

// // User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// // Token Service Contract Address on Ethereum
export const ethTsContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// // Token Service Contract on Aleo
export const aleoTsContract =
  "aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3";

// // Address of the council Program
export const councilProgram =
  "aleo17kz55dul4jmqmw7j3c83yh3wh82hlxnz7v2y5ccqzzj7r6yyeupq4447kp";

// // User address on Aleo
export const aleoUser1 = "aleo1zyt7ldc0t3ung0h5sg4k65wjtnmsa6hatagjccxr7s84h93tpuxqf9zse9";
export const aleoUser2 = "aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn"
export const aleoUser3 = "aleo154t7wtj5putqrkjaep99zztd7za23m7jnkh6csc328aqww8c6srsqcpe8k"
export const aleoUser4 = "aleo1u4y9ntu2yegz29w4rppwvyzddyfw6scnzklf59q4ngjs5h6vqvfqqwad9n"
export const aleoUser5 = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"

export const councilThreshold = 1;

export const TOTAL_PROPOSALS_INDEX = 0;
