import {
  Token,
  TokenLeo,
  TokenMetadata,
  TokenMetadataLeo,
  TokenOwner,
  TokenOwnerLeo,
  Balance,
  BalanceLeo,
  Allowance,
  AllowanceLeo
} from "../types/token_registry";
import {
  leo2js,
  tx,
  parseJSONLikeString
} from "@doko-js/core";
import {
  PrivateKey
} from "@provablehq/sdk"


export function getToken(token: TokenLeo): Token {
  const result: Token = {
    owner: leo2js.address(token.owner),
    amount: leo2js.u128(token.amount),
    token_id: leo2js.field(token.token_id),
    external_authorization_required: leo2js.boolean(token.external_authorization_required),
    authorized_until: leo2js.u32(token.authorized_until),
    _nonce: leo2js.group(token._nonce),
  }
  return result;
}


export function decryptToken(token: tx.RecordOutput < Token > | string, privateKey: string): Token {
  const encodedRecord: string = typeof token === 'string' ? token : token.value;
  const decodedRecord: string = PrivateKey.from_string(privateKey).to_view_key().decrypt(encodedRecord);
  const result: Token = getToken(parseJSONLikeString(decodedRecord));

  return result;
}

export function getTokenMetadata(tokenMetadata: TokenMetadataLeo): TokenMetadata {
  const result: TokenMetadata = {
    token_id: leo2js.field(tokenMetadata.token_id),
    name: leo2js.u128(tokenMetadata.name),
    symbol: leo2js.u128(tokenMetadata.symbol),
    decimals: leo2js.u8(tokenMetadata.decimals),
    supply: leo2js.u128(tokenMetadata.supply),
    max_supply: leo2js.u128(tokenMetadata.max_supply),
    admin: leo2js.address(tokenMetadata.admin),
    external_authorization_required: leo2js.boolean(tokenMetadata.external_authorization_required),
    external_authorization_party: leo2js.address(tokenMetadata.external_authorization_party),
  }
  return result;
}

export function getTokenOwner(tokenOwner: TokenOwnerLeo): TokenOwner {
  const result: TokenOwner = {
    account: leo2js.address(tokenOwner.account),
    token_id: leo2js.field(tokenOwner.token_id),
  }
  return result;
}

export function getBalance(balance: BalanceLeo): Balance {
  const result: Balance = {
    token_id: leo2js.field(balance.token_id),
    account: leo2js.address(balance.account),
    balance: leo2js.u128(balance.balance),
    authorized_until: leo2js.u32(balance.authorized_until),
  }
  return result;
}

export function getAllowance(allowance: AllowanceLeo): Allowance {
  const result: Allowance = {
    account: leo2js.address(allowance.account),
    spender: leo2js.address(allowance.spender),
    token_id: leo2js.field(allowance.token_id),
  }
  return result;
}