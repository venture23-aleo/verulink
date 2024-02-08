// The 'bridge' program.
program token_bridge_v0001.aleo {

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
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        addr: [u8; 32]
    }

    struct OutTokenMessage {
        // Address of the sender on this chain
        sender_address: address,
        // Contract Address of the Asset on origin chain; Ex: USDC on Ethereum
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        dest_token_address: [u8; 32],
        // Amount to unlock on origin chain
        amount: u128
        // Address of the receiver on origin chain
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        receiver_address: [u8; 32],
    }


    struct InTokenMessage {
        // Address of the sender on the origin chain
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        sender_address: [u8; 32],
        // Program Address of the wrapped asset on Aleo; Ex: wUSDC
        dest_token_address: address,
        // Amount to mint on Aleo
        amount: u128
        // Address of the receiver on Aleo
        receiver_address: address,
    }


    struct OutPacket {
        // Packet versioning for future enhancements or changes
        version: u8,
        // Service Program where the packet originated
        source: AleoProgram,
        // Service Contract where the packet should be consumed
        destination: ForeignContract,
        // Sequence no of the packet for destination chain
        sequence: u64,
        // Hash of the message. Message can be found in service program
        message: OutTokenMessage,
        // Height where the packet is published
        height: u64
    }

    struct InPacket {
        // Packet versioning for future enhancements or changes
        version: u8,
        // Sequence no of the packet for this chain on source chain
        source: ForeignContract,
        // Destination Program where the packet should be consumed
        destination: AleoProgram,
        // Full message token
        sequence: u64,
        // Service Contract where the packet originated
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

    struct PacketIdWithAttestor {
        // Chain Id where the packet originated
        chain_id: u128,
        // Sequence no of when the packet emitted
        sequence: u64,
        // Address of the attestor
        attestor: address
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

    /// Tracks the number of attestations for a given packet
    /// key is derived as hash(InPacket);
    mapping in_packet_attestations: field => u8;

    /// Tracks if the given packet is consumed
    mapping in_packet_consumed: PacketId => bool;

    /// Stores the hash of the given packet
    mapping in_packet_hash: PacketId => field;

    /// Stores the outgoing packet
    mapping out_packets: PacketId => OutPacket;

    /// Tracks if the given attestor has signed a given packet
    /// key is hash(PacketIdWithAttestor)
    mapping in_packet_attestors: field => bool;

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

    // Version of the bridge program
    const VERSION: u8 = 0u8;

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
    /// Note: This function must be allowed to be called only once.
    transition initialize_tb(public initial_attestors: [address; 5], public threshold: u8, public owner: address) {

        let unique_attestors: u8 = 0u8;

        // Assert all attestors are different
        if (initial_attestors[0u8] != ZERO_ADDRESS) {
            assert(initial_attestors[0u8] != initial_attestors[1u8]);
            assert_neq(initial_attestors[0u8], initial_attestors[1u8]);
            assert_neq(initial_attestors[0u8], initial_attestors[2u8]);
            assert_neq(initial_attestors[0u8], initial_attestors[3u8]);
            assert_neq(initial_attestors[0u8], initial_attestors[4u8]);
            unique_attestors += 1u8;
        }

        if (initial_attestors[1u8] != ZERO_ADDRESS) {
            assert_neq(initial_attestors[1u8], initial_attestors[2u8]);
            assert_neq(initial_attestors[1u8], initial_attestors[3u8]);
            assert_neq(initial_attestors[1u8], initial_attestors[4u8]);
            unique_attestors += 1u8;
        }

        if (initial_attestors[2u8] != ZERO_ADDRESS) {
            assert_neq(initial_attestors[2u8], initial_attestors[3u8]);
            assert_neq(initial_attestors[2u8], initial_attestors[4u8]);
            unique_attestors += 1u8;
        }

        if (initial_attestors[3u8] != ZERO_ADDRESS) {
            assert_neq(initial_attestors[3u8], initial_attestors[4u8]);
            unique_attestors += 1u8;
        }

        if (initial_attestors[4u8] != ZERO_ADDRESS) {
            unique_attestors += 1u8;
        }

        // Sanity check for threshold
        assert(threshold >= 1u8 && threshold <= unique_attestors );

        return then finalize(initial_attestors, threshold, unique_attestors, owner);
    }

    finalize initialize_tb(initial_attestors: [address; 5], threshold: u8, total: u8, owner: address) {
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
    transition transfer_ownership_tb(public new_owner: address) {
        return then finalize(self.caller, new_owner);
    }

    finalize transfer_ownership_tb(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this fails
        let current_owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, current_owner);

        // If attestor does not exist, this is expected to fail
        Mapping::set(owner_TB, OWNER_INDEX, new_owner);
    }

    /////////////////////////////////////
    ///// Add/Remove/Update Attestor ////
    /////////////////////////////////////

    /// Add a new attestor to the bridge program
    /// Only a valid attestor can `attest` to a packet
    /// Can only be called from owner
    transition add_attestor_tb(public new_attestor: address, public new_threshold: u8) {
        return then finalize(self.caller, new_attestor, new_threshold);
    }

    finalize add_attestor_tb(from: address, new_attestor: address, new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        assert(new_threshold > 0u8);
        let total_attestors: u8 = Mapping::get(bridge_settings, TOTAL_ATTESTORS_INDEX);

        assert(!Mapping::contains(attestors, new_attestor));
        Mapping::set(attestors, new_attestor, true);
        Mapping::set(bridge_settings, THRESHOLD_INDEX, new_threshold);
        Mapping::set(bridge_settings, TOTAL_ATTESTORS_INDEX, total_attestors + 1u8);
    }

    /// Remove an existing attestor from the bridge program
    /// Can only be called from owner
    transition remove_attestor_tb(public attestor: address, public new_threshold: u8) {
        return then finalize(self.caller, attestor, new_threshold);
    }

    finalize remove_attestor_tb(from: address, attestor: address, public new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        let current_threshold: u8 = Mapping::get(bridge_settings, THRESHOLD_INDEX);
        let total_attestors: u8 = Mapping::get(bridge_settings, TOTAL_ATTESTORS_INDEX);
        assert(new_threshold > 0u8);

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
    transition update_threshold_tb(public new_threshold: u8) {
        assert(new_threshold >= 1u8);
        return then finalize(self.caller, new_threshold);
    }

    finalize update_threshold_tb(from: address, public new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        let total_attestors: u8 = Mapping::get(bridge_settings, TOTAL_ATTESTORS_INDEX);
        assert(new_threshold >= 1u8 && new_threshold <= total_attestors);

        // If attestor does not exist, this is expected to fail
        Mapping::set(bridge_settings, THRESHOLD_INDEX, new_threshold);
    }

    //////////////////////////////
    ////// Add/Remove Chains /////
    //////////////////////////////

    /// Support a new chain by the bridge
    transition add_chain_tb(public chain_id: u128) {
        return then finalize(self.caller, chain_id);
    }

    finalize add_chain_tb(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(supported_chains, chain_id, true);
    }

    /// Remove chain supported by the bridge
    transition remove_chain_tb(public chain_id: u128) {
        return then finalize(self.caller, chain_id);
    }

    finalize remove_chain_tb(from: address, chain_id: u128) {
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
    transition add_service_tb(public service: address) {
        return then finalize(self.caller, service);
    }

    finalize add_service_tb(from: address, service: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(supported_services, service, true);
    }

    /// Remove an existing service program from the bridge program
    /// Removing the program program prevents it from calling publish/consume on bridge program
    /// Can only be called from owner
    transition remove_service_tb(public service: address) {
        return then finalize(self.caller, service);
    }

    finalize remove_service_tb(from: address, service: address) {
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
    transition pause_tb() {
        return then finalize(self.caller);
    }

    finalize pause_tb(from: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(bridge_settings, PAUSABILITY_INDEX, PAUSED_VALUE);
    }

    /// Unpauses the bridge
    /// There can be transfers only when the bridge is unpaused
    transition unpause_tb() {
        return then finalize(self.caller);
    }

    finalize unpause_tb(from: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(bridge_settings, PAUSABILITY_INDEX, UNPAUSED_VALUE);
    }


    /// Publishes a message to be picked up by attestors to forward to the destination chain.
    /// This transition must be called from one of the service supported by the bridge.
    ///
    /// # Arguments:
    /// * `destination_chain_id`: u128 - ChainId of the chain where the message is intended for
    /// * `destination_service_contract`: [u8; 32] - Service contract on destination chain which can consume the message
    /// * `token`: [u8; 32] - Token contract of destination chain. Eg: Address of USDC contract
    /// * `sender`: address - Sender of the message
    /// * `receiver`: [u8; 32] - Receiver of the message on destination chain
    /// * `amount`: u128 - Amount being sent to the receiver
    transition publish(
        public destination_chain_id: u128, 
        public destination_service_contract: [u8; 32], 
        public token: [u8; 32], 
        public sender: address, 
        public receiver: [u8; 32], 
        public amount: u128
    ) {
        // Assert that only a program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);

        // Cannot directly pass struct as parameter in cross-contract call.
        // So construct source struct on `finalize` instead
        // Issue: https://github.com/AleoHQ/leo/issues/3269
        // let source: AleoProgram = AleoProgram {
        //     chain_id: ALEO_CHAIN_ID,
        //     addr: self.caller
        // };

        return then finalize (
            ALEO_CHAIN_ID, 
            self.caller, 
            destination_chain_id, 
            destination_service_contract, 
            token, 
            sender, 
            receiver, 
            amount
        );
    }

    finalize publish(
        source_chain_id: u128, 
        source_service_program: address, 
        destination_chain_id: u128, 
        destination_service_contract: [u8; 32], 
        dest_token_address: [u8;32], 
        sender_address: address, 
        receiver_address: [u8; 32], 
        amount: u128
    ) {
        // Assert that the bridge is unpaused
        assert_eq(Mapping::get(bridge_settings, PAUSABILITY_INDEX), UNPAUSED_VALUE);

        // Assert that the packet is being sent to supported chain.
        assert(Mapping::get(supported_chains, destination_chain_id));

        // Assert that the packet is being sent from one of the supported services
        assert(Mapping::get(supported_services, source_service_program));

        // Get Sequence number for the destination chain
        let target_sequence_no: u64 = Mapping::get_or_use(sequences, destination_chain_id, 1u64);
        
        // Get Sequence number of this bridge
        // This can be used to check the total outgoing messages from this bridge irrespective of destination chain
        let bridge_sequence_no: u64 = Mapping::get_or_use(sequences, ALEO_CHAIN_ID, 1u64); 

        let source: AleoProgram = AleoProgram {
            chain_id: source_chain_id,
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
            receiver_address,
        };

        // Construct
        let packet: OutPacket = OutPacket {
            version: VERSION,
            source,
            destination,
            sequence: target_sequence_no,
            message,
            height: block.height as u64
        };

        // Update sequence
        Mapping::set(sequences, destination_chain_id, target_sequence_no + 1u64);
        Mapping::set(sequences, source_chain_id, bridge_sequence_no + 1u64);

        let packet_id: PacketId = PacketId {
            chain_id: destination_chain_id,
            sequence: target_sequence_no
        };

        // Set the outgoing packets
        Mapping::set(out_packets, packet_id, packet);
    }

    /// Consumes it
    /// This transition must be called from one of the service supported by the bridge.
    ///
    /// # Arguments:
    /// * `source_chain_id`: u32 - Source Chain Id
    /// * `source_service_contract`: [u8;32] - Service contract of the source service contract
    /// * `token`: address - Address of the wrapped token on Aleo
    /// * `sender`: address - Address of the sender on other chain
    /// * `receiver`: address - Address of the receiver on Aleo
    /// * `amount`: u64 - Amount to be minted on Aleo 
    /// * `sequence`: u32 - Sequence no for this chain on the source chain
    /// * `height`: u32 - Height of the source chain where the packet originated
    /// * `signers`: [address; 5] - Addresses of the attestors who have signed the packet
    /// * `signs`: [signature; 5] - Signatures of the attestors after signing the packet
    transition consume(
        public source_chain_id: u128, 
        public source_service_contract: [u8;32], 
        public dest_token_address: address, 
        public sender_address: [u8; 32], 
        public receiver_address: address, 
        public actual_receiver: address, 
        public amount: u128, 
        public sequence: u64, 
        public height: u64, 
        signers: [address; 5], 
        signs: [signature; 5]
    ) {
        public signers: [address; 5], 
        public signs: [signature; 5]
        // Assert that only a program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);

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
            dest_token_address,
            amount,
            receiver_address
        };

        let in_packet: InPacket = InPacket {
            version: VERSION,
            source,
            destination,
            sequence,
            message,
            height
        };

        let packet_hash: field = BHP256::hash_to_field(in_packet);

        let screening_passed: bool = receiver_address == actual_receiver;

        let packet_hash_with_screening: field = BHP256::hash_to_field(InPacketWithScreening {
            packet_hash,
            screening_passed
        });

        let valid_signs: u8 = get_valid_signatures_count(packet_hash_with_screening, signers , signs );

        let packet_attestor_keys: [field; 5] = get_packet_attestor_keys(source_chain_id, sequence, signers);

        return then finalize (
            self.caller, 
            source_chain_id, 
            sequence, 
            packet_hash_with_screening, 
            signers, 
            signs, 
            valid_signs, 
            packet_attestor_keys, 
            screening_passed
        );
    }

    finalize consume(
        from: address, 
        chain_id: u128, 
        sequence: u64 , 
        packet_hash_with_screening: field, 
        signers: [address; 5], 
        signs: [signature; 5], 
        valid_signs: u8, 
        packet_attestor_keys: [field; 5], 
        screening_passed: bool
    ) {
        // Assert that the bridge is unpaused
        assert_eq(Mapping::get(bridge_settings, PAUSABILITY_INDEX), UNPAUSED_VALUE);

        // Assert that the packet is being received from supported chain.
        assert(Mapping::get(supported_chains, chain_id));

        // Assert that the packet is being consumed from one of the supported services
        assert(Mapping::get(supported_services, from));

        for i: u8 in 0u8..INITIAL_TOTAL_ATTESTORS {
            if (i < valid_signs) {
                // Assert that the attestors signing are valid
                assert(Mapping::contains(attestors, signers[i]));
                
                // Assert attestor can only vote once for given (chain_id, sequence)
                assert(!Mapping::contains(in_packet_attestors, packet_attestor_keys[i]));

                // Mark the packet as signed by attestor
                Mapping::set(in_packet_attestors, packet_attestor_keys[i], screening_passed);
            }
        }

        // Get the threshold
        // If bridge is not initialized, this should fail
        let threshold: u8 = Mapping::get(bridge_settings, THRESHOLD_INDEX);

        // Ensure enough attestation for the packet
        let packet_attestation: u8 = Mapping::get_or_use(in_packet_attestations, packet_hash_with_screening, 0u8) + valid_signs;
        assert(packet_attestation >= threshold);

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


    /// Returns the number of valid signatures
    /// If the address is *NOT* ZERO_ADDRESS and the signature does not match, it throws an error
    function get_valid_signatures_count(msg: field, signers: [address; 5], signs: [signature; 5]) -> u8 {
        let count: u8 = 0u8;
        for i: u8 in 0u8..INITIAL_TOTAL_ATTESTORS {
            if (signers[i] != ZERO_ADDRESS) {
                assert(signature::verify(signs[i], signers[i], msg));
                count = count + 1u8;
            }
        }
        return count;
    }

    /// Returns the packet attestor keys for the given PacketId(chain_id, sequence) and the signers
    function get_packet_attestor_keys(chain_id: u128, sequence: u64, signers: [address; 5]) -> [field; 5] {
        let packet_attestor_keys: [field; 5] = [
            BHP256::hash_to_field(PacketIdWithAttestor {
                chain_id,
                sequence,
                attestor: signers[0u8]
            }),
            BHP256::hash_to_field(PacketIdWithAttestor {
                chain_id,
                sequence,
                attestor: signers[1u8]
            }),
            BHP256::hash_to_field(PacketIdWithAttestor {
                chain_id,
                sequence,
                attestor: signers[2u8]
            }),
            BHP256::hash_to_field(PacketIdWithAttestor {
                chain_id,
                sequence,
                attestor: signers[3u8]
            }),
            BHP256::hash_to_field(PacketIdWithAttestor {
                chain_id,
                sequence,
                attestor: signers[4u8]
            })
        ];
        return packet_attestor_keys;
    }

}


