import token_bridge_v0001.aleo;
program token_service_v0001.aleo;










struct WithdrawalLimit:
    percentage as u16;
    duration as u32;
    threshold_no_limit as u128;


mapping owner_TS:
	key as boolean.public;
	value as address.public;


mapping total_supply:
	key as address.public;
	value as u128.public;


mapping token_connectors:
	key as address.public;
	value as address.public;


mapping min_transfers:
	key as address.public;
	value as u128.public;


mapping max_transfers:
	key as address.public;
	value as u128.public;


mapping token_withdrawal_limits:
	key as address.public;
	value as WithdrawalLimit.public;


mapping token_snapshot_withdrawal:
	key as address.public;
	value as u128.public;


mapping token_snapshot_height:
	key as address.public;
	value as u32.public;


mapping token_amount_withdrawn:
	key as address.public;
	value as u128.public;

function initialize_ts:
    input r0 as address.private;
    async initialize_ts r0 into r1;
    output r1 as token_service_v0001.aleo/initialize_ts.future;

finalize initialize_ts:
    input r0 as address.public;
    contains owner_TS[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into owner_TS[true];


function transfer_ownership_ts:
    input r0 as address.public;
    async transfer_ownership_ts self.caller r0 into r1;
    output r1 as token_service_v0001.aleo/transfer_ownership_ts.future;

finalize transfer_ownership_ts:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    set r1 into owner_TS[true];


function add_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as u16.public;
    input r5 as u32.public;
    input r6 as u128.public;
    gte r3 r2 into r7;
    assert.eq r7 true;
    async add_token_ts self.caller r0 r1 r2 r3 r4 r5 r6 into r8;
    output r8 as token_service_v0001.aleo/add_token_ts.future;

finalize add_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as u128.public;
    input r5 as u16.public;
    input r6 as u32.public;
    input r7 as u128.public;
    get owner_TS[true] into r8;
    assert.eq r0 r8;
    cast r5 r6 r7 into r9 as WithdrawalLimit;
    set r9 into token_withdrawal_limits[r1];
    set r3 into min_transfers[r1];
    set r4 into max_transfers[r1];
    set r2 into token_connectors[r1];


function remove_token_ts:
    input r0 as address.public;
    async remove_token_ts self.caller r0 into r1;
    output r1 as token_service_v0001.aleo/remove_token_ts.future;

finalize remove_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    contains token_withdrawal_limits[r1] into r3;
    assert.eq r3 true;
    remove token_withdrawal_limits[r1];
    remove min_transfers[r1];
    remove token_connectors[r1];


function update_connector_ts:
    input r0 as address.private;
    input r1 as address.private;
    async update_connector_ts self.caller r0 r1 into r2;
    output r2 as token_service_v0001.aleo/update_connector_ts.future;

finalize update_connector_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    get token_connectors[r1] into r3;
    assert.eq r0 r3;
    set r2 into token_connectors[r1];


function update_min_transfer_ts:
    input r0 as address.public;
    input r1 as u128.private;
    async update_min_transfer_ts self.caller r0 r1 into r2;
    output r2 as token_service_v0001.aleo/update_min_transfer_ts.future;

finalize update_min_transfer_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u128.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into min_transfers[r1];


function update_max_transfer_ts:
    input r0 as address.public;
    input r1 as u128.private;
    async update_max_transfer_ts self.caller r0 r1 into r2;
    output r2 as token_service_v0001.aleo/update_max_transfer_ts.future;

finalize update_max_transfer_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u128.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into max_transfers[r1];


function update_withdrawal_limit:
    input r0 as address.public;
    input r1 as u16.public;
    input r2 as u32.public;
    input r3 as u128.public;
    lte r1 100_00u16 into r4;
    assert.eq r4 true;
    async update_withdrawal_limit self.caller r0 r1 r2 r3 into r5;
    output r5 as token_service_v0001.aleo/update_withdrawal_limit.future;

finalize update_withdrawal_limit:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u16.public;
    input r3 as u32.public;
    input r4 as u128.public;
    get owner_TS[true] into r5;
    assert.eq r0 r5;
    cast r2 r3 r4 into r6 as WithdrawalLimit;
    set r6 into token_withdrawal_limits[r1];




function token_send:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as [u8; 32u32].public;
    input r3 as u128.public;
    input r4 as u128.public;
    input r5 as [u8; 32u32].public;
    input r6 as [u8; 32u32].public;
    assert.neq self.signer self.caller;
    call token_bridge_v0001.aleo/publish r4 r6 r5 r1 r2 r3 into r7;
    async token_send r7 self.caller r0 r3 into r8;
    output r8 as token_service_v0001.aleo/token_send.future;

finalize token_send:
    input r0 as token_bridge_v0001.aleo/publish.future;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    await r0;
    get token_connectors[r2] into r4;
    assert.eq r1 r4;
    get min_transfers[r2] into r5;
    gte r3 r5 into r6;
    assert.eq r6 true;
    get max_transfers[r2] into r7;
    lte r3 r7 into r8;
    assert.eq r8 true;
    get token_withdrawal_limits[r2] into r9;
    get total_supply[r2] into r10;
    lte r9.percentage 100_00u16 into r11;
    assert.eq r11 true;
    cast r9.percentage into r12 as u128;
    mul r10 r12 into r13;
    cast 100_00u16 into r14 as u128;
    div r13 r14 into r15;
    get.or_use token_snapshot_withdrawal[r2] r15 into r16;
    get.or_use token_snapshot_height[r2] 0u32 into r17;
    get.or_use token_amount_withdrawn[r2] 0u128 into r18;
    sub block.height r17 into r19;
    gt r19 r9.duration into r20;
    add r18 r3 into r21;
    ternary r20 r15 r16 into r22;
    ternary r20 block.height r17 into r23;
    ternary r20 r3 r21 into r24;
    gte r10 r9.threshold_no_limit into r25;
    lte r24 r22 into r26;
    not r25 into r27;
    or r27 r26 into r28;
    assert.eq r28 true;
    set r22 into token_snapshot_withdrawal[r2];
    set r23 into token_snapshot_height[r2];
    set r24 into token_amount_withdrawn[r2];
    sub r10 r3 into r29;
    set r29 into total_supply[r2];


function token_receive:
    input r0 as u128.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 32u32].public;
    input r3 as address.public;
    input r4 as [u8; 32u32].public;
    input r5 as address.public;
    input r6 as address.public;
    input r7 as u128.public;
    input r8 as u64.public;
    input r9 as u32.public;
    input r10 as [address; 5u32].private;
    input r11 as [signature; 5u32].private;
    assert.neq self.signer self.caller;
    call token_bridge_v0001.aleo/consume r0 r1 r3 r4 r5 r6 r7 r8 r9 r10 r11 into r12;
    async token_receive r12 self.caller r3 r7 into r13;
    output r13 as token_service_v0001.aleo/token_receive.future;

finalize token_receive:
    input r0 as token_bridge_v0001.aleo/consume.future;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    await r0;
    get token_connectors[r2] into r4;
    assert.eq r4 r1;
    get.or_use total_supply[r2] 0u128 into r5;
    add r5 r3 into r6;
    set r6 into total_supply[r2];
