import bridge.aleo;
import wrapped_token.aleo;
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
    min_amount as u64;


mapping members:
	key as address.public;
	value as boolean.public;


mapping settings:
	key as u8.public;
	value as u8.public;


mapping proposal_vote_counts:
	key as field.public;
	value as u8.public;


mapping proposal_executed:
	key as field.public;
	value as boolean.public;


mapping proposal_vote_signs:
	key as field.public;
	value as boolean.public;


mapping proposal_counts:
	key as u8.public;
	value as u32.public;


mapping add_member_proposals:
	key as u32.public;
	value as AddMemberProposal.public;


mapping remove_member_proposals:
	key as u32.public;
	value as RemoveMemberProposal.public;


mapping update_threshold_proposals:
	key as u32.public;
	value as UpdateThresholdProposal.public;


mapping approve_chain_bridge_proposals:
	key as u32.public;
	value as ApproveChainBridgeProposal.public;


mapping enable_service_proposals:
	key as u32.public;
	value as EnableServiceProposal.public;


mapping disapprove_chain_proposals:
	key as u32.public;
	value as DisapproveChainBridge.public;


mapping support_chain_ts_proposals:
	key as u32.public;
	value as SupportChainTS.public;


mapping support_token_proposals:
	key as u32.public;
	value as SupportToken.public;


mapping enable_token_proposals:
	key as u32.public;
	value as EnableToken.public;

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




function prop_add_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    cast r0 r1 r2 into r3 as AddMemberProposal;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async prop_add_member self.caller r3 r4 r6 into r7;
    output r7 as council.aleo/prop_add_member.future;

finalize prop_add_member:
    input r0 as address.public;
    input r1 as AddMemberProposal.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[1u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into add_member_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[1u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_add_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    cast r0 r1 r2 into r3 as AddMemberProposal;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async vote_add_member self.caller r4 r6 into r7;
    output r7 as council.aleo/vote_add_member.future;

finalize vote_add_member:
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
    get.or_use proposal_vote_counts[r0] 0u8 into r4;
    gte r4 r3 into r5;
    assert.eq r5 true;
    contains proposal_executed[r0] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r0];
    set true into members[r1];
    set r2 into settings[1u8];




function prop_remove_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.private;
    cast r0 r1 r2 into r3 as RemoveMemberProposal;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async prop_remove_member self.caller r3 r4 r6 into r7;
    output r7 as council.aleo/prop_remove_member.future;

finalize prop_remove_member:
    input r0 as address.public;
    input r1 as RemoveMemberProposal.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[2u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into remove_member_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[2u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_remove_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.private;
    cast r0 r1 r2 into r3 as RemoveMemberProposal;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async vote_remove_member self.caller r4 r6 into r7;
    output r7 as council.aleo/vote_remove_member.future;

finalize vote_remove_member:
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
    gte r4 r3 into r5;
    assert.eq r5 true;
    contains proposal_executed[r0] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r0];
    remove members[r1];
    set r2 into settings[1u8];




function prop_update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    cast r0 r1 into r2 as UpdateThresholdProposal;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async prop_update_threshold self.caller r2 r3 r5 into r6;
    output r6 as council.aleo/prop_update_threshold.future;

finalize prop_update_threshold:
    input r0 as address.public;
    input r1 as UpdateThresholdProposal.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[3u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into update_threshold_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[3u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    cast r0 r1 into r2 as UpdateThresholdProposal;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async vote_update_threshold self.caller r3 r5 into r6;
    output r6 as council.aleo/vote_update_threshold.future;

finalize vote_update_threshold:
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
    get.or_use proposal_vote_counts[r0] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r0] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r0];
    set r1 into settings[1u8];




function prop_approve_chain_bridge:
    input r0 as u32.public;
    input r1 as u32.public;
    cast r0 r1 into r2 as ApproveChainBridgeProposal;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async prop_approve_chain_bridge self.caller r2 r3 r5 into r6;
    output r6 as council.aleo/prop_approve_chain_bridge.future;

finalize prop_approve_chain_bridge:
    input r0 as address.public;
    input r1 as ApproveChainBridgeProposal.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[4u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into approve_chain_bridge_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[4u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_approve_chain_bridge:
    input r0 as u32.public;
    input r1 as u32.public;
    cast r0 r1 into r2 as ApproveChainBridgeProposal;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async vote_approve_chain_bridge self.caller r3 r5 into r6;
    output r6 as council.aleo/vote_approve_chain_bridge.future;

finalize vote_approve_chain_bridge:
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
    input r1 as u32.public;
    cast r0 r1 into r2 as ApproveChainBridgeProposal;
    hash.bhp256 r2 into r3 as field;
    call bridge.aleo/approve_chain r1 into r4;
    async exec_approve_chain_bridge r4 r3 into r5;
    output r5 as council.aleo/exec_approve_chain_bridge.future;

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




function prop_enable_service:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as EnableServiceProposal;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async prop_enable_service self.caller r2 r3 r5 into r6;
    output r6 as council.aleo/prop_enable_service.future;

finalize prop_enable_service:
    input r0 as address.public;
    input r1 as EnableServiceProposal.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[5u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into enable_service_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[5u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_enable_service:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as EnableServiceProposal;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async vote_enable_service self.caller r3 r5 into r6;
    output r6 as council.aleo/vote_enable_service.future;

finalize vote_enable_service:
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
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as EnableServiceProposal;
    hash.bhp256 r2 into r3 as field;
    call bridge.aleo/add_service r1 into r4;
    async exec_enable_service r4 r3 into r5;
    output r5 as council.aleo/exec_enable_service.future;

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




function prop_disapprove_chain_bridge:
    input r0 as u32.public;
    input r1 as u32.public;
    cast r0 r1 into r2 as DisapproveChainBridge;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async prop_disapprove_chain_bridge self.caller r2 r3 r5 into r6;
    output r6 as council.aleo/prop_disapprove_chain_bridge.future;

finalize prop_disapprove_chain_bridge:
    input r0 as address.public;
    input r1 as DisapproveChainBridge.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[6u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into disapprove_chain_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[5u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_disapprove_chain_bridge:
    input r0 as u32.public;
    input r1 as u32.public;
    cast r0 r1 into r2 as DisapproveChainBridge;
    hash.bhp256 r2 into r3 as field;
    cast r3 self.caller into r4 as ProposalSign;
    hash.bhp256 r4 into r5 as field;
    async vote_disapprove_chain_bridge self.caller r3 r5 into r6;
    output r6 as council.aleo/vote_disapprove_chain_bridge.future;

finalize vote_disapprove_chain_bridge:
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
    input r1 as u32.public;
    cast r0 r1 into r2 as DisapproveChainBridge;
    hash.bhp256 r2 into r3 as field;
    call bridge.aleo/disapprove_chain r1 into r4;
    async exec_disapprove_chain_bridge r4 r3 into r5;
    output r5 as council.aleo/exec_disapprove_chain_bridge.future;

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




function prop_support_chain_ts:
    input r0 as u32.public;
    input r1 as u32.public;
    input r2 as [u8; 32u32].public;
    cast r0 r1 r2 into r3 as SupportChainTS;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async prop_support_chain_ts self.caller r3 r4 r6 into r7;
    output r7 as council.aleo/prop_support_chain_ts.future;

finalize prop_support_chain_ts:
    input r0 as address.public;
    input r1 as SupportChainTS.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[7u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into support_chain_ts_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[7u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_support_chain_ts:
    input r0 as u32.public;
    input r1 as u32.public;
    input r2 as [u8; 32u32].public;
    cast r0 r1 r2 into r3 as SupportChainTS;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async vote_support_chain_ts self.caller r4 r6 into r7;
    output r7 as council.aleo/vote_support_chain_ts.future;

finalize vote_support_chain_ts:
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
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];




function prop_add_new_token:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 16u32].public;
    input r3 as u8.public;
    input r4 as u32.public;
    input r5 as [u8; 32u32].public;
    cast r0 r1 r2 r3 r4 r5 into r6 as SupportToken;
    hash.bhp256 r6 into r7 as field;
    cast r7 self.caller into r8 as ProposalSign;
    hash.bhp256 r8 into r9 as field;
    async prop_add_new_token self.caller r6 r7 r9 into r10;
    output r10 as council.aleo/prop_add_new_token.future;

finalize prop_add_new_token:
    input r0 as address.public;
    input r1 as SupportToken.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[8u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into support_token_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[8u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_add_new_token:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 16u32].public;
    input r3 as u8.public;
    input r4 as u32.public;
    input r5 as [u8; 32u32].public;
    cast r0 r1 r2 r3 r4 r5 into r6 as SupportToken;
    hash.bhp256 r6 into r7 as field;
    cast r7 self.caller into r8 as ProposalSign;
    hash.bhp256 r8 into r9 as field;
    async vote_add_new_token self.caller r7 r9 into r10;
    output r10 as council.aleo/vote_add_new_token.future;

finalize vote_add_new_token:
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
    get.or_use proposal_vote_counts[r1] 0u8 into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];




function prop_enable_new_token:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r0 r1 r2 into r3 as EnableToken;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async prop_enable_new_token self.caller r3 r4 r6 into r7;
    output r7 as council.aleo/prop_enable_new_token.future;

finalize prop_enable_new_token:
    input r0 as address.public;
    input r1 as EnableToken.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_vote_signs[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get.or_use proposal_counts[9u8] 1u32 into r7;
    assert.eq r1.id r7;
    set r1 into enable_token_proposals[r7];
    add r7 1u32 into r8;
    set r8 into proposal_counts[9u8];
    set true into proposal_vote_signs[r3];
    get.or_use proposal_vote_counts[r2] 0u8 into r9;
    add r9 1u8 into r10;
    set r10 into proposal_vote_counts[r2];


function vote_enable_new_token:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r0 r1 r2 into r3 as EnableToken;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as ProposalSign;
    hash.bhp256 r5 into r6 as field;
    async vote_enable_new_token self.caller r4 r6 into r7;
    output r7 as council.aleo/vote_enable_new_token.future;

finalize vote_enable_new_token:
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
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r0 r1 r2 into r3 as EnableToken;
    hash.bhp256 r3 into r4 as field;
    call token_service.aleo/enable_token r1 r2 into r5;
    async exec_enable_new_token r5 r4 into r6;
    output r6 as council.aleo/exec_enable_new_token.future;

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
