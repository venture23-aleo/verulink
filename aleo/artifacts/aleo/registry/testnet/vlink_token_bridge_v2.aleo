program vlink_token_bridge_v2.aleo;

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
    or r5 r4 into r6;
    assert.eq r6 true;
    not r3 into r7;
    is.neq r0[0u32] r0[2u32] into r8;
    or r8 r7 into r9;
    assert.eq r9 true;
    not r3 into r10;
    is.neq r0[0u32] r0[3u32] into r11;
    or r11 r10 into r12;
    assert.eq r12 true;
    not r3 into r13;
    is.neq r0[0u32] r0[4u32] into r14;
    or r14 r13 into r15;
    assert.eq r15 true;
    add 0u8 1u8 into r16;
    ternary r3 r16 0u8 into r17;
    is.neq r0[1u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r18;
    not r18 into r19;
    is.neq r0[1u32] r0[2u32] into r20;
    or r20 r19 into r21;
    assert.eq r21 true;
    not r18 into r22;
    is.neq r0[1u32] r0[3u32] into r23;
    or r23 r22 into r24;
    assert.eq r24 true;
    not r18 into r25;
    is.neq r0[1u32] r0[4u32] into r26;
    or r26 r25 into r27;
    assert.eq r27 true;
    add r17 1u8 into r28;
    ternary r18 r28 r17 into r29;
    is.neq r0[2u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r30;
    not r30 into r31;
    is.neq r0[2u32] r0[3u32] into r32;
    or r32 r31 into r33;
    assert.eq r33 true;
    not r30 into r34;
    is.neq r0[2u32] r0[4u32] into r35;
    or r35 r34 into r36;
    assert.eq r36 true;
    add r29 1u8 into r37;
    ternary r30 r37 r29 into r38;
    is.neq r0[3u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r39;
    not r39 into r40;
    is.neq r0[3u32] r0[4u32] into r41;
    or r41 r40 into r42;
    assert.eq r42 true;
    add r38 1u8 into r43;
    ternary r39 r43 r38 into r44;
    is.neq r0[4u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r45;
    add r44 1u8 into r46;
    ternary r45 r46 r44 into r47;
    gte r1 1u8 into r48;
    lte r1 r47 into r49;
    and r48 r49 into r50;
    assert.eq r50 true;
    async initialize_tb r0 r1 r47 r2 into r51;
    output r51 as vlink_token_bridge_v2.aleo/initialize_tb.future;

finalize initialize_tb:
    input r0 as [address; 5u32].public;
    input r1 as u8.public;
    input r2 as u8.public;
    input r3 as address.public;
    contains bridge_settings[1u8] into r4;
    not r4 into r5;
    assert.eq r5 true;
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
    output r1 as vlink_token_bridge_v2.aleo/transfer_ownership_tb.future;

finalize transfer_ownership_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    set r1 into owner_TB[true];

function add_attestor_tb:
    input r0 as address.public;
    input r1 as u8.public;
    gt r1 0u8 into r2;
    assert.eq r2 true;
    async add_attestor_tb self.caller r0 r1 into r3;
    output r3 as vlink_token_bridge_v2.aleo/add_attestor_tb.future;

finalize add_attestor_tb:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get owner_TB[true] into r3;
    assert.eq r0 r3;
    get bridge_settings[2u8] into r4;
    add r4 1u8 into r5;
    lte r2 r5 into r6;
    assert.eq r6 true;
    contains attestors[r1] into r7;
    not r7 into r8;
    assert.eq r8 true;
    set true into attestors[r1];
    set r2 into bridge_settings[1u8];
    add r4 1u8 into r9;
    set r9 into bridge_settings[2u8];

function remove_attestor_tb:
    input r0 as address.public;
    input r1 as u8.public;
    assert.neq r0 aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;
    gt r1 0u8 into r2;
    assert.eq r2 true;
    async remove_attestor_tb self.caller r0 r1 into r3;
    output r3 as vlink_token_bridge_v2.aleo/remove_attestor_tb.future;

finalize remove_attestor_tb:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get owner_TB[true] into r3;
    assert.eq r0 r3;
    get bridge_settings[2u8] into r4;
    lt r2 r4 into r5;
    assert.eq r5 true;
    contains attestors[r1] into r6;
    assert.eq r6 true;
    remove attestors[r1];
    set r2 into bridge_settings[1u8];
    sub r4 1u8 into r7;
    set r7 into bridge_settings[2u8];

function update_threshold_tb:
    input r0 as u8.public;
    gte r0 1u8 into r1;
    assert.eq r1 true;
    async update_threshold_tb self.caller r0 into r2;
    output r2 as vlink_token_bridge_v2.aleo/update_threshold_tb.future;

finalize update_threshold_tb:
    input r0 as address.public;
    input r1 as u8.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    get bridge_settings[2u8] into r3;
    lte r1 r3 into r4;
    assert.eq r4 true;
    set r1 into bridge_settings[1u8];

function add_chain_tb:
    input r0 as u128.public;
    async add_chain_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v2.aleo/add_chain_tb.future;

finalize add_chain_tb:
    input r0 as address.public;
    input r1 as u128.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    set true into supported_chains[r1];

function remove_chain_tb:
    input r0 as u128.public;
    async remove_chain_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v2.aleo/remove_chain_tb.future;

finalize remove_chain_tb:
    input r0 as address.public;
    input r1 as u128.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    contains supported_chains[r1] into r3;
    assert.eq r3 true;
    remove supported_chains[r1];

function add_service_tb:
    input r0 as address.public;
    async add_service_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v2.aleo/add_service_tb.future;

finalize add_service_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    set true into supported_services[r1];

function remove_service_tb:
    input r0 as address.public;
    async remove_service_tb self.caller r0 into r1;
    output r1 as vlink_token_bridge_v2.aleo/remove_service_tb.future;

finalize remove_service_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    contains supported_services[r1] into r3;
    assert.eq r3 true;
    remove supported_services[r1];

function pause_tb:
    async pause_tb self.caller into r0;
    output r0 as vlink_token_bridge_v2.aleo/pause_tb.future;

finalize pause_tb:
    input r0 as address.public;
    get owner_TB[true] into r1;
    assert.eq r0 r1;
    set 0u8 into bridge_settings[3u8];

function unpause_tb:
    async unpause_tb self.caller into r0;
    output r0 as vlink_token_bridge_v2.aleo/unpause_tb.future;

finalize unpause_tb:
    input r0 as address.public;
    get owner_TB[true] into r1;
    assert.eq r0 r1;
    set 1u8 into bridge_settings[3u8];

function publish:
    input r0 as u8.public;
    input r1 as u128.public;
    input r2 as [u8; 32u32].public;
    input r3 as [u8; 32u32].public;
    input r4 as address.public;
    input r5 as [u8; 32u32].public;
    input r6 as u128.public;
    async publish r0 self.caller r1 r2 r3 r4 r5 r6 into r7;
    output r7 as vlink_token_bridge_v2.aleo/publish.future;

finalize publish:
    input r0 as u8.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as [u8; 32u32].public;
    input r4 as [u8; 32u32].public;
    input r5 as address.public;
    input r6 as [u8; 32u32].public;
    input r7 as u128.public;
    get bridge_settings[3u8] into r8;
    assert.eq r8 1u8;
    contains supported_chains[r2] into r9;
    assert.eq r9 true;
    contains supported_services[r1] into r10;
    assert.eq r10 true;
    get.or_use sequences[r2] 1u64 into r11;
    get.or_use sequences[6694886634403u128] 1u64 into r12;
    cast 6694886634403u128 r1 into r13 as AleoProgram;
    cast r2 r3 into r14 as ForeignContract;
    cast r5 r4 r7 r6 into r15 as OutTokenMessage;
    cast block.height into r16 as u64;
    cast r0 r11 r13 r14 r15 r16 into r17 as OutPacket;
    add r11 1u64 into r18;
    set r18 into sequences[r2];
    add r12 1u64 into r19;
    set r19 into sequences[6694886634403u128];
    cast r2 r11 into r20 as PacketId;
    set r17 into out_packets[r20];

function consume:
    input r0 as u8.public;
    input r1 as u128.public;
    input r2 as [u8; 32u32].public;
    input r3 as field.public;
    input r4 as [u8; 32u32].public;
    input r5 as address.public;
    input r6 as u128.public;
    input r7 as u64.public;
    input r8 as u64.public;
    input r9 as [address; 5u32].public;
    input r10 as [signature; 5u32].public;
    cast r1 r2 into r11 as ForeignContract;
    cast 6694886634403u128 self.caller into r12 as AleoProgram;
    cast r4 r3 r6 r5 into r13 as InTokenMessage;
    cast r0 r7 r11 r12 r13 r8 into r14 as InPacket;
    hash.bhp256 r14 into r15 as field;
    is.neq r9[0u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r16;
    not r16 into r17;
    is.neq r9[0u32] r9[1u32] into r18;
    or r18 r17 into r19;
    assert.eq r19 true;
    not r16 into r20;
    is.neq r9[0u32] r9[2u32] into r21;
    or r21 r20 into r22;
    assert.eq r22 true;
    not r16 into r23;
    is.neq r9[0u32] r9[3u32] into r24;
    or r24 r23 into r25;
    assert.eq r25 true;
    not r16 into r26;
    is.neq r9[0u32] r9[4u32] into r27;
    or r27 r26 into r28;
    assert.eq r28 true;
    add 0u8 1u8 into r29;
    ternary r16 r29 0u8 into r30;
    is.neq r9[1u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r31;
    not r31 into r32;
    is.neq r9[1u32] r9[2u32] into r33;
    or r33 r32 into r34;
    assert.eq r34 true;
    not r31 into r35;
    is.neq r9[1u32] r9[3u32] into r36;
    or r36 r35 into r37;
    assert.eq r37 true;
    not r31 into r38;
    is.neq r9[1u32] r9[4u32] into r39;
    or r39 r38 into r40;
    assert.eq r40 true;
    add r30 1u8 into r41;
    ternary r31 r41 r30 into r42;
    is.neq r9[2u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r43;
    not r43 into r44;
    is.neq r9[2u32] r9[3u32] into r45;
    or r45 r44 into r46;
    assert.eq r46 true;
    not r43 into r47;
    is.neq r9[2u32] r9[4u32] into r48;
    or r48 r47 into r49;
    assert.eq r49 true;
    add r42 1u8 into r50;
    ternary r43 r50 r42 into r51;
    is.neq r9[3u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r52;
    not r52 into r53;
    is.neq r9[3u32] r9[4u32] into r54;
    or r54 r53 into r55;
    assert.eq r55 true;
    add r51 1u8 into r56;
    ternary r52 r56 r51 into r57;
    is.neq r9[4u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r58;
    add r57 1u8 into r59;
    ternary r58 r59 r57 into r60;
    cast r15 true into r61 as InPacketWithScreening;
    hash.bhp256 r61 into r62 as field;
    cast r15 false into r63 as InPacketWithScreening;
    hash.bhp256 r63 into r64 as field;
    is.neq r9[0u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r65;
    sign.verify r10[0u32] r9[0u32] r62 into r66;
    sign.verify r10[0u32] r9[0u32] r64 into r67;
    or r66 r67 into r68;
    not r65 into r69;
    or r68 r69 into r70;
    assert.eq r70 true;
    add 0u8 1u8 into r71;
    ternary r66 r71 0u8 into r72;
    add 0u8 1u8 into r73;
    ternary r67 r73 0u8 into r74;
    ternary r65 r72 0u8 into r75;
    ternary r65 r74 0u8 into r76;
    is.neq r9[1u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r77;
    sign.verify r10[1u32] r9[1u32] r62 into r78;
    sign.verify r10[1u32] r9[1u32] r64 into r79;
    or r78 r79 into r80;
    not r77 into r81;
    or r80 r81 into r82;
    assert.eq r82 true;
    add r75 1u8 into r83;
    ternary r78 r83 r75 into r84;
    add r76 1u8 into r85;
    ternary r79 r85 r76 into r86;
    ternary r77 r84 r75 into r87;
    ternary r77 r86 r76 into r88;
    is.neq r9[2u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r89;
    sign.verify r10[2u32] r9[2u32] r62 into r90;
    sign.verify r10[2u32] r9[2u32] r64 into r91;
    or r90 r91 into r92;
    not r89 into r93;
    or r92 r93 into r94;
    assert.eq r94 true;
    add r87 1u8 into r95;
    ternary r90 r95 r87 into r96;
    add r88 1u8 into r97;
    ternary r91 r97 r88 into r98;
    ternary r89 r96 r87 into r99;
    ternary r89 r98 r88 into r100;
    is.neq r9[3u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r101;
    sign.verify r10[3u32] r9[3u32] r62 into r102;
    sign.verify r10[3u32] r9[3u32] r64 into r103;
    or r102 r103 into r104;
    not r101 into r105;
    or r104 r105 into r106;
    assert.eq r106 true;
    add r99 1u8 into r107;
    ternary r102 r107 r99 into r108;
    add r100 1u8 into r109;
    ternary r103 r109 r100 into r110;
    ternary r101 r108 r99 into r111;
    ternary r101 r110 r100 into r112;
    is.neq r9[4u32] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r113;
    sign.verify r10[4u32] r9[4u32] r62 into r114;
    sign.verify r10[4u32] r9[4u32] r64 into r115;
    or r114 r115 into r116;
    not r113 into r117;
    or r116 r117 into r118;
    assert.eq r118 true;
    add r111 1u8 into r119;
    ternary r114 r119 r111 into r120;
    add r112 1u8 into r121;
    ternary r115 r121 r112 into r122;
    ternary r113 r120 r111 into r123;
    ternary r113 r122 r112 into r124;
    is.neq r123 r124 into r125;
    assert.eq r125 true;
    add r123 r124 into r126;
    assert.eq r60 r126;
    gt r123 r124 into r127;
    ternary r127 true false into r128;
    ternary r127 r123 r124 into r129;
    async consume self.caller r1 r7 r9 r129 into r130;
    output r128 as boolean.public;
    output r130 as vlink_token_bridge_v2.aleo/consume.future;

finalize consume:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as u64.public;
    input r3 as [address; 5u32].public;
    input r4 as u8.public;
    get bridge_settings[3u8] into r5;
    assert.eq r5 1u8;
    get supported_chains[r1] into r6;
    assert.eq r6 true;
    get supported_services[r0] into r7;
    assert.eq r7 true;
    contains attestors[r3[0u32]] into r8;
    assert.eq r8 true;
    contains attestors[r3[1u32]] into r9;
    assert.eq r9 true;
    contains attestors[r3[2u32]] into r10;
    assert.eq r10 true;
    contains attestors[r3[3u32]] into r11;
    assert.eq r11 true;
    contains attestors[r3[4u32]] into r12;
    assert.eq r12 true;
    get bridge_settings[1u8] into r13;
    gte r4 r13 into r14;
    assert.eq r14 true;
    cast r1 r2 into r15 as PacketId;
    get.or_use in_packet_consumed[r15] false into r16;
    not r16 into r17;
    assert.eq r17 true;
    set true into in_packet_consumed[r15];
