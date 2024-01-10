import { getWrappedTokenInfoLeo } from "../artifacts/js/js2leo";
import {
  TokenInfo,
  WTForeignContract,
  WrappedTokenInfo,
} from "../artifacts/js/types";
import * as js2leoCommon from "../artifacts/js/js2leo/common";
import * as leo2jsCommon from "../artifacts/js/leo2js/common";
import { encodeNetworkChainId, evm2AleoArr, string2AleoArr } from "./utils";
import { hash } from "aleo-hasher";

export const ethChainId = encodeNetworkChainId("evm", 1);
export const aleoChainId = encodeNetworkChainId("aleo", 1);

// USDC Contract Address on Ethereum
export const usdcContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const usdcInfo: TokenInfo = {
  name: string2AleoArr("Wrapped USDC", 32),
  symbol: string2AleoArr("USDC", 16),
  decimals: 18,
};

export const usdcOrigin: WTForeignContract = {
  chain_id: ethChainId,
  contract_address: evm2AleoArr(usdcContractAddr),
};

const wUSDCInfo: WrappedTokenInfo = {
  token_info: usdcInfo,
  origin: usdcOrigin,
};

const wUSDCInfoLeo = getWrappedTokenInfoLeo(wUSDCInfo);
const wUSDCInfoLeoString = js2leoCommon.json(wUSDCInfoLeo);
export const wUSDCProgramAddr = hash("bhp256", wUSDCInfoLeoString, "address");

// User Address on Ethereum
export const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Token Service Contract Address on Ethereum
export const ethTsContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// Token Service Contract on Aleo
export const aleoTsContract =
  "aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3";

// Address of the council Program
export const councilProgram =
  "aleo17kz55dul4jmqmw7j3c83yh3wh82hlxnz7v2y5ccqzzj7r6yyeupq4447kp";

// User address on Aleo
export const aleoUser =
  "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

export const councilMember =
  "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

export const attestor =
  "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

export const councilThreshold = 1;

export const TOTAL_PROPOSALS_INDEX = 3;
