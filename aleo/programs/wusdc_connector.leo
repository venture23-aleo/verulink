import wusdc_token.aleo;
import wusdc_holding.aleo;
import token_service.aleo;
import council.aleo;

program wusdc_connector.aleo {

    const WUSDC_TOKEN: address = aleo1qg0azcck30ys6598lpmfx9xpfazj9w7ma973g7l5p7eka0p4jq9s2c3vk2;
    const WUSDC_HOLDING: address = aleo16dyvhwsrfmx5eru9kffhn6df8cr3v3h06apqzsrphl6h03wa2crq43djr6;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_wusdc() {
        wusdc_token.aleo/initialize_wusdc_token();
        wusdc_holding.aleo/initialize_wusdc_holding();
    }

    /// Receive Wrapped USDC
    ///
    /// # Arguments:
    /// * sender: [u8; 32] - Address of the sender on source chain (Ethereum)
    /// * receiver: address - Receiver on the packet in Aleo
    /// * actual_receiver: address - Address where the token is minted on Aleo
    /// * amount: u128 - Amount to be minted on Aleo
    /// * `sequence`: u32 - Sequence no for this chain on the source chain
    /// * `height`: u32 - Height of the source chain where the packet originated
    transition wusdc_receive(public sender: [u8; 32], public receiver: address, public actual_receiver: address, public amount: u128, public sequence: u64, public height: u32) {

        token_service.aleo/token_receive(origin_chain_id(), origin_token_service_address(), origin_usdc_address(), WUSDC_TOKEN, sender, receiver, actual_receiver, amount, sequence, height);

        wusdc_token.aleo/mint_public(actual_receiver, amount);

        // If the packet did not pass the screening, the `actual_receiver` must be the holding program
        // In case the packet passed the screening, the receiver and the actual receiver are the same address.
        // And additional checks are not required
        let check_required: bool = !(receiver == actual_receiver);

        if check_required {
            assert_eq(actual_receiver, WUSDC_HOLDING);
            wusdc_holding.aleo/hold_fund(receiver, amount);
        }

    }

    transition wusdc_send(public receiver: [u8; 32], public amount: u128) {

        wusdc_token.aleo/burn_public(self.caller, amount);

        token_service.aleo/token_send(WUSDC_TOKEN, receiver, amount, origin_chain_id(), origin_usdc_address(), origin_token_service_address());

    }

    ///////////////////////////////
    ///// Update Connector ////////
    ///////////////////////////////

    /// Update the existing connector program
    /// Can only be called if proposal with enough votes exist on council program
    struct UpdateConnector {
        new_connector: address
    }
    transition update_wusdc_connector(public proposal_id: u32, public new_connector: address) {
        let update_connector: UpdateConnector = UpdateConnector {
            new_connector
        };
        council.aleo/external_execute(proposal_id, BHP256::hash_to_field(update_connector));
        wusdc_token.aleo/transfer_ownership_wusdc_token(new_connector);
        wusdc_holding.aleo/transfer_ownership_wusdc_holdin(new_connector);
    }


    /// Release fund from holding program
    /// Can only be called if proposal with enough votes exist on council program
    struct WUsdcRelease {
        receiver: address,
        amount: u128
    }

    transition wusdc_release(public proposal_id: u32, public receiver: address, public amount: u128) {
        let releaseProposal: WUsdcRelease = WUsdcRelease {
            receiver,
            amount
        };
        council.aleo/external_execute(proposal_id, BHP256::hash_to_field(releaseProposal));
        wusdc_holding.aleo/release_fund(receiver, amount);
    }


    // Chain Id of the network
    // Chain Id is generated as {network_type}:{chain_id} where `network_id` is represented as ASCII and `chain_id` is a number, `:` is separator
    // For Ethereum mainnet, chain_id: `evm:1` -> 27236160417
    inline origin_chain_id() -> u128 {
        return 27236160417u128;
    }

    // Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formated as following:
    inline origin_usdc_address() -> [u8; 32] {
        return [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,160u8,184u8,105u8,145u8,198u8,33u8,139u8,54u8,193u8,209u8,157u8,74u8,46u8,158u8,176u8,206u8,54u8,6u8,235u8,72u8];
    }

    // Token Service Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formated as following:
    inline origin_token_service_address() -> [u8; 32] {
        return [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,160u8,184u8,105u8,145u8,198u8,33u8,139u8,54u8,193u8,209u8,157u8,74u8,46u8,158u8,176u8,206u8,54u8,6u8,235u8,72u8];
    }


}