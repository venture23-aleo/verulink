import {
  wrapped_token,
  wrapped_tokenLeo,
  WTForeignContract,
  WTForeignContractLeo,
  TokenInfo,
  TokenInfoLeo,
  WrappedTokenInfo,
  WrappedTokenInfoLeo,
  TokenAccount,
  TokenAccountLeo,
} from "../types";

import * as leo2js from "./common";
export function getwrapped_token(wrapped_token: wrapped_tokenLeo): wrapped_token {
  const result: wrapped_token = {
    owner: leo2js.address(wrapped_token.owner),
    token_id: leo2js.address(wrapped_token.token_id),
    amount: leo2js.u64(wrapped_token.amount),
    _nonce: leo2js.group(wrapped_token._nonce),
  }
  return result;
}

export function getWTForeignContract(wTForeignContract: WTForeignContractLeo): WTForeignContract {
  const result: WTForeignContract = {
    chain_id: leo2js.u128(wTForeignContract.chain_id),
    contract_address: leo2js.array(wTForeignContract.contract_address, leo2js.u8),
  }
  return result;
}

export function getTokenInfo(tokenInfo: TokenInfoLeo): TokenInfo {
  const result: TokenInfo = {
    name: leo2js.array(tokenInfo.name, leo2js.u8),
    symbol: leo2js.array(tokenInfo.symbol, leo2js.u8),
    decimals: leo2js.u8(tokenInfo.decimals),
  }
  return result;
}

export function getWrappedTokenInfo(wrappedTokenInfo: WrappedTokenInfoLeo): WrappedTokenInfo {
  const result: WrappedTokenInfo = {
    token_info: getTokenInfo(wrappedTokenInfo.token_info),
    origin: getWTForeignContract(wrappedTokenInfo.origin),
  }
  return result;
}

export function getTokenAccount(tokenAccount: TokenAccountLeo): TokenAccount {
  const result: TokenAccount = {
    user: leo2js.address(tokenAccount.user),
    token_id: leo2js.address(tokenAccount.token_id),
  }
  return result;
}