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

import * as js2leo from "./common";
export function getwrapped_tokenLeo(wrapped_token: wrapped_token): wrapped_tokenLeo {
  const result: wrapped_tokenLeo = {
    owner: js2leo.privateField(js2leo.address(wrapped_token.owner)),
    token_id: js2leo.privateField(js2leo.address(wrapped_token.token_id)),
    amount: js2leo.privateField(js2leo.u64(wrapped_token.amount)),
    _nonce: js2leo.publicField(js2leo.group(wrapped_token._nonce)),
  }
  return result;
}

export function getWTForeignContractLeo(wTForeignContract: WTForeignContract): WTForeignContractLeo {
  const result: WTForeignContractLeo = {
    chain_id: js2leo.u128(wTForeignContract.chain_id),
    contract_address: js2leo.array(wTForeignContract.contract_address, js2leo.u8),
  }
  return result;
}

export function getTokenInfoLeo(tokenInfo: TokenInfo): TokenInfoLeo {
  const result: TokenInfoLeo = {
    name: js2leo.array(tokenInfo.name, js2leo.u8),
    symbol: js2leo.array(tokenInfo.symbol, js2leo.u8),
    decimals: js2leo.u8(tokenInfo.decimals),
  }
  return result;
}

export function getWrappedTokenInfoLeo(wrappedTokenInfo: WrappedTokenInfo): WrappedTokenInfoLeo {
  const result: WrappedTokenInfoLeo = {
    token_info: getTokenInfoLeo(wrappedTokenInfo.token_info),
    origin: getWTForeignContractLeo(wrappedTokenInfo.origin),
  }
  return result;
}

export function getTokenAccountLeo(tokenAccount: TokenAccount): TokenAccountLeo {
  const result: TokenAccountLeo = {
    user: js2leo.address(tokenAccount.user),
    token_id: js2leo.address(tokenAccount.token_id),
  }
  return result;
}