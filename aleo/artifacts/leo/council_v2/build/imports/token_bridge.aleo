program token_bridge.aleo;

struct AleoProgram:
    chain_id as u32;
    addr as address;

struct ForeignContract:
    chain_id as u32;
    addr as [u8; 32u32];

struct MsgTokenReceive:
    token as address;
    sender as [u8; 32u32];
    receiver as address;
    amount as u64;

struct MsgTokenSend:
    token as [u8; 32u32];
    sender as address;
    receiver as [u8; 32u32];
    amount as u64;

struct InPacketFull:
    version as u8;
    sequence as u32;
    source as ForeignContract;
    destination as AleoProgram;
    message as MsgTokenReceive;
    height as u32;

struct InPacket:
    version as u8;
    sequence as u32;
    source as ForeignContract;
    destination as AleoProgram;
    msg_hash as field;
    height as u32;

struct OutPacket:
    version as u8;
    sequence as u32;
    source as AleoProgram;
    destination as ForeignContract;
    message as MsgTokenSend;
    height as u32;

struct PacketId:
    chain_id as u32;
    sequence as u32;

struct InPacketFullAttestorKey:
    packet_hash as field;
    attestor as address;

struct InPacketFullScreeningKey:
    packet_hash as field;
    screening_passed as boolean;


mapping bridge_settings:
	key as u8.public;
	value as u8.public;


mapping governance_TB:
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


mapping in_packet_signs:
	key as field.public;
	value as boolean.public;


mapping supported_chains:
	key as u32.public;
	value as boolean.public;


mapping supported_services:
	key as address.public;
	value as boolean.public;


mapping sequences:
	key as u32.public;
	value as u32.public;





function bridge_initialize:
    input r0 as u8.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as address.public;
    input r6 as address.public;
    async bridge_initialize r0 r1 r2 r3 r4 r5 r6 into r7;
    output r7 as token_bridge.aleo/bridge_initialize.future;

finalize bridge_initialize:
    input r0 as u8.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as address.public;
    input r6 as address.public;
    contains bridge_settings[0u8] into r7;
    not r7 into r8;
    assert.eq r8 true;
    set r0 into bridge_settings[0u8];
    set true into attestors[r1];
    set true into attestors[r2];
    set true into attestors[r3];
    set true into attestors[r4];
    set true into attestors[r5];
    set r6 into governance_TB[true];


function update_bridge_governance:
    input r0 as address.public;
    async update_bridge_governance self.caller r0 into r1;
    output r1 as token_bridge.aleo/update_bridge_governance.future;

finalize update_bridge_governance:
    input r0 as address.public;
    input r1 as address.public;
    get governance_TB[true] into r2;
    assert.eq r0 r2;
    set r1 into governance_TB[true];


function update_bridge_threshold:
    input r0 as u8.public;
    async update_bridge_threshold self.caller r0 into r1;
    output r1 as token_bridge.aleo/update_bridge_threshold.future;

finalize update_bridge_threshold:
    input r0 as address.public;
    input r1 as u8.public;
    get governance_TB[true] into r2;
    assert.eq r0 r2;
    set r1 into bridge_settings[0u8];


function add_service:
    input r0 as address.public;
    async add_service self.caller r0 into r1;
    output r1 as token_bridge.aleo/add_service.future;

finalize add_service:
    input r0 as address.public;
    input r1 as address.public;
    get governance_TB[true] into r2;
    assert.eq r0 r2;
    set true into supported_services[r1];


function remove_service:
    input r0 as address.public;
    async remove_service self.caller r0 into r1;
    output r1 as token_bridge.aleo/remove_service.future;

finalize remove_service:
    input r0 as address.public;
    input r1 as address.public;
    get governance_TB[true] into r2;
    assert.eq r0 r2;
    remove supported_services[r1];


function add_attestor:
    input r0 as address.public;
    input r1 as u8.private;
    async add_attestor self.caller r0 r1 into r2;
    output r2 as token_bridge.aleo/add_attestor.future;

finalize add_attestor:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get governance_TB[true] into r3;
    assert.eq r0 r3;
    set true into attestors[r1];
    set r2 into bridge_settings[0u8];


function remove_attestor:
    input r0 as address.public;
    input r1 as u8.private;
    async remove_attestor self.caller r0 r1 into r2;
    output r2 as token_bridge.aleo/remove_attestor.future;

finalize remove_attestor:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u8.public;
    get governance_TB[true] into r3;
    assert.eq r0 r3;
    remove attestors[r1];
    set r2 into bridge_settings[0u8];


function approve_chain:
    input r0 as u32.public;
    async approve_chain self.caller r0 into r1;
    output r1 as token_bridge.aleo/approve_chain.future;

finalize approve_chain:
    input r0 as address.public;
    input r1 as u32.public;
    get governance_TB[true] into r2;
    assert.eq r0 r2;
    set true into supported_chains[r1];


function disapprove_chain:
    input r0 as u32.public;
    async disapprove_chain self.caller r0 into r1;
    output r1 as token_bridge.aleo/disapprove_chain.future;

finalize disapprove_chain:
    input r0 as address.public;
    input r1 as u32.public;
    get governance_TB[true] into r2;
    assert.eq r0 r2;
    remove supported_chains[r1];


function publish:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    input r2 as [u8; 32u32].public;
    input r3 as address.public;
    input r4 as [u8; 32u32].public;
    input r5 as u64.public;
    assert.neq self.signer self.caller;
    async publish 1u32 self.caller r0 r1 r2 r3 r4 r5 into r6;
    output r6 as token_bridge.aleo/publish.future;

finalize publish:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u32.public;
    input r3 as [u8; 32u32].public;
    input r4 as [u8; 32u32].public;
    input r5 as address.public;
    input r6 as [u8; 32u32].public;
    input r7 as u64.public;
    cast r0 r1 into r8 as AleoProgram;
    get supported_chains[r2] into r9;
    assert.eq r9 true;
    get supported_services[r8.addr] into r10;
    assert.eq r10 true;
    get.or_use sequences[r2] 1u32 into r11;
    get.or_use sequences[1u32] 1u32 into r12;
    cast r2 r3 into r13 as ForeignContract;
    cast r4 r5 r6 r7 into r14 as MsgTokenSend;
    cast 0u8 r11 r8 r13 r14 block.height into r15 as OutPacket;
    add r11 1u32 into r16;
    set r16 into sequences[r2];
    add r12 1u32 into r17;
    set r17 into sequences[r0];
    cast r2 r11 into r18 as PacketId;
    set r15 into out_packets[r18];


function attest:
    input r0 as InPacketFull.public;
    input r1 as boolean.public;
    hash.bhp256 r0.message into r2 as field;
    cast r0.version r0.sequence r0.source r0.destination r2 r0.height into r3 as InPacket;
    hash.bhp256 r3 into r4 as field;
    cast r4 self.caller into r5 as InPacketFullAttestorKey;
    hash.bhp256 r5 into r6 as field;
    cast r4 r1 into r7 as InPacketFullScreeningKey;
    hash.bhp256 r7 into r8 as field;
    async attest r0.source.chain_id r0.sequence r8 self.caller r6 r0 into r9;
    output r9 as token_bridge.aleo/attest.future;

finalize attest:
    input r0 as u32.public;
    input r1 as u32.public;
    input r2 as field.public;
    input r3 as address.public;
    input r4 as field.public;
    input r5 as InPacketFull.public;
    assert.eq r5.destination.chain_id 1u32;
    get supported_chains[r5.source.chain_id] into r6;
    assert.eq r6 true;
    get attestors[r3] into r7;
    assert.eq r7 true;
    contains in_packet_signs[r4] into r8;
    not r8 into r9;
    assert.eq r9 true;
    set true into in_packet_signs[r4];
    get.or_use in_packet_attestations[r2] 0u8 into r10;
    add r10 1u8 into r11;
    set r11 into in_packet_attestations[r2];
    get bridge_settings[0u8] into r12;
    cast r0 r1 into r13 as PacketId;
    contains in_packet_hash[r13] into r14;
    not r14 into r15;
    add r10 1u8 into r16;
    gte r16 r12 into r17;
    and r15 r17 into r18;
    set r2 into in_packet_hash[r13];
    set false into in_packet_consumed[r13];


function consume:
    input r0 as u32.public;
    input r1 as [u8; 32u32].public;
    input r2 as address.public;
    input r3 as [u8; 32u32].public;
    input r4 as address.public;
    input r5 as address.public;
    input r6 as u64.public;
    input r7 as u32.public;
    input r8 as u32.public;
    assert.neq self.signer self.caller;
    cast r0 r1 into r9 as ForeignContract;
    cast 1u32 self.caller into r10 as AleoProgram;
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
    input r1 as u32.public;
    input r2 as u32.public;
    input r3 as field.public;
    get supported_services[r0] into r4;
    assert.eq r4 true;
    get bridge_settings[0u8] into r5;
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
