import wrapped_token.aleo;
import holding.aleo;
import bridge.aleo;
program token_service.aleo;

















struct TSForeignContract:
    chain_id as u32;
    contract_address as [u8; 32u32];

struct TokenOrigin:
    chain_id as u32;
    token_service_address as [u8; 32u32];
    token_address as [u8; 32u32];


mapping token_service_contracts:
	key as u32.public;
	value as [u8; 32u32].public;


mapping council_program_TS:
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
	value as u16.public;


mapping timeframe:
	key as address.public;
	value as u32.public;


mapping maximum_liquidity_for_no_cap:
	key as address.public;
	value as u32.public;


mapping last_token_update:
	key as address.public;
	value as u32.public;


mapping last_min_supply:
	key as address.public;
	value as u64.public;





function token_service_initialize:
    input r0 as address.private;
    input r1 as address.private;
    async token_service_initialize r0 r1 into r2;
    output r2 as token_service.aleo/token_service_initialize.future;

finalize token_service_initialize:
    input r0 as address.public;
    input r1 as address.public;
    contains council_program_TS[true] into r2;
    not r2 into r3;
    assert.eq r3 true;
    set r0 into council_program_TS[true];
    set r1 into holding_program_TS[true];


function support_chain:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    async support_chain self.caller r0 r1 into r2;
    output r2 as token_service.aleo/support_chain.future;

finalize support_chain:
    input r0 as address.public;
    input r1 as u32.public;
    input r2 as [u8; 32u32].public;
    get council_program_TS[true] into r3;
    assert.eq r0 r3;
    set r2 into token_service_contracts[r1];


function enable_token:
    input r0 as address.public;
    input r1 as u64.public;
    input r2 as u16.public;
    input r3 as u32.public;
    async enable_token self.caller r0 r1 r2 r3 into r4;
    output r4 as token_service.aleo/enable_token.future;

finalize enable_token:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u16.public;
    input r4 as u32.public;
    get council_program_TS[true] into r5;
    assert.eq r0 r5;
    set r3 into max_outgoing_percentage[r1];
    set r4 into timeframe[r1];
    set r2 into minimum_transfers[r1];


function token_send:
    input r0 as address.public;
    input r1 as [u8; 32u32].public;
    input r2 as u64.public;
    input r3 as TokenOrigin.public;
    call wrapped_token.aleo/burn r2 r0 r3.chain_id r3.token_address into r4;
    call bridge.aleo/publish r3.chain_id r3.token_service_address r3.token_address self.caller r1 r2 into r5;
    async token_send r4 r5 r0 r3 r2 into r6;
    output r6 as token_service.aleo/token_send.future;

finalize token_send:
    input r0 as wrapped_token.aleo/burn.future;
    input r1 as bridge.aleo/publish.future;
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
    get timeframe[r2] into r10;
    sub 10000u16 r9 into r11;
    cast r11 into r12 as u64;
    mul r8 r12 into r13;
    cast 10000u16 into r14 as u64;
    div r13 r14 into r15;
    get.or_use last_token_update[r2] 0u32 into r16;
    get.or_use last_min_supply[r2] r15 into r17;
    sub block.height r16 into r18;
    cast r9 into r19 as u64;
    mul r8 r19 into r20;
    cast 10000u16 into r21 as u64;
    div r20 r21 into r22;
    cast r18 into r23 as u64;
    mul r22 r23 into r24;
    cast r10 into r25 as u64;
    div r24 r25 into r26;
    gt r17 r26 into r27;
    sub.w r17 r26 into r28;
    ternary r27 r28 0u64 into r29;
    gt r29 r15 into r30;
    ternary r30 r29 r15 into r31;
    sub r8 r4 into r32;
    gte r32 r31 into r33;
    assert.eq r33 true;
    set block.height into last_token_update[r2];
    set r31 into last_min_supply[r2];
    sub r8 r4 into r34;
    set r34 into total_supply[r2];


function token_receive:
    input r0 as TokenOrigin.public;
    input r1 as address.public;
    input r2 as [u8; 32u32].public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u64.public;
    input r6 as u32.public;
    input r7 as u32.public;
    call bridge.aleo/consume r0.chain_id r0.token_service_address r1 r2 r3 r4 r5 r6 r7 into r8;
    call wrapped_token.aleo/mint r4 r5 r1 r0.chain_id r0.token_address into r9;
    is.eq r3 r4 into r10;
    not r10 into r11;
    call holding.aleo/hold_fund r1 r3 r5 into r12;
    async token_receive r8 r9 r12 r1 r5 r4 r11 into r13;
    output r13 as token_service.aleo/token_receive.future;

finalize token_receive:
    input r0 as bridge.aleo/consume.future;
    input r1 as wrapped_token.aleo/mint.future;
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
