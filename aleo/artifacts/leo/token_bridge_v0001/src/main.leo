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

    struct MsgTokenReceive {
        // Program Address of the wrapped asset on Aleo; Ex: wUSDC
        token: address,
        // Address of the sender on the origin chain
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        sender: [u8; 32],
        // Address of the receiver on Aleo
        receiver: address,
        // Amount to mint on Aleo
        amount: u128
    }

    struct MsgTokenSend {
        // Contract Address of the Asset on origin chain; Ex: USDC on Ethereum
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        token: [u8; 32],
        // Address of the sender on this chain
        sender: address,
        // Address of the receiver on origin chain
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        receiver: [u8; 32],
        // Amount to unlock on origin chain
        amount: u128
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
        message: MsgTokenReceive,
        // Height on the source chain where the packet originated
        height: u32
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
        message: MsgTokenSend,
        // Height where the packet is published
        height: u32
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
    /// key = true : returns the threshold
    /// key = false : returns the total attestors
    mapping attestor_settings: bool => u8;

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

    const THRESHOLD_INDEX: bool = true;
    const TOTAL_ATTESTORS_INDEX: bool = false;


    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    transition initialize_tb(public threshold: u8, public initial_attestors: [address; 5], public owner: address) {

        // Sanity check for threshold
        assert(threshold >= 1u8 && threshold <= 5u8 );

        // Assert all attestors are different
        assert_neq(initial_attestors[0u8], initial_attestors[1u8]);
        assert_neq(initial_attestors[0u8], initial_attestors[2u8]);
        assert_neq(initial_attestors[0u8], initial_attestors[3u8]);
        assert_neq(initial_attestors[0u8], initial_attestors[4u8]);

        assert_neq(initial_attestors[1u8], initial_attestors[2u8]);
        assert_neq(initial_attestors[1u8], initial_attestors[3u8]);
        assert_neq(initial_attestors[1u8], initial_attestors[4u8]);

        assert_neq(initial_attestors[2u8], initial_attestors[3u8]);
        assert_neq(initial_attestors[2u8], initial_attestors[4u8]);

        assert_neq(initial_attestors[3u8], initial_attestors[4u8]);

        return then finalize(threshold, initial_attestors, owner);
    }

    finalize initialize_tb(threshold: u8, initial_attestors: [address; 5], owner: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(attestor_settings, THRESHOLD_INDEX));

        Mapping::set(attestor_settings, THRESHOLD_INDEX, threshold);
        Mapping::set(attestor_settings, TOTAL_ATTESTORS_INDEX, 5u8);

        // Set the initial attestors
        for i: u8 in 0u8..5u8 {
            Mapping::set(attestors, initial_attestors[i], true);
        }

        // Set the owner
        Mapping::set(owner_TB, true, owner);
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
        let current_owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, current_owner);

        // If attestor does not exist, this is expected to fail
        Mapping::set(owner_TB, true, new_owner);
    }

    //////////////////////////////
    ///// Add/Remove Attestor ////
    //////////////////////////////

    /// Add a new attestor to the bridge program
    /// Only a valid attestor can `attest` to a packet
    /// Can only be called from owner
    transition add_attestor_tb(public new_attestor: address, new_threshold: u8) {
        return then finalize(self.caller, new_attestor, new_threshold);
    }

    finalize add_attestor_tb(from: address, new_attestor: address, new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, owner);

        let current_threshold: u8 = Mapping::get(attestor_settings, THRESHOLD_INDEX);
        let total_attestors: u8 = Mapping::get(attestor_settings, TOTAL_ATTESTORS_INDEX);
        assert(new_threshold >= current_threshold && new_threshold <= total_attestors + 1u8);

        assert(!Mapping::contains(attestors, new_attestor));
        Mapping::set(attestors, new_attestor, true);
        Mapping::set(attestor_settings, THRESHOLD_INDEX, new_threshold);
        Mapping::set(attestor_settings, TOTAL_ATTESTORS_INDEX, total_attestors + 1u8);
    }

    /// Remove an existing attestor from the bridge program
    /// Can only be called from owner
    transition remove_attestor_tb(public attestor: address, new_threshold: u8) {
        return then finalize(self.caller, attestor, new_threshold);
    }

    finalize remove_attestor_tb(from: address, attestor: address, new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, owner);

        let current_threshold: u8 = Mapping::get(attestor_settings, THRESHOLD_INDEX);
        let total_attestors: u8 = Mapping::get(attestor_settings, TOTAL_ATTESTORS_INDEX);
        assert(new_threshold >= 1u8 && new_threshold < total_attestors );
        assert(total_attestors >= 2u8);

        // If attestor does not exist, this is expected to fail
        Mapping::remove(attestors, attestor);
        Mapping::set(attestor_settings, THRESHOLD_INDEX, new_threshold);
        Mapping::set(attestor_settings, TOTAL_ATTESTORS_INDEX, total_attestors - 1u8);
    }

    /// Update attestor key to a new address
    /// Attestor can use this transition to update their key to a new address
    /// This is useful in key-rotation of an attestor without any overhead from council
    transition update_attestor_key(new_attestor: address) {
        return then finalize (self.caller, new_attestor);
    }

    finalize update_attestor_key(existing_attestor: address, new_attestor: address) {
        Mapping::remove(attestors, existing_attestor);
        Mapping::set(attestors, new_attestor, true);
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

    finalize update_threshold_tb(from: address, new_threshold: u8) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, owner);

        let total_attestors: u8 = Mapping::get(attestor_settings, TOTAL_ATTESTORS_INDEX);
        assert(new_threshold >= 1u8 && new_threshold <= total_attestors);

        // If attestor does not exist, this is expected to fail
        Mapping::set(attestor_settings, THRESHOLD_INDEX, new_threshold);
    }

    //////////////////////////////////////
    ////// Enable/Disable Chains /////
    //////////////////////////////////////

    /// Support a new chain by the bridge
    transition enable_chain_tb(public chain_id: u128) {
        return then finalize(self.caller, chain_id);
    }

    finalize enable_chain_tb(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, owner);

        Mapping::set(supported_chains, chain_id, true);
    }

    /// Remove chain supported by the bridge
    transition disable_chain_tb(public chain_id: u128) {
        return then finalize(self.caller, chain_id);
    }

    finalize disable_chain_tb(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, owner);

        // If the chain_id is not supported, this fails
        Mapping::remove(supported_chains, chain_id);
    }


    //////////////////////////////////
    //// Enable/Disable Service //////
    //////////////////////////////////

    /// Add a new supported service program to the bridge program
    /// Only the supported service program can call publish/consume on bridge program
    /// Can only be called from owner
    transition enable_service_tb(public service: address) {
        return then finalize(self.caller, service);
    }

    finalize enable_service_tb(from: address, service: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, owner);

        Mapping::set(supported_services, service, true);
    }

    /// Remove an existing service program from the bridge program
    /// Removing the program program prevents it from calling publish/consume on bridge program
    /// Can only be called from owner
    transition disable_service_tb(public service: address) {
        return then finalize(self.caller, service);
    }

    finalize disable_service_tb(from: address, service: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TB, true);
        assert_eq(from, owner);

        // If service does not exist, this is expected to fail
        Mapping::remove(supported_services, service);
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
    transition publish(public destination_chain_id: u128, public destination_service_contract: [u8; 32], public token: [u8; 32], public sender: address, public receiver: [u8; 32], public amount: u128) {
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

        return then finalize (ALEO_CHAIN_ID, self.caller, destination_chain_id, destination_service_contract, token, sender, receiver, amount);
    }

    finalize publish(source_chain_id: u128, source_service_program: address, destination_chain_id: u128, destination_service_contract: [u8; 32], token: [u8;32], sender: address, receiver: [u8; 32], amount: u128) {
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

        // Construct
        let packet: OutPacket = OutPacket {
            version: VERSION,
            sequence: target_sequence_no,
            source,
            destination,
            message: MsgTokenSend {
                sender,
                token,
                receiver,
                amount
            },
            height: block.height
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

    /// Receive a message published on some other chain.
    /// This transition can be called by anyone with valid signatures of the attestors.
    /// 
    /// Note: This method need not be called if the threshold <= 5.
    /// If the threshold is higher, this method is called before the consume.
    ///
    /// Example: If threshold is 8, receive can be called with 5 valid signatures.
    /// Remaining 3 valid signatures can be passed in consume.
    ///
    /// # Arguments:
    /// * `packet`: InPacket - Incoming packet with this chain as destination.
    /// * `signers`: address - Array of the addresses of the signers
    /// * `signs`: signature - Array of the signatures after signing the packet
    transition receive(public packet: InPacket, public signers: [address; 5], public signs: [signature; 5], screening_passed: bool) -> u8 {

        // Assert that the packet is being sent to this chain
        assert_eq(packet.destination.chain_id, ALEO_CHAIN_ID);

        let packet_hash: field = BHP256::hash_to_field(packet);

        let attestor: address = self.caller;
        let packet_hash_with_screening: field = BHP256::hash_to_field(InPacketWithScreening {
            packet_hash,
            screening_passed
        });

        let valid_signs: u8 = get_valid_signatures_count(packet_hash_with_screening, signers , signs );

        let packet_attestor_keys: [field; 5] = get_packet_attestor_keys(packet.source.chain_id, packet.sequence, signers);

        return valid_signs then finalize(packet.source.chain_id, packet.sequence, packet_hash_with_screening, signers, valid_signs, screening_passed, packet_attestor_keys);
    }

    finalize receive(source_chain_id: u128, sequence: u64, packet_hash_with_screening: field, signers: [address; 5], valid_signs: u8, screening_passed: bool, packet_attestor_keys: [field; 5]) {

        // Assert that the packet is being received from supported chain.
        assert(Mapping::get(supported_chains, source_chain_id));

        for i: u8 in 0u8..5u8 {
            if (i < valid_signs) {
                // Assert that the attestors signing are valid
                assert(Mapping::contains(attestors, signers[i]));
                
                // Assert attestor can only vote once for given (chain_id, sequence)
                assert(!Mapping::contains(in_packet_attestors, packet_attestor_keys[i]));

                // Mark the packet as signed by attestor
                Mapping::set(in_packet_attestors, packet_attestor_keys[i], screening_passed);
            }
        }

        // Get the attestations for the packet
        let packet_attestation_count: u8 = Mapping::get_or_use(in_packet_attestations, packet_hash_with_screening, 0u8);

        // Increase the attestation by valid_signs
        Mapping::set(in_packet_attestations, packet_hash_with_screening, packet_attestation_count + valid_signs);

        // Get the threshold
        // If bridge is not initialized, this should fail
        let threshold: u8 = Mapping::get(attestor_settings, THRESHOLD_INDEX);

        let packet_id: PacketId = PacketId {
            chain_id: source_chain_id,
            sequence
        };

        // Check if the packet exists
        let packet_id_exists: bool = Mapping::contains(in_packet_hash, packet_id);

        if (!packet_id_exists && packet_attestation_count + valid_signs >= threshold) {
            // If the threshold is met, set the packet_id
            // Alternatively, store the entire packet
            Mapping::set(in_packet_hash, packet_id, packet_hash_with_screening);

            // Mark the packet as not consumed
            Mapping::set(in_packet_consumed, packet_id, false);
        }

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
    transition consume(public source_chain_id: u128, public source_service_contract: [u8;32], public token: address, public sender: [u8; 32], public receiver: address, public actual_receiver: address, public amount: u128, public sequence: u64, public height: u32, signers: [address; 5], signs: [signature; 5]) {
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

        let message: MsgTokenReceive = MsgTokenReceive {
            token,
            sender,
            receiver,
            amount
        };

        let in_packet: InPacket = InPacket {
            version: VERSION,
            sequence,
            source,
            destination,
            message,
            height
        };

        let packet_hash: field = BHP256::hash_to_field(in_packet);

        let screening_passed: bool = receiver == actual_receiver;

        let packet_hash_with_screening: field = BHP256::hash_to_field(InPacketWithScreening {
            packet_hash,
            screening_passed
        });

        let valid_signs: u8 = get_valid_signatures_count(packet_hash_with_screening, signers , signs );

        let packet_attestor_keys: [field; 5] = get_packet_attestor_keys(source_chain_id, sequence, signers);

        return then finalize (self.caller, source_chain_id, sequence, packet_hash_with_screening, signers, signs, valid_signs, packet_attestor_keys, screening_passed);
    }

    finalize consume(by: address, chain_id: u128, sequence: u64 , packet_hash_with_screening: field, signers: [address; 5], signs: [signature; 5], valid_signs: u8, packet_attestor_keys: [field; 5], screening_passed: bool) {
        // Assert that the packet is being received from supported chain.
        assert(Mapping::get(supported_chains, chain_id));

        // Assert that the packet is being consumed from one of the supported services
        assert(Mapping::get(supported_services, by));

        for i: u8 in 0u8..5u8 {
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
        let threshold: u8 = Mapping::get(attestor_settings, THRESHOLD_INDEX);

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
        for i: u8 in 0u8..5u8 {
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


