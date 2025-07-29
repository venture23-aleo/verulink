import {
  TokenMetadata,
  TokenMetadataLeo,
  TokenOwner,
  TokenOwnerLeo,
  Image,
  ImageLeo,
  Holder,
  HolderLeo
} from "../types/vlink_holding_v2";
import {
  leo2js,
  tx,
  parseJSONLikeString
} from "@doko-js/core";
import {
  PrivateKey
} from "@provablehq/sdk"


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

export function getImage(image: ImageLeo): Image {
  const result: Image = {
    pre_image: leo2js.field(image.pre_image),
    receiver: leo2js.address(image.receiver),
  }
  return result;
}

export function getHolder(holder: HolderLeo): Holder {
  const result: Holder = {
    account: leo2js.address(holder.account),
    token_id: leo2js.field(holder.token_id),
  }
  return result;
}