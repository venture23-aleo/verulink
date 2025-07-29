import credits.aleo;
import token_registry.aleo;
import vlink_holding_v2.aleo;
import vlink_token_bridge_v2.aleo;
program vlink_token_service_v2.aleo;

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

struct Image:
    pre_image as field;
    receiver as address;

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

struct WithdrawalLimit:
    percentage as u32;
    duration as u32;
    threshold_no_limit as u128;

struct ChainToken:
    chain_id as u128;
    token_id as field;

mapping owner_TS:
    key as boolean.public;
    value as address.public;

mapping total_supply:
    key as field.public;
    value as u128.public;

mapping added_tokens:
    key as field.public;
    value as boolean.public;

mapping min_transfers:
    key as field.public;
    value as u128.public;

mapping max_transfers:
    key as field.public;
    value as u128.public;

mapping token_withdrawal_limits:
    key as field.public;
    value as WithdrawalLimit.public;

mapping token_snapshot_withdrawal:
    key as field.public;
    value as u128.public;

mapping token_snapshot_supply:
    key as field.public;
    value as u128.public;

mapping token_snapshot_height:
    key as field.public;
    value as u32.public;

mapping token_amount_withdrawn:
    key as field.public;
    value as u128.public;

mapping token_status:
    key as field.public;
    value as boolean.public;

mapping token_holding:
    key as field.public;
    value as u128.public;

mapping other_chain_token_service:
    key as ChainToken.public;
    value as [u8; 32u32].public;

mapping other_chain_token_address:
    key as ChainToken.public;
    value as [u8; 32u32].public;

mapping public_platform_fee:
    key as ChainToken.public;
    value as u32.public;

mapping private_platform_fee:
    key as ChainToken.public;
    value as u32.public;

mapping public_relayer_fee:
    key as ChainToken.public;
    value as u128.public;

mapping private_relayer_fee:
    key as ChainToken.public;
    value as u128.public;

function initialize_ts:
    input r0 as address.public;
    async initialize_ts r0 into r1;
    output r1 as vlink_token_service_v2.aleo/initialize_ts.future;

finalize initialize_ts:
    input r0 as address.public;
    contains owner_TS[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into owner_TS[true];

function transfer_ownership_ts:
    input r0 as address.public;
    async transfer_ownership_ts self.caller r0 into r1;
    output r1 as vlink_token_service_v2.aleo/transfer_ownership_ts.future;

finalize transfer_ownership_ts:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    set r1 into owner_TS[true];

function update_other_chain_tokenservice:
    input r0 as u128.public;
    input r1 as field.public;
    input r2 as [u8; 20u32].private;
    async update_other_chain_tokenservice self.caller r0 r1 r2 into r3;
    output r3 as vlink_token_service_v2.aleo/update_other_chain_tokenservice.future;

finalize update_other_chain_tokenservice:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [u8; 20u32].public;
    get owner_TS[true] into r4;
    assert.eq r0 r4;
    cast r1 r2 into r5 as ChainToken;
    contains other_chain_token_service[r5] into r6;
    assert.eq r6 true;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r3[0u32] r3[1u32] r3[2u32] r3[3u32] r3[4u32] r3[5u32] r3[6u32] r3[7u32] r3[8u32] r3[9u32] r3[10u32] r3[11u32] r3[12u32] r3[13u32] r3[14u32] r3[15u32] r3[16u32] r3[17u32] r3[18u32] r3[19u32] into r7 as [u8; 32u32];
    set r7 into other_chain_token_service[r5];

function update_other_chain_tokenaddress:
    input r0 as u128.public;
    input r1 as field.public;
    input r2 as [u8; 20u32].private;
    async update_other_chain_tokenaddress self.caller r0 r1 r2 into r3;
    output r3 as vlink_token_service_v2.aleo/update_other_chain_tokenaddress.future;

finalize update_other_chain_tokenaddress:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as [u8; 20u32].public;
    get owner_TS[true] into r4;
    assert.eq r0 r4;
    cast r1 r2 into r5 as ChainToken;
    contains other_chain_token_address[r5] into r6;
    assert.eq r6 true;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r3[0u32] r3[1u32] r3[2u32] r3[3u32] r3[4u32] r3[5u32] r3[6u32] r3[7u32] r3[8u32] r3[9u32] r3[10u32] r3[11u32] r3[12u32] r3[13u32] r3[14u32] r3[15u32] r3[16u32] r3[17u32] r3[18u32] r3[19u32] into r7 as [u8; 32u32];
    set r7 into other_chain_token_address[r5];

function remove_other_chain_addresses:
    input r0 as u128.public;
    input r1 as field.public;
    async remove_other_chain_addresses self.caller r0 r1 into r2;
    output r2 as vlink_token_service_v2.aleo/remove_other_chain_addresses.future;

finalize remove_other_chain_addresses:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as field.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    cast r1 r2 into r4 as ChainToken;
    contains other_chain_token_service[r4] into r5;
    assert.eq r5 true;
    remove other_chain_token_service[r4];
    contains other_chain_token_address[r4] into r6;
    assert.eq r6 true;
    remove other_chain_token_address[r4];

function add_token_ts:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as u32.public;
    input r4 as u32.public;
    input r5 as u128.public;
    input r6 as [u8; 20u32].public;
    input r7 as [u8; 20u32].public;
    input r8 as u128.public;
    input r9 as u32.public;
    input r10 as u32.public;
    input r11 as u128.public;
    input r12 as u128.public;
    gte r2 r1 into r13;
    assert.eq r13 true;
    lte r3 100000u32 into r14;
    assert.eq r14 true;
    async add_token_ts self.caller r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 into r15;
    output r15 as vlink_token_service_v2.aleo/add_token_ts.future;

finalize add_token_ts:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as u32.public;
    input r5 as u32.public;
    input r6 as u128.public;
    input r7 as [u8; 20u32].public;
    input r8 as [u8; 20u32].public;
    input r9 as u128.public;
    input r10 as u32.public;
    input r11 as u32.public;
    input r12 as u128.public;
    input r13 as u128.public;
    get owner_TS[true] into r14;
    assert.eq r0 r14;
    cast r4 r5 r6 into r15 as WithdrawalLimit;
    cast r9 r1 into r16 as ChainToken;
    contains added_tokens[r1] into r17;
    not r17 into r18;
    assert.eq r18 true;
    set true into added_tokens[r1];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r7[0u32] r7[1u32] r7[2u32] r7[3u32] r7[4u32] r7[5u32] r7[6u32] r7[7u32] r7[8u32] r7[9u32] r7[10u32] r7[11u32] r7[12u32] r7[13u32] r7[14u32] r7[15u32] r7[16u32] r7[17u32] r7[18u32] r7[19u32] into r19 as [u8; 32u32];
    set r19 into other_chain_token_address[r16];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r8[0u32] r8[1u32] r8[2u32] r8[3u32] r8[4u32] r8[5u32] r8[6u32] r8[7u32] r8[8u32] r8[9u32] r8[10u32] r8[11u32] r8[12u32] r8[13u32] r8[14u32] r8[15u32] r8[16u32] r8[17u32] r8[18u32] r8[19u32] into r20 as [u8; 32u32];
    set r20 into other_chain_token_service[r16];
    set r15 into token_withdrawal_limits[r1];
    set r2 into min_transfers[r1];
    set r3 into max_transfers[r1];
    set true into token_status[r1];
    set r10 into public_platform_fee[r16];
    set r11 into private_platform_fee[r16];
    set r12 into public_relayer_fee[r16];
    set r13 into private_relayer_fee[r16];

function remove_token_ts:
    input r0 as u128.public;
    input r1 as field.public;
    async remove_token_ts self.caller r0 r1 into r2;
    output r2 as vlink_token_service_v2.aleo/remove_token_ts.future;

finalize remove_token_ts:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as field.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    cast r1 r2 into r4 as ChainToken;
    contains added_tokens[r2] into r5;
    assert.eq r5 true;
    remove added_tokens[r2];
    remove token_withdrawal_limits[r2];
    remove min_transfers[r2];
    remove max_transfers[r2];
    remove token_status[r2];
    remove public_platform_fee[r4];
    remove private_platform_fee[r4];
    remove public_relayer_fee[r4];
    remove private_relayer_fee[r4];

function pause_token_ts:
    input r0 as field.public;
    async pause_token_ts self.caller r0 into r1;
    output r1 as vlink_token_service_v2.aleo/pause_token_ts.future;

finalize pause_token_ts:
    input r0 as address.public;
    input r1 as field.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    contains token_status[r1] into r3;
    assert.eq r3 true;
    set true into token_status[r1];

function unpause_token_ts:
    input r0 as field.public;
    async unpause_token_ts self.caller r0 into r1;
    output r1 as vlink_token_service_v2.aleo/unpause_token_ts.future;

finalize unpause_token_ts:
    input r0 as address.public;
    input r1 as field.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    contains token_status[r1] into r3;
    assert.eq r3 true;
    set false into token_status[r1];

function update_min_transfer_ts:
    input r0 as field.public;
    input r1 as u128.public;
    async update_min_transfer_ts self.caller r0 r1 into r2;
    output r2 as vlink_token_service_v2.aleo/update_min_transfer_ts.future;

finalize update_min_transfer_ts:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    get max_transfers[r1] into r4;
    lte r2 r4 into r5;
    assert.eq r5 true;
    contains min_transfers[r1] into r6;
    assert.eq r6 true;
    set r2 into min_transfers[r1];

function update_max_transfer_ts:
    input r0 as field.public;
    input r1 as u128.public;
    async update_max_transfer_ts self.caller r0 r1 into r2;
    output r2 as vlink_token_service_v2.aleo/update_max_transfer_ts.future;

finalize update_max_transfer_ts:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    get min_transfers[r1] into r4;
    gte r2 r4 into r5;
    assert.eq r5 true;
    contains max_transfers[r1] into r6;
    assert.eq r6 true;
    set r2 into max_transfers[r1];

function update_withdrawal_limit:
    input r0 as field.public;
    input r1 as u32.public;
    input r2 as u32.public;
    input r3 as u128.public;
    lte r1 100000u32 into r4;
    assert.eq r4 true;
    async update_withdrawal_limit self.caller r0 r1 r2 r3 into r5;
    output r5 as vlink_token_service_v2.aleo/update_withdrawal_limit.future;

finalize update_withdrawal_limit:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u32.public;
    input r3 as u32.public;
    input r4 as u128.public;
    get owner_TS[true] into r5;
    assert.eq r0 r5;
    contains token_withdrawal_limits[r1] into r6;
    assert.eq r6 true;
    cast r2 r3 r4 into r7 as WithdrawalLimit;
    set r7 into token_withdrawal_limits[r1];

function token_send_public:
    input r0 as field.public;
    input r1 as [u8; 20u32].public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as [u8; 20u32].public;
    input r5 as [u8; 20u32].public;
    input r6 as u128.public;
    input r7 as boolean.public;
    call token_registry.aleo/burn_public r0 self.caller r2 into r8;
    call token_registry.aleo/mint_public r0 vlink_council_v2.aleo r6 4294967295u32 into r9;
    cast r3 r0 into r10 as ChainToken;
    ternary r7 2u8 1u8 into r11;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r4[0u32] r4[1u32] r4[2u32] r4[3u32] r4[4u32] r4[5u32] r4[6u32] r4[7u32] r4[8u32] r4[9u32] r4[10u32] r4[11u32] r4[12u32] r4[13u32] r4[14u32] r4[15u32] r4[16u32] r4[17u32] r4[18u32] r4[19u32] into r12 as [u8; 32u32];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r5[0u32] r5[1u32] r5[2u32] r5[3u32] r5[4u32] r5[5u32] r5[6u32] r5[7u32] r5[8u32] r5[9u32] r5[10u32] r5[11u32] r5[12u32] r5[13u32] r5[14u32] r5[15u32] r5[16u32] r5[17u32] r5[18u32] r5[19u32] into r13 as [u8; 32u32];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r1[0u32] r1[1u32] r1[2u32] r1[3u32] r1[4u32] r1[5u32] r1[6u32] r1[7u32] r1[8u32] r1[9u32] r1[10u32] r1[11u32] r1[12u32] r1[13u32] r1[14u32] r1[15u32] r1[16u32] r1[17u32] r1[18u32] r1[19u32] into r14 as [u8; 32u32];
    sub r2 r6 into r15;
    call vlink_token_bridge_v2.aleo/publish r11 r3 r12 r13 self.caller r14 r15 into r16;
    async token_send_public r0 r2 r10 r5 r4 r6 r8 r9 r16 into r17;
    output r17 as vlink_token_service_v2.aleo/token_send_public.future;

finalize token_send_public:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as ChainToken.public;
    input r3 as [u8; 20u32].public;
    input r4 as [u8; 20u32].public;
    input r5 as u128.public;
    input r6 as token_registry.aleo/burn_public.future;
    input r7 as token_registry.aleo/mint_public.future;
    input r8 as vlink_token_bridge_v2.aleo/publish.future;
    await r6;
    await r7;
    await r8;
    get public_platform_fee[r2] into r9;
    lte r9 100000u32 into r10;
    assert.eq r10 true;
    cast r9 into r11 as u128;
    mul r1 r11 into r12;
    div r12 100000u128 into r13;
    assert.eq r13 r5;
    get min_transfers[r0] into r14;
    gte r1 r14 into r15;
    assert.eq r15 true;
    contains other_chain_token_address[r2] into r16;
    assert.eq r16 true;
    get other_chain_token_address[r2] into r17;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r3[0u32] r3[1u32] r3[2u32] r3[3u32] r3[4u32] r3[5u32] r3[6u32] r3[7u32] r3[8u32] r3[9u32] r3[10u32] r3[11u32] r3[12u32] r3[13u32] r3[14u32] r3[15u32] r3[16u32] r3[17u32] r3[18u32] r3[19u32] into r18 as [u8; 32u32];
    assert.eq r17 r18;
    contains other_chain_token_service[r2] into r19;
    assert.eq r19 true;
    get other_chain_token_service[r2] into r20;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r4[0u32] r4[1u32] r4[2u32] r4[3u32] r4[4u32] r4[5u32] r4[6u32] r4[7u32] r4[8u32] r4[9u32] r4[10u32] r4[11u32] r4[12u32] r4[13u32] r4[14u32] r4[15u32] r4[16u32] r4[17u32] r4[18u32] r4[19u32] into r21 as [u8; 32u32];
    assert.eq r20 r21;
    get max_transfers[r0] into r22;
    lte r1 r22 into r23;
    assert.eq r23 true;
    get token_status[r0] into r24;
    assert.eq r24 false;
    get token_withdrawal_limits[r0] into r25;
    get total_supply[r0] into r26;
    get.or_use token_snapshot_height[r0] 0u32 into r27;
    get.or_use token_amount_withdrawn[r0] 0u128 into r28;
    sub block.height r27 into r29;
    gt r29 r25.duration into r30;
    branch.eq r30 false to end_then_0_0;
    get.or_use token_holding[r0] 0u128 into r31;
    sub r26 r31 into r32;
    set r32 into token_snapshot_supply[r0];
    set block.height into token_snapshot_height[r0];
    sub r1 r5 into r33;
    set r33 into token_amount_withdrawn[r0];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    add r28 r1 into r34;
    sub r34 r5 into r35;
    set r35 into token_amount_withdrawn[r0];
    position end_otherwise_0_1;
    get token_snapshot_supply[r0] into r36;
    gte r36 r25.threshold_no_limit into r37;
    branch.eq r37 false to end_then_0_2;
    get token_amount_withdrawn[r0] into r38;
    lte r25.percentage 100000u32 into r39;
    assert.eq r39 true;
    cast r25.percentage into r40 as u128;
    mul r36 r40 into r41;
    div r41 100000u128 into r42;
    lte r38 r42 into r43;
    assert.eq r43 true;
    branch.eq true true to end_otherwise_0_3;
    position end_then_0_2;
    position end_otherwise_0_3;
    sub r26 r1 into r44;
    add r44 r5 into r45;
    set r45 into total_supply[r0];

function token_send_private:
    input r0 as field.public;
    input r1 as [u8; 20u32].public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as [u8; 20u32].public;
    input r5 as [u8; 20u32].public;
    input r6 as token_registry.aleo/Token.record;
    input r7 as u128.private;
    input r8 as boolean.public;
    call token_registry.aleo/burn_private r6 r2 into r9 r10;
    call token_registry.aleo/mint_public r0 vlink_council_v2.aleo r7 4294967295u32 into r11;
    cast r3 r0 into r12 as ChainToken;
    ternary r8 12u8 11u8 into r13;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r4[0u32] r4[1u32] r4[2u32] r4[3u32] r4[4u32] r4[5u32] r4[6u32] r4[7u32] r4[8u32] r4[9u32] r4[10u32] r4[11u32] r4[12u32] r4[13u32] r4[14u32] r4[15u32] r4[16u32] r4[17u32] r4[18u32] r4[19u32] into r14 as [u8; 32u32];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r5[0u32] r5[1u32] r5[2u32] r5[3u32] r5[4u32] r5[5u32] r5[6u32] r5[7u32] r5[8u32] r5[9u32] r5[10u32] r5[11u32] r5[12u32] r5[13u32] r5[14u32] r5[15u32] r5[16u32] r5[17u32] r5[18u32] r5[19u32] into r15 as [u8; 32u32];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r1[0u32] r1[1u32] r1[2u32] r1[3u32] r1[4u32] r1[5u32] r1[6u32] r1[7u32] r1[8u32] r1[9u32] r1[10u32] r1[11u32] r1[12u32] r1[13u32] r1[14u32] r1[15u32] r1[16u32] r1[17u32] r1[18u32] r1[19u32] into r16 as [u8; 32u32];
    sub r2 r7 into r17;
    call vlink_token_bridge_v2.aleo/publish r13 r3 r14 r15 vlink_token_service_v2.aleo r16 r17 into r18;
    async token_send_private r0 r2 r12 r5 r4 r7 r10 r11 r18 into r19;
    output r9 as token_registry.aleo/Token.record;
    output r19 as vlink_token_service_v2.aleo/token_send_private.future;

finalize token_send_private:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as ChainToken.public;
    input r3 as [u8; 20u32].public;
    input r4 as [u8; 20u32].public;
    input r5 as u128.public;
    input r6 as token_registry.aleo/burn_private.future;
    input r7 as token_registry.aleo/mint_public.future;
    input r8 as vlink_token_bridge_v2.aleo/publish.future;
    await r6;
    await r7;
    await r8;
    get private_platform_fee[r2] into r9;
    lte r9 100000u32 into r10;
    assert.eq r10 true;
    cast r9 into r11 as u128;
    mul r1 r11 into r12;
    div r12 100000u128 into r13;
    assert.eq r13 r5;
    get min_transfers[r0] into r14;
    gte r1 r14 into r15;
    assert.eq r15 true;
    contains other_chain_token_address[r2] into r16;
    assert.eq r16 true;
    get other_chain_token_address[r2] into r17;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r3[0u32] r3[1u32] r3[2u32] r3[3u32] r3[4u32] r3[5u32] r3[6u32] r3[7u32] r3[8u32] r3[9u32] r3[10u32] r3[11u32] r3[12u32] r3[13u32] r3[14u32] r3[15u32] r3[16u32] r3[17u32] r3[18u32] r3[19u32] into r18 as [u8; 32u32];
    assert.eq r17 r18;
    contains other_chain_token_service[r2] into r19;
    assert.eq r19 true;
    get other_chain_token_service[r2] into r20;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r4[0u32] r4[1u32] r4[2u32] r4[3u32] r4[4u32] r4[5u32] r4[6u32] r4[7u32] r4[8u32] r4[9u32] r4[10u32] r4[11u32] r4[12u32] r4[13u32] r4[14u32] r4[15u32] r4[16u32] r4[17u32] r4[18u32] r4[19u32] into r21 as [u8; 32u32];
    assert.eq r20 r21;
    get max_transfers[r0] into r22;
    lte r1 r22 into r23;
    assert.eq r23 true;
    get token_status[r0] into r24;
    assert.eq r24 false;
    get token_withdrawal_limits[r0] into r25;
    get total_supply[r0] into r26;
    get.or_use token_snapshot_height[r0] 0u32 into r27;
    get.or_use token_amount_withdrawn[r0] 0u128 into r28;
    sub block.height r27 into r29;
    gt r29 r25.duration into r30;
    branch.eq r30 false to end_then_0_4;
    get.or_use token_holding[r0] 0u128 into r31;
    sub r26 r31 into r32;
    set r32 into token_snapshot_supply[r0];
    set block.height into token_snapshot_height[r0];
    sub r1 r5 into r33;
    set r33 into token_amount_withdrawn[r0];
    branch.eq true true to end_otherwise_0_5;
    position end_then_0_4;
    add r28 r1 into r34;
    sub r34 r5 into r35;
    set r35 into token_amount_withdrawn[r0];
    position end_otherwise_0_5;
    get token_snapshot_supply[r0] into r36;
    gte r36 r25.threshold_no_limit into r37;
    branch.eq r37 false to end_then_0_6;
    get token_amount_withdrawn[r0] into r38;
    lte r25.percentage 100000u32 into r39;
    assert.eq r39 true;
    cast r25.percentage into r40 as u128;
    mul r36 r40 into r41;
    div r41 100000u128 into r42;
    lte r38 r42 into r43;
    assert.eq r43 true;
    branch.eq true true to end_otherwise_0_7;
    position end_then_0_6;
    position end_otherwise_0_7;
    sub r26 r1 into r44;
    add r44 r5 into r45;
    set r45 into total_supply[r0];

function token_receive_public:
    input r0 as [u8; 20u32].public;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as u64.public;
    input r5 as u64.public;
    input r6 as [address; 5u32].public;
    input r7 as [signature; 5u32].public;
    input r8 as u128.public;
    input r9 as [u8; 20u32].public;
    input r10 as u128.public;
    input r11 as u8.public;
    lt r11 10u8 into r12;
    assert.eq r12 true;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r9[0u32] r9[1u32] r9[2u32] r9[3u32] r9[4u32] r9[5u32] r9[6u32] r9[7u32] r9[8u32] r9[9u32] r9[10u32] r9[11u32] r9[12u32] r9[13u32] r9[14u32] r9[15u32] r9[16u32] r9[17u32] r9[18u32] r9[19u32] into r13 as [u8; 32u32];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r0[0u32] r0[1u32] r0[2u32] r0[3u32] r0[4u32] r0[5u32] r0[6u32] r0[7u32] r0[8u32] r0[9u32] r0[10u32] r0[11u32] r0[12u32] r0[13u32] r0[14u32] r0[15u32] r0[16u32] r0[17u32] r0[18u32] r0[19u32] into r14 as [u8; 32u32];
    call vlink_token_bridge_v2.aleo/consume r11 r8 r13 r1 r14 r2 r3 r4 r5 r6 r7 into r15 r16;
    cast r8 r1 into r17 as ChainToken;
    gte r3 r10 into r18;
    assert.eq r18 true;
    not r15 into r19;
    sub r3 r10 into r20;
    ternary r19 aleo1f4xc78ykumx4pac8hlnle66nxptux3pwm2q24fslvhns3wh4tqgsj8f7yu r2 into r21;
    ternary r19 r20 0u128 into r22;
    is.eq r11 1u8 into r23;
    is.eq r11 3u8 into r24;
    or r23 r24 into r25;
    ternary r25 r21 self.caller into r26;
    call token_registry.aleo/mint_public r1 r26 r10 4294967295u32 into r27;
    sub r3 r10 into r28;
    call token_registry.aleo/mint_public r1 r21 r28 4294967295u32 into r29;
    call vlink_holding_v2.aleo/hold_fund r2 r1 r22 into r30;
    async token_receive_public r1 r3 r22 r17 r9 r10 r16 r27 r29 r30 into r31;
    output r15 as boolean.public;
    output r31 as vlink_token_service_v2.aleo/token_receive_public.future;

finalize token_receive_public:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as ChainToken.public;
    input r4 as [u8; 20u32].public;
    input r5 as u128.public;
    input r6 as vlink_token_bridge_v2.aleo/consume.future;
    input r7 as token_registry.aleo/mint_public.future;
    input r8 as token_registry.aleo/mint_public.future;
    input r9 as vlink_holding_v2.aleo/hold_fund.future;
    await r6;
    await r7;
    await r8;
    await r9;
    get token_status[r0] into r10;
    assert.eq r10 false;
    contains other_chain_token_service[r3] into r11;
    assert.eq r11 true;
    get public_relayer_fee[r3] into r12;
    assert.eq r12 r5;
    get other_chain_token_service[r3] into r13;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r4[0u32] r4[1u32] r4[2u32] r4[3u32] r4[4u32] r4[5u32] r4[6u32] r4[7u32] r4[8u32] r4[9u32] r4[10u32] r4[11u32] r4[12u32] r4[13u32] r4[14u32] r4[15u32] r4[16u32] r4[17u32] r4[18u32] r4[19u32] into r14 as [u8; 32u32];
    assert.eq r13 r14;
    get.or_use total_supply[r0] 0u128 into r15;
    add r15 r1 into r16;
    set r16 into total_supply[r0];
    get.or_use token_holding[r0] 0u128 into r17;
    add r17 r2 into r18;
    set r18 into token_holding[r0];

function token_receive_private:
    input r0 as [u8; 20u32].public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u64.public;
    input r4 as u64.public;
    input r5 as [address; 5u32].public;
    input r6 as [signature; 5u32].public;
    input r7 as u128.public;
    input r8 as [u8; 20u32].public;
    input r9 as field.private;
    input r10 as address.private;
    input r11 as u8.public;
    input r12 as u128.public;
    gt r11 10u8 into r13;
    lt r11 20u8 into r14;
    and r13 r14 into r15;
    assert.eq r15 true;
    gte r2 r12 into r16;
    assert.eq r16 true;
    cast r9 r10 into r17 as Image;
    hash.bhp256 r17 into r18 as address;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r8[0u32] r8[1u32] r8[2u32] r8[3u32] r8[4u32] r8[5u32] r8[6u32] r8[7u32] r8[8u32] r8[9u32] r8[10u32] r8[11u32] r8[12u32] r8[13u32] r8[14u32] r8[15u32] r8[16u32] r8[17u32] r8[18u32] r8[19u32] into r19 as [u8; 32u32];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r0[0u32] r0[1u32] r0[2u32] r0[3u32] r0[4u32] r0[5u32] r0[6u32] r0[7u32] r0[8u32] r0[9u32] r0[10u32] r0[11u32] r0[12u32] r0[13u32] r0[14u32] r0[15u32] r0[16u32] r0[17u32] r0[18u32] r0[19u32] into r20 as [u8; 32u32];
    call vlink_token_bridge_v2.aleo/consume r11 r7 r19 r1 r20 r18 r2 r3 r4 r5 r6 into r21 r22;
    cast r7 r1 into r23 as ChainToken;
    not r21 into r24;
    sub r2 r12 into r25;
    ternary r24 aleo1f4xc78ykumx4pac8hlnle66nxptux3pwm2q24fslvhns3wh4tqgsj8f7yu r10 into r26;
    ternary r24 r25 0u128 into r27;
    is.eq r11 11u8 into r28;
    is.eq r11 13u8 into r29;
    or r28 r29 into r30;
    ternary r30 r26 self.caller into r31;
    call token_registry.aleo/mint_private r1 r31 r12 false 4294967295u32 into r32 r33;
    sub r2 r12 into r34;
    call token_registry.aleo/mint_private r1 r26 r34 false 4294967295u32 into r35 r36;
    call vlink_holding_v2.aleo/hold_fund r18 r1 r27 into r37;
    async token_receive_private r1 r2 r27 r23 r8 r12 r22 r33 r36 r37 into r38;
    output r21 as boolean.public;
    output r32 as token_registry.aleo/Token.record;
    output r35 as token_registry.aleo/Token.record;
    output r38 as vlink_token_service_v2.aleo/token_receive_private.future;

finalize token_receive_private:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as ChainToken.public;
    input r4 as [u8; 20u32].public;
    input r5 as u128.public;
    input r6 as vlink_token_bridge_v2.aleo/consume.future;
    input r7 as token_registry.aleo/mint_private.future;
    input r8 as token_registry.aleo/mint_private.future;
    input r9 as vlink_holding_v2.aleo/hold_fund.future;
    await r6;
    await r7;
    await r8;
    await r9;
    get token_status[r0] into r10;
    assert.eq r10 false;
    get private_relayer_fee[r3] into r11;
    assert.eq r11 r5;
    contains other_chain_token_service[r3] into r12;
    assert.eq r12 true;
    get other_chain_token_service[r3] into r13;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r4[0u32] r4[1u32] r4[2u32] r4[3u32] r4[4u32] r4[5u32] r4[6u32] r4[7u32] r4[8u32] r4[9u32] r4[10u32] r4[11u32] r4[12u32] r4[13u32] r4[14u32] r4[15u32] r4[16u32] r4[17u32] r4[18u32] r4[19u32] into r14 as [u8; 32u32];
    assert.eq r13 r14;
    get.or_use total_supply[r0] 0u128 into r15;
    add r15 r1 into r16;
    set r16 into total_supply[r0];
    get.or_use token_holding[r0] 0u128 into r17;
    add r17 r2 into r18;
    set r18 into token_holding[r0];

function add_chain_to_existing_token:
    input r0 as u128.public;
    input r1 as field.public;
    input r2 as [u8; 20u32].public;
    input r3 as [u8; 20u32].public;
    input r4 as u32.public;
    input r5 as u32.public;
    input r6 as u128.public;
    input r7 as u128.public;
    cast r0 r1 into r8 as ChainToken;
    async add_chain_to_existing_token self.caller r8 r2 r3 r4 r5 r6 r7 into r9;
    output r9 as vlink_token_service_v2.aleo/add_chain_to_existing_token.future;

finalize add_chain_to_existing_token:
    input r0 as address.public;
    input r1 as ChainToken.public;
    input r2 as [u8; 20u32].public;
    input r3 as [u8; 20u32].public;
    input r4 as u32.public;
    input r5 as u32.public;
    input r6 as u128.public;
    input r7 as u128.public;
    get added_tokens[r1.token_id] into r8;
    assert.eq r8 true;
    get owner_TS[true] into r9;
    assert.eq r0 r9;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r2[0u32] r2[1u32] r2[2u32] r2[3u32] r2[4u32] r2[5u32] r2[6u32] r2[7u32] r2[8u32] r2[9u32] r2[10u32] r2[11u32] r2[12u32] r2[13u32] r2[14u32] r2[15u32] r2[16u32] r2[17u32] r2[18u32] r2[19u32] into r10 as [u8; 32u32];
    set r10 into other_chain_token_service[r1];
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 r3[0u32] r3[1u32] r3[2u32] r3[3u32] r3[4u32] r3[5u32] r3[6u32] r3[7u32] r3[8u32] r3[9u32] r3[10u32] r3[11u32] r3[12u32] r3[13u32] r3[14u32] r3[15u32] r3[16u32] r3[17u32] r3[18u32] r3[19u32] into r11 as [u8; 32u32];
    set r11 into other_chain_token_address[r1];
    set r4 into public_platform_fee[r1];
    set r5 into private_platform_fee[r1];
    set r6 into public_relayer_fee[r1];
    set r7 into private_relayer_fee[r1];

function holding_release:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    call vlink_holding_v2.aleo/release_fund r1 r0 r2 into r3;
    async holding_release self.caller r0 r2 r3 into r4;
    output r4 as vlink_token_service_v2.aleo/holding_release.future;

finalize holding_release:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as vlink_holding_v2.aleo/release_fund.future;
    await r3;
    get owner_TS[true] into r4;
    assert.eq r4 r0;
    get token_holding[r1] into r5;
    sub r5 r2 into r6;
    set r6 into token_holding[r1];

function holding_release_private:
    input r0 as field.public;
    input r1 as address.private;
    input r2 as field.private;
    input r3 as u128.public;
    call vlink_holding_v2.aleo/release_fund_private r1 r2 r0 r3 into r4 r5;
    async holding_release_private self.caller r0 r3 r5 into r6;
    output r4 as token_registry.aleo/Token.record;
    output r6 as vlink_token_service_v2.aleo/holding_release_private.future;

finalize holding_release_private:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as vlink_holding_v2.aleo/release_fund_private.future;
    await r3;
    get owner_TS[true] into r4;
    assert.eq r4 r0;
    get token_holding[r1] into r5;
    sub r5 r2 into r6;
    set r6 into token_holding[r1];

function holding_transfer_ownership:
    input r0 as address.public;
    call vlink_holding_v2.aleo/transfer_ownership_holding r0 into r1;
    async holding_transfer_ownership self.caller r1 into r2;
    output r2 as vlink_token_service_v2.aleo/holding_transfer_ownership.future;

finalize holding_transfer_ownership:
    input r0 as address.public;
    input r1 as vlink_holding_v2.aleo/transfer_ownership_holding.future;
    await r1;
    get owner_TS[true] into r2;
    assert.eq r2 r0;

function update_platform_fee:
    input r0 as u128.public;
    input r1 as field.public;
    input r2 as u32.public;
    input r3 as u32.public;
    async update_platform_fee self.caller r0 r1 r2 r3 into r4;
    output r4 as vlink_token_service_v2.aleo/update_platform_fee.future;

finalize update_platform_fee:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as u32.public;
    input r4 as u32.public;
    cast r1 r2 into r5 as ChainToken;
    get owner_TS[true] into r6;
    assert.eq r6 r0;
    contains public_platform_fee[r5] into r7;
    assert.eq r7 true;
    contains private_platform_fee[r5] into r8;
    assert.eq r8 true;
    set r3 into public_platform_fee[r5];
    set r4 into private_platform_fee[r5];

function update_relayer_fee:
    input r0 as u128.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u128.public;
    async update_relayer_fee self.caller r0 r1 r2 r3 into r4;
    output r4 as vlink_token_service_v2.aleo/update_relayer_fee.future;

finalize update_relayer_fee:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as u128.public;
    input r4 as u128.public;
    get owner_TS[true] into r5;
    assert.eq r5 r0;
    cast r1 r2 into r6 as ChainToken;
    contains public_relayer_fee[r6] into r7;
    assert.eq r7 true;
    contains private_relayer_fee[r6] into r8;
    assert.eq r8 true;
    set r3 into public_relayer_fee[r6];
    set r4 into private_relayer_fee[r6];
