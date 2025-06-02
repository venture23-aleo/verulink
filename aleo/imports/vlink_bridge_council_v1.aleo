import vlink_council_v1.aleo;
import vlink_token_bridge_v1.aleo;

program vlink_bridge_council_v1.aleo;

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

struct TbTransferOwnership:
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

struct TbPause:
    id as u32;

struct TbUnpause:
    id as u32;

function tb_transfer_ownership:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TbTransferOwnership;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_bridge_v1.aleo/transfer_ownership_tb r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async tb_transfer_ownership r5 r6 into r7;
    output r7 as vlink_bridge_council_v1.aleo/tb_transfer_ownership.future;

finalize tb_transfer_ownership:
    input r0 as vlink_token_bridge_v1.aleo/transfer_ownership_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_add_attestor:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as TbAddAttestor;
    hash.bhp256 r4 into r5 as field;
    call vlink_token_bridge_v1.aleo/add_attestor_tb r1 r2 into r6;
    call vlink_council_v1.aleo/external_execute r0 r5 r3 into r7;
    async tb_add_attestor r6 r7 into r8;
    output r8 as vlink_bridge_council_v1.aleo/tb_add_attestor.future;

finalize tb_add_attestor:
    input r0 as vlink_token_bridge_v1.aleo/add_attestor_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_remove_attestor:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u8.public;
    input r3 as [address; 5u32].public;
    cast r0 r1 r2 into r4 as TbRemoveAttestor;
    hash.bhp256 r4 into r5 as field;
    call vlink_token_bridge_v1.aleo/remove_attestor_tb r1 r2 into r6;
    call vlink_council_v1.aleo/external_execute r0 r5 r3 into r7;
    async tb_remove_attestor r6 r7 into r8;
    output r8 as vlink_bridge_council_v1.aleo/tb_remove_attestor.future;

finalize tb_remove_attestor:
    input r0 as vlink_token_bridge_v1.aleo/remove_attestor_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_update_threshold:
    input r0 as u32.public;
    input r1 as u8.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TbUpdateThreshold;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_bridge_v1.aleo/update_threshold_tb r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async tb_update_threshold r5 r6 into r7;
    output r7 as vlink_bridge_council_v1.aleo/tb_update_threshold.future;

finalize tb_update_threshold:
    input r0 as vlink_token_bridge_v1.aleo/update_threshold_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_add_chain:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TbAddChain;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_bridge_v1.aleo/add_chain_tb r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async tb_add_chain r5 r6 into r7;
    output r7 as vlink_bridge_council_v1.aleo/tb_add_chain.future;

finalize tb_add_chain:
    input r0 as vlink_token_bridge_v1.aleo/add_chain_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_remove_chain:
    input r0 as u32.public;
    input r1 as u128.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TbRemoveChain;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_bridge_v1.aleo/remove_chain_tb r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async tb_remove_chain r5 r6 into r7;
    output r7 as vlink_bridge_council_v1.aleo/tb_remove_chain.future;

finalize tb_remove_chain:
    input r0 as vlink_token_bridge_v1.aleo/remove_chain_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_add_service:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TbAddService;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_bridge_v1.aleo/add_service_tb r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async tb_add_service r5 r6 into r7;
    output r7 as vlink_bridge_council_v1.aleo/tb_add_service.future;

finalize tb_add_service:
    input r0 as vlink_token_bridge_v1.aleo/add_service_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_remove_service:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as [address; 5u32].public;
    cast r0 r1 into r3 as TbRemoveService;
    hash.bhp256 r3 into r4 as field;
    call vlink_token_bridge_v1.aleo/remove_service_tb r1 into r5;
    call vlink_council_v1.aleo/external_execute r0 r4 r2 into r6;
    async tb_remove_service r5 r6 into r7;
    output r7 as vlink_bridge_council_v1.aleo/tb_remove_service.future;

finalize tb_remove_service:
    input r0 as vlink_token_bridge_v1.aleo/remove_service_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_pause:
    input r0 as u32.public;
    input r1 as [address; 5u32].public;
    cast r0 into r2 as TbPause;
    hash.bhp256 r2 into r3 as field;
    call vlink_token_bridge_v1.aleo/pause_tb into r4;
    call vlink_council_v1.aleo/external_execute r0 r3 r1 into r5;
    async tb_pause r4 r5 into r6;
    output r6 as vlink_bridge_council_v1.aleo/tb_pause.future;

finalize tb_pause:
    input r0 as vlink_token_bridge_v1.aleo/pause_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;

function tb_unpause:
    input r0 as u32.public;
    input r1 as [address; 5u32].public;
    cast r0 into r2 as TbUnpause;
    hash.bhp256 r2 into r3 as field;
    call vlink_token_bridge_v1.aleo/unpause_tb into r4;
    call vlink_council_v1.aleo/external_execute r0 r3 r1 into r5;
    async tb_unpause r4 r5 into r6;
    output r6 as vlink_bridge_council_v1.aleo/tb_unpause.future;

finalize tb_unpause:
    input r0 as vlink_token_bridge_v1.aleo/unpause_tb.future;
    input r1 as vlink_council_v1.aleo/external_execute.future;
    await r0;
    await r1;