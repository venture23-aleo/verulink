// The 'bridge' program.
program token_bridge.aleo {

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
        amount: u64
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
        amount: u64
    }


    struct InPacketFull {
        // Packet versioning for future enhancements or changes
        version: u8,
        // Sequence no of the packet for this chain on source chain
        sequence: u32,
        // Service Contract where the packet originated
        source: ForeignContract,
        // Destination Program where the packet should be consumed
        destination: AleoProgram,
        // Full message token
        message: MsgTokenReceive,
        // Height on the source chain where the packet originated
        height: u32
    }

    struct InPacket {
        // Packet versioning for future enhancements or changes
        version: u8,
        // Sequence no of the packet for this chain on source chain
        sequence: u32,
        // Service Contract where the packet originated
        source: ForeignContract,
        // Destination Program where the packet should be consumed
        destination: AleoProgram,
        // Hash of the message
        msg_hash: field,
        // Height on the source chain where the packet originated
        height: u32
    }


    struct OutPacket {
        // Packet versioning for future enhancements or changes
        version: u8,
        // Sequence no of the packet for destination chain
        sequence: u32,
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
        sequence: u32
    }

    struct PacketIdWithAttestor {
        // Chain Id where the packet originated
        chain_id: u128,
        // Sequence no of when the packet emitted
        sequence: u32,
        // Address of the attestor
        attestor: address
    }

    // keys setting index
    // 0 -> | 0: not initialized | 1: initialized |
    mapping bridge_settings: u8 => u8;

    // mapping used as variable
    // true: address of council 
    // false: Null
    mapping governance_TB: bool => address;

    mapping attestors: address => bool;

    // key is derived as hash(InPacket);
    mapping in_packet_attestations: field => u8;

    // key is derived as PacketId
    mapping in_packet_consumed: PacketId => bool;
    mapping in_packet_hash: PacketId => field;

    mapping out_packets: PacketId => OutPacket;

    mapping in_packet_attestors: PacketIdWithAttestor => bool;

    // key is chain_id
    mapping supported_chains: u128 => bool;
    mapping supported_services: address => bool;

    // sequence no of the packet for the target (destination) chain
    // key is chain_id
    mapping sequences: u128 => u32;

    // Used to receive the packet
    // Can only be called by attestor
    struct InPacketFullAttestorKey {
        packet_hash: field,
        attestor: address
    }

    struct InPacketFullScreeningKey {
        packet_hash: field,
        screening_passed: bool
    }


    // Returns the chain id of the network where this program is deployed
    inline this_chain_id() -> u128 {
        return 6694886634401u128;
    }

    // TODO: store as a variable
    inline version() -> u8 {
        return 0u8;
    }

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize can only be called once
    /// Initialize must be called from council program
    transition initialize_tb(public threshold: u8, public a1: address, public a2: address, public a3: address, public a4: address, public a5: address, public council: address) {
        return then finalize(threshold, a1, a2, a3, a4, a5, council);
    }

    finalize initialize_tb(threshold: u8, a1: address, a2: address, a3: address, a4: address, a5: address, council: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(bridge_settings, 0u8));

        // Setting threshold marks the bridge as initialized
        Mapping::set(bridge_settings, 0u8, threshold);

        // Set the initial attestors
        Mapping::set(attestors, a1, true);
        Mapping::set(attestors, a2, true);
        Mapping::set(attestors, a3, true);
        Mapping::set(attestors, a4, true);
        Mapping::set(attestors, a5, true);

        // Set the governance program
        Mapping::set(governance_TB, true, council);
    }

    transition update_attestor_key(new_attestor: address) {
        return then finalize (self.caller, new_attestor);
    }

    finalize update_attestor_key(existing_attestor: address, new_attestor: address) {
        Mapping::remove(attestors, existing_attestor);
        Mapping::set(attestors, new_attestor, true);
    }

    ///////////////////////////////
    ///// Update Governance ///////
    ///////////////////////////////

    /// Update the existing governance program
    /// Can only be called from council/governance program
    transition update_governance_tb(public new_governance: address) {
        return then finalize(self.caller, new_governance);
    }

    finalize update_governance_tb(from: address, new_governance: address) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::set(governance_TB, true, new_governance);
    }

    //////////////////////////////
    ///// Add/Remove Attestor ////
    //////////////////////////////

    /// Add a new attestor to the bridge program
    /// Only a valid attestor can `attest` to a packet
    /// Can only be called from council/governance program
    transition add_attestor_tb(public attestor: address, new_threshold: u8) {
        return then finalize(self.caller, attestor, new_threshold);
    }

    finalize add_attestor_tb(from: address, attestor: address, new_threshold: u8) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        Mapping::set(attestors, attestor, true);
        Mapping::set(bridge_settings, 0u8, new_threshold);
    }

    /// Remove an existing attestor from the bridge program
    /// Can only be called from council/governance program
    transition remove_attestor_tb(public attestor: address, new_threshold: u8) {
        return then finalize(self.caller, attestor, new_threshold);
    }

    finalize remove_attestor_tb(from: address, attestor: address, new_threshold: u8) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::remove(attestors, attestor);
        Mapping::set(bridge_settings, 0u8, new_threshold);
    }

    //////////////////////////////
    ///// Update Threshold ///////
    //////////////////////////////

    /// Update the existing threshold for a packet to be considered valid
    /// Can only be called from council/governance program
    transition update_threshold_tb(public new_threshold: u8) {
        return then finalize(self.caller, new_threshold);
    }

    finalize update_threshold_tb(from: address, new_threshold: u8) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::set(bridge_settings, 0u8, new_threshold);
    }

    //////////////////////////////////////
    ////// Enable/Disable Chains /////
    //////////////////////////////////////

    /// Support a new chain by the bridge
    transition enable_chain_tb(public chain_id: u128) {
        return then finalize(self.caller, chain_id);
    }

    finalize enable_chain_tb(from: address, chain_id: u128) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        Mapping::set(supported_chains, chain_id, true);
    }

    /// Remove chain supported by the bridge
    transition disable_chain_tb(public chain_id: u128) {
        return then finalize(self.caller, chain_id);
    }

    finalize disable_chain_tb(from: address, chain_id: u128) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        // If the chain_id is not supported, this fails
        Mapping::remove(supported_chains, chain_id);
    }


    //////////////////////////////////
    //// Enable/Disable Service //////
    //////////////////////////////////

    /// Add a new supported service program to the bridge program
    /// Only the supported service program can call publish/consume on bridge program
    /// Can only be called from council/governance program
    transition enable_service_tb(public service: address) {
        return then finalize(self.caller, service);
    }

    finalize enable_service_tb(from: address, service: address) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        Mapping::set(supported_services, service, true);
    }

    /// Remove an existing service program from the bridge program
    /// Removing the program program prevents it from calling publish/consume on bridge program
    /// Can only be called from council/governance program
    transition disable_service_tb(public service: address) {
        return then finalize(self.caller, service);
    }

    finalize disable_service_tb(from: address, service: address) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_TB, true);
        assert_eq(from, governance);

        // If service does not exist, this is expected to fail
        Mapping::remove(supported_services, service);
    }

    /// Publishes a message to be picked up by attestors to forward to the destination chain.
    /// This transition must be called from one of the service supported by the bridge.
    ///
    /// # Arguments:
    /// * `destination_chain_id`: u32 - ChainId of the chain where the message is intended for
    /// * `destination_service_contract`: u32 - Service contract on destination chain which can consume the message
    /// * `msg_hash`: field - Hash of the message; Message is stored in the service program

    transition publish(public destination_chain_id: u128, public destination_service_contract: [u8; 32], public token: [u8; 32], public sender: address, public receiver: [u8; 32], public amount: u64) {
        // Assert that only a program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);

        // Cannot directly pass struct as parameter in cross-contract call.
        // So construct source struct on `finalize` instead
        // Issue: https://github.com/AleoHQ/leo/issues/3269
        // let source: AleoProgram = AleoProgram {
        //     chain_id: this_chain_id(),
        //     addr: self.caller
        // };

        return then finalize (this_chain_id(), self.caller, destination_chain_id, destination_service_contract, token, sender, receiver, amount);
    }

    finalize publish(source_chain_id: u128, source_service_program: address, destination_chain_id: u128, destination_service_contract: [u8; 32], token: [u8;32], sender: address, receiver: [u8; 32], amount: u64) {
        let source: AleoProgram = AleoProgram {
            chain_id: source_chain_id,
            addr: source_service_program
        };

        // Assert that the packet is being sent to supported chain.
        assert(Mapping::get(supported_chains, destination_chain_id));

        // Assert that the packet is being sent from one of the supported services
        assert(Mapping::get(supported_services, source.addr));

        // Get Sequence number of the service
        let target_sequence_no: u32 = Mapping::get_or_use(sequences, destination_chain_id, 1u32);
        
        // Get Sequence number of the bridge
        let bridge_sequence_no: u32 = Mapping::get_or_use(sequences, this_chain_id(), 1u32); 

        let destination: ForeignContract = ForeignContract {
            chain_id: destination_chain_id,
            addr: destination_service_contract
        };

        let packet: OutPacket = OutPacket {
            version: version(),
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

        // Update sequence no of the destination chain
        Mapping::set(sequences, destination_chain_id, target_sequence_no + 1u32);

        Mapping::set(sequences, source_chain_id, bridge_sequence_no + 1u32);

        let packet_id: PacketId = PacketId {
            chain_id: destination_chain_id,
            sequence: target_sequence_no
        };

        // Set the outgoing packets
        Mapping::set(out_packets, packet_id, packet);
    }

    /// Attest to a message published on some other chain.
    /// This transition must be called only by the attestors.
    ///
    /// # Arguments:
    /// * `packet`: InPacketFull - Incoming packet with this chain as destination.
    /// * `screening_passed`: bool - true if the receiver/sender pass the screening; false otherwise
    transition attest(public packet: InPacketFull, public screening_passed: bool) {

        let msg_hash: field = BHP256::hash_to_field(packet.message);

        let packet_hash: field = BHP256::hash_to_field(InPacket {
            version: packet.version,
            sequence: packet.sequence,
            source: packet.source,
            destination: packet.destination,
            msg_hash,
            height: packet.height
        });

        let attestor: address = self.caller;
        let packet_attestor_key: PacketIdWithAttestor = PacketIdWithAttestor {
            chain_id: packet.source.chain_id,
            sequence: packet.sequence,
            attestor
        };

        let packet_hash_with_screening: field = BHP256::hash_to_field(InPacketFullScreeningKey {
            packet_hash,
            screening_passed
        });

        return then finalize(packet.source.chain_id, packet.sequence, packet_hash_with_screening, attestor, screening_passed, packet_attestor_key, packet);
    }

    finalize attest(chain_id: u128, sequence: u32, packet_hash_with_screening: field, attestor: address, screening_passed: bool, packet_attestor_key: PacketIdWithAttestor, packet: InPacketFull) {

        // Assert that the packet is being sent to this chain
        assert_eq(packet.destination.chain_id, this_chain_id());

        // Assert that the packet is being received from supported chain.
        assert(Mapping::get(supported_chains, packet.source.chain_id));

        // Assert that the attestors signing are valid
        assert(Mapping::get(attestors, attestor));
        
        // TODO: Ensure attestor can only vote once for given (chain_id, sequence)
        assert(!Mapping::contains(in_packet_attestors, packet_attestor_key));

        // Mark the packet as signed by attestor
        Mapping::set(in_packet_attestors, packet_attestor_key, screening_passed);

        // Get the attestations for the packet
        let packet_attestation_count: u8 = Mapping::get_or_use(in_packet_attestations, packet_hash_with_screening, 0u8);

        // Increase the attestation by 1
        Mapping::set(in_packet_attestations, packet_hash_with_screening, packet_attestation_count + 1u8);

        // Get the threshold
        // If bridge is not initialized, this should fail
        let threshold: u8 = Mapping::get(bridge_settings, 0u8);

        let packet_id: PacketId = PacketId {
            chain_id,
            sequence
        };

        // Check if the packet exists
        let packet_id_exists: bool = Mapping::contains(in_packet_hash, packet_id);

        if (!packet_id_exists && packet_attestation_count + 1u8 >= threshold) {
            // If the threshold is met, set the packet_id
            // Alternatively, store the entire packet
            Mapping::set(in_packet_hash, packet_id, packet_hash_with_screening);

            // Mark the packet as not consumed
            Mapping::set(in_packet_consumed, packet_id, false);
        }

    }


    /// Receive a message published on some other chain.
    /// This transition can be called by anyone with valid signature of the attestor.
    ///
    /// # Arguments:
    /// * `packet`: InPacketFull - Incoming packet with this chain as destination.
    /// * `attestor`: address - Address of the attestor
    /// * `sign`: signature - Signature of the attestor signing the packet
    // transition receive(public packet: InPacketFull, public attestor: address, public sign: signature) { sign.verify(attestor, packet) // same as attest};

    /// Consumes a packet available on bridge program.
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
    transition consume(public source_chain_id: u128, public source_service_contract: [u8;32], public token: address, public sender: [u8; 32], public receiver: address, public actual_receiver: address, public amount: u64, public sequence: u32, public height: u32) {
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
            chain_id: this_chain_id(),
            addr: self.caller
        };

        let message: MsgTokenReceive = MsgTokenReceive {
            token,
            sender,
            receiver,
            amount
        };

        let msg_hash: field = BHP256::hash_to_field(message);

        let in_packet: InPacket = InPacket {
            version: version(),
            sequence,
            source,
            destination,
            msg_hash,
            height
        };

        let packet_hash: field = BHP256::hash_to_field(in_packet);

        let screening_passed: bool = receiver == actual_receiver;

        let packet_hash_with_screening: field = BHP256::hash_to_field(InPacketFullScreeningKey {
            packet_hash,
            screening_passed
        });


        return then finalize (self.caller, source_chain_id, sequence, packet_hash_with_screening);
    }

    finalize consume(by: address, chain_id: u128, sequence: u32 , packet_hash_with_screening: field) {
        // Assert that the packet is being sent from one of the supported services
        assert(Mapping::get(supported_services, by));

        // Get the threshold
        // If bridge is not initialized, this should fail
        let threshold: u8 = Mapping::get(bridge_settings, 0u8);

        // Ensure enough attestation for the packet
        // Not required? since packet_id exists if enough attestations is reached
        let packet_validation: u8 = Mapping::get(in_packet_attestations, packet_hash_with_screening);
        assert(packet_validation >= threshold);

        let packet_id: PacketId = PacketId {
            chain_id,
            sequence
        };

        // Ensure that the packet has the right information
        let stored_packet_hash: field = Mapping::get(in_packet_hash, packet_id);
        assert_eq(stored_packet_hash, packet_hash_with_screening);

        // Ensure that the packet has not been consumed
        let is_packet_consumed: bool = Mapping::get(in_packet_consumed, packet_id);
        assert(!is_packet_consumed);

        // Consume the packet
        Mapping::set(in_packet_consumed, packet_id, true);


    }

}


