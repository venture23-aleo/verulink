import wusdc_token.aleo;
program wusdc_holding.aleo;




mapping governance_holding:
	key as boolean.public;
	value as address.public;


mapping holdings:
	key as address.public;
	value as u64.public;

function initialize_wusdc_holding:
    async initialize_wusdc_holding self.caller into r0;
    output r0 as wusdc_holding.aleo/initialize_wusdc_holding.future;

finalize initialize_wusdc_holding:
    input r0 as address.public;
    contains governance_holding[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into governance_holding[true];


function update_governance_wusdc_holding:
    input r0 as address.public;
    async update_governance_wusdc_holding self.caller r0 into r1;
    output r1 as wusdc_holding.aleo/update_governance_wusdc_holding.future;

finalize update_governance_wusdc_holding:
    input r0 as address.public;
    input r1 as address.public;
    get governance_holding[true] into r2;
    assert.eq r0 r2;
    set r1 into governance_holding[true];


function hold_fund:
    input r0 as address.public;
    input r1 as u64.public;
    async hold_fund self.caller r0 r1 into r2;
    output r2 as wusdc_holding.aleo/hold_fund.future;

finalize hold_fund:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get governance_holding[true] into r3;
    assert.eq r3 r0;
    get.or_use holdings[r1] 0u64 into r4;
    add r4 r2 into r5;
    set r5 into holdings[r1];


function release_fund:
    input r0 as address.public;
    input r1 as u64.public;
    call wusdc_token.aleo/transfer_public r0 r1 into r2;
    async release_fund r2 r0 r1 self.caller into r3;
    output r3 as wusdc_holding.aleo/release_fund.future;

finalize release_fund:
    input r0 as wusdc_token.aleo/transfer_public.future;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    get governance_holding[true] into r4;
    assert.eq r4 r3;
    get holdings[r1] into r5;
    sub r5 r2 into r6;
    set r6 into holdings[r1];
