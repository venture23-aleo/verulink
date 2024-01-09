import token_bridge.aleo;
import wrapped_token.aleo;
import holding.aleo;
import token_service.aleo;
program council.aleo;



















struct ProposalSign:
    proposal as field;
    member as address;

struct AddMemberProposal:
    id as u32;
    new_member as address;
    new_threshold as u8;

struct RemoveMemberProposal:
    id as u32;
    existing_member as address;
    new_threshold as u8;

struct UpdateThresholdProposal:
    id as u32;
    new_threshold as u8;

struct ApproveChainBridgeProposal:
    id as u32;
    chain_id as u32;

struct EnableServiceProposal:
    id as u32;
    service as address;

struct DisapproveChainBridge:
    id as u32;
    chain_id as u32;

struct SupportChainTS:
    id as u32;
    chain_id as u32;
    token_service as [u8; 32u32];

struct SupportToken:
    id as u32;
    name as [u8; 32u32];
    symbol as [u8; 16u32];
    decimals as u8;
    origin_chain_id as u32;
    origin_contract_address as [u8; 32u32];

struct EnableToken:
    id as u32;
    token_id as address;
    minimum_transfer as u64;
    outgoing_percentage as u16;
    time as u32;


mapping members:
	key as address.public;
	value as boolean.public;


mapping settings:
	key as u8.public;
	value as u32.public;


mapping proposal_vote_counts:
	key as field.public;
	value as u8.public;


mapping proposal_executed:
	key as field.public;
	value as boolean.public;


mapping proposals:
	key as u32.public;
	value as field.public;


mapping proposal_vote_signs:
	key as field.public;
	value as boolean.public;

function initialize:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u32.public;
    async initialize r0 r1 r2 r3 r4 r5 into r6;
    output r6 as council.aleo/initialize.future;

finalize initialize:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u32.public;
    contains settings[0u8] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into members[r0];
    set true into members[r1];
    set true into members[r2];
    set true into members[r3];
    set true into members[r4];
    set r5 into settings[1u8];
    set 5u32 into settings[2u8];
    set 1u32 into settings[3u8];


function propose:
    input r0 as u32.public;
    input r1 as field.public;
    cast r1 self.caller into r2 as ProposalSign;
    hash.bhp256 r2 into r3 as field;
    async propose self.caller r0 r1 r3 into r4;
    output r4 as council.aleo/propose.future;

finalize propose:
    input r0 as address.public;
    input r1 as u32.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get settings[3u8] into r7;
    assert.eq r7 r1;
    add r1 1u32 into r8;
    set r8 into settings[3u8];
    set r2 into proposals[r1];
    set true into proposal_vote_signs[r3];
    set 1u8 into proposal_vote_counts[r2];


function vote:
    input r0 as field.private;
    input r1 as u8.public;
    cast r0 self.caller into r2 as ProposalSign;
    hash.bhp256 r2 into r3 as field;
    async vote self.caller r0 r3 into r4;
    output r4 as council.aleo/vote.future;

finalize vote:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_vote_signs[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_vote_signs[r2];
    get proposal_vote_counts[r1] into r6;
    add r6 1u8 into r7;
    set r7 into proposal_vote_counts[r1];


function exec_add_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    cast r0 r1 r2 into r3 as AddMemberProposal;
    hash.bhp256 r3 into r4 as field;
    async exec_add_member r4 r1 r2 into r5;
    output r5 as council.aleo/exec_add_member.future;

finalize exec_add_member:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u8.public;
    get settings[1u8] into r3;
    cast r3 into r4 as u8;
    gte r2 r4 into r5;
    assert.eq r5 true;
    get.or_use proposal_vote_counts[r0] 0u8 into r6;
    cast r3 into r7 as u8;
    gte r6 r7 into r8;
    assert.eq r8 true;
    contains proposal_executed[r0] into r9;
    not r9 into r10;
    assert.eq r10 true;
    set true into proposal_executed[r0];
    set true into members[r1];
    cast r2 into r11 as u32;
    set r11 into settings[1u8];


function exec_remove_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.private;
    cast r0 r1 r2 into r3 as RemoveMemberProposal;
    hash.bhp256 r3 into r4 as field;
    async exec_remove_member r4 r1 r2 into r5;
    output r5 as council.aleo/exec_remove_member.future;

finalize exec_remove_member:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u8.public;
    get settings[1u8] into r3;
    get.or_use proposal_vote_counts[r0] 0u8 into r4;
    cast r3 into r5 as u8;
    gte r4 r5 into r6;
    assert.eq r6 true;
    contains proposal_executed[r0] into r7;
    not r7 into r8;
    assert.eq r8 true;
    set true into proposal_executed[r0];
    remove members[r1];
    cast r2 into r9 as u32;
    set r9 into settings[1u8];


function exec_update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    cast r0 r1 into r2 as UpdateThresholdProposal;
    hash.bhp256 r2 into r3 as field;
    async exec_update_threshold r3 r1 into r4;
    output r4 as council.aleo/exec_update_threshold.future;

finalize exec_update_threshold:
    input r0 as field.public;
    input r1 as u8.public;
    get settings[1u8] into r2;
    get proposal_vote_counts[r0] into r3;
    cast r2 into r4 as u8;
    gte r3 r4 into r5;
    assert.eq r5 true;
    contains proposal_executed[r0] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r0];
    cast r1 into r8 as u32;
    set r8 into settings[1u8];


function exec_approve_chain_bridge:
    input r0 as u32.public;
    input r1 as u32.public;
    cast r0 r1 into r2 as ApproveChainBridgeProposal;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/approve_chain r1 into r4;
    async exec_approve_chain_bridge r4 r3 into r5;
    output r5 as council.aleo/exec_approve_chain_bridge.future;

finalize exec_approve_chain_bridge:
    input r0 as token_bridge.aleo/approve_chain.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get proposal_vote_counts[r1] into r3;
    cast r2 into r4 as u8;
    gte r3 r4 into r5;
    assert.eq r5 true;
    contains proposal_executed[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r1];


function exec_enable_service:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as EnableServiceProposal;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/add_service r1 into r4;
    async exec_enable_service r4 r3 into r5;
    output r5 as council.aleo/exec_enable_service.future;

finalize exec_enable_service:
    input r0 as token_bridge.aleo/add_service.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get proposal_vote_counts[r1] into r3;
    cast r2 into r4 as u8;
    gte r3 r4 into r5;
    assert.eq r5 true;
    contains proposal_executed[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r1];


function exec_disapprove_chain_bridge:
    input r0 as u32.public;
    input r1 as u32.public;
    cast r0 r1 into r2 as DisapproveChainBridge;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/disapprove_chain r1 into r4;
    async exec_disapprove_chain_bridge r4 r3 into r5;
    output r5 as council.aleo/exec_disapprove_chain_bridge.future;

finalize exec_disapprove_chain_bridge:
    input r0 as token_bridge.aleo/disapprove_chain.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get proposal_vote_counts[r1] into r3;
    cast r2 into r4 as u8;
    gte r3 r4 into r5;
    assert.eq r5 true;
    contains proposal_executed[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r1];


function exec_support_chain_ts:
    input r0 as u32.public;
    input r1 as u32.public;
    input r2 as [u8; 32u32].public;
    cast r0 r1 r2 into r3 as SupportChainTS;
    hash.bhp256 r3 into r4 as field;
    call token_service.aleo/support_chain r1 r2 into r5;
    async exec_support_chain_ts r5 r4 into r6;
    output r6 as council.aleo/exec_support_chain_ts.future;

finalize exec_support_chain_ts:
    input r0 as token_service.aleo/support_chain.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get proposal_vote_counts[r1] into r3;
    cast r2 into r4 as u8;
    gte r3 r4 into r5;
    assert.eq r5 true;
    contains proposal_executed[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r1];


function exec_add_new_token:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 16u32].public;
    input r3 as u8.public;
    input r4 as u32.public;
    input r5 as [u8; 32u32].public;
    cast r0 r1 r2 r3 r4 r5 into r6 as SupportToken;
    hash.bhp256 r6 into r7 as field;
    call wrapped_token.aleo/add_token r1 r2 r3 r4 r5 into r8;
    async exec_add_new_token r8 r7 into r9;
    output r9 as council.aleo/exec_add_new_token.future;

finalize exec_add_new_token:
    input r0 as wrapped_token.aleo/add_token.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get proposal_vote_counts[r1] into r3;
    cast r2 into r4 as u8;
    gte r3 r4 into r5;
    assert.eq r5 true;
    contains proposal_executed[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r1];


function exec_enable_new_token:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u16.public;
    input r4 as u32.public;
    cast r0 r1 r2 r3 r4 into r5 as EnableToken;
    hash.bhp256 r5 into r6 as field;
    call token_service.aleo/enable_token r1 r2 r3 r4 into r7;
    async exec_enable_new_token r7 r6 into r8;
    output r8 as council.aleo/exec_enable_new_token.future;

finalize exec_enable_new_token:
    input r0 as token_service.aleo/enable_token.future;
    input r1 as field.public;
    await r0;
    get settings[1u8] into r2;
    get proposal_vote_counts[r1] into r3;
    cast r2 into r4 as u8;
    gte r3 r4 into r5;
    assert.eq r5 true;
    contains proposal_executed[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r1];
