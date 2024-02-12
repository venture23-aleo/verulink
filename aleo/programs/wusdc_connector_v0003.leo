import wusdc_token_v0002.aleo;
import wusdc_holding_v0002.aleo;
import token_service_v0002.aleo;
import council_v0002.aleo;

program wusdc_connector_v0003.aleo {

    // wusdc_token_v0002.aleo as address
    const WUSDC_TOKEN: address = aleo1s7ewgjkuhxr7a9u6vjmst4khchkggxemqazrs8vy54x3prt74upqy6aveq;

    // wusdc_holding_v0002.aleo as address
    const WUSDC_HOLDING: address = aleo1kcz2af0a3ezjh5hcqehhmjx0sv5cq8c40kwm835z9kc333a69sqq0fhfg3;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_wusdc() {
        wusdc_token_v0002.aleo/initialize_token(name(), symbol(), decimals());
        wusdc_holding_v0002.aleo/initialize_holding();
    }

    /// Receive Wrapped USDC
    ///
    /// # Arguments:
    /// * sender: [u8; 32] - Address of the sender on source chain (Ethereum)
    /// * receiver: address - Receiver on the packet in Aleo
    /// * amount: u128 - Amount to be minted on Aleo
    /// * sequence: u32 - Sequence no for this chain on the source chain
    /// * height: u32 - Height of the source chain where the packet originated
    /// * signers: [address; 5] - Addresses of the attestors who have signed the packet
    /// * signs: [signature; 5] - Signatures of the attestors after signing the packet
    transition wusdc_receive(
        public sender: [u8; 32], 
        public receiver: address, 
        public amount: u128, 
        public sequence: u64, 
        public height: u64, 
        public signers: [address; 5], 
        public signs: [signature; 5]
    ) {

        let screening_passed: bool = token_service_v0002.aleo/token_receive(
            origin_chain_id(), 
            origin_token_service_address(), 
            origin_token_address(), 
            WUSDC_TOKEN, 
            sender, 
            receiver, 
            amount, 
            sequence, 
            height, 
            signers, 
            signs
        );

        let actual_receiver: address = receiver;
        let held_amount: u128 = 0u128;

        if (!screening_passed) {
            actual_receiver = WUSDC_HOLDING;
            held_amount = amount;
        }

        wusdc_token_v0002.aleo/mint_public(actual_receiver, amount);

        wusdc_holding_v0002.aleo/hold_fund(receiver, held_amount);

    }

    transition wusdc_send(public receiver: [u8; 32], public amount: u128) {

        wusdc_token_v0002.aleo/burn_public(self.caller, amount);

        token_service_v0002.aleo/token_send(
            WUSDC_TOKEN, 
            self.caller, 
            receiver, 
            amount, 
            origin_chain_id(), 
            origin_token_address(), 
            origin_token_service_address()
        );

    }

    ///////////////////////////////
    ///// Update Connector ////////
    ///////////////////////////////

    /// Update the existing connector program
    /// Can only be called if proposal with enough votes exist on council program
    transition update(public proposal_id: u32, public new_connector: address) {
        council_v0002.aleo/connector_update(proposal_id, WUSDC_TOKEN, new_connector);
        wusdc_token_v0002.aleo/transfer_ownership_token(new_connector);
        wusdc_holding_v0002.aleo/transfer_ownership_holding(new_connector);
        token_service_v0002.aleo/update_connector_ts(WUSDC_TOKEN, new_connector);
    }


    /// Release fund from holding program
    /// Can only be called if proposal with enough votes exist on council program
    transition wusdc_release(public proposal_id: u32, public receiver: address, public amount: u128) {
        council_v0002.aleo/holding_release(proposal_id, WUSDC_TOKEN, receiver, amount);
        wusdc_holding_v0002.aleo/release_fund(receiver, amount);
    }


    // Chain Id of the network
    // Chain Id is generated as {network_type}:{chain_id} where `network_id` is represented as ASCII and `chain_id` is a number, `:` is separator
    // For Ethereum Sepolia testnet, chain_id: `eth:11155111` -> 28556963657430695
    inline origin_chain_id() -> u128 {
        return 28556963657430695u128;
    }

    // Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formatted as following:
    inline origin_token_address() -> [u8; 32] {
        return [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,211u8,66u8,192u8,49u8,69u8,60u8,102u8,166u8,214u8,194u8,162u8,61u8,109u8,168u8,108u8,48u8,173u8,160u8,140u8,121u8];
    }

    // Token Service Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formatted as following:
    inline origin_token_service_address() -> [u8; 32] {
        return [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,254u8,172u8,15u8,211u8,35u8,103u8,218u8,148u8,68u8,152u8,179u8,159u8,61u8,30u8,189u8,100u8,204u8,136u8,225u8,60u8];
    }

    // Name of the token
    // Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
    // Example: `USD Coin` is represented as following (hex):
    // [55 53 44 20 43 6f 69 6e 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00]
    // Storing in const? Error [ETYC0372080]: The value of a const declaration must be a literal
    inline name() -> [u8; 32] {
        return [85u8,83u8,68u8,32u8,67u8,111u8,105u8,110u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8];
    }

    // Symbol of the token
    // Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
    // Example: `USDC` is represented as following (hex):
    // [55 53 44 43 00 00 00 00 00 00 00 00 00 00 00 00] 
    inline symbol() -> [u8; 16] {
        return [85u8,83u8,68u8,67u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8];
    }

    // Decimals of the token
    inline decimals() -> u8 {
        return 6u8;
    }



}