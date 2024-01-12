import wrapped_tokens.aleo;
import holding.aleo;
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
    input r3 as TokenOrigin.public;
    call wrapped_tokens.aleo/burn r2 r0 r3.chain_id r3.token_address into r4;
    call token_bridge.aleo/publish r3.chain_id r3.token_service_address r3.token_address self.caller r1 r2 into r5;
    async token_send r4 r5 r0 r3 r2 into r6;
    output r6 as token_service.aleo/token_send.future;

finalize token_send:
    input r0 as wrapped_tokens.aleo/burn.future;
    input r1 as token_bridge.aleo/publish.future;
    input r2 as address.public;
    input r3 as TokenOrigin.public;
    input r4 as u64.public;
    await r0;
    await r1;
    get token_service_contracts[r3.chain_id] into r5;
    assert.eq r5 r3.token_service_address;
    get minimum_transfers[r2] into r6;
    gte r4 r6 into r7;
    assert.eq r7 true;
    get total_supply[r2] into r8;
    get max_outgoing_percentage[r2] into r9;
    sub 10000u16 r9.outgoing_percentage into r10;
    cast r10 into r11 as u64;
    mul r8 r11 into r12;
    cast 10000u16 into r13 as u64;
    div r12 r13 into r14;
    get.or_use last_token_update[r2] 0u32 into r15;
    get.or_use last_min_supply[r2] r14 into r16;
    sub block.height r15 into r17;
    cast r9.outgoing_percentage into r18 as u64;
    mul r8 r18 into r19;
    cast 10000u16 into r20 as u64;
    div r19 r20 into r21;
    cast r17 into r22 as u64;
    mul r21 r22 into r23;
    cast r9.timeframe into r24 as u64;
    div r23 r24 into r25;
    gt r16 r25 into r26;
    sub.w r16 r25 into r27;
    ternary r26 r27 0u64 into r28;
    gt r28 r14 into r29;
    ternary r29 r28 r14 into r30;
    sub r8 r4 into r31;
    gte r31 r30 into r32;
    assert.eq r32 true;
    set block.height into last_token_update[r2];
    set r30 into last_min_supply[r2];
    sub r8 r4 into r33;
    set r33 into total_supply[r2];


function token_receive:
    input r0 as TokenOrigin.public;
    input r1 as address.public;
    input r2 as [u8; 32u32].public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u64.public;
    input r6 as u32.public;
    input r7 as u32.public;
    call token_bridge.aleo/consume r0.chain_id r0.token_service_address r1 r2 r3 r4 r5 r6 r7 into r8;
    call wrapped_tokens.aleo/mint r4 r5 r1 r0.chain_id r0.token_address into r9;
    is.eq r3 r4 into r10;
    not r10 into r11;
    call holding.aleo/hold_fund r1 r3 r5 into r12;
    async token_receive r8 r9 r12 r1 r5 r4 r11 into r13;
    output r13 as token_service.aleo/token_receive.future;

finalize token_receive:
    input r0 as token_bridge.aleo/consume.future;
    input r1 as wrapped_tokens.aleo/mint.future;
    input r2 as holding.aleo/hold_fund.future;
    input r3 as address.public;
    input r4 as u64.public;
    input r5 as address.public;
    input r6 as boolean.public;
    await r0;
    await r1;
    await r2;
    get.or_use total_supply[r3] 0u64 into r7;
    add r7 r4 into r8;
    set r8 into total_supply[r3];
    get holding_program_TS[true] into r9;
    not r6 into r10;
    is.eq r9 r5 into r11;
    or r10 r11 into r12;
    assert.eq r12 true;
