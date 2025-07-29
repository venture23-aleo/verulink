import credits.aleo;
import token_registry.aleo;
program vlink_holding_v2.aleo;

struct TokenMetadata:
    token_id as field;
    name as u128;
    symbol as u128;
    decimals as u8;
    supply as u128;
    max_supply as u128;
    admin as address;
    external_authorization_required as boolean;
    external_authorization_party as address;

struct TokenOwner:
    account as address;
    token_id as field;

struct Image:
    pre_image as field;
    receiver as address;

struct Holder:
    account as address;
    token_id as field;

mapping holdings:
    key as Holder.public;
    value as u128.public;

mapping owner_holding:
    key as boolean.public;
    value as address.public;

function initialize_holding:
    input r0 as address.public;
    async initialize_holding r0 into r1;
    output r1 as vlink_holding_v2.aleo/initialize_holding.future;

finalize initialize_holding:
    input r0 as address.public;
    contains owner_holding[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into owner_holding[true];

function transfer_ownership_holding:
    input r0 as address.public;
    async transfer_ownership_holding self.caller r0 into r1;
    output r1 as vlink_holding_v2.aleo/transfer_ownership_holding.future;

finalize transfer_ownership_holding:
    input r0 as address.public;
    input r1 as address.public;
    get owner_holding[true] into r2;
    assert.eq r0 r2;
    set r1 into owner_holding[true];

function hold_fund:
    input r0 as address.public;
    input r1 as field.private;
    input r2 as u128.public;
    cast r0 r1 into r3 as Holder;
    async hold_fund self.caller r3 r2 into r4;
    output r4 as vlink_holding_v2.aleo/hold_fund.future;

finalize hold_fund:
    input r0 as address.public;
    input r1 as Holder.public;
    input r2 as u128.public;
    get owner_holding[true] into r3;
    assert.eq r0 r3;
    get.or_use holdings[r1] 0u128 into r4;
    add r4 r2 into r5;
    set r5 into holdings[r1];

function release_fund:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    call token_registry.aleo/transfer_public r1 r0 r2 into r3;
    cast r0 r1 into r4 as Holder;
    async release_fund self.caller r4 r2 r3 into r5;
    output r5 as vlink_holding_v2.aleo/release_fund.future;

finalize release_fund:
    input r0 as address.public;
    input r1 as Holder.public;
    input r2 as u128.public;
    input r3 as token_registry.aleo/transfer_public.future;
    await r3;
    get owner_holding[true] into r4;
    assert.eq r0 r4;
    get holdings[r1] into r5;
    sub r5 r2 into r6;
    set r6 into holdings[r1];

function release_fund_private:
    input r0 as address.private;
    input r1 as field.private;
    input r2 as field.public;
    input r3 as u128.public;
    cast r1 r0 into r4 as Image;
    hash.bhp256 r4 into r5 as address;
    call token_registry.aleo/transfer_public_to_private r2 r0 r3 false into r6 r7;
    cast r5 r2 into r8 as Holder;
    async release_fund_private self.caller r8 r3 r7 into r9;
    output r6 as token_registry.aleo/Token.record;
    output r9 as vlink_holding_v2.aleo/release_fund_private.future;

finalize release_fund_private:
    input r0 as address.public;
    input r1 as Holder.public;
    input r2 as u128.public;
    input r3 as token_registry.aleo/transfer_public_to_private.future;
    await r3;
    get owner_holding[true] into r4;
    assert.eq r0 r4;
    get holdings[r1] into r5;
    sub r5 r2 into r6;
    set r6 into holdings[r1];
