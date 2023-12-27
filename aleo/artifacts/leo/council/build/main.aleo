import bridge.aleo;
import wrapped_token.aleo;
import token_service.aleo;
program council.aleo;

















struct ProposalSign:
    proposal as field;
    member as address;

struct AddMemberProposal:
    member as address;

struct RemoveMemberProposal:
    member as address;

struct UpdateThresholdProposal:
    threshold as u8;

struct InitializeBridge:
    bridge_threshold as u8;
    a1 as address;
    a2 as address;
    a3 as address;
    a4 as address;
    a5 as address;

struct InitializeTokenService:
    token_service as boolean;

struct InitializeWrappedToken:
    wrapped_token as boolean;

struct SupportToken:
    name as [u8; 32u32];
    symbol as [u8; 16u32];
    decimals as u8;
    origin_chain_id as u32;
    origin_contract_address as [u8; 32u32];

struct EnableToken:
    token_id as address;
    min_amount as u64;

struct EnableService:
    service as address;

struct ApproveChainBridge:
    chain_id as u32;

struct DisapproveChainBridge:
    chain_id as u32;

struct SupportChainTS:
    chain_id as u32;
    token_service as [u8; 32u32];


mapping members:
	key as address.public;
	value as boolean.public;


mapping proposal_vote_counts:
	key as field.public;
	value as u8.public;


mapping proposal_executed:
	key as field.public;
	value as boolean.public;


mapping proposal_vote_signs:
	key as field.public;
	value as boolean.public;


mapping settings:
	key as u8.public;
	value as u8.public;

function initialize:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u8.public;
    async initialize r0 r1 r2 r3 r4 r5 into r6;
    output r6 as council.aleo/initialize.future;

finalize initialize:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u8.public;
    contains settings[0u8] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into members[r0];
    set true into members[r1];
    set true into members[r2];
    set true into members[r3];
    set true into members[r4];
    set 1u8 into settings[0u8];
    set r5 into settings[1u8];


function add_member:
    input r0 as address.public;
    cast r0 into r1 as AddMemberProposal;
    hash.bhp256 r1 into r2 as field;
    cast r2 self.caller into r3 as ProposalSign;
    hash.bhp256 r3 into r4 as field;
    async add_member self.caller r2 r4 into r5;
    output r5 as council.aleo/add_member.future;

finalize add_member:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_add_member:
    input r0 as address.public;
    cast r0 into r1 as AddMemberProposal;
    hash.bhp256 r1 into r2 as field;
    async exec_add_member r2 r0 into r3;
    output r3 as council.aleo/exec_add_member.future;

finalize exec_add_member:
    input r0 as field.public;
    input r1 as address.public;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r0] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r0] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r0];
    set true into members[r1];


function remove_member:
    input r0 as address.public;
    cast r0 into r1 as RemoveMemberProposal;
    hash.bhp256 r1 into r2 as field;
    cast r2 self.caller into r3 as ProposalSign;
    hash.bhp256 r3 into r4 as field;
    async remove_member self.caller r2 r4 into r5;
    output r5 as council.aleo/remove_member.future;

finalize remove_member:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_remove_member:
    input r0 as address.public;
    cast r0 into r1 as AddMemberProposal;
    hash.bhp256 r1 into r2 as field;
    async exec_remove_member r2 r0 into r3;
    output r3 as council.aleo/exec_remove_member.future;

finalize exec_remove_member:
    input r0 as field.public;
    input r1 as address.public;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r0] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r0] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r0];
    remove members[r1];


function update_threshold:
    input r0 as u8.public;
    cast r0 into r1 as UpdateThresholdProposal;
    hash.bhp256 r1 into r2 as field;
    cast r2 self.caller into r3 as ProposalSign;
    hash.bhp256 r3 into r4 as field;
    async update_threshold self.caller r2 r4 into r5;
    output r5 as council.aleo/update_threshold.future;

finalize update_threshold:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_update_threshold:
    input r0 as u8.public;
    cast r0 into r1 as UpdateThresholdProposal;
    hash.bhp256 r1 into r2 as field;
    async exec_update_threshold r2 r0 into r3;
    output r3 as council.aleo/exec_update_threshold.future;

finalize exec_update_threshold:
    input r0 as field.public;
    input r1 as u8.public;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r0] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r0] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r0];
    set r1 into settings[1u8];


function initialize_bridge:
    input r0 as u8.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as address.public;
    cast r0 r1 r2 r3 r4 r5 into r6 as InitializeBridge;
    hash.bhp256 r6 into r7 as field;
    cast r7 self.caller into r8 as ProposalSign;
    hash.bhp256 r8 into r9 as field;
    async initialize_bridge self.caller r7 r9 into r10;
    output r10 as council.aleo/initialize_bridge.future;

finalize initialize_bridge:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_initialize_bridge:
    input r0 as u8.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as address.public;
    cast r0 r1 r2 r3 r4 r5 into r6 as InitializeBridge;
    hash.bhp256 r6 into r7 as field;
    call bridge.aleo/bridge_initialize r0 r1 r2 r3 r4 r5 into r8;
    async exec_initialize_bridge r8 r7 r0 r1 r2 r3 r4 r5 into r9;
    output r9 as council.aleo/exec_initialize_bridge.future;

finalize exec_initialize_bridge:
    input r0 as bridge.aleo/bridge_initialize.future;
    input r1 as field.public;
    input r2 as u8.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as address.public;
    input r6 as address.public;
    input r7 as address.public;
    await r0;
    get settings[1u8] into r8;
    get.or_use proposal_vote_counts[r1] 0u8 into r9;
    gte r9 r8 into r10;
    assert.eq r10 true;
    contains proposal_executed[r1] into r11;
    not r11 into r12;
    assert.eq r12 true;
    set true into proposal_executed[r1];


function initialize_token_service:
    cast true into r0 as InitializeTokenService;
    hash.bhp256 r0 into r1 as field;
    cast r1 self.caller into r2 as ProposalSign;
    hash.bhp256 r2 into r3 as field;
    async initialize_token_service self.caller r1 r3 into r4;
    output r4 as council.aleo/initialize_token_service.future;

finalize initialize_token_service:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_initialize_token_service:
    cast true into r0 as InitializeTokenService;
    hash.bhp256 r0 into r1 as field;
    call token_service.aleo/token_service_initialize into r2;
    async exec_initialize_token_service r2 r1 into r3;
    output r3 as council.aleo/exec_initialize_token_service.future;

finalize exec_initialize_token_service:
    input r0 as token_service.aleo/token_service_initialize.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function initialize_wrapped_token:
    cast true into r0 as InitializeWrappedToken;
    hash.bhp256 r0 into r1 as field;
    cast r1 self.caller into r2 as ProposalSign;
    hash.bhp256 r2 into r3 as field;
    async initialize_wrapped_token self.caller r1 r3 into r4;
    output r4 as council.aleo/initialize_wrapped_token.future;

finalize initialize_wrapped_token:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_initialize_wrapped_token:
    cast true into r0 as InitializeWrappedToken;
    hash.bhp256 r0 into r1 as field;
    call wrapped_token.aleo/wrapped_token_initialize into r2;
    async exec_initialize_wrapped_token r2 r1 into r3;
    output r3 as council.aleo/exec_initialize_wrapped_token.future;

finalize exec_initialize_wrapped_token:
    input r0 as wrapped_token.aleo/wrapped_token_initialize.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function add_new_token:
    input r0 as [u8; 32u32].public;
    input r1 as [u8; 16u32].public;
    input r2 as u8.public;
    input r3 as u32.public;
    input r4 as [u8; 32u32].public;
    cast r0 r1 r2 r3 r4 into r5 as SupportToken;
    hash.bhp256 r5 into r6 as field;
    cast r6 self.caller into r7 as ProposalSign;
    hash.bhp256 r7 into r8 as field;
    async add_new_token self.caller r6 r8 into r9;
    output r9 as council.aleo/add_new_token.future;

finalize add_new_token:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_add_new_token:
    input r0 as [u8; 32u32].public;
    input r1 as [u8; 16u32].public;
    input r2 as u8.public;
    input r3 as u32.public;
    input r4 as [u8; 32u32].public;
    cast r0 r1 r2 r3 r4 into r5 as SupportToken;
    hash.bhp256 r5 into r6 as field;
    call wrapped_token.aleo/add_token r0 r1 r2 r3 r4 into r7;
    async exec_add_new_token r7 r6 into r8;
    output r8 as council.aleo/exec_add_new_token.future;

finalize exec_add_new_token:
    input r0 as wrapped_token.aleo/add_token.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function enable_new_token:
    input r0 as address.public;
    input r1 as u64.public;
    cast r0 r1 into r2 as EnableToken;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async enable_new_token self.caller r3 r5 into r6;
    output r6 as council.aleo/enable_new_token.future;

finalize enable_new_token:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_enable_new_token:
    input r0 as address.public;
    input r1 as u64.public;
    cast r0 r1 into r2 as EnableToken;
    hash.bhp256 r2 into r3 as field;
    call token_service.aleo/enable_token r0 r1 into r4;
    async exec_enable_new_token r4 r3 into r5;
    output r5 as council.aleo/exec_enable_new_token.future;

finalize exec_enable_new_token:
    input r0 as token_service.aleo/enable_token.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function enable_service:
    input r0 as address.public;
    cast r0 into r1 as EnableService;
    hash.bhp256 r1 into r2 as field;
    cast r2 self.caller into r3 as ProposalSign;
    hash.bhp256 r3 into r4 as field;
    async enable_service self.caller r2 r4 into r5;
    output r5 as council.aleo/enable_service.future;

finalize enable_service:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_enable_service:
    input r0 as address.public;
    cast r0 into r1 as EnableService;
    hash.bhp256 r1 into r2 as field;
    call bridge.aleo/add_service r0 into r3;
    async exec_enable_service r3 r2 into r4;
    output r4 as council.aleo/exec_enable_service.future;

finalize exec_enable_service:
    input r0 as bridge.aleo/add_service.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function approve_chain_bridge:
    input r0 as u32.public;
    cast r0 into r1 as ApproveChainBridge;
    hash.bhp256 r1 into r2 as field;
    cast r2 self.caller into r3 as ProposalSign;
    hash.bhp256 r3 into r4 as field;
    async approve_chain_bridge self.caller r2 r4 into r5;
    output r5 as council.aleo/approve_chain_bridge.future;

finalize approve_chain_bridge:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_approve_chain_bridge:
    input r0 as u32.public;
    cast r0 into r1 as ApproveChainBridge;
    hash.bhp256 r1 into r2 as field;
    call bridge.aleo/approve_chain r0 into r3;
    async exec_approve_chain_bridge r3 r2 into r4;
    output r4 as council.aleo/exec_approve_chain_bridge.future;

finalize exec_approve_chain_bridge:
    input r0 as bridge.aleo/approve_chain.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function disapprove_chain_bridge:
    input r0 as u32.public;
    cast r0 into r1 as DisapproveChainBridge;
    hash.bhp256 r1 into r2 as field;
    cast r2 self.caller into r3 as ProposalSign;
    hash.bhp256 r3 into r4 as field;
    async disapprove_chain_bridge self.caller r2 r4 into r5;
    output r5 as council.aleo/disapprove_chain_bridge.future;

finalize disapprove_chain_bridge:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_disapprove_chain_bridge:
    input r0 as u32.public;
    cast r0 into r1 as DisapproveChainBridge;
    hash.bhp256 r1 into r2 as field;
    call bridge.aleo/disapprove_chain r0 into r3;
    async exec_disapprove_chain_bridge r3 r2 into r4;
    output r4 as council.aleo/exec_disapprove_chain_bridge.future;

finalize exec_disapprove_chain_bridge:
    input r0 as bridge.aleo/disapprove_chain.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function support_chain_ts:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    cast r0 r1 into r2 as SupportChainTS;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async support_chain_ts self.caller r3 r5 into r6;
    output r6 as council.aleo/support_chain_ts.future;

finalize support_chain_ts:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get.or_use proposal_vote_counts[r1] 0u8 into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_support_chain_ts:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    cast r0 r1 into r2 as SupportChainTS;
    hash.bhp256 r2 into r3 as field;
    call token_service.aleo/support_chain r0 r1 into r4;
    async exec_support_chain_ts r4 r3 into r5;
    output r5 as council.aleo/exec_support_chain_ts.future;

finalize exec_support_chain_ts:
    input r0 as token_service.aleo/support_chain.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];
