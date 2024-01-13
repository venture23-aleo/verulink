import token_bridge.aleo;
program token_service.aleo;












struct OutgoingPercentageInTime:
    outgoing_percentage as u16;
    timeframe as u32;


mapping token_service_contracts:
	key as u128.public;
	value as [u8; 32u32].public;


mapping governance_TS:
	key as boolean.public;
	value as address.public;


mapping total_supply:
	key as address.public;
	value as u64.public;


mapping token_connectors:
	key as address.public;
	value as address.public;


mapping minimum_transfers:
	key as address.public;
	value as u64.public;


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
	value as u64.public;



function initialize_ts:
    input r0 as address.private;
    input r1 as address.private;
    async initialize_ts r0 r1 into r2;
    output r2 as token_service.aleo/initialize_ts.future;

finalize initialize_ts:
    input r0 as address.public;
    input r1 as address.public;
    contains governance_TS[true] into r2;
    not r2 into r3;
    assert.eq r3 true;
    set r0 into governance_TS[true];


function update_governance_ts:
    input r0 as address.public;
    async update_governance_ts self.caller r0 into r1;
    output r1 as token_service.aleo/update_governance_ts.future;

finalize update_governance_ts:
    input r0 as address.public;
    input r1 as address.public;
    get governance_TS[true] into r2;
    assert.eq r0 r2;
    set r1 into governance_TS[true];


function support_chain_ts:
    input r0 as u128.public;
    input r1 as [u8; 32u32].public;
    async support_chain_ts self.caller r0 r1 into r2;
    output r2 as token_service.aleo/support_chain_ts.future;

finalize support_chain_ts:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as [u8; 32u32].public;
    get governance_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into token_service_contracts[r1];


function remove_chain_ts:
    input r0 as u128.public;
    async remove_chain_ts self.caller r0 into r1;
    output r1 as token_service.aleo/remove_chain_ts.future;

finalize remove_chain_ts:
    input r0 as address.public;
    input r1 as u128.public;
    get governance_TS[true] into r2;
    assert.eq r0 r2;
    remove token_service_contracts[r1];


function support_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u16.public;
    input r4 as u32.public;
    async support_token_ts self.caller r0 r1 r2 r3 r4 into r5;
    output r5 as token_service.aleo/support_token_ts.future;

finalize support_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    input r4 as u16.public;
    input r5 as u32.public;
    get governance_TS[true] into r6;
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
    get governance_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into token_connectors[r1];


function remove_token_ts:
    input r0 as address.public;
    async remove_token_ts self.caller r0 into r1;
    output r1 as token_service.aleo/remove_token_ts.future;

finalize remove_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    get governance_TS[true] into r2;
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
    get governance_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into token_connectors[r1];


function update_minimum_transfer_ts:
    input r0 as address.public;
    input r1 as u64.private;
    async update_minimum_transfer_ts self.caller r0 r1 into r2;
    output r2 as token_service.aleo/update_minimum_transfer_ts.future;

finalize update_minimum_transfer_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get governance_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into minimum_transfers[r1];


function update_outgoing_percentage_ts:
    input r0 as address.public;
    input r1 as u16.private;
    input r2 as u32.private;
    async update_outgoing_percentage_ts self.caller r0 r1 r2 into r3;
    output r3 as token_service.aleo/update_outgoing_percentage_ts.future;

finalize update_outgoing_percentage_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u16.public;
    input r3 as u32.public;
    get governance_TS[true] into r4;
    assert.eq r0 r4;
    cast r2 r3 into r5 as OutgoingPercentageInTime;
    set r5 into max_outgoing_percentage[r1];


function token_send:
    input r0 as address.public;
    input r1 as [u8; 32u32].public;
    input r2 as u64.public;
    input r3 as u128.public;
    input r4 as [u8; 32u32].private;
    input r5 as [u8; 32u32].private;
    call token_bridge.aleo/publish r3 r5 r4 self.caller r1 r2 into r6;
    async token_send r6 self.caller r0 r2 into r7;
    output r7 as token_service.aleo/token_send.future;

finalize token_send:
    input r0 as token_bridge.aleo/publish.future;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    await r0;
    get token_connectors[r2] into r4;
    assert.eq r4 r1;
    get minimum_transfers[r2] into r5;
    gte r3 r5 into r6;
    assert.eq r6 true;
    get total_supply[r2] into r7;
    get max_outgoing_percentage[r2] into r8;
    sub 10000u16 r8.outgoing_percentage into r9;
    cast r9 into r10 as u64;
    mul r7 r10 into r11;
    cast 10000u16 into r12 as u64;
    div r11 r12 into r13;
    get.or_use last_token_update[r2] 0u32 into r14;
    get.or_use last_min_supply[r2] r13 into r15;
    sub block.height r14 into r16;
    cast r8.outgoing_percentage into r17 as u64;
    mul r7 r17 into r18;
    cast 10000u16 into r19 as u64;
    div r18 r19 into r20;
    cast r16 into r21 as u64;
    mul r20 r21 into r22;
    cast r8.timeframe into r23 as u64;
    div r22 r23 into r24;
    gt r15 r24 into r25;
    sub.w r15 r24 into r26;
    ternary r25 r26 0u64 into r27;
    gt r27 r13 into r28;
    ternary r28 r27 r13 into r29;
    sub r7 r3 into r30;
    gte r30 r29 into r31;
    assert.eq r31 true;
    set block.height into last_token_update[r2];
    set r29 into last_min_supply[r2];
    sub r7 r3 into r32;
    set r32 into total_supply[r2];


function token_receive:
    input r0 as u128.private;
    input r1 as [u8; 32u32].private;
    input r2 as [u8; 32u32].private;
    input r3 as address.public;
    input r4 as [u8; 32u32].public;
    input r5 as address.public;
    input r6 as address.public;
    input r7 as u64.public;
    input r8 as u32.public;
    input r9 as u32.public;
    call token_bridge.aleo/consume r0 r1 r3 r4 r5 r6 r7 r8 r9 into r10;
    async token_receive r10 self.caller r3 r7 into r11;
    output r11 as token_service.aleo/token_receive.future;

finalize token_receive:
    input r0 as token_bridge.aleo/consume.future;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    await r0;
    get token_connectors[r2] into r4;
    assert.eq r4 r1;
    get.or_use total_supply[r2] 0u64 into r5;
    add r5 r3 into r6;
    set r6 into total_supply[r2];
