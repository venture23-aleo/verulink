import {
  TokenMetadata,
  TokenMetadataLeo,
  TokenOwner,
  TokenOwnerLeo,
  Holder,
  HolderLeo,
  AleoProgram,
  AleoProgramLeo,
  ForeignContract,
  ForeignContractLeo,
  OutTokenMessage,
  OutTokenMessageLeo,
  InTokenMessage,
  InTokenMessageLeo,
  ChainToken,
  ChainTokenLeo,
  TsTransferOwnership,
  TsTransferOwnershipLeo,
  TsAddToken,
  TsAddTokenLeo,
  TsRemoveToken,
  TsRemoveTokenLeo,
  TsUpdateMaxMinTransfer,
  TsUpdateMaxMinTransferLeo,
  TsPauseToken,
  TsPauseTokenLeo,
  TsUnpauseToken,
  TsUnpauseTokenLeo,
  TsUpdateWithdrawalLimit,
  TsUpdateWithdrawalLimitLeo,
  HoldingRelease,
  HoldingReleaseLeo,
  HoldingReleasePrivate,
  HoldingReleasePrivateLeo,
  TransferOwnershipHolding,
  TransferOwnershipHoldingLeo,
  RegisterToken,
  RegisterTokenLeo,
  UpdateTokenMetadata,
  UpdateTokenMetadataLeo,
  SetRoleForToken,
  SetRoleForTokenLeo,
  UpdateTokenServiceSetting,
  UpdateTokenServiceSettingLeo,
  AddChainExistingToken,
  AddChainExistingTokenLeo,
  RemoveOtherChainAddresses,
  RemoveOtherChainAddressesLeo,
  UpdateFees,
  UpdateFeesLeo,
  RemoveRole,
  RemoveRoleLeo
} from "../types/vlink_token_service_council_v2";
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

export function getHolderLeo(holder: Holder): HolderLeo {
  const result: HolderLeo = {
    account: js2leo.address(holder.account),
    token_id: js2leo.field(holder.token_id),
  }
  return result;
}

export function getAleoProgramLeo(aleoProgram: AleoProgram): AleoProgramLeo {
  const result: AleoProgramLeo = {
    chain_id: js2leo.u128(aleoProgram.chain_id),
    addr: js2leo.address(aleoProgram.addr),
  }
  return result;
}

export function getForeignContractLeo(foreignContract: ForeignContract): ForeignContractLeo {
  const result: ForeignContractLeo = {
    chain_id: js2leo.u128(foreignContract.chain_id),
    addr: js2leo.array(foreignContract.addr, js2leo.u8),
  }
  return result;
}

export function getOutTokenMessageLeo(outTokenMessage: OutTokenMessage): OutTokenMessageLeo {
  const result: OutTokenMessageLeo = {
    sender_address: js2leo.address(outTokenMessage.sender_address),
    dest_token_address: js2leo.array(outTokenMessage.dest_token_address, js2leo.u8),
    amount: js2leo.u128(outTokenMessage.amount),
    receiver_address: js2leo.array(outTokenMessage.receiver_address, js2leo.u8),
  }
  return result;
}

export function getInTokenMessageLeo(inTokenMessage: InTokenMessage): InTokenMessageLeo {
  const result: InTokenMessageLeo = {
    sender_address: js2leo.array(inTokenMessage.sender_address, js2leo.u8),
    dest_token_id: js2leo.field(inTokenMessage.dest_token_id),
    amount: js2leo.u128(inTokenMessage.amount),
    receiver_address: js2leo.address(inTokenMessage.receiver_address),
  }
  return result;
}

export function getChainTokenLeo(chainToken: ChainToken): ChainTokenLeo {
  const result: ChainTokenLeo = {
    chain_id: js2leo.u128(chainToken.chain_id),
    token_id: js2leo.field(chainToken.token_id),
  }
  return result;
}

export function getTsTransferOwnershipLeo(tsTransferOwnership: TsTransferOwnership): TsTransferOwnershipLeo {
  const result: TsTransferOwnershipLeo = {
    id: js2leo.u32(tsTransferOwnership.id),
    new_owner: js2leo.address(tsTransferOwnership.new_owner),
  }
  return result;
}

export function getTsAddTokenLeo(tsAddToken: TsAddToken): TsAddTokenLeo {
  const result: TsAddTokenLeo = {
    id: js2leo.u32(tsAddToken.id),
    token_id: js2leo.field(tsAddToken.token_id),
    min_transfer: js2leo.u128(tsAddToken.min_transfer),
    max_transfer: js2leo.u128(tsAddToken.max_transfer),
    outgoing_percentage: js2leo.u32(tsAddToken.outgoing_percentage),
    time: js2leo.u32(tsAddToken.time),
    max_no_cap: js2leo.u128(tsAddToken.max_no_cap),
    token_address: js2leo.array(tsAddToken.token_address, js2leo.u8),
    token_service: js2leo.array(tsAddToken.token_service, js2leo.u8),
    chain_id: js2leo.u128(tsAddToken.chain_id),
    pub_platform_fee: js2leo.u32(tsAddToken.pub_platform_fee),
    pri_platform_fee: js2leo.u32(tsAddToken.pri_platform_fee),
    pub_relayer_fee: js2leo.u128(tsAddToken.pub_relayer_fee),
    pri_relayer_fee: js2leo.u128(tsAddToken.pri_relayer_fee),
  }
  return result;
}

export function getTsRemoveTokenLeo(tsRemoveToken: TsRemoveToken): TsRemoveTokenLeo {
  const result: TsRemoveTokenLeo = {
    id: js2leo.u32(tsRemoveToken.id),
    chain_id: js2leo.u128(tsRemoveToken.chain_id),
    token_id: js2leo.field(tsRemoveToken.token_id),
  }
  return result;
}

export function getTsUpdateMaxMinTransferLeo(tsUpdateMaxMinTransfer: TsUpdateMaxMinTransfer): TsUpdateMaxMinTransferLeo {
  const result: TsUpdateMaxMinTransferLeo = {
    id: js2leo.u32(tsUpdateMaxMinTransfer.id),
    token_id: js2leo.field(tsUpdateMaxMinTransfer.token_id),
    max_transfer: js2leo.u128(tsUpdateMaxMinTransfer.max_transfer),
    min_transfer: js2leo.u128(tsUpdateMaxMinTransfer.min_transfer),
  }
  return result;
}

export function getTsPauseTokenLeo(tsPauseToken: TsPauseToken): TsPauseTokenLeo {
  const result: TsPauseTokenLeo = {
    id: js2leo.u32(tsPauseToken.id),
    token_id: js2leo.field(tsPauseToken.token_id),
  }
  return result;
}

export function getTsUnpauseTokenLeo(tsUnpauseToken: TsUnpauseToken): TsUnpauseTokenLeo {
  const result: TsUnpauseTokenLeo = {
    id: js2leo.u32(tsUnpauseToken.id),
    token_id: js2leo.field(tsUnpauseToken.token_id),
  }
  return result;
}

export function getTsUpdateWithdrawalLimitLeo(tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimit): TsUpdateWithdrawalLimitLeo {
  const result: TsUpdateWithdrawalLimitLeo = {
    id: js2leo.u32(tsUpdateWithdrawalLimit.id),
    token_id: js2leo.field(tsUpdateWithdrawalLimit.token_id),
    percentage: js2leo.u32(tsUpdateWithdrawalLimit.percentage),
    duration: js2leo.u32(tsUpdateWithdrawalLimit.duration),
    threshold_no_limit: js2leo.u128(tsUpdateWithdrawalLimit.threshold_no_limit),
  }
  return result;
}

export function getHoldingReleaseLeo(holdingRelease: HoldingRelease): HoldingReleaseLeo {
  const result: HoldingReleaseLeo = {
    id: js2leo.u32(holdingRelease.id),
    token_id: js2leo.field(holdingRelease.token_id),
    receiver: js2leo.address(holdingRelease.receiver),
    amount: js2leo.u128(holdingRelease.amount),
  }
  return result;
}

export function getHoldingReleasePrivateLeo(holdingReleasePrivate: HoldingReleasePrivate): HoldingReleasePrivateLeo {
  const result: HoldingReleasePrivateLeo = {
    id: js2leo.u32(holdingReleasePrivate.id),
    token_id: js2leo.field(holdingReleasePrivate.token_id),
    pre_image: js2leo.field(holdingReleasePrivate.pre_image),
    receiver: js2leo.address(holdingReleasePrivate.receiver),
    amount: js2leo.u128(holdingReleasePrivate.amount),
  }
  return result;
}

export function getTransferOwnershipHoldingLeo(transferOwnershipHolding: TransferOwnershipHolding): TransferOwnershipHoldingLeo {
  const result: TransferOwnershipHoldingLeo = {
    id: js2leo.u32(transferOwnershipHolding.id),
    new_owner: js2leo.address(transferOwnershipHolding.new_owner),
  }
  return result;
}

export function getRegisterTokenLeo(registerToken: RegisterToken): RegisterTokenLeo {
  const result: RegisterTokenLeo = {
    id: js2leo.u32(registerToken.id),
    token_name: js2leo.u128(registerToken.token_name),
    symbol: js2leo.u128(registerToken.symbol),
    decimals: js2leo.u8(registerToken.decimals),
    max_supply: js2leo.u128(registerToken.max_supply),
  }
  return result;
}

export function getUpdateTokenMetadataLeo(updateTokenMetadata: UpdateTokenMetadata): UpdateTokenMetadataLeo {
  const result: UpdateTokenMetadataLeo = {
    id: js2leo.u32(updateTokenMetadata.id),
    token_id: js2leo.field(updateTokenMetadata.token_id),
    admin: js2leo.address(updateTokenMetadata.admin),
    external_authorization_party: js2leo.address(updateTokenMetadata.external_authorization_party),
  }
  return result;
}

export function getSetRoleForTokenLeo(setRoleForToken: SetRoleForToken): SetRoleForTokenLeo {
  const result: SetRoleForTokenLeo = {
    id: js2leo.u32(setRoleForToken.id),
    token_id: js2leo.field(setRoleForToken.token_id),
    account: js2leo.address(setRoleForToken.account),
    role: js2leo.u8(setRoleForToken.role),
  }
  return result;
}

export function getUpdateTokenServiceSettingLeo(updateTokenServiceSetting: UpdateTokenServiceSetting): UpdateTokenServiceSettingLeo {
  const result: UpdateTokenServiceSettingLeo = {
    id: js2leo.u32(updateTokenServiceSetting.id),
    chain_id: js2leo.u128(updateTokenServiceSetting.chain_id),
    token_id: js2leo.field(updateTokenServiceSetting.token_id),
    token_service_address: js2leo.array(updateTokenServiceSetting.token_service_address, js2leo.u8),
    token_address: js2leo.array(updateTokenServiceSetting.token_address, js2leo.u8),
  }
  return result;
}

export function getAddChainExistingTokenLeo(addChainExistingToken: AddChainExistingToken): AddChainExistingTokenLeo {
  const result: AddChainExistingTokenLeo = {
    id: js2leo.u32(addChainExistingToken.id),
    chain_id: js2leo.u128(addChainExistingToken.chain_id),
    token_id: js2leo.field(addChainExistingToken.token_id),
    token_service_address: js2leo.array(addChainExistingToken.token_service_address, js2leo.u8),
    token_address: js2leo.array(addChainExistingToken.token_address, js2leo.u8),
    pub_platform_fee: js2leo.u32(addChainExistingToken.pub_platform_fee),
    pri_platform_fee: js2leo.u32(addChainExistingToken.pri_platform_fee),
    pub_relayer_fee: js2leo.u128(addChainExistingToken.pub_relayer_fee),
    pri_relayer_fee: js2leo.u128(addChainExistingToken.pri_relayer_fee),
  }
  return result;
}

export function getRemoveOtherChainAddressesLeo(removeOtherChainAddresses: RemoveOtherChainAddresses): RemoveOtherChainAddressesLeo {
  const result: RemoveOtherChainAddressesLeo = {
    id: js2leo.u32(removeOtherChainAddresses.id),
    chain_id: js2leo.u128(removeOtherChainAddresses.chain_id),
    token_id: js2leo.field(removeOtherChainAddresses.token_id),
  }
  return result;
}

export function getUpdateFeesLeo(updateFees: UpdateFees): UpdateFeesLeo {
  const result: UpdateFeesLeo = {
    id: js2leo.u32(updateFees.id),
    chain_id: js2leo.u128(updateFees.chain_id),
    token_id: js2leo.field(updateFees.token_id),
    public_relayer_fee: js2leo.u128(updateFees.public_relayer_fee),
    private_relayer_fee: js2leo.u128(updateFees.private_relayer_fee),
    public_platform_fee: js2leo.u32(updateFees.public_platform_fee),
    private_platform_fee: js2leo.u32(updateFees.private_platform_fee),
  }
  return result;
}

export function getRemoveRoleLeo(removeRole: RemoveRole): RemoveRoleLeo {
  const result: RemoveRoleLeo = {
    id: js2leo.u32(removeRole.id),
    token_id: js2leo.field(removeRole.token_id),
    account: js2leo.address(removeRole.account),
  }
  return result;
}