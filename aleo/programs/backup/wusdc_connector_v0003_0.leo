import wusdc_token_v0003.aleo;
import wusdc_holding_v0003.aleo;
import token_service_v0003.aleo;
import council.aleo;

program wusdc_connector_v0003_0.aleo {

    // wusdc_token_v0003.aleo as address
    const WUSDC_TOKEN: address = aleo19q66g404mh2q57qvaa4qwujnfvujfv9rufc4pqfsqvvypjl7aqgsqr0p9s;

    // wusdc_holding_v0003.aleo as address
    const WUSDC_HOLDING: address = aleo1f4xc78ykumx4pac8hlnle66nxptux3pwm2q24fslvhns3wh4tqgsj8f7yu;

    // wusdc_connector_v0003_0.aleo as address
    const WUSDC_CONNECTOR: address = aleo1cxxz3y3pwqe3c9gggtc4f7l5hq93p6vcumzf7lfm3y3rxrpwhyzsup2jdk;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_wusdc() {
        wusdc_token_v0003.aleo/initialize_token( WUSDC_CONNECTOR );
        wusdc_holding_v0003.aleo/initialize_holding( WUSDC_CONNECTOR );
    }

    /// Receive Wrapped USDC
    ///
    /// # Arguments:
    /// * sender: [u8; 20] - Address of the sender on source chain (Ethereum)
    /// * receiver: address - Receiver on the packet in Aleo
    /// * amount: u128 - Amount to be minted on Aleo
    /// * sequence: u32 - Sequence no for this chain on the source chain
    /// * height: u32 - Height of the source chain where the packet originated
    /// * signers: [address; 5] - Addresses of the attestors who have signed the packet
    /// * signs: [signature; 5] - Signatures of the attestors after signing the packet
    transition wusdc_receive(
        public sender: [u8; 20], 
        public receiver: address, 
        public amount: u128, 
        public sequence: u64, 
        public height: u64, 
        public signers: [address; 5], 
        public signs: [signature; 5]
    ) {

        let screening_passed: bool = token_service_v0003.aleo/token_receive(
            origin_chain_id(), 
            origin_token_service_address(), 
            WUSDC_TOKEN, 
            pad_20_to_32(sender), 
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

        wusdc_token_v0003.aleo/mint_public(actual_receiver, amount);

        wusdc_holding_v0003.aleo/hold_fund(receiver, held_amount);

    }

    /// Send Wrapped USDC
    ///
    /// # Arguments:
    /// * receiver: [u8; 20] - Receiver on wusdc in Ethereum
    /// * amount: u128 - Amount to be burned on Aleo; unlocked on Ethereum
    transition wusdc_send(public receiver: [u8; 20], public amount: u128) {

        wusdc_token_v0003.aleo/burn_public(self.caller, amount);

        token_service_v0003.aleo/token_send(
            WUSDC_TOKEN, 
            self.caller, 
            pad_20_to_32(receiver) , 
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
    transition update(public proposal_id: u32, public new_connector: address, public voters: [address; 5]) {
        council.aleo/connector_update(proposal_id, WUSDC_TOKEN, new_connector, voters);
        wusdc_token_v0003.aleo/transfer_ownership_token(new_connector);
        wusdc_holding_v0003.aleo/transfer_ownership_holding(new_connector);
        token_service_v0003.aleo/update_connector_ts(WUSDC_TOKEN, new_connector);
    }


    /// Release fund from holding program
    /// Can only be called if proposal with enough votes exist on council program
    transition wusdc_release(public proposal_id: u32, public receiver: address, public amount: u128, public voters: [address; 5]) {
        council.aleo/holding_release(proposal_id, WUSDC_TOKEN, receiver, amount, voters);
        wusdc_holding_v0003.aleo/release_fund(receiver, amount);
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
        return [0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 211u8, 66u8, 192u8, 49u8, 69u8, 60u8, 102u8, 166u8, 214u8, 194u8, 162u8, 61u8, 109u8, 168u8, 108u8, 48u8, 173u8, 160u8, 140u8, 121u8];
    }

    // Token Service Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formatted as following:
    inline origin_token_service_address() -> [u8; 32] {
        return [0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 37u8, 138u8, 119u8, 59u8, 25u8, 252u8, 200u8, 149u8, 142u8, 12u8, 225u8, 177u8, 177u8, 60u8, 131u8, 10u8, 80u8, 186u8, 124u8, 17u8];
    }
    
    inline pad_20_to_32(unpadded: [u8; 20]) -> [u8; 32] {
        return [
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            unpadded[0u32],
            unpadded[1u32],
            unpadded[2u32],
            unpadded[3u32],
            unpadded[4u32],
            unpadded[5u32],
            unpadded[6u32],
            unpadded[7u32],
            unpadded[8u32],
            unpadded[9u32],
            unpadded[10u32],
            unpadded[11u32],
            unpadded[12u32],
            unpadded[13u32],
            unpadded[14u32],
            unpadded[15u32],
            unpadded[16u32],
            unpadded[17u32],
            unpadded[18u32],
            unpadded[19u32],
        ];
    }




}