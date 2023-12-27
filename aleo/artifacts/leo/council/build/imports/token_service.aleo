import bridge.aleo;
import wrapped_token.aleo;
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


mapping minimum_transfers:
	key as address.public;
	value as u64.public;



function token_service_initialize:
    assert.neq self.signer self.caller;
    async token_service_initialize self.caller into r0;
    output r0 as token_service.aleo/token_service_initialize.future;

finalize token_service_initialize:
    input r0 as address.public;
    contains council_program_TS[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into council_program_TS[true];


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
    async enable_token self.caller r0 r1 into r2;
    output r2 as token_service.aleo/enable_token.future;

finalize enable_token:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get council_program_TS[true] into r3;
    assert.eq r0 r3;
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


function token_receive:
    input r0 as TokenOrigin.public;
    input r1 as address.public;
    input r2 as [u8; 32u32].public;
    input r3 as address.public;
    input r4 as u64.public;
    input r5 as u32.public;
    input r6 as u32.public;
    call bridge.aleo/consume r0.chain_id r0.token_service_address r1 r2 r3 r4 r5 r6 into r7;
    call wrapped_token.aleo/mint r3 r4 r1 r0.chain_id r0.token_address into r8;
    async token_receive r7 r8 into r9;
    output r9 as token_service.aleo/token_receive.future;

finalize token_receive:
    input r0 as bridge.aleo/consume.future;
    input r1 as wrapped_token.aleo/mint.future;
    await r0;
    await r1;
