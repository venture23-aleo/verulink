program wrapped_tokens.aleo;

record wrapped_token:
    owner as address.private;
    token_id as address.private;
    amount as u64.private;

struct WTForeignContract:
    chain_id as u128;
    contract_address as [u8; 32u32];

struct TokenInfo:
    name as [u8; 32u32];
    symbol as [u8; 16u32];
    decimals as u8;

struct WrappedTokenInfo:
    token_info as TokenInfo;
    origin as WTForeignContract;

struct TokenAccount:
    user as address;
    token_id as address;


mapping token_info:
	key as address.public;
	value as TokenInfo.public;


mapping token_origin:
	key as address.public;
	value as WTForeignContract.public;


mapping token_supply:
	key as address.public;
	value as u64.public;


mapping token_balances:
	key as TokenAccount.public;
	value as u64.public;


mapping governance_WT:
	key as boolean.public;
	value as address.public;



function wrapped_token_initialize:
    input r0 as address.private;
    async wrapped_token_initialize r0 into r1;
    output r1 as wrapped_tokens.aleo/wrapped_token_initialize.future;

finalize wrapped_token_initialize:
    input r0 as address.public;
    contains governance_WT[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into governance_WT[true];


function update_governance_wt:
    input r0 as address.public;
    async update_governance_wt self.caller r0 into r1;
    output r1 as wrapped_tokens.aleo/update_governance_wt.future;

finalize update_governance_wt:
    input r0 as address.public;
    input r1 as address.public;
    get governance_WT[true] into r2;
    assert.eq r0 r2;
    set r1 into governance_WT[true];


function add_token_wt:
    input r0 as [u8; 32u32].public;
    input r1 as [u8; 16u32].public;
    input r2 as u8.public;
    input r3 as u128.public;
    input r4 as [u8; 32u32].public;
    cast r0 r1 r2 into r5 as TokenInfo;
    cast r3 r4 into r6 as WTForeignContract;
    cast r5 r6 into r7 as WrappedTokenInfo;
    hash.bhp256 r7 into r8 as address;
    async add_token_wt self.caller r8 r0 r1 r2 r3 r4 into r9;
    output r9 as wrapped_tokens.aleo/add_token_wt.future;

finalize add_token_wt:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as [u8; 32u32].public;
    input r3 as [u8; 16u32].public;
    input r4 as u8.public;
    input r5 as u128.public;
    input r6 as [u8; 32u32].public;
    get governance_WT[true] into r7;
    assert.eq r0 r7;
    contains token_info[r1] into r8;
    not r8 into r9;
    assert.eq r9 true;
    cast r5 r6 into r10 as WTForeignContract;
    cast r2 r3 r4 into r11 as TokenInfo;
    set r11 into token_info[r1];
    set r10 into token_origin[r1];


function transfer_public:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as address.private;
    async transfer_public self.caller r2 r0 r1 into r3;
    output r3 as wrapped_tokens.aleo/transfer_public.future;

finalize transfer_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    contains token_info[r1] into r4;
    assert.eq r4 true;
    contains token_origin[r1] into r5;
    assert.eq r5 true;
    cast r0 r1 into r6 as TokenAccount;
    cast r2 r1 into r7 as TokenAccount;
    get token_balances[r6] into r8;
    sub r8 r3 into r9;
    set r9 into token_balances[r6];
    get.or_use token_balances[r7] 0u64 into r10;
    add r10 r3 into r11;
    set r11 into token_balances[r7];


function transfer_private:
    input r0 as wrapped_token.record;
    input r1 as address.private;
    input r2 as u64.private;
    sub r0.amount r2 into r3;
    cast r0.owner r0.token_id r3 into r4 as wrapped_token.record;
    cast r1 r0.token_id r2 into r5 as wrapped_token.record;
    output r4 as wrapped_token.record;
    output r5 as wrapped_token.record;


function transfer_private_to_public:
    input r0 as wrapped_token.record;
    input r1 as address.private;
    input r2 as u64.private;
    sub r0.amount r2 into r3;
    cast r0.owner r0.token_id r3 into r4 as wrapped_token.record;
    async transfer_private_to_public r0.token_id r1 r2 into r5;
    output r4 as wrapped_token.record;
    output r5 as wrapped_tokens.aleo/transfer_private_to_public.future;

finalize transfer_private_to_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r1 r0 into r3 as TokenAccount;
    get.or_use token_balances[r3] 0u64 into r4;
    add r4 r2 into r5;
    set r5 into token_balances[r3];


function transfer_public_to_private:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as address.private;
    cast r0 r2 r1 into r3 as wrapped_token.record;
    async transfer_public_to_private r2 self.caller r1 into r4;
    output r3 as wrapped_token.record;
    output r4 as wrapped_tokens.aleo/transfer_public_to_private.future;

finalize transfer_public_to_private:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r1 r0 into r3 as TokenAccount;
    get token_balances[r3] into r4;
    sub r4 r2 into r5;
    set r5 into token_balances[r3];


function mint:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as address.private;
    input r3 as u128.private;
    input r4 as [u8; 32u32].private;
    assert.neq self.signer self.caller;
    assert.eq self.caller aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3;
    async mint r0 r1 r2 r3 r4 into r5;
    output r5 as wrapped_tokens.aleo/mint.future;

finalize mint:
    input r0 as address.public;
    input r1 as u64.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as [u8; 32u32].public;
    cast r3 r4 into r5 as WTForeignContract;
    get token_origin[r2] into r6;
    assert.eq r6 r5;
    cast r0 r2 into r7 as TokenAccount;
    get.or_use token_balances[r7] 0u64 into r8;
    add r8 r1 into r9;
    set r9 into token_balances[r7];
    get.or_use token_supply[r2] 0u64 into r10;
    add r10 r1 into r11;
    set r11 into token_supply[r2];


function burn:
    input r0 as u64.private;
    input r1 as address.private;
    input r2 as u128.private;
    input r3 as [u8; 32u32].private;
    assert.neq self.signer self.caller;
    assert.eq self.caller aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3;
    async burn self.signer r0 r1 r2 r3 into r4;
    output r4 as wrapped_tokens.aleo/burn.future;

finalize burn:
    input r0 as address.public;
    input r1 as u64.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as [u8; 32u32].public;
    cast r3 r4 into r5 as WTForeignContract;
    get token_origin[r2] into r6;
    assert.eq r6 r5;
    cast r0 r2 into r7 as TokenAccount;
    get token_balances[r7] into r8;
    sub r8 r1 into r9;
    set r9 into token_balances[r7];
    get token_supply[r2] into r10;
    sub r10 r1 into r11;
    set r11 into token_supply[r2];
