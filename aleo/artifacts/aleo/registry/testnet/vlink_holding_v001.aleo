import credits.aleo;
import token_registry.aleo;

program vlink_holding_v001.aleo;

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
    output r1 as vlink_holding_v001.aleo/initialize_holding.future;

finalize initialize_holding:
    input r0 as address.public;
    contains owner_holding[true] into r1;
    not r1 into r2;
    assert.eq r2 true ;
    set r0 into owner_holding[true];

function transfer_ownership_holding:
    input r0 as address.public;
    async transfer_ownership_holding self.caller r0 into r1;
    output r1 as vlink_holding_v001.aleo/transfer_ownership_holding.future;

finalize transfer_ownership_holding:
    input r0 as address.public;
    input r1 as address.public;
    get owner_holding[true] into r2;
    assert.eq r0 r2 ;
    set r1 into owner_holding[true];

function hold_fund:
    input r0 as address.public;
    input r1 as field.private;
    input r2 as u128.public;
    cast r0 r1 into r3 as Holder;
    async hold_fund self.caller r3 r2 into r4;
    output r4 as vlink_holding_v001.aleo/hold_fund.future;

finalize hold_fund:
    input r0 as address.public;
    input r1 as Holder.public;
    input r2 as u128.public;
    get owner_holding[true] into r3;
    assert.eq r0 r3 ;
    get.or_use holdings[r1] 0u128 into r4;
    add r4 r2 into r5;
    set r5 into holdings[r1];

function release_fund:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    call token_registry.aleo/transfer_public r1 r0 r2 into r3;
    cast r0 r1 into r4 as Holder;
    async release_fund r3 self.caller r4 r2 into r5;
    output r5 as vlink_holding_v001.aleo/release_fund.future;

finalize release_fund:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as address.public;
    input r2 as Holder.public;
    input r3 as u128.public;
    await r0;
    get owner_holding[true] into r4;
    assert.eq r1 r4 ;
    get holdings[r2] into r5;
    sub r5 r3 into r6;
    set r6 into holdings[r2];