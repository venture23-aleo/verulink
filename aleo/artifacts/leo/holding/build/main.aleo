import wrapped_tokens.aleo;
program holding.aleo;






struct TokenAcc:
    user as address;
    token_id as address;


mapping governance_holding:
	key as boolean.public;
	value as address.public;


mapping holdings:
	key as TokenAcc.public;
	value as u64.public;



function initialize_holding:
    input r0 as address.public;
    async initialize_holding r0 into r1;
    output r1 as holding.aleo/initialize_holding.future;

finalize initialize_holding:
    input r0 as address.public;
    contains governance_holding[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into governance_holding[true];


function update_governance_holding:
    input r0 as address.public;
    async update_governance_holding self.caller r0 into r1;
    output r1 as holding.aleo/update_governance_holding.future;

finalize update_governance_holding:
    input r0 as address.public;
    input r1 as address.public;
    get governance_holding[true] into r2;
    assert.eq r0 r2;
    set r1 into governance_holding[true];


function hold_fund:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    assert.neq self.signer self.caller;
    assert.eq self.caller aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3;
    async hold_fund r0 r1 r2 into r3;
    output r3 as holding.aleo/hold_fund.future;

finalize hold_fund:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r1 r0 into r3 as TokenAcc;
    get.or_use holdings[r3] 0u64 into r4;
    add r4 r2 into r5;
    set r5 into holdings[r3];


function release_fund:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    call wrapped_tokens.aleo/transfer_public r1 r2 r0 into r3;
    async release_fund r3 r0 r1 r2 self.caller into r4;
    output r4 as holding.aleo/release_fund.future;

finalize release_fund:
    input r0 as wrapped_tokens.aleo/transfer_public.future;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    input r4 as address.public;
    await r0;
    get governance_holding[true] into r5;
    assert.eq r5 r4;
    cast r2 r1 into r6 as TokenAcc;
    get holdings[r6] into r7;
    sub r7 r3 into r8;
    set r8 into holdings[r6];
