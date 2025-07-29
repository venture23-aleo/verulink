import {
  z
} from "zod";
import {
  leoAddressSchema,
  leoPrivateKeySchema,
  leoViewKeySchema,
  leoTxIdSchema,
  leoScalarSchema,
  leoFieldSchema,
  leoBooleanSchema,
  leoU8Schema,
  leoU16Schema,
  leoU32Schema,
  leoU64Schema,
  leoU128Schema,
  leoGroupSchema,
  leoRecordSchema,
  leoTxSchema,
  leoSignatureSchema,
  LeoArray,
  LeoAddress,
  ExternalRecord,
  tx
} from "@doko-js/core";

export interface TokenMetadata {
  token_id: bigint;
  name: bigint;
  symbol: bigint;
  decimals: number;
  supply: bigint;
  max_supply: bigint;
  admin: LeoAddress;
  external_authorization_required: boolean;
  external_authorization_party: LeoAddress;
}

export const leoTokenMetadataSchema = z.object({
  token_id: leoFieldSchema,
  name: leoU128Schema,
  symbol: leoU128Schema,
  decimals: leoU8Schema,
  supply: leoU128Schema,
  max_supply: leoU128Schema,
  admin: leoAddressSchema,
  external_authorization_required: leoBooleanSchema,
  external_authorization_party: leoAddressSchema,
});
export type TokenMetadataLeo = z.infer < typeof leoTokenMetadataSchema > ;

export interface TokenOwner {
  account: LeoAddress;
  token_id: bigint;
}

export const leoTokenOwnerSchema = z.object({
  account: leoAddressSchema,
  token_id: leoFieldSchema,
});
export type TokenOwnerLeo = z.infer < typeof leoTokenOwnerSchema > ;

export interface Holder {
  account: LeoAddress;
  token_id: bigint;
}

export const leoHolderSchema = z.object({
  account: leoAddressSchema,
  token_id: leoFieldSchema,
});
export type HolderLeo = z.infer < typeof leoHolderSchema > ;

export interface AleoProgram {
  chain_id: bigint;
  addr: LeoAddress;
}

export const leoAleoProgramSchema = z.object({
  chain_id: leoU128Schema,
  addr: leoAddressSchema,
});
export type AleoProgramLeo = z.infer < typeof leoAleoProgramSchema > ;

export interface ForeignContract {
  chain_id: bigint;
  addr: Array < number > ;
}

export const leoForeignContractSchema = z.object({
  chain_id: leoU128Schema,
  addr: z.array(leoU8Schema).length(32),
});
export type ForeignContractLeo = z.infer < typeof leoForeignContractSchema > ;

export interface OutTokenMessage {
  sender_address: LeoAddress;
  dest_token_address: Array < number > ;
  amount: bigint;
  receiver_address: Array < number > ;
}

export const leoOutTokenMessageSchema = z.object({
  sender_address: leoAddressSchema,
  dest_token_address: z.array(leoU8Schema).length(32),
  amount: leoU128Schema,
  receiver_address: z.array(leoU8Schema).length(32),
});
export type OutTokenMessageLeo = z.infer < typeof leoOutTokenMessageSchema > ;

export interface InTokenMessage {
  sender_address: Array < number > ;
  dest_token_id: bigint;
  amount: bigint;
  receiver_address: LeoAddress;
}

export const leoInTokenMessageSchema = z.object({
  sender_address: z.array(leoU8Schema).length(32),
  dest_token_id: leoFieldSchema,
  amount: leoU128Schema,
  receiver_address: leoAddressSchema,
});
export type InTokenMessageLeo = z.infer < typeof leoInTokenMessageSchema > ;

export interface ChainToken {
  chain_id: bigint;
  token_id: bigint;
}

export const leoChainTokenSchema = z.object({
  chain_id: leoU128Schema,
  token_id: leoFieldSchema,
});
export type ChainTokenLeo = z.infer < typeof leoChainTokenSchema > ;

export interface TsTransferOwnership {
  id: number;
  new_owner: LeoAddress;
}

export const leoTsTransferOwnershipSchema = z.object({
  id: leoU32Schema,
  new_owner: leoAddressSchema,
});
export type TsTransferOwnershipLeo = z.infer < typeof leoTsTransferOwnershipSchema > ;

export interface TsAddToken {
  id: number;
  token_id: bigint;
  min_transfer: bigint;
  max_transfer: bigint;
  outgoing_percentage: number;
  time: number;
  max_no_cap: bigint;
  token_address: Array < number > ;
  token_service: Array < number > ;
  chain_id: bigint;
  pub_platform_fee: number;
  pri_platform_fee: number;
  pub_relayer_fee: bigint;
  pri_relayer_fee: bigint;
}

export const leoTsAddTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  min_transfer: leoU128Schema,
  max_transfer: leoU128Schema,
  outgoing_percentage: leoU32Schema,
  time: leoU32Schema,
  max_no_cap: leoU128Schema,
  token_address: z.array(leoU8Schema).length(20),
  token_service: z.array(leoU8Schema).length(20),
  chain_id: leoU128Schema,
  pub_platform_fee: leoU32Schema,
  pri_platform_fee: leoU32Schema,
  pub_relayer_fee: leoU128Schema,
  pri_relayer_fee: leoU128Schema,
});
export type TsAddTokenLeo = z.infer < typeof leoTsAddTokenSchema > ;

export interface TsRemoveToken {
  id: number;
  chain_id: bigint;
  token_id: bigint;
}

export const leoTsRemoveTokenSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
  token_id: leoFieldSchema,
});
export type TsRemoveTokenLeo = z.infer < typeof leoTsRemoveTokenSchema > ;

export interface TsUpdateMaxMinTransfer {
  id: number;
  token_id: bigint;
  max_transfer: bigint;
  min_transfer: bigint;
}

export const leoTsUpdateMaxMinTransferSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  max_transfer: leoU128Schema,
  min_transfer: leoU128Schema,
});
export type TsUpdateMaxMinTransferLeo = z.infer < typeof leoTsUpdateMaxMinTransferSchema > ;

export interface TsPauseToken {
  id: number;
  token_id: bigint;
}

export const leoTsPauseTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
});
export type TsPauseTokenLeo = z.infer < typeof leoTsPauseTokenSchema > ;

export interface TsUnpauseToken {
  id: number;
  token_id: bigint;
}

export const leoTsUnpauseTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
});
export type TsUnpauseTokenLeo = z.infer < typeof leoTsUnpauseTokenSchema > ;

export interface TsUpdateWithdrawalLimit {
  id: number;
  token_id: bigint;
  percentage: number;
  duration: number;
  threshold_no_limit: bigint;
}

export const leoTsUpdateWithdrawalLimitSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  percentage: leoU32Schema,
  duration: leoU32Schema,
  threshold_no_limit: leoU128Schema,
});
export type TsUpdateWithdrawalLimitLeo = z.infer < typeof leoTsUpdateWithdrawalLimitSchema > ;

export interface HoldingRelease {
  id: number;
  token_id: bigint;
  receiver: LeoAddress;
  amount: bigint;
}

export const leoHoldingReleaseSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  receiver: leoAddressSchema,
  amount: leoU128Schema,
});
export type HoldingReleaseLeo = z.infer < typeof leoHoldingReleaseSchema > ;

export interface HoldingReleasePrivate {
  id: number;
  token_id: bigint;
  pre_image: bigint;
  receiver: LeoAddress;
  amount: bigint;
}

export const leoHoldingReleasePrivateSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  pre_image: leoFieldSchema,
  receiver: leoAddressSchema,
  amount: leoU128Schema,
});
export type HoldingReleasePrivateLeo = z.infer < typeof leoHoldingReleasePrivateSchema > ;

export interface TransferOwnershipHolding {
  id: number;
  new_owner: LeoAddress;
}

export const leoTransferOwnershipHoldingSchema = z.object({
  id: leoU32Schema,
  new_owner: leoAddressSchema,
});
export type TransferOwnershipHoldingLeo = z.infer < typeof leoTransferOwnershipHoldingSchema > ;

export interface RegisterToken {
  id: number;
  token_name: bigint;
  symbol: bigint;
  decimals: number;
  max_supply: bigint;
}

export const leoRegisterTokenSchema = z.object({
  id: leoU32Schema,
  token_name: leoU128Schema,
  symbol: leoU128Schema,
  decimals: leoU8Schema,
  max_supply: leoU128Schema,
});
export type RegisterTokenLeo = z.infer < typeof leoRegisterTokenSchema > ;

export interface UpdateTokenMetadata {
  id: number;
  token_id: bigint;
  admin: LeoAddress;
  external_authorization_party: LeoAddress;
}

export const leoUpdateTokenMetadataSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  admin: leoAddressSchema,
  external_authorization_party: leoAddressSchema,
});
export type UpdateTokenMetadataLeo = z.infer < typeof leoUpdateTokenMetadataSchema > ;

export interface SetRoleForToken {
  id: number;
  token_id: bigint;
  account: LeoAddress;
  role: number;
}

export const leoSetRoleForTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  account: leoAddressSchema,
  role: leoU8Schema,
});
export type SetRoleForTokenLeo = z.infer < typeof leoSetRoleForTokenSchema > ;

export interface UpdateTokenServiceSetting {
  id: number;
  chain_id: bigint;
  token_id: bigint;
  token_service_address: Array < number > ;
  token_address: Array < number > ;
}

export const leoUpdateTokenServiceSettingSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
  token_id: leoFieldSchema,
  token_service_address: z.array(leoU8Schema).length(20),
  token_address: z.array(leoU8Schema).length(20),
});
export type UpdateTokenServiceSettingLeo = z.infer < typeof leoUpdateTokenServiceSettingSchema > ;

export interface AddChainExistingToken {
  id: number;
  chain_id: bigint;
  token_id: bigint;
  token_service_address: Array < number > ;
  token_address: Array < number > ;
  pub_platform_fee: number;
  pri_platform_fee: number;
  pub_relayer_fee: bigint;
  pri_relayer_fee: bigint;
}

export const leoAddChainExistingTokenSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
  token_id: leoFieldSchema,
  token_service_address: z.array(leoU8Schema).length(20),
  token_address: z.array(leoU8Schema).length(20),
  pub_platform_fee: leoU32Schema,
  pri_platform_fee: leoU32Schema,
  pub_relayer_fee: leoU128Schema,
  pri_relayer_fee: leoU128Schema,
});
export type AddChainExistingTokenLeo = z.infer < typeof leoAddChainExistingTokenSchema > ;

export interface RemoveOtherChainAddresses {
  id: number;
  chain_id: bigint;
  token_id: bigint;
}

export const leoRemoveOtherChainAddressesSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
  token_id: leoFieldSchema,
});
export type RemoveOtherChainAddressesLeo = z.infer < typeof leoRemoveOtherChainAddressesSchema > ;

export interface UpdateFees {
  id: number;
  chain_id: bigint;
  token_id: bigint;
  public_relayer_fee: bigint;
  private_relayer_fee: bigint;
  public_platform_fee: number;
  private_platform_fee: number;
}

export const leoUpdateFeesSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
  token_id: leoFieldSchema,
  public_relayer_fee: leoU128Schema,
  private_relayer_fee: leoU128Schema,
  public_platform_fee: leoU32Schema,
  private_platform_fee: leoU32Schema,
});
export type UpdateFeesLeo = z.infer < typeof leoUpdateFeesSchema > ;

export interface RemoveRole {
  id: number;
  token_id: bigint;
  account: LeoAddress;
}

export const leoRemoveRoleSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  account: leoAddressSchema,
});
export type RemoveRoleLeo = z.infer < typeof leoRemoveRoleSchema > ;