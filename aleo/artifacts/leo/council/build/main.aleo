import token_bridge.aleo;
import wrapped_token.aleo;
import holding.aleo;
import token_service.aleo;
program council.aleo;





















struct ProposalSign:
    proposal as field;
    member as address;

struct AddMember:
    id as u32;
    new_member as address;
    new_threshold as u8;

struct RemoveMember:
    id as u32;
    existing_member as address;
    new_threshold as u8;

struct UpdateThreshold:
    id as u32;
    new_threshold as u8;

struct TbUpdateGovernance:
    id as u32;
    new_governance as address;

struct TbAddAttestor:
    id as u32;
    new_attestor as address;
    new_threshold as u8;

struct TbRemoveAttestor:
    id as u32;
    existing_attestor as address;
    new_threshold as u8;

struct TbUpdateThreshold:
    id as u32;
    new_threshold as u8;

struct TbEnableChain:
    id as u32;
    chain_id as u128;

struct TbDisableChain:
    id as u32;
    chain_id as u128;

struct TbEnableService:
    id as u32;
    service as address;

struct TbDisableService:
    id as u32;
    service as address;

struct WtUpdateGovernance:
    id as u32;
    new_governance as address;

struct WtAddToken:
    id as u32;
    name as [u8; 32u32];
    symbol as [u8; 16u32];
    decimals as u8;
    origin_chain_id as u128;
    origin_contract_address as [u8; 32u32];

struct TsSupportChain:
    id as u32;
    chain_id as u128;
    token_service as [u8; 32u32];

struct TsRemoveChain:
    id as u32;
    chain_id as u128;

struct TsSupportToken:
    id as u32;
    token_id as address;
    minimum_transfer as u64;
    outgoing_percentage as u16;
    time as u32;

struct TsRemoveToken:
    id as u32;
    token_id as address;

struct TsUpdateMinimumTransfer:
    id as u32;
    token_id as address;
    minimum_transfer as u64;

struct TsUpdateOutgoingPercentage:
    id as u32;
    token_id as address;
    outgoing_percentage as u16;
    timeframe as u32;


mapping members:
	key as address.public;
	value as boolean.public;


mapping settings:
	key as boolean.public;
	value as u8.public;


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
    contains settings[true] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into members[r0];
    set true into members[r1];
    set true into members[r2];
    set true into members[r3];
    set true into members[r4];
    set r5 into settings[true];
    set 5u8 into settings[false];
    set 0field into proposals[0u32];


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
    get proposals[0u32] into r7;
    add r7 1field into r8;
    cast r8 into r9 as u32;
    assert.eq r9 r1;
    add r7 1field into r10;
    set r10 into proposals[0u32];
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


function add_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    cast r0 r1 r2 into r3 as AddMember;
    hash.bhp256 r3 into r4 as field;
    async add_member r4 r1 r2 into r5;
    output r5 as council.aleo/add_member.future;

finalize add_member:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u8.public;
    get settings[true] into r3;
    gte r2 r3 into r4;
    assert.eq r4 true;
    get proposal_vote_counts[r0] into r5;
    gte r5 r3 into r6;
    assert.eq r6 true;
    contains proposal_executed[r0] into r7;
    not r7 into r8;
    assert.eq r8 true;
    set true into proposal_executed[r0];
    contains members[r1] into r9;
    not r9 into r10;
    assert.eq r10 true;
    set true into members[r1];
    set r2 into settings[true];
    get settings[false] into r11;
    add r11 1u8 into r12;
    set r12 into settings[false];


function remove_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.private;
    cast r0 r1 r2 into r3 as RemoveMember;
    hash.bhp256 r3 into r4 as field;
    async remove_member r4 r1 r2 into r5;
    output r5 as council.aleo/remove_member.future;

finalize remove_member:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u8.public;
    get settings[true] into r3;
    get proposal_vote_counts[r0] into r4;
    gte r4 r3 into r5;
    assert.eq r5 true;
    contains proposal_executed[r0] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r0];
    remove members[r1];
    gte r2 1u8 into r8;
    assert.eq r8 true;
    set r2 into settings[true];
    get settings[false] into r9;
    gte r9 2u8 into r10;
    assert.eq r10 true;
    sub r9 1u8 into r11;
    set r11 into settings[false];


function update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    cast r0 r1 into r2 as UpdateThreshold;
    hash.bhp256 r2 into r3 as field;
    async update_threshold r3 r1 into r4;
    output r4 as council.aleo/update_threshold.future;

finalize update_threshold:
    input r0 as field.public;
    input r1 as u8.public;
    get settings[true] into r2;
    gte r1 1u8 into r3;
    assert.eq r3 true;
    get proposal_vote_counts[r0] into r4;
    gte r4 r2 into r5;
    assert.eq r5 true;
    contains proposal_executed[r0] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set true into proposal_executed[r0];
    set r1 into settings[true];


function tb_update_governance:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as TbUpdateGovernance;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/update_governance_tb r1 into r4;
    async tb_update_governance r4 r3 into r5;
    output r5 as council.aleo/tb_update_governance.future;

finalize tb_update_governance:
    input r0 as token_bridge.aleo/update_governance_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function tb_add_attestor:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.private;
    cast r0 r1 r2 into r3 as TbAddAttestor;
    hash.bhp256 r3 into r4 as field;
    call token_bridge.aleo/add_attestor_tb r1 r2 into r5;
    async tb_add_attestor r5 r4 into r6;
    output r6 as council.aleo/tb_add_attestor.future;

finalize tb_add_attestor:
    input r0 as token_bridge.aleo/add_attestor_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function tb_remove_attestor:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.private;
    cast r0 r1 r2 into r3 as TbRemoveAttestor;
    hash.bhp256 r3 into r4 as field;
    call token_bridge.aleo/remove_attestor_tb r1 r2 into r5;
    async tb_remove_attestor r5 r4 into r6;
    output r6 as council.aleo/tb_remove_attestor.future;

finalize tb_remove_attestor:
    input r0 as token_bridge.aleo/remove_attestor_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function tb_update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    cast r0 r1 into r2 as TbUpdateThreshold;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/update_threshold_tb r1 into r4;
    async tb_update_threshold r4 r3 into r5;
    output r5 as council.aleo/tb_update_threshold.future;

finalize tb_update_threshold:
    input r0 as token_bridge.aleo/update_threshold_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function tb_enable_chain:
    input r0 as u32.public;
    input r1 as u128.public;
    cast r0 r1 into r2 as TbEnableChain;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/enable_chain_tb r1 into r4;
    async tb_enable_chain r4 r3 into r5;
    output r5 as council.aleo/tb_enable_chain.future;

finalize tb_enable_chain:
    input r0 as token_bridge.aleo/enable_chain_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function disapprove_chain_bridge:
    input r0 as u32.public;
    input r1 as u128.public;
    cast r0 r1 into r2 as TbDisableChain;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/disable_chain_tb r1 into r4;
    async disapprove_chain_bridge r4 r3 into r5;
    output r5 as council.aleo/disapprove_chain_bridge.future;

finalize disapprove_chain_bridge:
    input r0 as token_bridge.aleo/disable_chain_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function tb_enable_service:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as TbEnableService;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/enable_service_tb r1 into r4;
    async tb_enable_service r4 r3 into r5;
    output r5 as council.aleo/tb_enable_service.future;

finalize tb_enable_service:
    input r0 as token_bridge.aleo/enable_service_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function tb_disable_service:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as TbEnableService;
    hash.bhp256 r2 into r3 as field;
    call token_bridge.aleo/disable_service_tb r1 into r4;
    async tb_disable_service r4 r3 into r5;
    output r5 as council.aleo/tb_disable_service.future;

finalize tb_disable_service:
    input r0 as token_bridge.aleo/disable_service_tb.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function wt_update_governance:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as WtUpdateGovernance;
    hash.bhp256 r2 into r3 as field;
    call wrapped_token.aleo/update_governance_wt r1 into r4;
    async wt_update_governance r4 r3 into r5;
    output r5 as council.aleo/wt_update_governance.future;

finalize wt_update_governance:
    input r0 as wrapped_token.aleo/update_governance_wt.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function wt_add_token:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 16u32].public;
    input r3 as u8.public;
    input r4 as u128.public;
    input r5 as [u8; 32u32].public;
    cast r0 r1 r2 r3 r4 r5 into r6 as WtAddToken;
    hash.bhp256 r6 into r7 as field;
    call wrapped_token.aleo/add_token_wt r1 r2 r3 r4 r5 into r8;
    async wt_add_token r8 r7 into r9;
    output r9 as council.aleo/wt_add_token.future;

finalize wt_add_token:
    input r0 as wrapped_token.aleo/add_token_wt.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function ts_support_chain:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as [u8; 32u32].public;
    cast r0 r1 r2 into r3 as TsSupportChain;
    hash.bhp256 r3 into r4 as field;
    call token_service.aleo/support_chain_ts r1 r2 into r5;
    async ts_support_chain r5 r4 into r6;
    output r6 as council.aleo/ts_support_chain.future;

finalize ts_support_chain:
    input r0 as token_service.aleo/support_chain_ts.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function ts_remove_chain:
    input r0 as u32.public;
    input r1 as u128.public;
    cast r0 r1 into r2 as TsRemoveChain;
    hash.bhp256 r2 into r3 as field;
    call token_service.aleo/remove_chain_ts r1 into r4;
    async ts_remove_chain r4 r3 into r5;
    output r5 as council.aleo/ts_remove_chain.future;

finalize ts_remove_chain:
    input r0 as token_service.aleo/remove_chain_ts.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function ts_support_token:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u16.public;
    input r4 as u32.public;
    cast r0 r1 r2 r3 r4 into r5 as TsSupportToken;
    hash.bhp256 r5 into r6 as field;
    call token_service.aleo/support_token_ts r1 r2 r3 r4 into r7;
    async ts_support_token r7 r6 into r8;
    output r8 as council.aleo/ts_support_token.future;

finalize ts_support_token:
    input r0 as token_service.aleo/support_token_ts.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function ts_remove_token:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as TsRemoveToken;
    hash.bhp256 r2 into r3 as field;
    call token_service.aleo/remove_token_ts r1 into r4;
    async ts_remove_token r4 r3 into r5;
    output r5 as council.aleo/ts_remove_token.future;

finalize ts_remove_token:
    input r0 as token_service.aleo/remove_token_ts.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function ts_update_minimum_transfer:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u16.public;
    input r4 as u32.public;
    cast r0 r1 r2 into r5 as TsUpdateMinimumTransfer;
    hash.bhp256 r5 into r6 as field;
    call token_service.aleo/update_minimum_transfer_ts r1 r2 into r7;
    async ts_update_minimum_transfer r7 r6 into r8;
    output r8 as council.aleo/ts_update_minimum_transfer.future;

finalize ts_update_minimum_transfer:
    input r0 as token_service.aleo/update_minimum_transfer_ts.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];


function ts_update_outgoing_percentage:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u16.public;
    input r3 as u32.public;
    cast r0 r1 r2 r3 into r4 as TsUpdateOutgoingPercentage;
    hash.bhp256 r4 into r5 as field;
    call token_service.aleo/update_outgoing_percentage_ts r1 r2 r3 into r6;
    async ts_update_outgoing_percentage r6 r5 into r7;
    output r7 as council.aleo/ts_update_outgoing_percentage.future;

finalize ts_update_outgoing_percentage:
    input r0 as token_service.aleo/update_outgoing_percentage_ts.future;
    input r1 as field.public;
    await r0;
    get settings[true] into r2;
    get proposal_vote_counts[r1] into r3;
    gte r3 r2 into r4;
    assert.eq r4 true;
    contains proposal_executed[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    set true into proposal_executed[r1];
