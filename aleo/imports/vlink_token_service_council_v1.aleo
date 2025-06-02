import vlink_council_v1.aleo;
import credits.aleo;
import token_registry.aleo;
import vlink_holding_v1.aleo;
import vlink_token_bridge_v1.aleo;
import vlink_token_service_v1.aleo;

program vlink_token_service_council_v1.aleo;

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
    outgoing_percentage as u16;
    time as u32;
    max_no_cap as u128;
    token_address as [u8; 20u32];
    token_service as [u8; 20u32];
    chain_id as u128;

struct TsRemoveToken:
    id as u32;
    token_id as field;

struct TsUpdateMinTransfer:
    id as u32;
    token_id as field;
    min_transfer as u128;

struct TsUpdateMaxTransfer:
    id as u32;
    token_id as field;
    max_transfer as u128;

struct TsPauseToken:
    id as u32;
    token_id as field;

struct TsUnpauseToken:
    id as u32;
    token_id as field;

struct TsUpdateWithdrawalLimit:
    id as u32;
    token_id as field;
    percentage as u16;
    duration as u32;
    threshold_no_limit as u128;

struct HoldingRelease:
    id as u32;
    token_id as field;
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

struct UpdateTokenServiceAddress:
    id as u32;
    chain_id as u128;
    token_id as field;
    token_service_address as [u8; 20u32];

struct UpdateTokenAddress:
    id as u32;
    chain_id as u128;
    token_id as field;
    token_address as [u8; 20u32];

struct RemoveOtherChainAddresses:
    id as u32;
    chain_id as u128;
    token_id as field;

function holding_release:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as [address; 5u32].public;
    cast r0 r1 r2 r3 into r5 as HoldingRelease;
    hash.bhp256 r5 into r6 as field;
    call vlink_token_service_v1.aleo/holding_release r1 r2 r3 into r7;
    call vlink_council_v1.aleo/external_execute r0 r6 r4 into r8;
    async holding_release r7 r8 into r9;
    output r9 as vlink_token_service_council_v1.aleo/holding_release.future;

finalize holding_release:
    input r0 as vlink_token_service_v1.aleo/holding_release.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_transfer_ownership:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TsTransferOwnership;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v1.aleo/transfer_ownership_ts r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async ts_transfer_ownership r5 r6 into r7;
    output r7 as vlink_token_service_council_v1.aleo/ts_transfer_ownership.future;

finalize ts_transfer_ownership:
    input r0 as vlink_token_service_v1.aleo/transfer_ownership_ts.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_add_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as u16.public;
    input r5 as u32.public;
    input r6 as u128.public;
    input r7 as [address; 5u32].public;
    input r8 as [u8; 20u32].public;
    input r9 as [u8; 20u32].public;
    input r10 as u128.public;
    cast r0 r1 r2 r3 r4 r5 r6 r8 r9 r10 into r11 as TsAddToken;
    hash.bhp256 r11 into r12 as field;
    call vlink_token_service_v1.aleo/add_token_ts r1 r2 r3 r4 r5 r6 r8 r9 r10 into r13;
    call vlink_council_v1.aleo/external_execute r0 r12 r7 into r14;
    async ts_add_token r13 r14 into r15;
    output r15 as vlink_token_service_council_v1.aleo/ts_add_token.future;

finalize ts_add_token:
    input r0 as vlink_token_service_v1.aleo/add_token_ts.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_remove_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TsRemoveToken;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v1.aleo/remove_token_ts r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async ts_remove_token r5 r6 into r7;
    output r7 as vlink_token_service_council_v1.aleo/ts_remove_token.future;

finalize ts_remove_token:
    input r0 as vlink_token_service_v1.aleo/remove_token_ts.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_min_transfer:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as TsUpdateMinTransfer;
    hash.bhp256 r4 into r5 as field;
    call vlink_token_service_v1.aleo/update_min_transfer_ts r1 r2 into r6;
    call vlink_council_v1.aleo/external_execute r0 r5 r3 into r7;
    async ts_update_min_transfer r6 r7 into r8;
    output r8 as vlink_token_service_council_v1.aleo/ts_update_min_transfer.future;

finalize ts_update_min_transfer:
    input r0 as vlink_token_service_v1.aleo/update_min_transfer_ts.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_max_transfer:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as TsUpdateMaxTransfer;
    hash.bhp256 r4 into r5 as field;
    call vlink_token_service_v1.aleo/update_max_transfer_ts r1 r2 into r6;
    call vlink_council_v1.aleo/external_execute r0 r5 r3 into r7;
    async ts_update_max_transfer r6 r7 into r8;
    output r8 as vlink_token_service_council_v1.aleo/ts_update_max_transfer.future;

finalize ts_update_max_transfer:
    input r0 as vlink_token_service_v1.aleo/update_max_transfer_ts.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_pause_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TsPauseToken;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v1.aleo/pause_token_ts r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async ts_pause_token r5 r6 into r7;
    output r7 as vlink_token_service_council_v1.aleo/ts_pause_token.future;

finalize ts_pause_token:
    input r0 as vlink_token_service_v1.aleo/pause_token_ts.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_unpause_token:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TsUnpauseToken;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v1.aleo/unpause_token_ts r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async ts_unpause_token r5 r6 into r7;
    output r7 as vlink_token_service_council_v1.aleo/ts_unpause_token.future;

finalize ts_unpause_token:
    input r0 as vlink_token_service_v1.aleo/unpause_token_ts.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_outgoing_percentage:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as u16.public;
    input r3 as u32.public;
    input r4 as u128.public;
    input r5 as [address; 5u32].public;
    cast r0 r1 r2 r3 r4 into r6 as TsUpdateWithdrawalLimit;
    hash.bhp256 r6 into r7 as field;
    call vlink_token_service_v1.aleo/update_withdrawal_limit r1 r2 r3 r4 into r8;
    call vlink_council_v1.aleo/external_execute r0 r7 r5 into r9;
    async ts_update_outgoing_percentage r8 r9 into r10;
    output r10 as vlink_token_service_council_v1.aleo/ts_update_outgoing_percentage.future;

finalize ts_update_outgoing_percentage:
    input r0 as vlink_token_service_v1.aleo/update_withdrawal_limit.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function holding_ownership_transfer:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TransferOwnershipHolding;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_service_v1.aleo/holding_transfer_ownership r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async holding_ownership_transfer r5 r6 into r7;
    output r7 as vlink_token_service_council_v1.aleo/holding_ownership_transfer.future;

finalize holding_ownership_transfer:
    input r0 as vlink_token_service_v1.aleo/holding_transfer_ownership.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
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
    call vlink_council_v1.aleo/external_execute r0 r7 r5 into r10;
    async ts_register_token r9 r10 into r11;
    output r11 as vlink_token_service_council_v1.aleo/ts_register_token.future;

finalize ts_register_token:
    input r0 as token_registry.aleo/register_token.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
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
    call vlink_council_v1.aleo/external_execute r0 r6 r4 into r8;
    async update_token_metadata r7 r8 into r9;
    output r9 as vlink_token_service_council_v1.aleo/update_token_metadata.future;

finalize update_token_metadata:
    input r0 as token_registry.aleo/update_token_management.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
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
    call vlink_council_v1.aleo/external_execute r0 r6 r4 into r8;
    async set_role_token r7 r8 into r9;
    output r9 as vlink_token_service_council_v1.aleo/set_role_token.future;

finalize set_role_token:
    input r0 as token_registry.aleo/set_role.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_token_service_address:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [u8; 20u32].public;
    input r4 as [address; 5u32].public;
    cast r0 r1 r2 r3 into r5 as UpdateTokenServiceAddress;
    hash.bhp256 r5 into r6 as field;
    call vlink_token_service_v1.aleo/update_other_chain_tokenservice r1 r2 r3 into r7;
    call vlink_council_v1.aleo/external_execute r0 r6 r4 into r8;
    async ts_update_token_service_address r7 r8 into r9;
    output r9 as vlink_token_service_council_v1.aleo/ts_update_token_service_address.future;

finalize ts_update_token_service_address:
    input r0 as vlink_token_service_v1.aleo/update_other_chain_tokenservice.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_update_other_token_address:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [u8; 20u32].public;
    input r4 as [address; 5u32].public;
    cast r0 r1 r2 r3 into r5 as UpdateTokenAddress;
    hash.bhp256 r5 into r6 as field;
    call vlink_token_service_v1.aleo/update_other_chain_tokenaddress r1 r2 r3 into r7;
    call vlink_council_v1.aleo/external_execute r0 r6 r4 into r8;
    async ts_update_other_token_address r7 r8 into r9;
    output r9 as vlink_token_service_council_v1.aleo/ts_update_other_token_address.future;

finalize ts_update_other_token_address:
    input r0 as vlink_token_service_v1.aleo/update_other_chain_tokenaddress.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function ts_remove_other_chain_addresses:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as RemoveOtherChainAddresses;
    hash.bhp256 r4 into r5 as field;
    call vlink_token_service_v1.aleo/remove_other_chain_addresses r1 r2 into r6;
    call vlink_council_v1.aleo/external_execute r0 r5 r3 into r7;
    async ts_remove_other_chain_addresses r6 r7 into r8;
    output r8 as vlink_token_service_council_v1.aleo/ts_remove_other_chain_addresses.future;

finalize ts_remove_other_chain_addresses:
    input r0 as vlink_token_service_v1.aleo/remove_other_chain_addresses.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;