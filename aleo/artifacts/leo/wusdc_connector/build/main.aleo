import token_bridge.aleo;
import token_service.aleo;
import council.aleo;
import wusdc_token.aleo;
import wusdc_holding.aleo;
program wusdc_connector.aleo;




































struct UpdateGovernance:
    new_governance as address;

struct WUsdcRelease:
    receiver as address;
    amount as u64;


function initialize_wusdc:
    call wusdc_token.aleo/initialize_wusdc_token into r0;
    call wusdc_holding.aleo/initialize_wusdc_holding into r1;
    async initialize_wusdc r0 r1 into r2;
    output r2 as wusdc_connector.aleo/initialize_wusdc.future;

finalize initialize_wusdc:
    input r0 as wusdc_token.aleo/initialize_wusdc_token.future;
    input r1 as wusdc_holding.aleo/initialize_wusdc_holding.future;
    await r0;
    await r1;


function update_wusdc_governance:
    input r0 as u32.public;
    input r1 as address.public;
    cast r1 into r2 as UpdateGovernance;
    hash.bhp256 r2 into r3 as field;
    call council.aleo/external_execute r0 r3 into r4;
    call wusdc_token.aleo/update_governance_wusdc_token r1 into r5;
    call wusdc_holding.aleo/update_governance_wusdc_holding r1 into r6;
    async update_wusdc_governance r4 r5 r6 into r7;
    output r7 as wusdc_connector.aleo/update_wusdc_governance.future;

finalize update_wusdc_governance:
    input r0 as council.aleo/external_execute.future;
    input r1 as wusdc_token.aleo/update_governance_wusdc_token.future;
    input r2 as wusdc_holding.aleo/update_governance_wusdc_holding.future;
    await r0;
    await r1;
    await r2;








function wusdc_receive:
    input r0 as [u8; 32u32].public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    input r4 as u32.public;
    input r5 as u32.public;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r6 as [u8; 32u32];
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r7 as [u8; 32u32];
    call token_service.aleo/token_receive 27236160417u128 r6 r7 aleo1qg0azcck30ys6598lpmfx9xpfazj9w7ma973g7l5p7eka0p4jq9s2c3vk2 r0 r1 r2 r3 r4 r5 into r8;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r9 as [u8; 32u32];
    call wusdc_token.aleo/mint_public r2 r3 27236160417u128 r9 into r10;
    is.eq r1 r2 into r11;
    not r11 into r12;
    call wusdc_holding.aleo/hold_fund r1 r3 into r13;
    async wusdc_receive r8 r10 r13 into r14;
    output r14 as wusdc_connector.aleo/wusdc_receive.future;

finalize wusdc_receive:
    input r0 as token_service.aleo/token_receive.future;
    input r1 as wusdc_token.aleo/mint_public.future;
    input r2 as wusdc_holding.aleo/hold_fund.future;
    await r0;
    await r1;
    await r2;


function wusdc_send:
    input r0 as [u8; 32u32].public;
    input r1 as u64.public;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r2 as [u8; 32u32];
    call wusdc_token.aleo/burn_public self.caller r1 27236160417u128 r2 into r3;
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r4 as [u8; 32u32];
    cast  0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 160u8 184u8 105u8 145u8 198u8 33u8 139u8 54u8 193u8 209u8 157u8 74u8 46u8 158u8 176u8 206u8 54u8 6u8 235u8 72u8 into r5 as [u8; 32u32];
    call token_service.aleo/token_send aleo1qg0azcck30ys6598lpmfx9xpfazj9w7ma973g7l5p7eka0p4jq9s2c3vk2 r0 r1 27236160417u128 r4 r5 into r6;
    async wusdc_send r3 r6 into r7;
    output r7 as wusdc_connector.aleo/wusdc_send.future;

finalize wusdc_send:
    input r0 as wusdc_token.aleo/burn_public.future;
    input r1 as token_service.aleo/token_send.future;
    await r0;
    await r1;


function wusdc_release:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r1 r2 into r3 as WUsdcRelease;
    hash.bhp256 r3 into r4 as field;
    call council.aleo/external_execute r0 r4 into r5;
    call wusdc_holding.aleo/release_fund r1 r2 into r6;
    async wusdc_release r5 r6 into r7;
    output r7 as wusdc_connector.aleo/wusdc_release.future;

finalize wusdc_release:
    input r0 as council.aleo/external_execute.future;
    input r1 as wusdc_holding.aleo/release_fund.future;
    await r0;
    await r1;
