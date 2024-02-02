import token_bridge_v0001.aleo;
import token_service_v0001.aleo;
program council_v0001.aleo;











struct ProposalVote:
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
    new_owner as address;

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

struct TbAddChain:
    id as u32;
    chain_id as u128;

struct TbRemoveChain:
    id as u32;
    chain_id as u128;

struct TbAddService:
    id as u32;
    service as address;

struct TbRemoveService:
    id as u32;
    service as address;

struct TsTransferOwnership:
    id as u32;
    new_owner as address;

struct TsAddToken:
    id as u32;
    token_id as address;
    connector as address;
    min_transfer as u128;
    max_transfer as u128;
    outgoing_percentage as u16;
    time as u32;
    max_no_cap as u128;

struct TsRemoveToken:
    id as u32;
    token_id as address;

struct TsUpdateMinTransfer:
    id as u32;
    token_id as address;
    min_transfer as u128;

struct TsUpdateMaxTransfer:
    id as u32;
    token_id as address;
    max_transfer as u128;

struct TsUpdateWithdrawalLimit:
    id as u32;
    token_id as address;
    percentage as u16;
    duration as u32;
    threshold_no_limit as u128;

struct HoldingRelease:
    id as u32;
    token_id as address;
    connector as address;
    receiver as address;
    amount as u128;

struct ConnectorUpdate:
    id as u32;
    token_id as address;
    connector as address;
    new_connector as address;

struct ExternalProposal:
    id as u32;
    external_program as address;
    proposal_hash as field;


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


mapping proposal_votes:
	key as field.public;
	value as boolean.public;

function initialize:
    input r0 as [address; 5u32].public;
    input r1 as u8.public;
    gte r1 1u8 into r2;
    lte r1 5u8 into r3;
    and r2 r3 into r4;
    assert.eq r4 true;
    assert.neq r0[0u32] r0[1u32];
    assert.neq r0[0u32] r0[2u32];
    assert.neq r0[0u32] r0[3u32];
    assert.neq r0[0u32] r0[4u32];
    assert.neq r0[1u32] r0[2u32];
    assert.neq r0[1u32] r0[3u32];
    assert.neq r0[1u32] r0[4u32];
    assert.neq r0[2u32] r0[3u32];
    assert.neq r0[2u32] r0[4u32];
    assert.neq r0[3u32] r0[4u32];
    async initialize r0 r1 into r5;
    output r5 as council_v0001.aleo/initialize.future;

finalize initialize:
    input r0 as [address; 5u32].public;
    input r1 as u8.public;
    contains settings[true] into r2;
    not r2 into r3;
    assert.eq r3 true;
    set true into members[r0[0u32]];
    set true into members[r0[1u32]];
    set true into members[r0[2u32]];
    set true into members[r0[3u32]];
    set true into members[r0[4u32]];
    set r1 into settings[true];
    set 5u8 into settings[false];
    set 0field into proposals[0u32];


function update_member_key:
    input r0 as address.private;
    async update_member_key self.caller r0 into r1;
    output r1 as council_v0001.aleo/update_member_key.future;

finalize update_member_key:
    input r0 as address.public;
    input r1 as address.public;
    contains members[r0] into r2;
    assert.eq r2 true;
    remove members[r0];
    set true into members[r1];


function propose:
    input r0 as u32.public;
    input r1 as field.public;
    cast r1 self.caller into r2 as ProposalVote;
    hash.bhp256 r2 into r3 as field;
    async propose self.caller r0 r1 r3 into r4;
    output r4 as council_v0001.aleo/propose.future;

finalize propose:
    input r0 as address.public;
    input r1 as u32.public;
    input r2 as field.public;
    input r3 as field.public;
    get members[r0] into r4;
    assert.eq r4 true;
    contains proposal_votes[r3] into r5;
    not r5 into r6;
    assert.eq r6 true;
    get proposals[0u32] into r7;
    add r7 1field into r8;
    cast r8 into r9 as u32;
    assert.eq r9 r1;
    add r7 1field into r10;
    set r10 into proposals[0u32];
    set r2 into proposals[r1];
    set true into proposal_votes[r3];
    set 1u8 into proposal_vote_counts[r2];


function vote:
    input r0 as field.public;
    cast r0 self.caller into r1 as ProposalVote;
    hash.bhp256 r1 into r2 as field;
    async vote self.caller r0 r2 into r3;
    output r3 as council_v0001.aleo/vote.future;

finalize vote:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    get members[r0] into r3;
    assert.eq r3 true;
    contains proposal_votes[r2] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_votes[r2];
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
    output r5 as council_v0001.aleo/add_member.future;

finalize add_member:
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
    contains members[r1] into r8;
    not r8 into r9;
    assert.eq r9 true;
    set true into members[r1];
    set r2 into settings[true];
    get settings[false] into r10;
    gte r2 1u8 into r11;
    add r10 1u8 into r12;
    lte r2 r12 into r13;
    and r11 r13 into r14;
    assert.eq r14 true;
    add r10 1u8 into r15;
    set r15 into settings[false];


function remove_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.private;
    cast r0 r1 r2 into r3 as RemoveMember;
    hash.bhp256 r3 into r4 as field;
    async remove_member r4 r1 r2 into r5;
    output r5 as council_v0001.aleo/remove_member.future;

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
    get settings[false] into r8;
    gte r8 2u8 into r9;
    assert.eq r9 true;
    gte r2 1u8 into r10;
    lt r2 r8 into r11;
    and r10 r11 into r12;
    assert.eq r12 true;
    contains members[r1] into r13;
    assert.eq r13 true;
    remove members[r1];
    set r2 into settings[true];
    sub r8 1u8 into r14;
    set r14 into settings[false];


function update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    cast r0 r1 into r2 as UpdateThreshold;
    hash.bhp256 r2 into r3 as field;
    gte r1 1u8 into r4;
    assert.eq r4 true;
    async update_threshold r3 r1 into r5;
    output r5 as council_v0001.aleo/update_threshold.future;

finalize update_threshold:
    input r0 as field.public;
    input r1 as u8.public;
    get settings[true] into r2;
    get settings[false] into r3;
    lte r1 r3 into r4;
    assert.eq r4 true;
    get proposal_vote_counts[r0] into r5;
    gte r5 r2 into r6;
    assert.eq r6 true;
    contains proposal_executed[r0] into r7;
    not r7 into r8;
    assert.eq r8 true;
    set true into proposal_executed[r0];
    set r1 into settings[true];


function tb_update_governance:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as TbUpdateGovernance;
    hash.bhp256 r2 into r3 as field;
    call token_bridge_v0001.aleo/transfer_ownership_tb r1 into r4;
    async tb_update_governance r4 r3 into r5;
    output r5 as council_v0001.aleo/tb_update_governance.future;

finalize tb_update_governance:
    input r0 as token_bridge_v0001.aleo/transfer_ownership_tb.future;
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
    call token_bridge_v0001.aleo/add_attestor_tb r1 r2 into r5;
    async tb_add_attestor r5 r4 into r6;
    output r6 as council_v0001.aleo/tb_add_attestor.future;

finalize tb_add_attestor:
    input r0 as token_bridge_v0001.aleo/add_attestor_tb.future;
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
    call token_bridge_v0001.aleo/remove_attestor_tb r1 r2 into r5;
    async tb_remove_attestor r5 r4 into r6;
    output r6 as council_v0001.aleo/tb_remove_attestor.future;

finalize tb_remove_attestor:
    input r0 as token_bridge_v0001.aleo/remove_attestor_tb.future;
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
    call token_bridge_v0001.aleo/update_threshold_tb r1 into r4;
    async tb_update_threshold r4 r3 into r5;
    output r5 as council_v0001.aleo/tb_update_threshold.future;

finalize tb_update_threshold:
    input r0 as token_bridge_v0001.aleo/update_threshold_tb.future;
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
    cast r0 r1 into r2 as TbAddChain;
    hash.bhp256 r2 into r3 as field;
    call token_bridge_v0001.aleo/add_chain_tb r1 into r4;
    async tb_enable_chain r4 r3 into r5;
    output r5 as council_v0001.aleo/tb_enable_chain.future;

finalize tb_enable_chain:
    input r0 as token_bridge_v0001.aleo/add_chain_tb.future;
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
    cast r0 r1 into r2 as TbRemoveChain;
    hash.bhp256 r2 into r3 as field;
    call token_bridge_v0001.aleo/remove_chain_tb r1 into r4;
    async disapprove_chain_bridge r4 r3 into r5;
    output r5 as council_v0001.aleo/disapprove_chain_bridge.future;

finalize disapprove_chain_bridge:
    input r0 as token_bridge_v0001.aleo/remove_chain_tb.future;
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
    cast r0 r1 into r2 as TbAddService;
    hash.bhp256 r2 into r3 as field;
    call token_bridge_v0001.aleo/add_service_tb r1 into r4;
    async tb_enable_service r4 r3 into r5;
    output r5 as council_v0001.aleo/tb_enable_service.future;

finalize tb_enable_service:
    input r0 as token_bridge_v0001.aleo/add_service_tb.future;
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
    cast r0 r1 into r2 as TbAddService;
    hash.bhp256 r2 into r3 as field;
    call token_bridge_v0001.aleo/remove_service_tb r1 into r4;
    async tb_disable_service r4 r3 into r5;
    output r5 as council_v0001.aleo/tb_disable_service.future;

finalize tb_disable_service:
    input r0 as token_bridge_v0001.aleo/remove_service_tb.future;
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


function ts_transfer_ownership:
    input r0 as u32.public;
    input r1 as address.public;
    cast r0 r1 into r2 as TsTransferOwnership;
    hash.bhp256 r2 into r3 as field;
    call token_service_v0001.aleo/transfer_ownership_ts r1 into r4;
    async ts_transfer_ownership r4 r3 into r5;
    output r5 as council_v0001.aleo/ts_transfer_ownership.future;

finalize ts_transfer_ownership:
    input r0 as token_service_v0001.aleo/transfer_ownership_ts.future;
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
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as u128.public;
    input r5 as u16.public;
    input r6 as u32.public;
    input r7 as u128.public;
    cast r0 r1 r2 r3 r4 r5 r6 r7 into r8 as TsAddToken;
    hash.bhp256 r8 into r9 as field;
    call token_service_v0001.aleo/add_token_ts r1 r2 r3 r4 r5 r6 r7 into r10;
    async ts_support_token r10 r9 into r11;
    output r11 as council_v0001.aleo/ts_support_token.future;

finalize ts_support_token:
    input r0 as token_service_v0001.aleo/add_token_ts.future;
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
    call token_service_v0001.aleo/remove_token_ts r1 into r4;
    async ts_remove_token r4 r3 into r5;
    output r5 as council_v0001.aleo/ts_remove_token.future;

finalize ts_remove_token:
    input r0 as token_service_v0001.aleo/remove_token_ts.future;
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


function ts_update_min_transfer:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u128.public;
    cast r0 r1 r2 into r3 as TsUpdateMinTransfer;
    hash.bhp256 r3 into r4 as field;
    call token_service_v0001.aleo/update_min_transfer_ts r1 r2 into r5;
    async ts_update_min_transfer r5 r4 into r6;
    output r6 as council_v0001.aleo/ts_update_min_transfer.future;

finalize ts_update_min_transfer:
    input r0 as token_service_v0001.aleo/update_min_transfer_ts.future;
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


function ts_update_max_transfer:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u128.public;
    cast r0 r1 r2 into r3 as TsUpdateMaxTransfer;
    hash.bhp256 r3 into r4 as field;
    call token_service_v0001.aleo/update_max_transfer_ts r1 r2 into r5;
    async ts_update_max_transfer r5 r4 into r6;
    output r6 as council_v0001.aleo/ts_update_max_transfer.future;

finalize ts_update_max_transfer:
    input r0 as token_service_v0001.aleo/update_max_transfer_ts.future;
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
    input r4 as u128.public;
    cast r0 r1 r2 r3 r4 into r5 as TsUpdateWithdrawalLimit;
    hash.bhp256 r5 into r6 as field;
    call token_service_v0001.aleo/update_withdrawal_limit r1 r2 r3 r4 into r7;
    async ts_update_outgoing_percentage r7 r6 into r8;
    output r8 as council_v0001.aleo/ts_update_outgoing_percentage.future;

finalize ts_update_outgoing_percentage:
    input r0 as token_service_v0001.aleo/update_withdrawal_limit.future;
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


function holding_release:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    cast r0 r1 self.caller r2 r3 into r4 as HoldingRelease;
    hash.bhp256 r4 into r5 as field;
    async holding_release r5 into r6;
    output r6 as council_v0001.aleo/holding_release.future;

finalize holding_release:
    input r0 as field.public;
    get settings[true] into r1;
    get proposal_vote_counts[r0] into r2;
    gte r2 r1 into r3;
    assert.eq r3 true;
    contains proposal_executed[r0] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_executed[r0];


function connector_update:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as address.public;
    cast r0 r1 self.caller r2 into r3 as ConnectorUpdate;
    hash.bhp256 r3 into r4 as field;
    async connector_update r4 into r5;
    output r5 as council_v0001.aleo/connector_update.future;

finalize connector_update:
    input r0 as field.public;
    get settings[true] into r1;
    get proposal_vote_counts[r0] into r2;
    gte r2 r1 into r3;
    assert.eq r3 true;
    contains proposal_executed[r0] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_executed[r0];


function external_execute:
    input r0 as u32.public;
    input r1 as field.public;
    cast r0 self.caller r1 into r2 as ExternalProposal;
    hash.bhp256 r2 into r3 as field;
    async external_execute r3 into r4;
    output r4 as council_v0001.aleo/external_execute.future;

finalize external_execute:
    input r0 as field.public;
    get settings[true] into r1;
    get proposal_vote_counts[r0] into r2;
    gte r2 r1 into r3;
    assert.eq r3 true;
    contains proposal_executed[r0] into r4;
    not r4 into r5;
    assert.eq r5 true;
    set true into proposal_executed[r0];
