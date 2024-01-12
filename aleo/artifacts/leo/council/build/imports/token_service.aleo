import token_bridge.aleo;
program token_service.aleo;












struct TSForeignContract:
    chain_id as u128;
    contract_address as [u8; 32u32];

struct TokenOrigin:
    chain_id as u128;
    token_service_address as [u8; 32u32];
    token_address as [u8; 32u32];

struct OutgoingPercentageInTime:
    outgoing_percentage as u16;
    timeframe as u32;


mapping token_service_contracts:
	key as u128.public;
	value as [u8; 32u32].public;


mapping governance_TS:
	key as boolean.public;
	value as address.public;


mapping holding_program_TS:
	key as boolean.public;
	value as address.public;


mapping total_supply:
	key as address.public;
	value as u64.public;


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
    set r1 into holding_program_TS[true];


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
    input r1 as u64.public;
    input r2 as u16.public;
    input r3 as u32.public;
    async support_token_ts self.caller r0 r1 r2 r3 into r4;
    output r4 as token_service.aleo/support_token_ts.future;

finalize support_token_ts:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u16.public;
    input r4 as u32.public;
    get governance_TS[true] into r5;
    assert.eq r0 r5;
    cast r3 r4 into r6 as OutgoingPercentageInTime;
    set r6 into max_outgoing_percentage[r1];
    set r2 into minimum_transfers[r1];


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
    async token_send r6 r0 r2 into r7;
    output r7 as token_service.aleo/token_send.future;

finalize token_send:
    input r0 as token_bridge.aleo/publish.future;
    input r1 as address.public;
    input r2 as u64.public;
    await r0;
    get minimum_transfers[r1] into r3;
    gte r2 r3 into r4;
    assert.eq r4 true;
    get total_supply[r1] into r5;
    get max_outgoing_percentage[r1] into r6;
    sub 10000u16 r6.outgoing_percentage into r7;
    cast r7 into r8 as u64;
    mul r5 r8 into r9;
    cast 10000u16 into r10 as u64;
    div r9 r10 into r11;
    get.or_use last_token_update[r1] 0u32 into r12;
    get.or_use last_min_supply[r1] r11 into r13;
    sub block.height r12 into r14;
    cast r6.outgoing_percentage into r15 as u64;
    mul r5 r15 into r16;
    cast 10000u16 into r17 as u64;
    div r16 r17 into r18;
    cast r14 into r19 as u64;
    mul r18 r19 into r20;
    cast r6.timeframe into r21 as u64;
    div r20 r21 into r22;
    gt r13 r22 into r23;
    sub.w r13 r22 into r24;
    ternary r23 r24 0u64 into r25;
    gt r25 r11 into r26;
    ternary r26 r25 r11 into r27;
    sub r5 r2 into r28;
    gte r28 r27 into r29;
    assert.eq r29 true;
    set block.height into last_token_update[r1];
    set r27 into last_min_supply[r1];
    sub r5 r2 into r30;
    set r30 into total_supply[r1];


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
    async token_receive r10 r3 r7 into r11;
    output r11 as token_service.aleo/token_receive.future;

finalize token_receive:
    input r0 as token_bridge.aleo/consume.future;
    input r1 as address.public;
    input r2 as u64.public;
    await r0;
    get.or_use total_supply[r1] 0u64 into r3;
    add r3 r2 into r4;
    set r4 into total_supply[r1];
