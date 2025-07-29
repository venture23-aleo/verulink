import credits.aleo;
import token_registry.aleo;
import vlink_council_v2.aleo;
import vlink_holding_v2.aleo;
import vlink_token_bridge_v2.aleo;
import vlink_token_service_v2.aleo;
program vlink_token_service_council_v2.aleo;

struct TokenMetadata:
    token_id as field;
    name as u128;
    symbol as u128;
    decimals as u8;
    supply as u128;
    max_supply as u128;
    admin as address;
    external_authorization_required as boolean;
    external_authorization_party as address;

struct TokenOwner:
    account as address;
    token_id as field;

struct Holder:
    account as address;
    token_id as field;

struct AleoProgram:
    chain_id as u128;
    addr as address;

struct ForeignContract:
    chain_id as u128;
    addr as [u8; 32u32];

struct OutTokenMessage:
    sender_address as address;
    dest_token_address as [u8; 32u32];
    amount as u128;
    receiver_address as [u8; 32u32];

struct InTokenMessage:
    sender_address as [u8; 32u32];
    dest_token_id as field;
    amount as u128;
    receiver_address as address;

struct ChainToken:
    chain_id as u128;
    token_id as field;

struct TsTransferOwnership:
    id as u32;
    new_owner as address;

struct TsAddToken:
    id as u32;
    token_id as field;
    min_transfer as u128;
    max_transfer as u128;
    outgoing_percentage as u32;
    time as u32;
    max_no_cap as u128;
    token_address as [u8; 20u32];
    token_service as [u8; 20u32];
    chain_id as u128;
    pub_platform_fee as u32;
    pri_platform_fee as u32;
    pub_relayer_fee as u128;
    pri_relayer_fee as u128;

struct TsRemoveToken:
    id as u32;
    chain_id as u128;
    token_id as field;

struct TsUpdateMaxMinTransfer:
    id as u32;
    token_id as field;
    max_transfer as u128;
    min_transfer as u128;

struct TsPauseToken:
    id as u32;
    token_id as field;

struct TsUnpauseToken:
    id as u32;
    token_id as field;

struct TsUpdateWithdrawalLimit:
    id as u32;
    token_id as field;
    percentage as u32;
    duration as u32;
    threshold_no_limit as u128;

struct HoldingRelease:
    id as u32;
    token_id as field;
    receiver as address;
    amount as u128;

struct HoldingReleasePrivate:
    id as u32;
    token_id as field;
    pre_image as field;
    receiver as address;
    amount as u128;

struct TransferOwnershipHolding:
    id as u32;
    new_owner as address;

struct RegisterToken:
    id as u32;
    token_name as u128;
    symbol as u128;
    decimals as u8;
    max_supply as u128;

struct UpdateTokenMetadata:
    id as u32;
    token_id as field;
    admin as address;
    external_authorization_party as address;

struct SetRoleForToken:
    id as u32;
    token_id as field;
    account as address;
    role as u8;

struct UpdateTokenServiceSetting:
    id as u32;
    chain_id as u128;
    token_id as field;
    token_service_address as [u8; 20u32];
    token_address as [u8; 20u32];

struct AddChainExistingToken:
    id as u32;
    chain_id as u128;
    token_id as field;
    token_service_address as [u8; 20u32];
    token_address as [u8; 20u32];
    pub_platform_fee as u32;
    pri_platform_fee as u32;
    pub_relayer_fee as u128;
    pri_relayer_fee as u128;

struct RemoveOtherChainAddresses:
    id as u32;
    chain_id as u128;
    token_id as field;

struct UpdateFees:
    id as u32;
    chain_id as u128;
    token_id as field;
    public_relayer_fee as u128;
    private_relayer_fee as u128;
    public_platform_fee as u32;
    private_platform_fee as u32;

struct RemoveRole:
    id as u32;
    token_id as field;
    account as address;

function remove_role:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as RemoveRole;
    hash.bhp256 r4 into r5 as field;
    call token_registry.aleo/remove_role r1 r2 into r6;
    call vlink_council_v2.aleo/external_execute r0 r5 r3 into r7;
    async remove_role r6 r7 into r8;
    output r8 as vlink_token_service_council_v2.aleo/remove_role.future;

finalize remove_role:
    input r0 as token_registry.aleo/remove_role.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function holding_release:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as [address; 5u32].public;
    cast r0 r1 r2 r3 into r5 as HoldingRelease;
    hash.bhp256 r5 into r6 as field;
    call vlink_token_service_v2.aleo/holding_release r1 r2 r3 into r7;
    call vlink_council_v2.aleo/external_execute r0 r6 r4 into r8;
    async holding_release r7 r8 into r9;
    output r9 as vlink_token_service_council_v2.aleo/holding_release.future;

finalize holding_release:
    input r0 as vlink_token_service_v2.aleo/holding_release.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function holding_release_private:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as address.private;
    input r3 as field.private;
    input r4 as u128.public;
    input r5 as [address; 5u32].public;
    cast r0 r1 r3 r2 r4 into r6 as HoldingReleasePrivate;
    hash.bhp256 r6 into r7 as field;
    call vlink_token_service_v2.aleo/holding_release_private r1 r2 r3 r4 into r8 r9;
    call vlink_council_v2.aleo/external_execute r0 r7 r5 into r10;
    async holding_release_private r9 r10 into r11;
    output r8 as token_registry.aleo/Token.record;
    output r11 as vlink_token_service_council_v2.aleo/holding_release_private.future;

finalize holding_release_private:
    input r0 as vlink_token_service_v2.aleo/holding_release_private.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_transfer_ownership:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TsTransferOwnership;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v2.aleo/transfer_ownership_ts r1 into r5;
    call vlink_council_v2.aleo/external_execute r0 r4 r2 into r6;
    async ts_transfer_ownership r5 r6 into r7;
    output r7 as vlink_token_service_council_v2.aleo/ts_transfer_ownership.future;

finalize ts_transfer_ownership:
    input r0 as vlink_token_service_v2.aleo/transfer_ownership_ts.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_add_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as u32.public;
    input r5 as u32.public;
    input r6 as u128.public;
    input r7 as [address; 5u32].public;
    input r8 as [u8; 20u32].public;
    input r9 as [u8; 20u32].public;
    input r10 as u128.public;
    input r11 as u32.public;
    input r12 as u32.public;
    input r13 as u128.public;
    input r14 as u128.public;
    cast r0 r1 r2 r3 r4 r5 r6 r8 r9 r10 r11 r12 r13 r14 into r15 as TsAddToken;
    hash.bhp256 r15 into r16 as field;
    call vlink_token_service_v2.aleo/add_token_ts r1 r2 r3 r4 r5 r6 r8 r9 r10 r11 r12 r13 r14 into r17;
    call vlink_council_v2.aleo/external_execute r0 r16 r7 into r18;
    async ts_add_token r17 r18 into r19;
    output r19 as vlink_token_service_council_v2.aleo/ts_add_token.future;

finalize ts_add_token:
    input r0 as vlink_token_service_v2.aleo/add_token_ts.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_remove_token:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as TsRemoveToken;
    hash.bhp256 r4 into r5 as field;
    call vlink_token_service_v2.aleo/remove_token_ts r1 r2 into r6;
    call vlink_council_v2.aleo/external_execute r0 r5 r3 into r7;
    async ts_remove_token r6 r7 into r8;
    output r8 as vlink_token_service_council_v2.aleo/ts_remove_token.future;

finalize ts_remove_token:
    input r0 as vlink_token_service_v2.aleo/remove_token_ts.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_max_min_transfer:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as [address; 5u32].public;
    cast r0 r1 r3 r2 into r5 as TsUpdateMaxMinTransfer;
    hash.bhp256 r5 into r6 as field;
    call vlink_token_service_v2.aleo/update_min_transfer_ts r1 r2 into r7;
    call vlink_token_service_v2.aleo/update_max_transfer_ts r1 r3 into r8;
    call vlink_council_v2.aleo/external_execute r0 r6 r4 into r9;
    async ts_update_max_min_transfer r7 r8 r9 into r10;
    output r10 as vlink_token_service_council_v2.aleo/ts_update_max_min_transfer.future;

finalize ts_update_max_min_transfer:
    input r0 as vlink_token_service_v2.aleo/update_min_transfer_ts.future;
    input r1 as vlink_token_service_v2.aleo/update_max_transfer_ts.future;
    input r2 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;
    await r2;

function ts_pause_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TsPauseToken;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v2.aleo/pause_token_ts r1 into r5;
    call vlink_council_v2.aleo/external_execute r0 r4 r2 into r6;
    async ts_pause_token r5 r6 into r7;
    output r7 as vlink_token_service_council_v2.aleo/ts_pause_token.future;

finalize ts_pause_token:
    input r0 as vlink_token_service_v2.aleo/pause_token_ts.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_unpause_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TsUnpauseToken;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v2.aleo/unpause_token_ts r1 into r5;
    call vlink_council_v2.aleo/external_execute r0 r4 r2 into r6;
    async ts_unpause_token r5 r6 into r7;
    output r7 as vlink_token_service_council_v2.aleo/ts_unpause_token.future;

finalize ts_unpause_token:
    input r0 as vlink_token_service_v2.aleo/unpause_token_ts.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_outgoing_percentage:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as u32.public;
    input r3 as u32.public;
    input r4 as u128.public;
    input r5 as [address; 5u32].public;
    cast r0 r1 r2 r3 r4 into r6 as TsUpdateWithdrawalLimit;
    hash.bhp256 r6 into r7 as field;
    call vlink_token_service_v2.aleo/update_withdrawal_limit r1 r2 r3 r4 into r8;
    call vlink_council_v2.aleo/external_execute r0 r7 r5 into r9;
    async ts_update_outgoing_percentage r8 r9 into r10;
    output r10 as vlink_token_service_council_v2.aleo/ts_update_outgoing_percentage.future;

finalize ts_update_outgoing_percentage:
    input r0 as vlink_token_service_v2.aleo/update_withdrawal_limit.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function holding_ownership_transfer:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TransferOwnershipHolding;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v2.aleo/holding_transfer_ownership r1 into r5;
    call vlink_council_v2.aleo/external_execute r0 r4 r2 into r6;
    async holding_ownership_transfer r5 r6 into r7;
    output r7 as vlink_token_service_council_v2.aleo/holding_ownership_transfer.future;

finalize holding_ownership_transfer:
    input r0 as vlink_token_service_v2.aleo/holding_transfer_ownership.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_register_token:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as u8.public;
    input r4 as u128.public;
    input r5 as [address; 5u32].public;
    cast r0 r1 r2 r3 r4 into r6 as RegisterToken;
    hash.bhp256 r6 into r7 as field;
    hash.bhp256 r1 into r8 as field;
    call token_registry.aleo/register_token r8 r1 r2 r3 r4 false aleo1ywd9h0gql58sqcxlvy6m5vjg2wm9h56umyaudazwmw5cjjv2sygq9yr6he into r9;
    call vlink_council_v2.aleo/external_execute r0 r7 r5 into r10;
    async ts_register_token r9 r10 into r11;
    output r11 as vlink_token_service_council_v2.aleo/ts_register_token.future;

finalize ts_register_token:
    input r0 as token_registry.aleo/register_token.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function update_token_metadata:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as [address; 5u32].public;
    cast r0 r1 r2 r3 into r5 as UpdateTokenMetadata;
    hash.bhp256 r5 into r6 as field;
    call token_registry.aleo/update_token_management r1 r2 r3 into r7;
    call vlink_council_v2.aleo/external_execute r0 r6 r4 into r8;
    async update_token_metadata r7 r8 into r9;
    output r9 as vlink_token_service_council_v2.aleo/update_token_metadata.future;

finalize update_token_metadata:
    input r0 as token_registry.aleo/update_token_management.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function set_role_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as u8.public;
    input r4 as [address; 5u32].public;
    cast r0 r1 r2 r3 into r5 as SetRoleForToken;
    hash.bhp256 r5 into r6 as field;
    call token_registry.aleo/set_role r1 r2 r3 into r7;
    call vlink_council_v2.aleo/external_execute r0 r6 r4 into r8;
    async set_role_token r7 r8 into r9;
    output r9 as vlink_token_service_council_v2.aleo/set_role_token.future;

finalize set_role_token:
    input r0 as token_registry.aleo/set_role.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_token_service_setting:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [u8; 20u32].public;
    input r4 as [u8; 20u32].public;
    input r5 as [address; 5u32].public;
    cast r0 r1 r2 r3 r4 into r6 as UpdateTokenServiceSetting;
    hash.bhp256 r6 into r7 as field;
    call vlink_token_service_v2.aleo/update_other_chain_tokenservice r1 r2 r3 into r8;
    call vlink_token_service_v2.aleo/update_other_chain_tokenaddress r1 r2 r4 into r9;
    call vlink_council_v2.aleo/external_execute r0 r7 r5 into r10;
    async ts_update_token_service_setting r8 r9 r10 into r11;
    output r11 as vlink_token_service_council_v2.aleo/ts_update_token_service_setting.future;

finalize ts_update_token_service_setting:
    input r0 as vlink_token_service_v2.aleo/update_other_chain_tokenservice.future;
    input r1 as vlink_token_service_v2.aleo/update_other_chain_tokenaddress.future;
    input r2 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;
    await r2;

function ts_add_chain_to_existing_token:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [u8; 20u32].public;
    input r4 as [u8; 20u32].public;
    input r5 as [address; 5u32].public;
    input r6 as u32.public;
    input r7 as u32.public;
    input r8 as u128.public;
    input r9 as u128.public;
    cast r0 r1 r2 r3 r4 r6 r7 r8 r9 into r10 as AddChainExistingToken;
    hash.bhp256 r10 into r11 as field;
    call vlink_token_service_v2.aleo/add_chain_to_existing_token r1 r2 r3 r4 r6 r7 r8 r9 into r12;
    call vlink_council_v2.aleo/external_execute r0 r11 r5 into r13;
    async ts_add_chain_to_existing_token r12 r13 into r14;
    output r14 as vlink_token_service_council_v2.aleo/ts_add_chain_to_existing_token.future;

finalize ts_add_chain_to_existing_token:
    input r0 as vlink_token_service_v2.aleo/add_chain_to_existing_token.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_remove_other_chain_addresses:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as RemoveOtherChainAddresses;
    hash.bhp256 r4 into r5 as field;
    call vlink_token_service_v2.aleo/remove_other_chain_addresses r1 r2 into r6;
    call vlink_council_v2.aleo/external_execute r0 r5 r3 into r7;
    async ts_remove_other_chain_addresses r6 r7 into r8;
    output r8 as vlink_token_service_council_v2.aleo/ts_remove_other_chain_addresses.future;

finalize ts_remove_other_chain_addresses:
    input r0 as vlink_token_service_v2.aleo/remove_other_chain_addresses.future;
    input r1 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_fees:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as u128.public;
    input r4 as u128.public;
    input r5 as u32.public;
    input r6 as u32.public;
    input r7 as [address; 5u32].public;
    cast r0 r1 r2 r3 r4 r5 r6 into r8 as UpdateFees;
    hash.bhp256 r8 into r9 as field;
    call vlink_token_service_v2.aleo/update_relayer_fee r1 r2 r3 r4 into r10;
    call vlink_token_service_v2.aleo/update_platform_fee r1 r2 r5 r6 into r11;
    call vlink_council_v2.aleo/external_execute r0 r9 r7 into r12;
    async ts_update_fees r10 r11 r12 into r13;
    output r13 as vlink_token_service_council_v2.aleo/ts_update_fees.future;

finalize ts_update_fees:
    input r0 as vlink_token_service_v2.aleo/update_relayer_fee.future;
    input r1 as vlink_token_service_v2.aleo/update_platform_fee.future;
    input r2 as vlink_council_v2.aleo/external_execute.future;
    await r0;
    await r1;
    await r2;
