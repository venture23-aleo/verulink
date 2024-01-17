import wusdc_token.aleo;
program wusdc_holding.aleo;




mapping owner_holding:
	key as boolean.public;
	value as address.public;


mapping holdings:
	key as address.public;
	value as u128.public;

function initialize_wusdc_holding:
    async initialize_wusdc_holding self.caller into r0;
    output r0 as wusdc_holding.aleo/initialize_wusdc_holding.future;

finalize initialize_wusdc_holding:
    input r0 as address.public;
    contains owner_holding[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into owner_holding[true];


function transfer_ownership_wusdc_holdin:
    input r0 as address.public;
    async transfer_ownership_wusdc_holdin self.caller r0 into r1;
    output r1 as wusdc_holding.aleo/transfer_ownership_wusdc_holdin.future;

finalize transfer_ownership_wusdc_holdin:
    input r0 as address.public;
    input r1 as address.public;
    get owner_holding[true] into r2;
    assert.eq r0 r2;
    set r1 into owner_holding[true];


function hold_fund:
    input r0 as address.public;
    input r1 as u128.public;
    async hold_fund self.caller r0 r1 into r2;
    output r2 as wusdc_holding.aleo/hold_fund.future;

finalize hold_fund:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u128.public;
    get owner_holding[true] into r3;
    assert.eq r3 r0;
    get.or_use holdings[r1] 0u128 into r4;
    add r4 r2 into r5;
    set r5 into holdings[r1];


function release_fund:
    input r0 as address.public;
    input r1 as u128.public;
    call wusdc_token.aleo/transfer_public r0 r1 into r2;
    async release_fund r2 r0 r1 self.caller into r3;
    output r3 as wusdc_holding.aleo/release_fund.future;

finalize release_fund:
    input r0 as wusdc_token.aleo/transfer_public.future;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as address.public;
    await r0;
    get owner_holding[true] into r4;
    assert.eq r4 r3;
    get holdings[r1] into r5;
    sub r5 r2 into r6;
    set r6 into holdings[r1];
