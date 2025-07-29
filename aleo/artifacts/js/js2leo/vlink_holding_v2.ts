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
  js2leo
} from "@doko-js/core";


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

export function getImageLeo(image: Image): ImageLeo {
  const result: ImageLeo = {
    pre_image: js2leo.field(image.pre_image),
    receiver: js2leo.address(image.receiver),
  }
  return result;
}

export function getHolderLeo(holder: Holder): HolderLeo {
  const result: HolderLeo = {
    account: js2leo.address(holder.account),
    token_id: js2leo.field(holder.token_id),
  }
  return result;
}