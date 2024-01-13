program wusdc_token.aleo;

record token:
    owner as address.private;
    amount as u64.private;

struct Approval:
    approver as address;
    spender as address;


mapping account:
	key as address.public;
	value as u64.public;


mapping approvals:
	key as field.public;
	value as u64.public;


mapping governance_wusdc:
	key as boolean.public;
	value as address.public;

function initialize_wusdc_token:
    async initialize_wusdc_token self.caller into r0;
    output r0 as wusdc_token.aleo/initialize_wusdc_token.future;

finalize initialize_wusdc_token:
    input r0 as address.public;
    contains governance_wusdc[true] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into governance_wusdc[true];


function update_governance_wusdc_token:
    input r0 as address.public;
    async update_governance_wusdc_token self.caller r0 into r1;
    output r1 as wusdc_token.aleo/update_governance_wusdc_token.future;

finalize update_governance_wusdc_token:
    input r0 as address.public;
    input r1 as address.public;
    get governance_wusdc[true] into r2;
    assert.eq r0 r2;
    set r1 into governance_wusdc[true];






function mint_public:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as u128.private;
    input r3 as [u8; 32u32].private;
    assert.eq r2 27236160417u128;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r4 as [u8; 32u32];
    assert.eq r3 r4;
    async mint_public self.caller r0 r1 into r5;
    output r5 as wusdc_token.aleo/mint_public.future;

finalize mint_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get governance_wusdc[true] into r3;
    assert.eq r0 r3;
    get.or_use account[r1] 0u64 into r4;
    add r4 r2 into r5;
    set r5 into account[r1];


function burn_public:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as u128.private;
    input r3 as [u8; 32u32].private;
    assert.eq r2 27236160417u128;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r4 as [u8; 32u32];
    assert.eq r3 r4;
    async burn_public self.caller r0 r1 into r5;
    output r5 as wusdc_token.aleo/burn_public.future;

finalize burn_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get governance_wusdc[true] into r3;
    assert.eq r0 r3;
    get.or_use account[r1] 0u64 into r4;
    sub r4 r2 into r5;
    set r5 into account[r1];


function transfer_public:
    input r0 as address.public;
    input r1 as u64.public;
    async transfer_public self.caller r0 r1 into r2;
    output r2 as wusdc_token.aleo/transfer_public.future;

finalize transfer_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get.or_use account[r0] 0u64 into r3;
    sub r3 r2 into r4;
    set r4 into account[r0];
    get.or_use account[r1] 0u64 into r5;
    add r5 r2 into r6;
    set r6 into account[r1];


function transfer_private:
    input r0 as token.record;
    input r1 as address.private;
    input r2 as u64.private;
    sub r0.amount r2 into r3;
    cast r0.owner r3 into r4 as token.record;
    cast r1 r2 into r5 as token.record;
    output r4 as token.record;
    output r5 as token.record;


function transfer_private_to_public:
    input r0 as token.record;
    input r1 as address.public;
    input r2 as u64.public;
    sub r0.amount r2 into r3;
    cast r0.owner r3 into r4 as token.record;
    async transfer_private_to_public r1 r2 into r5;
    output r4 as token.record;
    output r5 as wusdc_token.aleo/transfer_private_to_public.future;

finalize transfer_private_to_public:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use account[r0] 0u64 into r2;
    add r2 r1 into r3;
    set r3 into account[r0];


function transfer_public_to_private:
    input r0 as address.public;
    input r1 as u64.public;
    cast r0 r1 into r2 as token.record;
    async transfer_public_to_private self.caller r1 into r3;
    output r2 as token.record;
    output r3 as wusdc_token.aleo/transfer_public_to_private.future;

finalize transfer_public_to_private:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use account[r0] 0u64 into r2;
    sub r2 r1 into r3;
    set r3 into account[r0];


function approve_public:
    input r0 as address.public;
    input r1 as u64.public;
    cast self.caller r0 into r2 as Approval;
    hash.bhp256 r2 into r3 as field;
    async approve_public r3 r1 into r4;
    output r4 as wusdc_token.aleo/approve_public.future;

finalize approve_public:
    input r0 as field.public;
    input r1 as u64.public;
    get.or_use approvals[r0] 0u64 into r2;
    add r2 r1 into r3;
    set r3 into approvals[r0];


function unapprove_public:
    input r0 as address.public;
    input r1 as u64.public;
    cast self.caller r0 into r2 as Approval;
    hash.bhp256 r2 into r3 as field;
    async unapprove_public r3 r1 into r4;
    output r4 as wusdc_token.aleo/unapprove_public.future;

finalize unapprove_public:
    input r0 as field.public;
    input r1 as u64.public;
    get approvals[r0] into r2;
    sub r2 r1 into r3;
    set r3 into approvals[r0];


function transfer_from_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r0 self.caller into r3 as Approval;
    hash.bhp256 r3 into r4 as field;
    async transfer_from_public r4 r0 r1 r2 into r5;
    output r5 as wusdc_token.aleo/transfer_from_public.future;

finalize transfer_from_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    get approvals[r0] into r4;
    sub r4 r3 into r5;
    set r5 into approvals[r0];
    get account[r1] into r6;
    sub r6 r3 into r7;
    set r7 into account[r1];
    get.or_use account[r2] 0u64 into r8;
    add r8 r3 into r9;
    set r9 into account[r2];






