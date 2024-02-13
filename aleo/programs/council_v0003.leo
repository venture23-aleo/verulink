// The 'council' program.
import token_bridge_v0002.aleo;
import token_service_v0002.aleo;

// proposal_hash -> Proposal: String

program council_v0003.aleo {

    struct ProposalVote {
        // Hash of the proposal
        proposal: field,
        // Address of the member who have signed the proposal
        member: address
    }

    /// Tracks if the addess is an attestor
    /// Returns true if the address is a member
    /// Returns null/false otherwise
    mapping members: address => bool;

    /// Stores the threshold and the total attestors
    /// key = true : returns the threshold
    /// key = false : returns the total attestors
    mapping settings: bool => u8;

    /// Tracks if the proposal is executed or not
    mapping proposal_executed: field => bool;

    /// Stores the hash of the proposal
    /// Key is the proposalId
    /// TOTAL_PROPOSALS_INDEX keeps track of the total proposals created
    mapping proposals: u32 => field;

    const TOTAL_PROPOSALS_INDEX: u32 = 0u32;

    const THRESHOLD_INDEX: bool = true;
    const TOTAL_MEMBERS_INDEX: bool = false;

    /// This is the maximum threshold that this council program can support
    /// In case the threshold needs to be more than specified, new contract needs to be deployed
    const SUPPORTED_THRESHOLD: u8 = 5u8;

    const ZERO_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize the council program
    /// Note: This function must be allowed to be called only once.
    transition initialize(public initial_members: [address; 5], public threshold: u8) {
        
        let unique_members: u8 = 0u8;

        // Assert that the members are different
        if (initial_members[0u8] != ZERO_ADDRESS) {
            assert_neq(initial_members[0u8], initial_members[1u8]);
            assert_neq(initial_members[0u8], initial_members[2u8]);
            assert_neq(initial_members[0u8], initial_members[3u8]);
            assert_neq(initial_members[0u8], initial_members[4u8]);
            unique_members += 1u8;
        }

        if (initial_members[1u8] != ZERO_ADDRESS) {
            assert_neq(initial_members[1u8], initial_members[2u8]);
            assert_neq(initial_members[1u8], initial_members[3u8]);
            assert_neq(initial_members[1u8], initial_members[4u8]);
            unique_members += 1u8;
        }

        if (initial_members[2u8] != ZERO_ADDRESS) {
            assert_neq(initial_members[2u8], initial_members[3u8]);
            assert_neq(initial_members[2u8], initial_members[4u8]);
            unique_members += 1u8;
        }

        if (initial_members[3u8] != ZERO_ADDRESS) {
            assert_neq(initial_members[3u8], initial_members[4u8]);
            unique_members += 1u8;
        }

        if (initial_members[4u8] != ZERO_ADDRESS) {
            unique_members += 1u8;
        }

        // Sanity check for threhsold
        assert(threshold >= 1u8 && threshold <= unique_members );

        return then finalize(initial_members, threshold, unique_members);
    }

    finalize initialize(initial_members: [address; 5], threshold: u8, total: u8) {
        // Assert council has not been initialized before
        assert(!Mapping::contains(settings, true));

        // Set the initial members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            Mapping::set(members, initial_members[i], true);
        }
        Mapping::set(members, ZERO_ADDRESS, true);

        // Set the initial initial values
        Mapping::set(settings, THRESHOLD_INDEX, threshold);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, total);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, 0field);
    }

    ///////////////////////
    /////// Propose ///////
    ///////////////////////

    transition propose(public id: u32, public proposal_hash: field) {
        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalVote {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, id, proposal_hash, proposal_sign);
    }

    finalize propose(from: address, proposal_id: u32, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the proposal id is expected
        let total_proposals: field = Mapping::get(proposals, TOTAL_PROPOSALS_INDEX);
        let expected_proposal_id: u32 = (total_proposals + 1field ) as u32;
        assert_eq(expected_proposal_id, proposal_id);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, total_proposals + 1field);

        // Store the proposal hash
        Mapping::set(proposals, proposal_id, proposal_hash);
    }

    //////////////////////////////////////
    /////// Council: Add New Member //////
    //////////////////////////////////////

    struct AddMember {
        id: u32,
        new_member: address,
        new_threshold: u8
    }

    transition add_member(public id: u32, public new_member: address, public new_threshold: u8, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: AddMember = AddMember {
            id,
            new_member,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, new_member, new_threshold, signers, votes);
    }

    finalize add_member(proposal_hash: field, new_member: address, new_threshold: u8, signers: [address; 5], votes: u8) {
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold );

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        assert(!Mapping::contains(members, new_member));
        Mapping::set(members, new_member, true);
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold);

        // Update total members
        let current_members_count: u8 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(new_threshold >= 1u8 && new_threshold <= current_members_count + 1u8);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, current_members_count + 1u8);
    }

    //////////////////////////////////////////
    /////// Council: Remove A Member /////////
    //////////////////////////////////////////
    
    struct RemoveMember {
        id: u32,
        existing_member: address,
        new_threshold: u8
    }

    transition remove_member(public id: u32, public existing_member: address, public new_threshold: u8, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: RemoveMember = RemoveMember {
            id,
            existing_member,
            new_threshold
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, existing_member, new_threshold, signers, votes);
    }

    finalize remove_member(proposal_hash: field, existing_member: address, new_threshold: u8, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        let current_members_count: u8 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(current_members_count >= 2u8);
        assert(new_threshold >= 1u8 && new_threshold < current_members_count);

        // Execute the proposal
        assert(Mapping::contains(members, existing_member));
        Mapping::remove(members, existing_member);
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, current_members_count - 1u8);
    }

    ////////////////////////////////////////
    /////// Council: Update Threshold //////
    ////////////////////////////////////////

    struct UpdateThreshold {
        id: u32,
        new_threshold: u8
    }

    transition update_threshold(public id: u32, public new_threshold: u8, public signers: [address; 5], public signs: [signature; 5]) {
        assert(new_threshold >= 1u8);

        let proposal: UpdateThreshold = UpdateThreshold {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, new_threshold, signers, votes);
    }

    finalize update_threshold(proposal_hash: field, new_threshold: u8, signers: [address;5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        let total_members: u8 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(new_threshold <= total_members);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold);
    }



    ///////////////////////////////////////////
    /////// Bridge: Transfer Ownership ////////
    ///////////////////////////////////////////

    struct TbTransferOwnership {
        id: u32,
        new_owner: address
    }

    transition tb_transfer_ownership(public id: u32, public new_owner: address, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbTransferOwnership = TbTransferOwnership {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/transfer_ownership_tb(new_owner);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_transfer_ownership(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    /////////////////////////////////////
    /////// Bridge: Add Attestor ////////
    /////////////////////////////////////

    struct TbAddAttestor {
        id: u32,
        new_attestor: address,
        new_threshold: u8
    }

    transition tb_add_attestor(public id: u32, public new_attestor: address, public new_threshold: u8, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbAddAttestor = TbAddAttestor {
            id,
            new_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/add_attestor_tb(new_attestor, new_threshold);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_add_attestor(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ////////////////////////////////////////
    /////// Bridge: Remove Attestor ////////
    ///////////////////////////////////////

    struct TbRemoveAttestor {
        id: u32,
        existing_attestor: address,
        new_threshold: u8
    }

    transition tb_remove_attestor(public id: u32, public existing_attestor: address, public new_threshold: u8, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbRemoveAttestor = TbRemoveAttestor {
            id,
            existing_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/remove_attestor_tb(existing_attestor, new_threshold);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_remove_attestor(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    /////////////////////////////////////////
    /////// Bridge: Update Threshold ////////
    /////////////////////////////////////////

    struct TbUpdateThreshold {
        id: u32,
        new_threshold: u8
    }

    transition tb_update_threshold(public id: u32, public new_threshold: u8, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbUpdateThreshold = TbUpdateThreshold {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/update_threshold_tb(new_threshold);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_update_threshold(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    //////////////////////////////////
    /////// Bridge: Add Chain ////////
    //////////////////////////////////

    struct TbAddChain {
        id: u32,
        chain_id: u128
    }

    transition tb_add_chain(public id: u32, public chain_id: u128, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbAddChain = TbAddChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/add_chain_tb(chain_id);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_add_chain(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////////////
    /////// Bridge: Remove Chain /////////
    ///////////////////////////////////////

    struct TbRemoveChain {
        id: u32,
        chain_id: u128
    }

    transition tb_remove_chain(public id: u32, public chain_id: u128, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbRemoveChain = TbRemoveChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/remove_chain_tb(chain_id);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_remove_chain(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    ///////////////////////////////////////
    /////// Bridge: Add Service ////////
    ///////////////////////////////////////

    struct TbAddService {
        id: u32,
        service: address
    }

    transition tb_add_service(public id: u32, public service: address, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbAddService = TbAddService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/add_service_tb(service);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_add_service(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////////////
    /////// Bridge: Remove Service ////////
    ///////////////////////////////////////

    struct TbRemoveService {
        id: u32,
        service: address
    }

    transition tb_remove_service(public id: u32, public service: address, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbAddService = TbAddService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/remove_service_tb(service);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_remove_service(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    //////////////////////////////
    /////// Bridge: Pause ////////
    //////////////////////////////

    struct TbPause {
        id: u32,
    }

    transition tb_pause(public id: u32, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbPause = TbPause {
            id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/pause_tb();

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_pause(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    //////////////////////////////
    /////// Bridge: Unpause ////////
    //////////////////////////////

    struct TbUnpause {
        id: u32,
    }

    transition tb_unpause(public id: u32, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TbUnpause = TbUnpause {
            id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0002.aleo/unpause_tb();

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize tb_unpause(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    //////////////////////////////////////////////
    /////// Token Service: Transfer Ownership ////
    //////////////////////////////////////////////

    struct TsTransferOwnership {
        id: u32,
        new_owner: address
    }

    transition ts_transfer_ownership(public id: u32, public new_owner: address, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TsTransferOwnership = TsTransferOwnership {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        // Execute the proposal
        token_service_v0002.aleo/transfer_ownership_ts(new_owner);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize ts_transfer_ownership(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    //////////////////////////////////////////////
    ///////  Token Service: Add Token ////////
    //////////////////////////////////////////////

    struct TsAddToken {
        id: u32,
        token_address: address,
        connector: address,
        min_transfer: u128,
        max_transfer: u128,
        outgoing_percentage: u16,
        time: u32,
        max_no_cap: u128
    }

    transition ts_add_token(
        public id: u32, 
        public token_address: address, 
        public connector: address, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public outgoing_percentage: u16, 
        public time: u32,
        public max_no_cap: u128,
        public signers: [address; 5],
        public signs: [signature; 5]
    ) {
        let proposal: TsAddToken  = TsAddToken {
            id,
            token_address,
            connector,
            min_transfer,
            max_transfer,
            outgoing_percentage,
            time,
            max_no_cap
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0002.aleo/add_token_ts(token_address, connector, min_transfer, max_transfer, outgoing_percentage, time, max_no_cap);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize ts_add_token(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    /////////////////////////////////////////////
    ///////  Token Service: Remove Token ////////
    /////////////////////////////////////////////

    struct TsRemoveToken {
        id: u32,
        token_address: address,
    }

    transition ts_remove_token(public id: u32, public token_address: address, public signers: [address; 5], public signs: [signature; 5]) {
        let proposal: TsRemoveToken  = TsRemoveToken {
            id,
            token_address,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0002.aleo/remove_token_ts(token_address);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize ts_remove_token(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMinTransfer {
        id: u32,
        token_address: address,
        min_transfer: u128,
    }

    transition ts_update_min_transfer(
        public id: u32, 
        public token_address: address, 
        public min_transfer: u128, 
        public signers: [address; 5],
        public signs: [signature; 5]
    ) {
        let proposal: TsUpdateMinTransfer  = TsUpdateMinTransfer {
            id,
            token_address,
            min_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0002.aleo/update_min_transfer_ts(token_address, min_transfer);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize ts_update_min_transfer(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Maximum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMaxTransfer {
        id: u32,
        token_address: address,
        max_transfer: u128,
    }

    transition ts_update_max_transfer(
        public id: u32, 
        public token_address: address, 
        public max_transfer: u128, 
        public signers: [address; 5],
        public signs: [signature; 5]
    ) {
        let proposal: TsUpdateMaxTransfer  = TsUpdateMaxTransfer {
            id,
            token_address,
            max_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0002.aleo/update_max_transfer_ts(token_address, max_transfer);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize ts_update_max_transfer(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Withdrawal Limit ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateWithdrawalLimit {
        id: u32,
        token_address: address,
        percentage: u16,
        duration: u32,
        threshold_no_limit: u128
    }

    transition ts_update_outgoing_percentage(
        public id: u32, 
        public token_address: address, 
        public percentage: u16, 
        public duration: u32,
        public threshold_no_limit: u128,
        public signers: [address; 5],
        public signs: [signature; 5]
    ) {
        let proposal: TsUpdateWithdrawalLimit  = TsUpdateWithdrawalLimit {
            id,
            token_address,
            percentage,
            duration,
            threshold_no_limit
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0002.aleo/update_withdrawal_limit(token_address, percentage, duration, threshold_no_limit);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize ts_update_outgoing_percentage(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ////////////////////////////////////////////////
    ///////  Holding Program : Release Fund ////////
    ////////////////////////////////////////////////

    struct HoldingRelease {
        id: u32,
        token_address: address,
        connector: address,
        receiver: address,
        amount: u128
    }

    transition holding_release(
        public id: u32,
        public token_address: address,
        public receiver: address,
        public amount: u128,
        public signers: [address; 5],
        public signs: [signature; 5]
    ) {
        let proposal: HoldingRelease  = HoldingRelease {
            id,
            token_address,
            connector: self.caller,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize holding_release(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////////////////
    ///////  Connector Program: Update ////////
    ///////////////////////////////////////////

    struct ConnectorUpdate {
        id: u32,
        token_address: address,
        connector: address,
        new_connector: address
    }

    transition connector_update (
        public id: u32,
        public token_address: address,
        public new_connector: address,
        public signers: [address; 5],
        public signs: [signature; 5]
    ) {
        let proposal: ConnectorUpdate  = ConnectorUpdate {
            id,
            token_address,
            connector: self.caller,
            new_connector
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let votes: u8 = get_valid_signature_count(proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize connector_update(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ////////////////////////////////////////////////
    /////// External Program: Execute Proposal /////
    ////////////////////////////////////////////////

    struct ExternalProposal {
        id: u32,
        external_program: address
        proposal_hash: field,
    }

    transition external_execute(public id: u32, public proposal_hash: field, public signers: [address; 5], public signs: [signature; 5]) {
        let external_proposal: ExternalProposal = ExternalProposal {
            id,
            external_program: self.caller,
            proposal_hash,
        };

        let external_proposal_hash: field = BHP256::hash_to_field(external_proposal);

        let votes: u8 = get_valid_signature_count(external_proposal_hash, signers, signs);

        return then finalize(proposal_hash, signers, votes);
    }

    finalize external_execute(proposal_hash: field, signers: [address; 5], votes: u8) {
        // Ensure that the signature are from valid members
        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            assert(Mapping::contains(members, signers[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    function get_valid_signature_count(proposal_hash: field, signers: [address; 5], signs: [signature; 5]) -> u8 {
        // Assert all signers are different
        let unique_signers: u8 = 0u8;
        if (signers[0u8] != ZERO_ADDRESS) {
            assert(signers[0u8] != signers[1u8]);
            assert_neq(signers[0u8], signers[1u8]);
            assert_neq(signers[0u8], signers[2u8]);
            assert_neq(signers[0u8], signers[3u8]);
            assert_neq(signers[0u8], signers[4u8]);
            unique_signers += 1u8;
        }

        if (signers[1u8] != ZERO_ADDRESS) {
            assert_neq(signers[1u8], signers[2u8]);
            assert_neq(signers[1u8], signers[3u8]);
            assert_neq(signers[1u8], signers[4u8]);
            unique_signers += 1u8;
        }

        if (signers[2u8] != ZERO_ADDRESS) {
            assert_neq(signers[2u8], signers[3u8]);
            assert_neq(signers[2u8], signers[4u8]);
            unique_signers += 1u8;
        }

        if (signers[3u8] != ZERO_ADDRESS) {
            assert_neq(signers[3u8], signers[4u8]);
            unique_signers += 1u8;
        }

        if (signers[4u8] != ZERO_ADDRESS) {
            unique_signers += 1u8;
        }

        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            if (signers[i] != ZERO_ADDRESS) {
                assert(signature::verify(signs[i], signers[i], proposal_hash));
            }
        }
        return unique_signers;
}
}
