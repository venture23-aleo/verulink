import token_bridge_v0001.aleo;
import token_service_v0001.aleo;
import council_v0001.aleo;
import wusdc_token_v0001.aleo;
import wusdc_holding_v0001.aleo;
program wusdc_connector_v0001.aleo;


































struct UpdateConnector:
    new_connector as address;

struct WUsdcRelease:
    receiver as address;
    amount as u128;








function initialize_wusdc:
    cast  85u8 83u8 68u8 32u8 67u8 111u8 105u8 110u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 into r0 as [u8; 32u32];
    cast  85u8 83u8 68u8 67u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 into r1 as [u8; 16u32];
    call wusdc_token_v0001.aleo/initialize_token r0 r1 6u8 into r2;
    call wusdc_holding_v0001.aleo/initialize_holding into r3;
    async initialize_wusdc r2 r3 into r4;
    output r4 as wusdc_connector_v0001.aleo/initialize_wusdc.future;

finalize initialize_wusdc:
    input r0 as wusdc_token_v0001.aleo/initialize_token.future;
    input r1 as wusdc_holding_v0001.aleo/initialize_holding.future;
    await r0;
    await r1;








function wusdc_receive:
    input r0 as [u8; 32u32].public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as u64.public;
    input r5 as u32.public;
    input r6 as [address; 5u32].public;
    input r7 as [signature; 5u32].public;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r8 as [u8; 32u32];
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r9 as [u8; 32u32];
    call token_service_v0001.aleo/token_receive 28556963657430695u128 r8 r9 aleo1h2hds9hqjjp9swqwvmy0kdarg72myk307kszu2jga7efd04afqfqmcwl4j r0 r1 r2 r3 r4 r5 r6 r7 into r10;
    call wusdc_token_v0001.aleo/mint_public r2 r3 into r11;
    is.eq r1 r2 into r12;
    not r12 into r13;
    not r13 into r14;
    is.eq r2 aleo1qdd7ly83nst3fte50325sxzv9jfwr2sh3fn3gl5tr793djuxgsxsnf37q8 into r15;
    or r14 r15 into r16;
    assert.eq r16 true;
    call wusdc_holding_v0001.aleo/hold_fund r1 r3 into r17;
    async wusdc_receive r10 r11 r17 into r18;
    output r18 as wusdc_connector_v0001.aleo/wusdc_receive.future;

finalize wusdc_receive:
    input r0 as token_service_v0001.aleo/token_receive.future;
    input r1 as wusdc_token_v0001.aleo/mint_public.future;
    input r2 as wusdc_holding_v0001.aleo/hold_fund.future;
    await r0;
    await r1;
    await r2;


function wusdc_send:
    input r0 as [u8; 32u32].public;
    input r1 as u128.public;
    call wusdc_token_v0001.aleo/burn_public self.caller r1 into r2;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r3 as [u8; 32u32];
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r4 as [u8; 32u32];
    call token_service_v0001.aleo/token_send aleo1h2hds9hqjjp9swqwvmy0kdarg72myk307kszu2jga7efd04afqfqmcwl4j self.caller r0 r1 28556963657430695u128 r3 r4 into r5;
    async wusdc_send r2 r5 into r6;
    output r6 as wusdc_connector_v0001.aleo/wusdc_send.future;

finalize wusdc_send:
    input r0 as wusdc_token_v0001.aleo/burn_public.future;
    input r1 as token_service_v0001.aleo/token_send.future;
    await r0;
    await r1;


function update_wusdc_connector:
    input r0 as u32.public;
    input r1 as address.public;
    cast r1 into r2 as UpdateConnector;
    hash.bhp256 r2 into r3 as field;
    call council_v0001.aleo/external_execute r0 r3 into r4;
    call wusdc_token_v0001.aleo/transfer_ownership_token r1 into r5;
    call wusdc_holding_v0001.aleo/transfer_ownership_holding r1 into r6;
    call token_service_v0001.aleo/update_connector_ts aleo1h2hds9hqjjp9swqwvmy0kdarg72myk307kszu2jga7efd04afqfqmcwl4j r1 into r7;
    async update_wusdc_connector r4 r5 r6 r7 into r8;
    output r8 as wusdc_connector_v0001.aleo/update_wusdc_connector.future;

finalize update_wusdc_connector:
    input r0 as council_v0001.aleo/external_execute.future;
    input r1 as wusdc_token_v0001.aleo/transfer_ownership_token.future;
    input r2 as wusdc_holding_v0001.aleo/transfer_ownership_holding.future;
    input r3 as token_service_v0001.aleo/update_connector_ts.future;
    await r0;
    await r1;
    await r2;
    await r3;


function wusdc_release:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u128.public;
    cast r1 r2 into r3 as WUsdcRelease;
    hash.bhp256 r3 into r4 as field;
    call council_v0001.aleo/external_execute r0 r4 into r5;
    call wusdc_holding_v0001.aleo/release_fund r1 r2 into r6;
    async wusdc_release r5 r6 into r7;
    output r7 as wusdc_connector_v0001.aleo/wusdc_release.future;

finalize wusdc_release:
    input r0 as council_v0001.aleo/external_execute.future;
    input r1 as wusdc_holding_v0001.aleo/release_fund.future;
    await r0;
    await r1;
