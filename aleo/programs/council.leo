// The 'council' program.
import bridge.aleo;
import token_service.aleo;
import wrapped_token.aleo;

program council.aleo {

    // Members of the Council
    mapping members: address => bool;

    // key is hash(proposal)
    mapping proposal_vote_counts: field => u8;
    mapping proposal_executed: field => bool;

    struct ProposalSign {
        proposal: field,
        member: address
    }
    // key is hash(hash(proposal), member)
    mapping proposal_vote_signs: field => bool;

    // TODO: if only two keys
    // bool => u8 can be used; alt only 1 key can be used
    // keys setting index
    // 0 -> | 0: not initialized | 1: initialized |
    // 1 -> threshold required for execution
    mapping settings: u8 => u8;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize(public m1: address, public m2: address, public m3: address, public m4: address, public m5: address, public threshold: u8) {
        return then finalize(m1, m2, m3, m4, m5, threshold);
    }

    finalize initialize(m1: address, m2: address, m3: address, m4: address, m5: address, threshold: u8) {
        // Assert council has not been initialized before
        assert(!Mapping::contains(settings, 0u8));

        Mapping::set(members, m1, true);
        Mapping::set(members, m2, true);
        Mapping::set(members, m3, true);
        Mapping::set(members, m4, true);
        Mapping::set(members, m5, true);

        // Set the council as initialized
        Mapping::set(settings, 0u8, 1u8);

        // Set the intial initial threshold
        Mapping::set(settings, 1u8, threshold);
    }

    //////////////////////////////
    /////// Add New Member //////
    //////////////////////////////
    // Note: This fails if we are trying to add the same member for the second time
    // But no need to add the same member again. New address can be used.
    // TODO: Fix this

    struct AddMemberProposal {
        member: address
    }

    transition add_member(public new_member: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            AddMemberProposal {
                member: new_member
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize add_member(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_add_member(public new_member: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            AddMemberProposal {
                member: new_member
            }
        );
        return then finalize(proposal_hash, new_member);
    }

    finalize exec_add_member(proposal_hash: field, new_member: address) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        Mapping::set(members, new_member, true);
    }

    //////////////////////////////
    /////// Remove A Member //////
    //////////////////////////////
    // Note: This fails if we are trying to remove the same member if we have added it again
    // But we cannot add a member again. So, no need of fixing.

    struct RemoveMemberProposal {
        member: address
    }

    transition remove_member(public existing_member: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            RemoveMemberProposal {
                member: existing_member
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize remove_member(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_remove_member(public existing_member: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            AddMemberProposal {
                member: existing_member
            }
        );
        return then finalize(proposal_hash, existing_member );
    }

    finalize exec_remove_member(proposal_hash: field, existing_member: address) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        Mapping::remove(members, existing_member);
    }

    //////////////////////////////
    /////// Update Threshold //////
    //////////////////////////////
    // Note: This fails if we are trying update back to the same threshold
    // TODO: Fix this

    struct UpdateThresholdProposal {
        threshold: u8
    }

    transition update_threshold(public new_threshold: u8) {
        let proposal_hash: field = BHP256::hash_to_field(
            UpdateThresholdProposal {
                threshold: new_threshold
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize update_threshold(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_update_threshold(public new_threshold: u8) {
        let proposal_hash: field = BHP256::hash_to_field(
            UpdateThresholdProposal {
                threshold : new_threshold
            }
        );
        return then finalize(proposal_hash, new_threshold);
    }

    finalize exec_update_threshold(proposal_hash: field, new_threshold: u8) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        Mapping::set(settings, 1u8, new_threshold);
    }

    //////////////////////////////
    ////// Initialize Bridge /////
    //////////////////////////////

    struct InitializeBridge {
        bridge_threshold: u8, // threshold to consider a packet valid in bridge
        a1: address,
        a2: address,
        a3: address,
        a4: address,
        a5: address
    }

    transition initialize_bridge(public bridge_threshold: u8, public a1: address, public a2: address, public a3: address, public a4: address, public a5: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            InitializeBridge {
                bridge_threshold,
                a1,
                a2,
                a3,
                a4,
                a5
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize initialize_bridge(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_initialize_bridge(public bridge_threshold: u8, public a1: address, public a2: address, public a3: address, public a4: address, public a5: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            InitializeBridge {
                bridge_threshold,
                a1,
                a2,
                a3,
                a4,
                a5
            }
        );

        // Execute the proposal
        bridge.aleo/bridge_initialize(bridge_threshold, a1, a2, a3, a4, a5);

        return then finalize(proposal_hash, bridge_threshold, a1, a2, a3, a4, a5);
    }

    finalize exec_initialize_bridge(proposal_hash: field, bridge_threshold: u8, a1: address, a2: address, a3: address, a4: address, a5: address) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    //////////////////////////////
    // Initialize Token Service //
    //////////////////////////////

    struct InitializeTokenService {
        token_service: bool // created because struct cannot be empty
    }

    transition initialize_token_service() {
        let proposal_hash: field = BHP256::hash_to_field(
            InitializeTokenService {
                token_service: true
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize initialize_token_service(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    // The function identifier needs to be <= 32 bytes
    // So used exec_ instead of exec_
    // TODO: use a common prefix for all functions
    transition exec_initialize_token_service() {
        let proposal_hash: field = BHP256::hash_to_field(
            InitializeTokenService {
                token_service: true
            }
        );

        // Execute the proposal
        token_service.aleo/token_service_initialize();

        return then finalize(proposal_hash);
    }

    finalize exec_initialize_token_service(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    //////////////////////////////
    // Initialize Wrapped Token //
    //////////////////////////////

    struct InitializeWrappedToken {
        wrapped_token: bool // created because struct cannot be empty
    }

    transition initialize_wrapped_token() {
        let proposal_hash: field = BHP256::hash_to_field(
            InitializeWrappedToken {
                wrapped_token: true
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize initialize_wrapped_token(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    // The function identifier needs to be <= 32 bytes
    // So used exec_ instead of exec_
    // TODO: use a common prefix for all functions
    transition exec_initialize_wrapped_token() {
        let proposal_hash: field = BHP256::hash_to_field(
            InitializeWrappedToken {
                wrapped_token: true
            }
        );

        // Execute the proposal
        wrapped_token.aleo/wrapped_token_initialize();

        return then finalize(proposal_hash);
    }

    finalize exec_initialize_wrapped_token(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }


    //////////////////////////////
    ////// Add New Token //////
    //////////////////////////////

    struct SupportToken {
        name: [u8; 32],
        symbol: [u8; 16],
        decimals: u8,
        origin_chain_id: u32,
        origin_contract_address: [u8; 32]
    }

    transition add_new_token(public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u32, public origin_contract_address: [u8; 32]) {
        let proposal_hash: field = BHP256::hash_to_field(
            SupportToken {
                name,
                symbol,
                decimals,
                origin_chain_id,
                origin_contract_address
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize add_new_token(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_add_new_token(public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u32, public origin_contract_address: [u8; 32]) {
        let proposal_hash: field = BHP256::hash_to_field(
            SupportToken {
                name,
                symbol,
                decimals,
                origin_chain_id,
                origin_contract_address
            }
        );

        // Execute the proposal
        wrapped_token.aleo/add_token(name, symbol, decimals, origin_chain_id, origin_contract_address);

        return then finalize(proposal_hash);
    }

    finalize exec_add_new_token(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    //////////////////////////////
    ///////  Enable Token ////////
    //////////////////////////////

    struct EnableToken {
        token_id: address,
        min_amount: u64
    }

    transition enable_new_token(public token_id: address, public min_amount: u64) {
        let proposal_hash: field = BHP256::hash_to_field(
            EnableToken {
                token_id,
                min_amount
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize enable_new_token(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_enable_new_token(public token_id: address, public min_amount: u64) {
        let proposal_hash: field = BHP256::hash_to_field(
            EnableToken {
                token_id,
                min_amount
            }
        );

        // Execute the proposal
        token_service.aleo/enable_token(token_id, min_amount);

        return then finalize(proposal_hash);
    }

    finalize exec_enable_new_token(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    //////////////////////////////
    /////// Enable Service ////////
    //////////////////////////////

    struct EnableService {
        service: address
    }

    transition enable_service(public service: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            EnableService {
                service,
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize enable_service(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_enable_service(public service: address) {
        let proposal_hash: field = BHP256::hash_to_field(
            EnableService {
                service,
            }
        );

        // Execute the proposal
        bridge.aleo/add_service(service);

        return then finalize(proposal_hash);
    }

    finalize exec_enable_service(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    ////////////////////////////////////////
    /////// Approve Chain on Bridge ////////
    ///////////////////////////////////////

    struct ApproveChainBridge {
        chain_id: u32
    }

    transition approve_chain_bridge(public chain_id: u32) {
        let proposal_hash: field = BHP256::hash_to_field(
            ApproveChainBridge {
                chain_id,
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize approve_chain_bridge(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_approve_chain_bridge(public chain_id: u32) {
        let proposal_hash: field = BHP256::hash_to_field(
            ApproveChainBridge {
                chain_id,
            }
        );

        // Execute the proposal
        bridge.aleo/approve_chain(chain_id);

        return then finalize(proposal_hash);
    }

    finalize exec_approve_chain_bridge(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////
    /////// Withdraw Chain ////////
    ///////////////////////////////

    struct DisapproveChainBridge {
        chain_id: u32
    }

    transition disapprove_chain_bridge(public chain_id: u32) {
        let proposal_hash: field = BHP256::hash_to_field(
            DisapproveChainBridge {
                chain_id,
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize disapprove_chain_bridge(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_disapprove_chain_bridge(public chain_id: u32) {
        let proposal_hash: field = BHP256::hash_to_field(
            DisapproveChainBridge {
                chain_id,
            }
        );

        // Execute the proposal
        bridge.aleo/disapprove_chain(chain_id);

        return then finalize(proposal_hash);
    }

    finalize exec_disapprove_chain_bridge(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////////////////
    /////// Support Chain on Token Service ////
    ///////////////////////////////////////////

    struct SupportChainTS {
        chain_id: u32,
        token_service: [u8; 32]
    }

    transition support_chain_ts(public chain_id: u32, public token_service: [u8; 32]) {
        let proposal_hash: field = BHP256::hash_to_field(
            SupportChainTS {
                chain_id,
                token_service
            }
        );

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize support_chain_ts(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition exec_support_chain_ts(public chain_id: u32, public token_service: [u8; 32]) {
        let proposal_hash: field = BHP256::hash_to_field(
            SupportChainTS {
                chain_id,
                token_service
            }
        );

        // Execute the proposal
        token_service.aleo/support_chain(chain_id, token_service);

        return then finalize(proposal_hash);
    }

    finalize exec_support_chain_ts(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

}