program vlink_council_v1.aleo;

struct ProposalVote:
    proposal as field;
    member as address;

struct ProposalVoterKey:
    proposal as field;
    index as u8;

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

mapping proposals:
    key as u32.public;
    value as field.public;

mapping proposal_vote_counts:
    key as field.public;
    value as u8.public;

mapping proposal_votes:
    key as field.public;
    value as boolean.public;

mapping proposal_voters:
    key as ProposalVoterKey.public;
    value as address.public;

mapping proposal_executed:
    key as field.public;
    value as boolean.public;

closure get_valid_unique_address_count:
    input r0 as [address; 5u32];
    is.neq r0[0u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r1;
    not r1 into r2;
    is.neq r0[0u32] r0[1u32] into r3;
    or r2 r3 into r4;
    assert.eq r4 true ;
    not r1 into r5;
    is.neq r0[0u32] r0[2u32] into r6;
    or r5 r6 into r7;
    assert.eq r7 true ;
    not r1 into r8;
    is.neq r0[0u32] r0[3u32] into r9;
    or r8 r9 into r10;
    assert.eq r10 true ;
    not r1 into r11;
    is.neq r0[0u32] r0[4u32] into r12;
    or r11 r12 into r13;
    assert.eq r13 true ;
    add 0u8 1u8 into r14;
    ternary r1 r14 0u8 into r15;
    is.neq r0[1u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r16;
    not r16 into r17;
    is.neq r0[1u32] r0[2u32] into r18;
    or r17 r18 into r19;
    assert.eq r19 true ;
    not r16 into r20;
    is.neq r0[1u32] r0[3u32] into r21;
    or r20 r21 into r22;
    assert.eq r22 true ;
    not r16 into r23;
    is.neq r0[1u32] r0[4u32] into r24;
    or r23 r24 into r25;
    assert.eq r25 true ;
    add r15 1u8 into r26;
    ternary r16 r26 r15 into r27;
    is.neq r0[2u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r28;
    not r28 into r29;
    is.neq r0[2u32] r0[3u32] into r30;
    or r29 r30 into r31;
    assert.eq r31 true ;
    not r28 into r32;
    is.neq r0[2u32] r0[4u32] into r33;
    or r32 r33 into r34;
    assert.eq r34 true ;
    add r27 1u8 into r35;
    ternary r28 r35 r27 into r36;
    is.neq r0[3u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r37;
    not r37 into r38;
    is.neq r0[3u32] r0[4u32] into r39;
    or r38 r39 into r40;
    assert.eq r40 true ;
    add r36 1u8 into r41;
    ternary r37 r41 r36 into r42;
    is.neq r0[4u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r43;
    add r42 1u8 into r44;
    ternary r43 r44 r42 into r45;
    output r45 as u8;

function initialize:
    input r0 as [address; 5u32].public;
    input r1 as u8.public;
    call get_valid_unique_address_count r0 into r2;
    gt r1 0u8 into r3;
    lte r1 r2 into r4;
    and r3 r4 into r5;
    assert.eq r5 true ;
    async initialize r0 r1 r2 into r6;
    output r6 as vlink_council_v1.aleo/initialize.future;

finalize initialize:
    input r0 as [address; 5u32].public;
    input r1 as u8.public;
    input r2 as u8.public;
    contains settings[true] into r3;
    not r3 into r4;
    assert.eq r4 true ;
    set true into members[r0[0u32]];
    set true into members[r0[1u32]];
    set true into members[r0[2u32]];
    set true into members[r0[3u32]];
    set true into members[r0[4u32]];
    set true into members[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc];
    set r1 into settings[true];
    set r2 into settings[false];
    set 0field into proposals[0u32];

function propose:
    input r0 as u32.public;
    input r1 as field.public;
    assert.neq self.caller aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc ;
    cast r1 self.caller into r2 as ProposalVote;
    hash.bhp256 r2 into r3 as field;
    cast r1 aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r4 as ProposalVote;
    hash.bhp256 r4 into r5 as field;
    async propose self.caller r0 r1 r3 r5 into r6;
    output r6 as vlink_council_v1.aleo/propose.future;

finalize propose:
    input r0 as address.public;
    input r1 as u32.public;
    input r2 as field.public;
    input r3 as field.public;
    input r4 as field.public;
    get members[r0] into r5;
    assert.eq r5 true ;
    get proposals[0u32] into r6;
    add r6 1field into r7;
    cast r7 into r8 as u32;
    assert.eq r8 r1 ;
    add r6 1field into r9;
    set r9 into proposals[0u32];
    set r2 into proposals[r1];
    cast r2 0u8 into r10 as ProposalVoterKey;
    set r0 into proposal_voters[r10];
    set 1u8 into proposal_vote_counts[r2];
    set true into proposal_votes[r3];
    set true into proposal_votes[r4];

function vote:
    input r0 as field.public;
    input r1 as boolean.private;
    assert.neq self.caller aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc ;
    cast r0 self.caller into r2 as ProposalVote;
    hash.bhp256 r2 into r3 as field;
    async vote self.caller r0 r3 r1 into r4;
    output r4 as vlink_council_v1.aleo/vote.future;

finalize vote:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as boolean.public;
    get members[r0] into r4;
    assert.eq r4 true ;
    contains proposal_votes[r2] into r5;
    not r5 into r6;
    assert.eq r6 true ;
    get proposal_vote_counts[r1] into r7;
    cast r1 r7 into r8 as ProposalVoterKey;
    set r0 into proposal_voters[r8];
    set r3 into proposal_votes[r2];
    add r7 1u8 into r9;
    set r9 into proposal_vote_counts[r1];

function update_vote:
    input r0 as field.public;
    input r1 as boolean.private;
    assert.neq self.caller aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc ;
    cast r0 self.caller into r2 as ProposalVote;
    hash.bhp256 r2 into r3 as field;
    async update_vote self.caller r0 r3 r1 into r4;
    output r4 as vlink_council_v1.aleo/update_vote.future;

finalize update_vote:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as boolean.public;
    contains proposal_votes[r2] into r4;
    assert.eq r4 true ;
    set r3 into proposal_votes[r2];

closure get_proposal_vote_keys:
    input r0 as field;
    input r1 as [address; 5u32];
    cast r0 r1[0u32] into r2 as ProposalVote;
    hash.bhp256 r2 into r3 as field;
    cast r0 r1[1u32] into r4 as ProposalVote;
    hash.bhp256 r4 into r5 as field;
    cast r0 r1[2u32] into r6 as ProposalVote;
    hash.bhp256 r6 into r7 as field;
    cast r0 r1[3u32] into r8 as ProposalVote;
    hash.bhp256 r8 into r9 as field;
    cast r0 r1[4u32] into r10 as ProposalVote;
    hash.bhp256 r10 into r11 as field;
    cast r3 r5 r7 r9 r11 into r12 as [field; 5u32];
    output r12 as [field; 5u32];

function add_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    input r3 as [address; 5u32].public;
    gt r2 0u8 into r4;
    assert.eq r4 true ;
    cast r0 r1 r2 into r5 as AddMember;
    hash.bhp256 r5 into r6 as field;
    call get_valid_unique_address_count r3 into r7;
    call get_proposal_vote_keys r6 r3 into r8;
    async add_member r6 r1 r2 r3 r8 r7 into r9;
    output r9 as vlink_council_v1.aleo/add_member.future;

finalize add_member:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u8.public;
    input r3 as [address; 5u32].public;
    input r4 as [field; 5u32].public;
    input r5 as u8.public;
    contains members[r3[0u32]] into r6;
    assert.eq r6 true ;
    get proposal_votes[r4[0u32]] into r7;
    assert.eq r7 true ;
    contains members[r3[1u32]] into r8;
    assert.eq r8 true ;
    get proposal_votes[r4[1u32]] into r9;
    assert.eq r9 true ;
    contains members[r3[2u32]] into r10;
    assert.eq r10 true ;
    get proposal_votes[r4[2u32]] into r11;
    assert.eq r11 true ;
    contains members[r3[3u32]] into r12;
    assert.eq r12 true ;
    get proposal_votes[r4[3u32]] into r13;
    assert.eq r13 true ;
    contains members[r3[4u32]] into r14;
    assert.eq r14 true ;
    get proposal_votes[r4[4u32]] into r15;
    assert.eq r15 true ;
    get settings[true] into r16;
    gte r5 r16 into r17;
    assert.eq r17 true ;
    contains proposal_executed[r0] into r18;
    not r18 into r19;
    assert.eq r19 true ;
    set true into proposal_executed[r0];
    contains members[r1] into r20;
    not r20 into r21;
    assert.eq r21 true ;
    set true into members[r1];
    set r2 into settings[true];
    get settings[false] into r22;
    add r22 1u8 into r23;
    lte r2 r23 into r24;
    assert.eq r24 true ;
    add r22 1u8 into r25;
    set r25 into settings[false];

function remove_member:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    input r3 as [address; 5u32].public;
    assert.neq r1 aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc ;
    gt r2 0u8 into r4;
    assert.eq r4 true ;
    cast r0 r1 r2 into r5 as RemoveMember;
    hash.bhp256 r5 into r6 as field;
    call get_valid_unique_address_count r3 into r7;
    call get_proposal_vote_keys r6 r3 into r8;
    async remove_member r6 r1 r2 r3 r8 r7 into r9;
    output r9 as vlink_council_v1.aleo/remove_member.future;

finalize remove_member:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u8.public;
    input r3 as [address; 5u32].public;
    input r4 as [field; 5u32].public;
    input r5 as u8.public;
    contains members[r3[0u32]] into r6;
    assert.eq r6 true ;
    get proposal_votes[r4[0u32]] into r7;
    assert.eq r7 true ;
    contains members[r3[1u32]] into r8;
    assert.eq r8 true ;
    get proposal_votes[r4[1u32]] into r9;
    assert.eq r9 true ;
    contains members[r3[2u32]] into r10;
    assert.eq r10 true ;
    get proposal_votes[r4[2u32]] into r11;
    assert.eq r11 true ;
    contains members[r3[3u32]] into r12;
    assert.eq r12 true ;
    get proposal_votes[r4[3u32]] into r13;
    assert.eq r13 true ;
    contains members[r3[4u32]] into r14;
    assert.eq r14 true ;
    get proposal_votes[r4[4u32]] into r15;
    assert.eq r15 true ;
    get settings[true] into r16;
    gte r5 r16 into r17;
    assert.eq r17 true ;
    contains proposal_executed[r0] into r18;
    not r18 into r19;
    assert.eq r19 true ;
    set true into proposal_executed[r0];
    get settings[false] into r20;
    gt r20 1u8 into r21;
    assert.eq r21 true ;
    lt r2 r20 into r22;
    assert.eq r22 true ;
    contains members[r1] into r23;
    assert.eq r23 true ;
    remove members[r1];
    set r2 into settings[true];
    sub r20 1u8 into r24;
    set r24 into settings[false];

function update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    input r2 as [address; 5u32].public;
    gt r1 0u8 into r3;
    assert.eq r3 true ;
    cast r0 r1 into r4 as UpdateThreshold;
    hash.bhp256 r4 into r5 as field;
    call get_valid_unique_address_count r2 into r6;
    call get_proposal_vote_keys r5 r2 into r7;
    async update_threshold r5 r1 r2 r7 r6 into r8;
    output r8 as vlink_council_v1.aleo/update_threshold.future;

finalize update_threshold:
    input r0 as field.public;
    input r1 as u8.public;
    input r2 as [address; 5u32].public;
    input r3 as [field; 5u32].public;
    input r4 as u8.public;
    contains members[r2[0u32]] into r5;
    assert.eq r5 true ;
    get proposal_votes[r3[0u32]] into r6;
    assert.eq r6 true ;
    contains members[r2[1u32]] into r7;
    assert.eq r7 true ;
    get proposal_votes[r3[1u32]] into r8;
    assert.eq r8 true ;
    contains members[r2[2u32]] into r9;
    assert.eq r9 true ;
    get proposal_votes[r3[2u32]] into r10;
    assert.eq r10 true ;
    contains members[r2[3u32]] into r11;
    assert.eq r11 true ;
    get proposal_votes[r3[3u32]] into r12;
    assert.eq r12 true ;
    contains members[r2[4u32]] into r13;
    assert.eq r13 true ;
    get proposal_votes[r3[4u32]] into r14;
    assert.eq r14 true ;
    get settings[true] into r15;
    get settings[false] into r16;
    lte r1 r16 into r17;
    assert.eq r17 true ;
    gte r4 r15 into r18;
    assert.eq r18 true ;
    contains proposal_executed[r0] into r19;
    not r19 into r20;
    assert.eq r20 true ;
    set true into proposal_executed[r0];
    set r1 into settings[true];

function external_execute:
    input r0 as u32.public;
    input r1 as field.public;
    input r2 as [address; 5u32].public;
    cast r0 self.caller r1 into r3 as ExternalProposal;
    hash.bhp256 r3 into r4 as field;
    call get_valid_unique_address_count r2 into r5;
    call get_proposal_vote_keys r1 r2 into r6;
    async external_execute r1 r2 r6 r5 into r7;
    output r7 as vlink_council_v1.aleo/external_execute.future;

finalize external_execute:
    input r0 as field.public;
    input r1 as [address; 5u32].public;
    input r2 as [field; 5u32].public;
    input r3 as u8.public;
    contains members[r1[0u32]] into r4;
    assert.eq r4 true ;
    get proposal_votes[r2[0u32]] into r5;
    assert.eq r5 true ;
    contains members[r1[1u32]] into r6;
    assert.eq r6 true ;
    get proposal_votes[r2[1u32]] into r7;
    assert.eq r7 true ;
    contains members[r1[2u32]] into r8;
    assert.eq r8 true ;
    get proposal_votes[r2[2u32]] into r9;
    assert.eq r9 true ;
    contains members[r1[3u32]] into r10;
    assert.eq r10 true ;
    get proposal_votes[r2[3u32]] into r11;
    assert.eq r11 true ;
    contains members[r1[4u32]] into r12;
    assert.eq r12 true ;
    get proposal_votes[r2[4u32]] into r13;
    assert.eq r13 true ;
    get settings[true] into r14;
    gte r3 r14 into r15;
    assert.eq r15 true ;
    contains proposal_executed[r0] into r16;
    not r16 into r17;
    assert.eq r17 true ;
    set true into proposal_executed[r0];