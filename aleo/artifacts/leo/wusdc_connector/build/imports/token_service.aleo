import token_bridge.aleo;
program token_service.aleo;












struct OutgoingPercentageInTime:
    outgoing_percentage as u16;
    timeframe as u32;


mapping token_service_contracts:
	key as u128.public;
	value as [u8; 32u32].public;


mapping owner_TS:
	key as boolean.public;
	value as address.public;


mapping total_supply:
	key as address.public;
	value as u128.public;


mapping token_connectors:
	key as address.public;
	value as address.public;


mapping minimum_transfers:
	key as address.public;
	value as u128.public;


mapping max_outgoing_percentage:
	key as address.public;
	value as OutgoingPercentageInTime.public;


mapping maximum_liquidity_for_no_cap:
	key as address.public;
	value as u32.public;


mapping last_token_update:
	key as address.public;
	value as u32.public;


mapping last_min_supply:
	key as address.public;
	value as u128.public;



function initialize_ts:
    input r0 as address.private;
    async initialize_ts r0 into r1;
    output r1 as token_service.aleo/initialize_ts.future;

finalize initialize_ts:
    input r0 as address.public;
    contains owner_TS[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into owner_TS[true];


function transfer_ownership_ts:
    input r0 as address.public;
    async transfer_ownership_ts self.caller r0 into r1;
    output r1 as token_service.aleo/transfer_ownership_ts.future;

finalize transfer_ownership_ts:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    set r1 into owner_TS[true];


function support_chain_ts:
    input r0 as u128.public;
    input r1 as [u8; 32u32].public;
    async support_chain_ts self.caller r0 r1 into r2;
    output r2 as token_service.aleo/support_chain_ts.future;

finalize support_chain_ts:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as [u8; 32u32].public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into token_service_contracts[r1];


function remove_chain_ts:
    input r0 as u128.public;
    async remove_chain_ts self.caller r0 into r1;
    output r1 as token_service.aleo/remove_chain_ts.future;

finalize remove_chain_ts:
    input r0 as address.public;
    input r1 as u128.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    remove token_service_contracts[r1];


function support_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as u16.public;
    input r4 as u32.public;
    async support_token_ts self.caller r0 r1 r2 r3 r4 into r5;
    output r5 as token_service.aleo/support_token_ts.future;

finalize support_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as u16.public;
    input r5 as u32.public;
    get owner_TS[true] into r6;
    assert.eq r0 r6;
    cast r4 r5 into r7 as OutgoingPercentageInTime;
    set r7 into max_outgoing_percentage[r1];
    set r3 into minimum_transfers[r1];
    set r2 into token_connectors[r1];


function update_token_connector_ts:
    input r0 as address.public;
    input r1 as address.public;
    async update_token_connector_ts self.caller r0 r1 into r2;
    output r2 as token_service.aleo/update_token_connector_ts.future;

finalize update_token_connector_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into token_connectors[r1];


function remove_token_ts:
    input r0 as address.public;
    async remove_token_ts self.caller r0 into r1;
    output r1 as token_service.aleo/remove_token_ts.future;

finalize remove_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TS[true] into r2;
    assert.eq r0 r2;
    remove max_outgoing_percentage[r1];
    remove minimum_transfers[r1];
    remove token_connectors[r1];


function update_token_connector:
    input r0 as address.private;
    input r1 as address.private;
    async update_token_connector self.caller r0 r1 into r2;
    output r2 as token_service.aleo/update_token_connector.future;

finalize update_token_connector:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into token_connectors[r1];


function update_minimum_transfer_ts:
    input r0 as address.public;
    input r1 as u128.private;
    async update_minimum_transfer_ts self.caller r0 r1 into r2;
    output r2 as token_service.aleo/update_minimum_transfer_ts.future;

finalize update_minimum_transfer_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u128.public;
    get owner_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into minimum_transfers[r1];


function update_outgoing_percentage_ts:
    input r0 as address.public;
    input r1 as u16.private;
    input r2 as u32.private;
    lte r1 100_00u16 into r3;
    assert.eq r3 true;
    async update_outgoing_percentage_ts self.caller r0 r1 r2 into r4;
    output r4 as token_service.aleo/update_outgoing_percentage_ts.future;

finalize update_outgoing_percentage_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u16.public;
    input r3 as u32.public;
    get owner_TS[true] into r4;
    assert.eq r0 r4;
    cast r2 r3 into r5 as OutgoingPercentageInTime;
    set r5 into max_outgoing_percentage[r1];










function token_send:
    input r0 as address.public;
    input r1 as [u8; 32u32].public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as [u8; 32u32].private;
    input r5 as [u8; 32u32].private;
    assert.neq self.signer self.caller;
    call token_bridge.aleo/publish r3 r5 r4 self.caller r1 r2 into r6;
    async token_send r6 self.caller r0 r2 into r7;
    output r7 as token_service.aleo/token_send.future;

finalize token_send:
    input r0 as token_bridge.aleo/publish.future;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    await r0;
    get token_connectors[r2] into r4;
    assert.eq r4 r1;
    get minimum_transfers[r2] into r5;
    gte r3 r5 into r6;
    assert.eq r6 true;
    get total_supply[r2] into r7;
    get max_outgoing_percentage[r2] into r8;
    sub 100_00u16 r8.outgoing_percentage into r9;
    lte r9 100_00u16 into r10;
    assert.eq r10 true;
    cast r9 into r11 as u128;
    mul r7 r11 into r12;
    cast 100_00u16 into r13 as u128;
    div r12 r13 into r14;
    get.or_use last_token_update[r2] 0u32 into r15;
    get.or_use last_min_supply[r2] r14 into r16;
    sub 100_00u16 r8.outgoing_percentage into r17;
    lte r17 100_00u16 into r18;
    assert.eq r18 true;
    cast r17 into r19 as u128;
    mul r7 r19 into r20;
    cast 100_00u16 into r21 as u128;
    div r20 r21 into r22;
    lte r8.outgoing_percentage 100_00u16 into r23;
    assert.eq r23 true;
    cast r8.outgoing_percentage into r24 as u128;
    mul r7 r24 into r25;
    cast 100_00u16 into r26 as u128;
    div r25 r26 into r27;
    sub block.height r15 into r28;
    cast r28 into r29 as u128;
    mul r27 r29 into r30;
    cast r8.timeframe into r31 as u128;
    div r30 r31 into r32;
    gt r16 r32 into r33;
    sub.w r16 r32 into r34;
    ternary r33 r34 0u128 into r35;
    gt r35 r22 into r36;
    ternary r36 r35 r22 into r37;
    sub r7 r3 into r38;
    gte r38 r37 into r39;
    assert.eq r39 true;
    set block.height into last_token_update[r2];
    set r37 into last_min_supply[r2];
    sub r7 r3 into r40;
    set r40 into total_supply[r2];


function token_receive:
    input r0 as u128.private;
    input r1 as [u8; 32u32].private;
    input r2 as [u8; 32u32].private;
    input r3 as address.public;
    input r4 as [u8; 32u32].public;
    input r5 as address.public;
    input r6 as address.public;
    input r7 as u128.public;
    input r8 as u64.public;
    input r9 as u32.public;
    assert.neq self.signer self.caller;
    call token_bridge.aleo/consume r0 r1 r3 r4 r5 r6 r7 r8 r9 into r10;
    async token_receive r10 self.caller r3 r7 into r11;
    output r11 as token_service.aleo/token_receive.future;

finalize token_receive:
    input r0 as token_bridge.aleo/consume.future;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    await r0;
    get token_connectors[r2] into r4;
    assert.eq r4 r1;
    get.or_use total_supply[r2] 0u128 into r5;
    add r5 r3 into r6;
    set r6 into total_supply[r2];
