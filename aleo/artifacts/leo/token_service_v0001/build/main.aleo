import token_bridge_v0001.aleo;
program token_service_v0001.aleo;










struct OutgoingPercentageInTime:
    outgoing_percentage as u16;
    timeframe as u32;
    max_no_cap as u128;


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


mapping max_outgoing_percentage:
	key as address.public;
	value as OutgoingPercentageInTime.public;


mapping last_token_update:
	key as address.public;
	value as u32.public;


mapping last_min_supply:
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
    cast r5 r6 r7 into r9 as OutgoingPercentageInTime;
    set r9 into max_outgoing_percentage[r1];
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
    contains max_outgoing_percentage[r1] into r3;
    assert.eq r3 true;
    remove max_outgoing_percentage[r1];
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


function update_outgoing_percentage_ts:
    input r0 as address.public;
    input r1 as u16.public;
    input r2 as u32.public;
    input r3 as u128.public;
    lte r1 100_00u16 into r4;
    assert.eq r4 true;
    async update_outgoing_percentage_ts self.caller r0 r1 r2 r3 into r5;
    output r5 as token_service_v0001.aleo/update_outgoing_percentage_ts.future;

finalize update_outgoing_percentage_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u16.public;
    input r3 as u32.public;
    input r4 as u128.public;
    get owner_TS[true] into r5;
    assert.eq r0 r5;
    cast r2 r3 r4 into r6 as OutgoingPercentageInTime;
    set r6 into max_outgoing_percentage[r1];










function token_send:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as [u8; 32u32].public;
    input r3 as u128.public;
    input r4 as u128.public;
    input r5 as [u8; 32u32].public;
    input r6 as [u8; 32u32].private;
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
    get total_supply[r2] into r9;
    get max_outgoing_percentage[r2] into r10;
    gte r9 r10.max_no_cap into r11;
    sub 100_00u16 r10.outgoing_percentage into r12;
    lte r12 100_00u16 into r13;
    assert.eq r13 true;
    cast r12 into r14 as u128;
    mul r9 r14 into r15;
    cast 100_00u16 into r16 as u128;
    div r15 r16 into r17;
    get.or_use last_token_update[r2] 0u32 into r18;
    get.or_use last_min_supply[r2] r17 into r19;
    lte r10.outgoing_percentage 100_00u16 into r20;
    assert.eq r20 true;
    cast r10.outgoing_percentage into r21 as u128;
    mul r9 r21 into r22;
    cast 100_00u16 into r23 as u128;
    div r22 r23 into r24;
    sub block.height r18 into r25;
    cast r25 into r26 as u128;
    mul r24 r26 into r27;
    cast r10.timeframe into r28 as u128;
    div r27 r28 into r29;
    gt r19 r29 into r30;
    sub.w r19 r29 into r31;
    ternary r30 r31 0u128 into r32;
    gt r32 r17 into r33;
    ternary r33 r32 r17 into r34;
    sub r9 r3 into r35;
    gte r35 r34 into r36;
    assert.eq r36 true;
    set block.height into last_token_update[r2];
    set r34 into last_min_supply[r2];
    sub r9 r3 into r37;
    set r37 into total_supply[r2];


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
