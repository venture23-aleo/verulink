program vlink_token_bridge_v1.aleo;

struct AleoProgram:
    chain_id as u128;
    addr as address;

struct ForeignContract:
    chain_id as u128;
    addr as [u8; 32u32];

struct OutTokenMessage:
    sender_address as address;
    dest_token_address as [u8; 32u32];
    amount as u128;
    receiver_address as [u8; 32u32];

struct InTokenMessage:
    sender_address as [u8; 32u32];
    dest_token_id as field;
    amount as u128;
    receiver_address as address;

struct OutPacket:
    version as u8;
    sequence as u64;
    source as AleoProgram;
    destination as ForeignContract;
    message as OutTokenMessage;
    height as u64;

struct InPacket:
    version as u8;
    sequence as u64;
    source as ForeignContract;
    destination as AleoProgram;
    message as InTokenMessage;
    height as u64;

struct PacketId:
    chain_id as u128;
    sequence as u64;

struct InPacketWithScreening:
    packet_hash as field;
    screening_passed as boolean;

mapping bridge_settings:
    key as u8.public;
    value as u8.public;

mapping owner_TB:
    key as boolean.public;
    value as address.public;

mapping attestors:
    key as address.public;
    value as boolean.public;

mapping in_packet_consumed:
    key as PacketId.public;
    value as boolean.public;

mapping in_packet_hash:
    key as PacketId.public;
    value as field.public;

mapping out_packets:
    key as PacketId.public;
    value as OutPacket.public;

mapping supported_chains:
    key as u128.public;
    value as boolean.public;

mapping supported_services:
    key as address.public;
    value as boolean.public;

mapping sequences:
    key as u128.public;
    value as u64.public;

function initialize_tb:
    input r0 as [address; 5u32].public;
    input r1 as u8.public;
    input r2 as address.public;
    is.neq r0[0u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r3;
    not r3 into r4;
    is.neq r0[0u32] r0[1u32] into r5;
    or r4 r5 into r6;
    assert.eq r6 true ;
    not r3 into r7;
    is.neq r0[0u32] r0[2u32] into r8;
    or r7 r8 into r9;
    assert.eq r9 true ;
    not r3 into r10;
    is.neq r0[0u32] r0[3u32] into r11;
    or r10 r11 into r12;
    assert.eq r12 true ;
    not r3 into r13;
    is.neq r0[0u32] r0[4u32] into r14;
    or r13 r14 into r15;
    assert.eq r15 true ;
    add 0u8 1u8 into r16;
    ternary r3 r16 0u8 into r17;
    is.neq r0[1u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r18;
    not r18 into r19;
    is.neq r0[1u32] r0[2u32] into r20;
    or r19 r20 into r21;
    assert.eq r21 true ;
    not r18 into r22;
    is.neq r0[1u32] r0[3u32] into r23;
    or r22 r23 into r24;
    assert.eq r24 true ;
    not r18 into r25;
    is.neq r0[1u32] r0[4u32] into r26;
    or r25 r26 into r27;
    assert.eq r27 true ;
    add r17 1u8 into r28;
    ternary r18 r28 r17 into r29;
    is.neq r0[2u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r30;
    not r30 into r31;
    is.neq r0[2u32] r0[3u32] into r32;
    or r31 r32 into r33;
    assert.eq r33 true ;
    not r30 into r34;
    is.neq r0[2u32] r0[4u32] into r35;
    or r34 r35 into r36;
    assert.eq r36 true ;
    add r29 1u8 into r37;
    ternary r30 r37 r29 into r38;
    is.neq r0[3u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r39;
    not r39 into r40;
    is.neq r0[3u32] r0[4u32] into r41;
    or r40 r41 into r42;
    assert.eq r42 true ;
    add r38 1u8 into r43;
    ternary r39 r43 r38 into r44;
    is.neq r0[4u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r45;
    add r44 1u8 into r46;
    ternary r45 r46 r44 into r47;
    gte r1 1u8 into r48;
    lte r1 r47 into r49;
    and r48 r49 into r50;
    assert.eq r50 true ;
    async initialize_tb r0 r1 r47 r2 into r51;
    output r51 as vlink_token_bridge_v1.aleo/initialize_tb.future;

finalize initialize_tb:
    input r0 as [address; 5u32].public;
    input r1 as u8.public;
    input r2 as u8.public;
    input r3 as address.public;
    contains bridge_settings[1u8] into r4;
    not r4 into r5;
    assert.eq r5 true ;
    set r1 into bridge_settings[1u8];
    set r2 into bridge_settings[2u8];
    set true into attestors[r0[0u32]];
    set true into attestors[r0[1u32]];
    set true into attestors[r0[2u32]];
    set true into attestors[r0[3u32]];
    set true into attestors[r0[4u32]];
    set true into attestors[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc];
    set r3 into owner_TB[true];
    set 0u8 into bridge_settings[3u8];

function transfer_ownership_tb:
    input r0 as address.public;
    async transfer_ownership_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v1.aleo/transfer_ownership_tb.future;

finalize transfer_ownership_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2 ;
    set r1 into owner_TB[true];

function add_attestor_tb:
    input r0 as address.public;
    input r1 as u8.public;
    gt r1 0u8 into r2;
    assert.eq r2 true ;
    async add_attestor_tb self.caller r0 r1 into r3;
    output r3 as vlink_token_bridge_v1.aleo/add_attestor_tb.future;

finalize add_attestor_tb:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get owner_TB[true] into r3;
    assert.eq r0 r3 ;
    get bridge_settings[2u8] into r4;
    add r4 1u8 into r5;
    lte r2 r5 into r6;
    assert.eq r6 true ;
    contains attestors[r1] into r7;
    not r7 into r8;
    assert.eq r8 true ;
    set true into attestors[r1];
    set r2 into bridge_settings[1u8];
    add r4 1u8 into r9;
    set r9 into bridge_settings[2u8];

function remove_attestor_tb:
    input r0 as address.public;
    input r1 as u8.public;
    assert.neq r0 aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc ;
    gt r1 0u8 into r2;
    assert.eq r2 true ;
    async remove_attestor_tb self.caller r0 r1 into r3;
    output r3 as vlink_token_bridge_v1.aleo/remove_attestor_tb.future;

finalize remove_attestor_tb:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get owner_TB[true] into r3;
    assert.eq r0 r3 ;
    get bridge_settings[2u8] into r4;
    lt r2 r4 into r5;
    assert.eq r5 true ;
    contains attestors[r1] into r6;
    assert.eq r6 true ;
    remove attestors[r1];
    set r2 into bridge_settings[1u8];
    sub r4 1u8 into r7;
    set r7 into bridge_settings[2u8];

function update_threshold_tb:
    input r0 as u8.public;
    gte r0 1u8 into r1;
    assert.eq r1 true ;
    async update_threshold_tb self.caller r0 into r2;
    output r2 as vlink_token_bridge_v1.aleo/update_threshold_tb.future;

finalize update_threshold_tb:
    input r0 as address.public;
    input r1 as u8.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2 ;
    get bridge_settings[2u8] into r3;
    lte r1 r3 into r4;
    assert.eq r4 true ;
    set r1 into bridge_settings[1u8];

function add_chain_tb:
    input r0 as u128.public;
    async add_chain_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v1.aleo/add_chain_tb.future;

finalize add_chain_tb:
    input r0 as address.public;
    input r1 as u128.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2 ;
    set true into supported_chains[r1];

function remove_chain_tb:
    input r0 as u128.public;
    async remove_chain_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v1.aleo/remove_chain_tb.future;

finalize remove_chain_tb:
    input r0 as address.public;
    input r1 as u128.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2 ;
    contains supported_chains[r1] into r3;
    assert.eq r3 true ;
    remove supported_chains[r1];

function add_service_tb:
    input r0 as address.public;
    async add_service_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v1.aleo/add_service_tb.future;

finalize add_service_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2 ;
    set true into supported_services[r1];

function remove_service_tb:
    input r0 as address.public;
    async remove_service_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v1.aleo/remove_service_tb.future;

finalize remove_service_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2 ;
    contains supported_services[r1] into r3;
    assert.eq r3 true ;
    remove supported_services[r1];

function pause_tb:
    async pause_tb self.caller into r0;
    output r0 as vlink_token_bridge_v1.aleo/pause_tb.future;

finalize pause_tb:
    input r0 as address.public;
    get owner_TB[true] into r1;
    assert.eq r0 r1 ;
    set 0u8 into bridge_settings[3u8];

function unpause_tb:
    async unpause_tb self.caller into r0;
    output r0 as vlink_token_bridge_v1.aleo/unpause_tb.future;

finalize unpause_tb:
    input r0 as address.public;
    get owner_TB[true] into r1;
    assert.eq r0 r1 ;
    set 1u8 into bridge_settings[3u8];

function publish:
    input r0 as u128.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 32u32].public;
    input r3 as address.public;
    input r4 as [u8; 32u32].public;
    input r5 as u128.public;
    async publish self.caller r0 r1 r2 r3 r4 r5 into r6;
    output r6 as vlink_token_bridge_v1.aleo/publish.future;

finalize publish:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as [u8; 32u32].public;
    input r3 as [u8; 32u32].public;
    input r4 as address.public;
    input r5 as [u8; 32u32].public;
    input r6 as u128.public;
    get bridge_settings[3u8] into r7;
    assert.eq r7 1u8 ;
    contains supported_chains[r1] into r8;
    assert.eq r8 true ;
    contains supported_services[r0] into r9;
    assert.eq r9 true ;
    get.or_use sequences[r1] 1u64 into r10;
    get.or_use sequences[6694886634401u128] 1u64 into r11;
    cast 6694886634401u128 r0 into r12 as AleoProgram;
    cast r1 r2 into r13 as ForeignContract;
    cast r4 r3 r6 r5 into r14 as OutTokenMessage;
    cast block.height into r15 as u64;
    cast 1u8 r10 r12 r13 r14 r15 into r16 as OutPacket;
    add r10 1u64 into r17;
    set r17 into sequences[r1];
    add r11 1u64 into r18;
    set r18 into sequences[6694886634401u128];
    cast r1 r10 into r19 as PacketId;
    set r16 into out_packets[r19];

closure get_majority_count:
    input r0 as field;
    input r1 as [address; 5u32];
    input r2 as [signature; 5u32];
    is.neq r1[0u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r3;
    not r3 into r4;
    is.neq r1[0u32] r1[1u32] into r5;
    or r4 r5 into r6;
    assert.eq r6 true ;
    not r3 into r7;
    is.neq r1[0u32] r1[2u32] into r8;
    or r7 r8 into r9;
    assert.eq r9 true ;
    not r3 into r10;
    is.neq r1[0u32] r1[3u32] into r11;
    or r10 r11 into r12;
    assert.eq r12 true ;
    not r3 into r13;
    is.neq r1[0u32] r1[4u32] into r14;
    or r13 r14 into r15;
    assert.eq r15 true ;
    add 0u8 1u8 into r16;
    ternary r3 r16 0u8 into r17;
    is.neq r1[1u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r18;
    not r18 into r19;
    is.neq r1[1u32] r1[2u32] into r20;
    or r19 r20 into r21;
    assert.eq r21 true ;
    not r18 into r22;
    is.neq r1[1u32] r1[3u32] into r23;
    or r22 r23 into r24;
    assert.eq r24 true ;
    not r18 into r25;
    is.neq r1[1u32] r1[4u32] into r26;
    or r25 r26 into r27;
    assert.eq r27 true ;
    add r17 1u8 into r28;
    ternary r18 r28 r17 into r29;
    is.neq r1[2u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r30;
    not r30 into r31;
    is.neq r1[2u32] r1[3u32] into r32;
    or r31 r32 into r33;
    assert.eq r33 true ;
    not r30 into r34;
    is.neq r1[2u32] r1[4u32] into r35;
    or r34 r35 into r36;
    assert.eq r36 true ;
    add r29 1u8 into r37;
    ternary r30 r37 r29 into r38;
    is.neq r1[3u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r39;
    not r39 into r40;
    is.neq r1[3u32] r1[4u32] into r41;
    or r40 r41 into r42;
    assert.eq r42 true ;
    add r38 1u8 into r43;
    ternary r39 r43 r38 into r44;
    is.neq r1[4u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r45;
    add r44 1u8 into r46;
    ternary r45 r46 r44 into r47;
    cast r0 true into r48 as InPacketWithScreening;
    hash.bhp256 r48 into r49 as field;
    cast r0 false into r50 as InPacketWithScreening;
    hash.bhp256 r50 into r51 as field;
    is.neq r1[0u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r52;
    sign.verify r2[0u32] r1[0u32] r49 into r53;
    sign.verify r2[0u32] r1[0u32] r51 into r54;
    or r53 r54 into r55;
    not r52 into r56;
    or r56 r55 into r57;
    assert.eq r57 true ;
    add 0u8 1u8 into r58;
    ternary r53 r58 0u8 into r59;
    add 0u8 1u8 into r60;
    ternary r54 r60 0u8 into r61;
    ternary r52 r59 0u8 into r62;
    ternary r52 r61 0u8 into r63;
    is.neq r1[1u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r64;
    sign.verify r2[1u32] r1[1u32] r49 into r65;
    sign.verify r2[1u32] r1[1u32] r51 into r66;
    or r65 r66 into r67;
    not r64 into r68;
    or r68 r67 into r69;
    assert.eq r69 true ;
    add r62 1u8 into r70;
    ternary r65 r70 r62 into r71;
    add r63 1u8 into r72;
    ternary r66 r72 r63 into r73;
    ternary r64 r71 r62 into r74;
    ternary r64 r73 r63 into r75;
    is.neq r1[2u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r76;
    sign.verify r2[2u32] r1[2u32] r49 into r77;
    sign.verify r2[2u32] r1[2u32] r51 into r78;
    or r77 r78 into r79;
    not r76 into r80;
    or r80 r79 into r81;
    assert.eq r81 true ;
    add r74 1u8 into r82;
    ternary r77 r82 r74 into r83;
    add r75 1u8 into r84;
    ternary r78 r84 r75 into r85;
    ternary r76 r83 r74 into r86;
    ternary r76 r85 r75 into r87;
    is.neq r1[3u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r88;
    sign.verify r2[3u32] r1[3u32] r49 into r89;
    sign.verify r2[3u32] r1[3u32] r51 into r90;
    or r89 r90 into r91;
    not r88 into r92;
    or r92 r91 into r93;
    assert.eq r93 true ;
    add r86 1u8 into r94;
    ternary r89 r94 r86 into r95;
    add r87 1u8 into r96;
    ternary r90 r96 r87 into r97;
    ternary r88 r95 r86 into r98;
    ternary r88 r97 r87 into r99;
    is.neq r1[4u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r100;
    sign.verify r2[4u32] r1[4u32] r49 into r101;
    sign.verify r2[4u32] r1[4u32] r51 into r102;
    or r101 r102 into r103;
    not r100 into r104;
    or r104 r103 into r105;
    assert.eq r105 true ;
    add r98 1u8 into r106;
    ternary r101 r106 r98 into r107;
    add r99 1u8 into r108;
    ternary r102 r108 r99 into r109;
    ternary r100 r107 r98 into r110;
    ternary r100 r109 r99 into r111;
    is.neq r110 r111 into r112;
    assert.eq r112 true ;
    add r110 r111 into r113;
    assert.eq r47 r113 ;
    gt r110 r111 into r114;
    ternary r114 true false into r115;
    ternary r114 r110 r111 into r116;
    output r115 as boolean;
    output r116 as u8;

function consume:
    input r0 as u128.public;
    input r1 as [u8; 32u32].public;
    input r2 as field.public;
    input r3 as [u8; 32u32].public;
    input r4 as address.public;
    input r5 as u128.public;
    input r6 as u64.public;
    input r7 as u64.public;
    input r8 as [address; 5u32].public;
    input r9 as [signature; 5u32].public;
    cast r0 r1 into r10 as ForeignContract;
    cast 6694886634401u128 self.caller into r11 as AleoProgram;
    cast r3 r2 r5 r4 into r12 as InTokenMessage;
    cast 1u8 r6 r10 r11 r12 r7 into r13 as InPacket;
    hash.bhp256 r13 into r14 as field;
    call get_majority_count r14 r8 r9 into r15 r16;
    async consume self.caller r0 r6 r8 r16 into r17;
    output r15 as boolean.public;
    output r17 as vlink_token_bridge_v1.aleo/consume.future;

finalize consume:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as u64.public;
    input r3 as [address; 5u32].public;
    input r4 as u8.public;
    get bridge_settings[3u8] into r5;
    assert.eq r5 1u8 ;
    get supported_chains[r1] into r6;
    assert.eq r6 true ;
    get supported_services[r0] into r7;
    assert.eq r7 true ;
    contains attestors[r3[0u32]] into r8;
    assert.eq r8 true ;
    contains attestors[r3[1u32]] into r9;
    assert.eq r9 true ;
    contains attestors[r3[2u32]] into r10;
    assert.eq r10 true ;
    contains attestors[r3[3u32]] into r11;
    assert.eq r11 true ;
    contains attestors[r3[4u32]] into r12;
    assert.eq r12 true ;
    get bridge_settings[1u8] into r13;
    gte r4 r13 into r14;
    assert.eq r14 true ;
    cast r1 r2 into r15 as PacketId;
    get.or_use in_packet_consumed[r15] false into r16;
    not r16 into r17;
    assert.eq r17 true ;
    set true into in_packet_consumed[r15];