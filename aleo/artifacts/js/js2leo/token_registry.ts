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
  js2leo
} from "@doko-js/core";


export function getTokenLeo(token: Token): TokenLeo {
  const result: TokenLeo = {
    owner: js2leo.privateField(js2leo.address(token.owner)),
    amount: js2leo.privateField(js2leo.u128(token.amount)),
    token_id: js2leo.privateField(js2leo.field(token.token_id)),
    external_authorization_required: js2leo.privateField(js2leo.boolean(token.external_authorization_required)),
    authorized_until: js2leo.privateField(js2leo.u32(token.authorized_until)),
    _nonce: js2leo.publicField(js2leo.group(token._nonce)),
  }
  return result;
}

export function getTokenMetadataLeo(tokenMetadata: TokenMetadata): TokenMetadataLeo {
  const result: TokenMetadataLeo = {
    token_id: js2leo.field(tokenMetadata.token_id),
    name: js2leo.u128(tokenMetadata.name),
    symbol: js2leo.u128(tokenMetadata.symbol),
    decimals: js2leo.u8(tokenMetadata.decimals),
    supply: js2leo.u128(tokenMetadata.supply),
    max_supply: js2leo.u128(tokenMetadata.max_supply),
    admin: js2leo.address(tokenMetadata.admin),
    external_authorization_required: js2leo.boolean(tokenMetadata.external_authorization_required),
    external_authorization_party: js2leo.address(tokenMetadata.external_authorization_party),
  }
  return result;
}

export function getTokenOwnerLeo(tokenOwner: TokenOwner): TokenOwnerLeo {
  const result: TokenOwnerLeo = {
    account: js2leo.address(tokenOwner.account),
    token_id: js2leo.field(tokenOwner.token_id),
  }
  return result;
}

export function getBalanceLeo(balance: Balance): BalanceLeo {
  const result: BalanceLeo = {
    token_id: js2leo.field(balance.token_id),
    account: js2leo.address(balance.account),
    balance: js2leo.u128(balance.balance),
    authorized_until: js2leo.u32(balance.authorized_until),
  }
  return result;
}

export function getAllowanceLeo(allowance: Allowance): AllowanceLeo {
  const result: AllowanceLeo = {
    account: js2leo.address(allowance.account),
    spender: js2leo.address(allowance.spender),
    token_id: js2leo.field(allowance.token_id),
  }
  return result;
}