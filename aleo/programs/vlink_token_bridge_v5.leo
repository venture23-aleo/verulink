// The 'bridge' program.
program vlink_token_bridge_v5.aleo {

    // Default Aleo Program
    struct AleoProgram {
        // Chain Id of Aleo Network
        chain_id: u128,
        // Program Address of the Service Program
        addr: address
    }

    // Contract on different (foreign) chain
    struct ForeignContract {
        // Chain Id of Other Network
        chain_id: u128,
        // Contract address of the service contract on other chain
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formatted as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        addr: [u8; 32]
    }

    struct OutTokenMessage {
        // Address of the sender on this chain
        sender_address: address,
        // Contract Address of the Asset on origin chain; Ex: USDC on Ethereum
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formatted as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        dest_token_address: [u8; 32],
        // Amount to unlock on origin chain
        amount: u128,
        // Address of the receiver on origin chain
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formatted as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        receiver_address: [u8; 32],
    }


    struct InTokenMessage {
        // Address of the sender on the origin chain
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formatted as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        sender_address: [u8; 32],
        // Program Address of the wrapped asset on Aleo; Ex: wUSDC
        dest_token_id: field,
        // Amount to mint on Aleo
        amount: u128,
        // Address of the receiver on Aleo
        receiver_address: address
    }


    struct OutPacket {
        // Packet versioning for future enhancements or changes
        version: u8,
        // Sequence no of the packet for destination chain
        sequence: u64,
        // Service Program where the packet originated
        source: AleoProgram,
        // Service Contract where the packet should be consumed
        destination: ForeignContract,
        // Hash of the message. Message can be found in service program
        message: OutTokenMessage,
        // Height where the packet is published
        height: u64
    }

    struct InPacket {
        // Packet versioning for future enhancements or changes
        version: u8,
        // Sequence no of the packet for this chain on source chain
        sequence: u64,
        // Service Contract where the packet originated
        source: ForeignContract,
        // Destination Program where the packet should be consumed
        destination: AleoProgram,
        // Full message token
        message: InTokenMessage,
        // Height on the source chain where the packet originated
        height: u64
    }


    struct PacketId {
        // Chain Id where the packet originated
        chain_id: u128,
        // Sequence no of when the packet emitted
        sequence: u64
    }

    struct InPacketWithScreening {
        // Hash of the InPacket
        packet_hash: field,
        // Screening result of the packet sender/receiver
        // If the screening_passed is false, it means that the fund of the packet must go to the holding program
        screening_passed: bool
    }

    /// Stores the threshold and the total attestors
    /// key = 1u8 : returns the threshold attestations for `InPacket`
    /// key = 2u8 : returns the total attestors
    /// key = 3u8 : returns 0u8 if the bridge is paused, 1u8 otherwise
    mapping bridge_settings: u8 => u8;

    /// Stores the owner of this program
    /// The owner can be another program or wallet
    /// key = true: returns the address of the owner
    /// key = false: returns Null
    mapping owner_TB: bool => address;

    /// Tracks if the address is an attestor
    /// Returns true is the attestor is valid
    /// Returns null otherwise
    mapping attestors: address => bool;

    /// Tracks if the given packet is consumed
    mapping in_packet_consumed: PacketId => bool;

    /// Stores the hash of the given packet
    mapping in_packet_hash: PacketId => field;

    /// Stores the outgoing packet
    mapping out_packets: PacketId => OutPacket;

    /// Tracks the supported chains
    /// Key is chain_id
    mapping supported_chains: u128 => bool;

    /// Tracks the supported services
    /// Key is the address of the supported service
    mapping supported_services: address => bool;

    /// Tracks the outgoing sequence no for the target (destination) chain
    /// key is chain_id of the destination chain
    mapping sequences: u128 => u64;

    // The chain id of the Aleo network where this program is deployed
    const ALEO_CHAIN_ID: u128 = 6694886634403u128;

    // // Version of the packet
    // const VERSION: u8 = 1u8;

    const ZERO_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;

    const THRESHOLD_INDEX: u8 = 1u8;
    const TOTAL_ATTESTORS_INDEX: u8 = 2u8;

    const PAUSABILITY_INDEX: u8 = 3u8;
    const PAUSED_VALUE: u8 = 0u8;
    const UNPAUSED_VALUE: u8 = 1u8;

    const OWNER_INDEX: bool = true;

    /// This is the maximum threshold that this bridge can support
    /// In case the threshold needs to be more than specified, new contract needs to be deployed
    /// To support threshold <= 5, we need to set ZERO_ADDRESS as a valid attestor
    const SUPPORTED_THRESHOLD: u8 = 5u8;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize the token bridge program
    /// Note: This async function must be allowed to be called only once.
    async transition initialize_tb(public initial_attestors: [address; 5], public threshold: u8, public owner: address) -> Future{

        let unique_attestors: u8 = get_valid_unique_address_count(initial_attestors);

        // Sanity check for threshold
        assert(threshold >= 1u8 && threshold <= unique_attestors );

        return finalize_initialize_tb(initial_attestors, threshold, unique_attestors, owner);
    }

    async function finalize_initialize_tb(initial_attestors: [address; 5], threshold: u8, total: u8, owner: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(bridge_settings, THRESHOLD_INDEX));

        Mapping::set(bridge_settings, THRESHOLD_INDEX, threshold);
        Mapping::set(bridge_settings, TOTAL_ATTESTORS_INDEX, total);

        // Set the initial attestors
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            Mapping::set(attestors, initial_attestors[i], true);
        }
        Mapping::set(attestors, ZERO_ADDRESS, true);

        // Set the owner
        Mapping::set(owner_TB, OWNER_INDEX, owner);

        // Initialize the bridge as paused
        Mapping::set(bridge_settings, PAUSABILITY_INDEX, PAUSED_VALUE);
    }

    ////////////////////////////////
    ///// Transfer Ownership ///////
    ////////////////////////////////

    /// Update the existing owner
    /// Can only be called from owner
    async transition transfer_ownership_tb(public new_owner: address) -> Future{
        return finalize_transfer_ownership_tb(self.caller, new_owner);
    }

    async function finalize_transfer_ownership_tb(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this fails
        let current_owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, current_owner);

        // If attestor does not exist, this is expected to fail
        Mapping::set(owner_TB, OWNER_INDEX, new_owner);
    }

    //////////////////////////////
    ///// Add/Remove Attestor ////
    //////////////////////////////

    /// Add a new attestor to the bridge program
    /// Only a valid attestor can `attest` to a packet
    /// Can only be called from owner
    async transition add_attestor_tb(public new_attestor: address, public new_threshold: u8) -> Future{
         assert(new_threshold > 0u8); 
        return finalize_add_attestor_tb(self.caller, new_attestor, new_threshold);
    }

    async function finalize_add_attestor_tb(from: address, new_attestor: address, new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        let total_attestors: u8 = Mapping::get(bridge_settings, TOTAL_ATTESTORS_INDEX);
        
        // Check if the new threshold is below total attestors
        assert(new_threshold <= total_attestors+1u8);

        assert(!Mapping::contains(attestors, new_attestor));
        Mapping::set(attestors, new_attestor, true);
        Mapping::set(bridge_settings, THRESHOLD_INDEX, new_threshold);
        Mapping::set(bridge_settings, TOTAL_ATTESTORS_INDEX, total_attestors + 1u8);
    }

    /// Remove an existing attestor from the bridge program
    /// Can only be called from owner
    async transition remove_attestor_tb(public attestor: address, public new_threshold: u8) -> Future{
        assert_neq(attestor, ZERO_ADDRESS);
        assert(new_threshold > 0u8); 
        return finalize_remove_attestor_tb(self.caller, attestor, new_threshold);
    }

    async function finalize_remove_attestor_tb(from: address, attestor: address, public new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        let total_attestors: u8 = Mapping::get(bridge_settings, TOTAL_ATTESTORS_INDEX);

        // Check if the new threshold is below total attestors
        assert(new_threshold < total_attestors);
        // If attestor does not exist, this is expected to fail
        assert(Mapping::contains(attestors, attestor));
        Mapping::remove(attestors, attestor);
        Mapping::set(bridge_settings, THRESHOLD_INDEX, new_threshold);
        Mapping::set(bridge_settings, TOTAL_ATTESTORS_INDEX, total_attestors - 1u8);
    }

    //////////////////////////////
    ///// Update Threshold ///////
    //////////////////////////////

    /// Update the existing threshold for a packet to be considered valid
    /// Can only be called from owner
    async transition update_threshold_tb(public new_threshold: u8) -> Future{
        assert(new_threshold >= 1u8);
        return finalize_update_threshold_tb(self.caller, new_threshold);
    }

    async function finalize_update_threshold_tb(from: address, public new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        let total_attestors: u8 = Mapping::get(bridge_settings, TOTAL_ATTESTORS_INDEX);
        assert(new_threshold <= total_attestors);

        // If attestor does not exist, this is expected to fail
        Mapping::set(bridge_settings, THRESHOLD_INDEX, new_threshold);
    }

    //////////////////////////////
    ////// Add/Remove Chains /////
    //////////////////////////////

    /// Support a new chain by the bridge
    async transition add_chain_tb(public chain_id: u128) -> Future{
        return finalize_add_chain_tb(self.caller, chain_id);
    }

    async function finalize_add_chain_tb(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(supported_chains, chain_id, true);
    }

    /// Remove chain supported by the bridge
    async transition remove_chain_tb(public chain_id: u128) -> Future{
        return finalize_remove_chain_tb(self.caller, chain_id);
    }

    async function finalize_remove_chain_tb(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        // If the chain_id is not supported, this fails
        assert(Mapping::contains(supported_chains, chain_id));
        Mapping::remove(supported_chains, chain_id);
    }


    //////////////////////////////
    //// Add/Remove Service //////
    //////////////////////////////

    /// Add a new supported service program to the bridge program
    /// Only the supported service program can call publish/consume on bridge program
    /// Can only be called from owner
    async transition add_service_tb(public service: address) -> Future{
        return finalize_add_service_tb(self.caller, service);
    }

    async function finalize_add_service_tb(from: address, service: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(supported_services, service, true);
    }

    /// Remove an existing service program from the bridge program
    /// Removing the program program prevents it from calling publish/consume on bridge program
    /// Can only be called from owner
    async transition remove_service_tb(public service: address) -> Future{
        return finalize_remove_service_tb(self.caller, service);
    }

    async function finalize_remove_service_tb(from: address, service: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        // If service does not exist, this is expected to fail
        assert(Mapping::contains(supported_services, service));
        Mapping::remove(supported_services, service);
    }

    //////////////////////////////////
    //// Pause / Unpause Bridge //////
    //////////////////////////////////

    /// Pauses the bridge
    /// There can be no transfers when the bridge is paused
    async transition pause_tb() -> Future{
        return finalize_pause_tb(self.caller);
    }

    async function finalize_pause_tb(from: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(bridge_settings, PAUSABILITY_INDEX, PAUSED_VALUE);
    }

    /// Unpauses the bridge
    /// There can be transfers only when the bridge is unpaused
    async transition unpause_tb() -> Future{
        return finalize_unpause_tb(self.caller);
    }

    async function finalize_unpause_tb(from: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(bridge_settings, PAUSABILITY_INDEX, UNPAUSED_VALUE);
    }


    /// Publishes a message to be picked up by attestors to forward to the destination chain.
    /// This async transition must be called from one of the service supported by the bridge.
    ///
    /// # Arguments:
    /// * `destination_chain_id`: u128 - ChainId of the chain where the message is intended for
    /// * `destination_service_contract`: [u8; 32] - Service contract on destination chain which can consume the message
    /// * `token`: [u8; 32] - Token contract of destination chain. Eg: Address of USDC contract
    /// * `sender`: address - Sender of the message
    /// * `receiver`: [u8; 32] - Receiver of the message on destination chain
    /// * `amount`: u128 - Amount being sent to the receiver
    async transition publish(
        public version: u8,
        public destination_chain_id: u128, 
        public destination_service_contract: [u8; 32], 
        public token: [u8; 32], 
        public sender: address, 
        public receiver: [u8; 32], 
        public amount: u128,
    ) -> Future{

        // Cannot directly pass struct as parameter in cross-contract call.
        // So construct source struct on `finalize` instead
        // Issue: https://github.com/AleoHQ/leo/issues/3269
        // let source: AleoProgram = AleoProgram {
        //     chain_id: ALEO_CHAIN_ID,
        //     addr: self.caller
        // };

        return (finalize_publish (
            version,
            self.caller, 
            destination_chain_id, 
            destination_service_contract, 
            token, 
            sender, 
            receiver, 
            amount,
        ));
    }

    async function finalize_publish(
        version: u8,
        source_service_program: address, 
        destination_chain_id: u128, 
        destination_service_contract: [u8; 32], 
        dest_token_address: [u8;32], 
        sender_address: address, 
        receiver_address: [u8; 32], 
        amount: u128,
    ) {
        // Assert that the bridge is unpaused
        assert_eq(Mapping::get(bridge_settings, PAUSABILITY_INDEX), UNPAUSED_VALUE);

        // Assert that the packet is being sent to supported chain.
        assert(Mapping::contains(supported_chains, destination_chain_id));

        // Assert that the packet is being sent from one of the supported services
        assert(Mapping::contains(supported_services, source_service_program));

        // Get Sequence number for the destination chain
        let target_sequence_no: u64 = Mapping::get_or_use(sequences, destination_chain_id, 1u64);
        
        // Get Sequence number of this bridge
        // This can be used to check the total outgoing messages from this bridge irrespective of destination chain
        let bridge_sequence_no: u64 = Mapping::get_or_use(sequences, ALEO_CHAIN_ID, 1u64); 

        let source: AleoProgram = AleoProgram {
            chain_id: ALEO_CHAIN_ID,
            addr: source_service_program
        };

        let destination: ForeignContract = ForeignContract {
            chain_id: destination_chain_id,
            addr: destination_service_contract
        };

        let message: OutTokenMessage = OutTokenMessage {
            sender_address,
            dest_token_address,
            amount,
            receiver_address
        };

        // Construct
        let packet: OutPacket = OutPacket {
            version: version,
            source,
            destination,
            sequence: target_sequence_no,
            message,
            height: block.height as u64
        };

        // Update sequence
        Mapping::set(sequences, destination_chain_id, target_sequence_no + 1u64);
        Mapping::set(sequences, ALEO_CHAIN_ID, bridge_sequence_no + 1u64);

        let packet_id: PacketId = PacketId {
            chain_id: destination_chain_id,
            sequence: target_sequence_no
        };

        // Set the outgoing packets
        Mapping::set(out_packets, packet_id, packet);
    }

    /// Consumes it
    /// This async transition must be called from one of the service supported by the bridge.
    ///
    /// # Arguments:
    /// * `source_chain_id`: u32 - Source Chain Id
    /// * `source_service_contract`: [u8;32] - Service contract of the source service contract
    /// * `token`: id - id of the wrapped token on Aleo
    /// * `sender`: address - Address of the sender on other chain
    /// * `receiver`: address - Address of the receiver on Aleo
    /// * `amount`: u64 - Amount to be minted on Aleo 
    /// * `sequence`: u32 - Sequence no for this chain on the source chain
    /// * `height`: u32 - Height of the source chain where the packet originated
    /// * `signers`: [address; 5] - Addresses of the attestors who have signed the packet
    /// * `signs`: [signature; 5] - Signatures of the attestors after signing the packet
    async transition consume(
        public version: u8,
        public source_chain_id: u128, 
        public source_service_contract: [u8;32], 
        public dest_token_id: field, 
        public sender_address: [u8; 32], 
        public receiver_address: address, 
        public amount: u128, 
        public sequence: u64, 
        public height: u64, 
        public signers: [address; 5], 
        public signs: [signature; 5],
    ) -> (public bool, Future) {

        let source: ForeignContract = ForeignContract {
            chain_id: source_chain_id,
            addr: source_service_contract
        };

        let destination: AleoProgram = AleoProgram {
            chain_id: ALEO_CHAIN_ID,
            addr: self.caller
        };

        let message: InTokenMessage = InTokenMessage {
            sender_address,
            dest_token_id,
            amount,
            receiver_address
        };

        let in_packet: InPacket = InPacket {
            version: version,
            source,
            destination,
            sequence,
            message,
            height
        };

        let packet_hash: field = BHP256::hash_to_field(in_packet);

        let (screening_passed, votes): (bool, u8) = get_majority_count(packet_hash, signers , signs);

        return (screening_passed, finalize_consume (self.caller, source_chain_id, sequence, signers, votes));
    }

    async function finalize_consume(
        from: address, 
        chain_id: u128, 
        sequence: u64 , 
        signers: [address; 5], 
        votes: u8, 
    ) {
        // Assert that the bridge is unpaused
        assert_eq(Mapping::get(bridge_settings, PAUSABILITY_INDEX), UNPAUSED_VALUE);

        // Assert that the packet is being received from supported chain.
        assert(Mapping::get(supported_chains, chain_id));

        // Assert that the packet is being consumed from one of the supported services
        assert(Mapping::get(supported_services, from));

        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            // Assert that the attestors signing are valid
            assert(Mapping::contains(attestors, signers[i]));
        }

        // Get the threshold
        // If bridge is not initialized, this should fail
        let threshold: u8 = Mapping::get(bridge_settings, THRESHOLD_INDEX);

        // Ensure enough attestation for the packet
        assert(votes >= threshold);
        
        let packet_id: PacketId = PacketId {
            chain_id,
            sequence
        };

        // Ensure that the packet has not been consumed
        let is_packet_consumed: bool = Mapping::get_or_use(in_packet_consumed, packet_id, false);
        assert(!is_packet_consumed);

        // Consume the packet
        Mapping::set(in_packet_consumed, packet_id, true);
    }

    // Validates that the addresses are unique except for ZERO_ADDRESS
    // Returns the count of the unique addresses
    inline get_valid_unique_address_count(addresses: [address; 5]) -> u8 {
        let unique_addresses: u8 = 0u8;
        if (addresses[0u8] != ZERO_ADDRESS) {
            assert_neq(addresses[0u8], addresses[1u8]);
            assert_neq(addresses[0u8], addresses[2u8]);
            assert_neq(addresses[0u8], addresses[3u8]);
            assert_neq(addresses[0u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[1u8] != ZERO_ADDRESS) {
            assert_neq(addresses[1u8], addresses[2u8]);
            assert_neq(addresses[1u8], addresses[3u8]);
            assert_neq(addresses[1u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[2u8] != ZERO_ADDRESS) {
            assert_neq(addresses[2u8], addresses[3u8]);
            assert_neq(addresses[2u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[3u8] != ZERO_ADDRESS) {
            assert_neq(addresses[3u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[4u8] != ZERO_ADDRESS) {
            unique_addresses += 1u8;
        }
        return unique_addresses;
    }

    inline get_majority_count(packet_hash: field, signers: [address; 5], signs: [signature; 5]) -> (public bool, u8) {
        let unique_signers: u8 = get_valid_unique_address_count(signers);
        let yay_count: u8 = 0u8;
        let nay_count: u8 = 0u8;

        let packet_hash_with_yay: field = BHP256::hash_to_field(InPacketWithScreening {
            packet_hash,
            screening_passed: true
        });

        let packet_hash_with_nay: field = BHP256::hash_to_field(InPacketWithScreening {
            packet_hash,
            screening_passed: false
        });

        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            if (signers[i] != ZERO_ADDRESS) {
                let yay: bool = signature::verify(signs[i], signers[i], packet_hash_with_yay);
                let nay: bool = signature::verify(signs[i], signers[i], packet_hash_with_nay);
                assert(yay | nay);
                if (yay) { yay_count = yay_count + 1u8; }
                if (nay) { nay_count = nay_count + 1u8; }
            }
        }

        assert(yay_count != nay_count);

        assert_eq(unique_signers, yay_count + nay_count);

        if (yay_count > nay_count) {
            return (true, yay_count);
        } else {
            return (false, nay_count);
        }
    }

}