program token_bridge.aleo;

struct AleoProgram:
    chain_id as u128;
    addr as address;

struct ForeignContract:
    chain_id as u128;
    addr as [u8; 32u32];

struct MsgTokenReceive:
    token as address;
    sender as [u8; 32u32];
    receiver as address;
    amount as u128;

struct MsgTokenSend:
    token as [u8; 32u32];
    sender as address;
    receiver as [u8; 32u32];
    amount as u128;

struct InPacketFull:
    version as u8;
    sequence as u64;
    source as ForeignContract;
    destination as AleoProgram;
    message as MsgTokenReceive;
    height as u32;

struct InPacket:
    version as u8;
    sequence as u64;
    source as ForeignContract;
    destination as AleoProgram;
    msg_hash as field;
    height as u32;

struct OutPacket:
    version as u8;
    sequence as u64;
    source as AleoProgram;
    destination as ForeignContract;
    message as MsgTokenSend;
    height as u32;

struct PacketId:
    chain_id as u128;
    sequence as u64;

struct PacketIdWithAttestor:
    chain_id as u128;
    sequence as u64;
    attestor as address;

struct InPacketFullAttestorKey:
    packet_hash as field;
    attestor as address;

struct InPacketFullScreeningKey:
    packet_hash as field;
    screening_passed as boolean;


mapping attestor_settings:
	key as boolean.public;
	value as u8.public;


mapping owner_TB:
	key as boolean.public;
	value as address.public;


mapping attestors:
	key as address.public;
	value as boolean.public;


mapping in_packet_attestations:
	key as field.public;
	value as u8.public;


mapping in_packet_consumed:
	key as PacketId.public;
	value as boolean.public;


mapping in_packet_hash:
	key as PacketId.public;
	value as field.public;


mapping out_packets:
	key as PacketId.public;
	value as OutPacket.public;


mapping in_packet_attestors:
	key as PacketIdWithAttestor.public;
	value as boolean.public;


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
    input r0 as u8.public;
    input r1 as [address; 5u32].public;
    input r2 as address.public;
    gte r0 1u8 into r3;
    lte r0 5u8 into r4;
    and r3 r4 into r5;
    assert.eq r5 true;
    assert.neq r1[0u32] r1[1u32];
    assert.neq r1[0u32] r1[2u32];
    assert.neq r1[0u32] r1[3u32];
    assert.neq r1[0u32] r1[4u32];
    assert.neq r1[1u32] r1[2u32];
    assert.neq r1[1u32] r1[3u32];
    assert.neq r1[1u32] r1[4u32];
    assert.neq r1[2u32] r1[3u32];
    assert.neq r1[2u32] r1[4u32];
    assert.neq r1[3u32] r1[4u32];
    async initialize_tb r0 r1 r2 into r6;
    output r6 as token_bridge.aleo/initialize_tb.future;

finalize initialize_tb:
    input r0 as u8.public;
    input r1 as [address; 5u32].public;
    input r2 as address.public;
    contains attestor_settings[true] into r3;
    not r3 into r4;
    assert.eq r4 true;
    set r0 into attestor_settings[true];
    set 5u8 into attestor_settings[false];
    set true into attestors[r1[0u32]];
    set true into attestors[r1[1u32]];
    set true into attestors[r1[2u32]];
    set true into attestors[r1[3u32]];
    set true into attestors[r1[4u32]];
    set r2 into owner_TB[true];


function transfer_ownership_tb:
    input r0 as address.public;
    async transfer_ownership_tb self.caller r0 into r1;
    output r1 as token_bridge.aleo/transfer_ownership_tb.future;

finalize transfer_ownership_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    set r1 into owner_TB[true];


function update_attestor:
    input r0 as address.private;
    async update_attestor self.caller r0 into r1;
    output r1 as token_bridge.aleo/update_attestor.future;

finalize update_attestor:
    input r0 as address.public;
    input r1 as address.public;
    remove attestors[r0];
    set true into attestors[r1];


function add_attestor_tb:
    input r0 as address.public;
    input r1 as u8.private;
    async add_attestor_tb self.caller r0 r1 into r2;
    output r2 as token_bridge.aleo/add_attestor_tb.future;

finalize add_attestor_tb:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get owner_TB[true] into r3;
    assert.eq r0 r3;
    get attestor_settings[true] into r4;
    get attestor_settings[false] into r5;
    gte r2 r4 into r6;
    add r5 1u8 into r7;
    lte r2 r7 into r8;
    and r6 r8 into r9;
    assert.eq r9 true;
    contains attestors[r1] into r10;
    not r10 into r11;
    assert.eq r11 true;
    set true into attestors[r1];
    set r2 into attestor_settings[true];
    add r5 1u8 into r12;
    set r12 into attestor_settings[false];


function remove_attestor_tb:
    input r0 as address.public;
    input r1 as u8.private;
    async remove_attestor_tb self.caller r0 r1 into r2;
    output r2 as token_bridge.aleo/remove_attestor_tb.future;

finalize remove_attestor_tb:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get owner_TB[true] into r3;
    assert.eq r0 r3;
    get attestor_settings[true] into r4;
    get attestor_settings[false] into r5;
    gte r2 1u8 into r6;
    lt r2 r5 into r7;
    and r6 r7 into r8;
    assert.eq r8 true;
    gte r5 2u8 into r9;
    assert.eq r9 true;
    remove attestors[r1];
    set r2 into attestor_settings[true];
    sub r5 1u8 into r10;
    set r10 into attestor_settings[false];


function update_threshold_tb:
    input r0 as u8.public;
    gte r0 1u8 into r1;
    assert.eq r1 true;
    async update_threshold_tb self.caller r0 into r2;
    output r2 as token_bridge.aleo/update_threshold_tb.future;

finalize update_threshold_tb:
    input r0 as address.public;
    input r1 as u8.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    get attestor_settings[false] into r3;
    gte r1 1u8 into r4;
    lte r1 r3 into r5;
    and r4 r5 into r6;
    assert.eq r6 true;
    set r1 into attestor_settings[true];


function enable_chain_tb:
    input r0 as u128.public;
    async enable_chain_tb self.caller r0 into r1;
    output r1 as token_bridge.aleo/enable_chain_tb.future;

finalize enable_chain_tb:
    input r0 as address.public;
    input r1 as u128.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    set true into supported_chains[r1];


function disable_chain_tb:
    input r0 as u128.public;
    async disable_chain_tb self.caller r0 into r1;
    output r1 as token_bridge.aleo/disable_chain_tb.future;

finalize disable_chain_tb:
    input r0 as address.public;
    input r1 as u128.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    remove supported_chains[r1];


function enable_service_tb:
    input r0 as address.public;
    async enable_service_tb self.caller r0 into r1;
    output r1 as token_bridge.aleo/enable_service_tb.future;

finalize enable_service_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    set true into supported_services[r1];


function disable_service_tb:
    input r0 as address.public;
    async disable_service_tb self.caller r0 into r1;
    output r1 as token_bridge.aleo/disable_service_tb.future;

finalize disable_service_tb:
    input r0 as address.public;
    input r1 as address.public;
    get owner_TB[true] into r2;
    assert.eq r0 r2;
    remove supported_services[r1];


function publish:
    input r0 as u128.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 32u32].public;
    input r3 as address.public;
    input r4 as [u8; 32u32].public;
    input r5 as u128.public;
    assert.neq self.signer self.caller;
    async publish 6694886634401u128 self.caller r0 r1 r2 r3 r4 r5 into r6;
    output r6 as token_bridge.aleo/publish.future;

finalize publish:
    input r0 as u128.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as [u8; 32u32].public;
    input r4 as [u8; 32u32].public;
    input r5 as address.public;
    input r6 as [u8; 32u32].public;
    input r7 as u128.public;
    cast r0 r1 into r8 as AleoProgram;
    get supported_chains[r2] into r9;
    assert.eq r9 true;
    get supported_services[r8.addr] into r10;
    assert.eq r10 true;
    get.or_use sequences[r2] 1u64 into r11;
    get.or_use sequences[6694886634401u128] 1u64 into r12;
    cast r2 r3 into r13 as ForeignContract;
    cast r4 r5 r6 r7 into r14 as MsgTokenSend;
    cast 0u8 r11 r8 r13 r14 block.height into r15 as OutPacket;
    add r11 1u64 into r16;
    set r16 into sequences[r2];
    add r12 1u64 into r17;
    set r17 into sequences[r0];
    cast r2 r11 into r18 as PacketId;
    set r15 into out_packets[r18];


function attest:
    input r0 as InPacketFull.public;
    input r1 as boolean.public;
    hash.bhp256 r0.message into r2 as field;
    cast r0.version r0.sequence r0.source r0.destination r2 r0.height into r3 as InPacket;
    hash.bhp256 r3 into r4 as field;
    cast r0.source.chain_id r0.sequence self.caller into r5 as PacketIdWithAttestor;
    cast r4 r1 into r6 as InPacketFullScreeningKey;
    hash.bhp256 r6 into r7 as field;
    async attest r0.source.chain_id r0.sequence r7 self.caller r1 r5 r0 into r8;
    output r8 as token_bridge.aleo/attest.future;

finalize attest:
    input r0 as u128.public;
    input r1 as u64.public;
    input r2 as field.public;
    input r3 as address.public;
    input r4 as boolean.public;
    input r5 as PacketIdWithAttestor.public;
    input r6 as InPacketFull.public;
    assert.eq r6.destination.chain_id 6694886634401u128;
    get supported_chains[r6.source.chain_id] into r7;
    assert.eq r7 true;
    get attestors[r3] into r8;
    assert.eq r8 true;
    contains in_packet_attestors[r5] into r9;
    not r9 into r10;
    assert.eq r10 true;
    set r4 into in_packet_attestors[r5];
    get.or_use in_packet_attestations[r2] 0u8 into r11;
    add r11 1u8 into r12;
    set r12 into in_packet_attestations[r2];
    get attestor_settings[true] into r13;
    cast r0 r1 into r14 as PacketId;
    contains in_packet_hash[r14] into r15;
    not r15 into r16;
    add r11 1u8 into r17;
    gte r17 r13 into r18;
    and r16 r18 into r19;
    set r2 into in_packet_hash[r14];
    set false into in_packet_consumed[r14];


function consume:
    input r0 as u128.public;
    input r1 as [u8; 32u32].public;
    input r2 as address.public;
    input r3 as [u8; 32u32].public;
    input r4 as address.public;
    input r5 as address.public;
    input r6 as u128.public;
    input r7 as u64.public;
    input r8 as u32.public;
    assert.neq self.signer self.caller;
    cast r0 r1 into r9 as ForeignContract;
    cast 6694886634401u128 self.caller into r10 as AleoProgram;
    cast r2 r3 r4 r6 into r11 as MsgTokenReceive;
    hash.bhp256 r11 into r12 as field;
    cast 0u8 r7 r9 r10 r12 r8 into r13 as InPacket;
    hash.bhp256 r13 into r14 as field;
    is.eq r4 r5 into r15;
    cast r14 r15 into r16 as InPacketFullScreeningKey;
    hash.bhp256 r16 into r17 as field;
    async consume self.caller r0 r7 r17 into r18;
    output r18 as token_bridge.aleo/consume.future;

finalize consume:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as u64.public;
    input r3 as field.public;
    get supported_services[r0] into r4;
    assert.eq r4 true;
    get attestor_settings[true] into r5;
    get in_packet_attestations[r3] into r6;
    gte r6 r5 into r7;
    assert.eq r7 true;
    cast r1 r2 into r8 as PacketId;
    get in_packet_hash[r8] into r9;
    assert.eq r9 r3;
    get in_packet_consumed[r8] into r10;
    not r10 into r11;
    assert.eq r11 true;
    set true into in_packet_consumed[r8];
