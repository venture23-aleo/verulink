// The 'council' program.
import token_bridge.aleo;
import token_service.aleo;
import wrapped_token.aleo;

program council.aleo {

    // Members of the Council
    mapping members: address => bool;

    const THRESHOLD_INDEX: u8 = 1u8;
    const TOTAL_MEMBERS_INDEX: u8 = 2u8;
    const TOTAL_PROPOSALS_INDEX: u8 = 3u8;

    // keys setting index
    mapping settings: u8 => u32;

    // key is hash(proposal)
    mapping proposal_vote_counts: field => u8;
    mapping proposal_executed: field => bool;

    mapping proposals: u32 => field;

    struct ProposalSign {
        proposal: field,
        member: address
    }
    // key is hash(hash(proposal), member)
    mapping proposal_vote_signs: field => bool;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize(public m1: address, public m2: address, public m3: address, public m4: address, public m5: address, public threshold: u32) {
        // TODO: Assert that the members are different
        return then finalize(m1, m2, m3, m4, m5, threshold);
    }

    finalize initialize(m1: address, m2: address, m3: address, m4: address, m5: address, threshold: u32) {
        // Assert council has not been initialized before
        assert(!Mapping::contains(settings, 0u8));

        Mapping::set(members, m1, true);
        Mapping::set(members, m2, true);
        Mapping::set(members, m3, true);
        Mapping::set(members, m4, true);
        Mapping::set(members, m5, true);

        // Set the initial initial values
        Mapping::set(settings, THRESHOLD_INDEX, threshold);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, 5u32);
        Mapping::set(settings, TOTAL_PROPOSALS_INDEX, 1u32);
    }

    transition propose(public id: u32, public proposal_hash: field) {
        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, id, proposal_hash, proposal_sign);
    }

    finalize propose(from: address, proposal_id: u32, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert that the proposal id is expected
        let expected_proposal_id: u32 = Mapping::get(settings, TOTAL_PROPOSALS_INDEX);
        assert_eq(expected_proposal_id, proposal_id);
        Mapping::set(settings, TOTAL_PROPOSALS_INDEX, proposal_id + 1u32);

        // Store the proposal hash
        Mapping::set(proposals, proposal_id, proposal_hash);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Set the vote for proposal to be 1
        Mapping::set(proposal_vote_counts, proposal_hash, 1u8);

    }

    transition vote(proposal_hash: field, public new_threshold: u8) {
        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote(from: address, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }


    ////////////////////////////////
    /////// 1. Add New Member //////
    ////////////////////////////////

    struct AddMemberProposal {
        id: u32,
        new_member: address,
        new_threshold: u8
    }

    transition exec_add_member(public id: u32, public new_member: address, public new_threshold: u8) {
        let proposal: AddMemberProposal = AddMemberProposal {
            id,
            new_member,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        return then finalize(proposal_hash, new_member, new_threshold);
    }

    finalize exec_add_member(proposal_hash: field, new_member: address, new_threshold: u8) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(new_threshold >= threshold as u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        assert(!Mapping::contains(members, new_member));
        Mapping::set(members, new_member, true);
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold as u32);

        // Update total members
        let current_members_count: u32 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, current_members_count + 1u32);
    }

    /////////////////////////////////
    /////// 2. Remove A Member //////
    /////////////////////////////////
    
    struct RemoveMemberProposal {
        id: u32,
        existing_member: address,
        new_threshold: u8
    }

    transition exec_remove_member(public id: u32, public existing_member: address, new_threshold: u8) {
        let proposal: RemoveMemberProposal = RemoveMemberProposal {
            id,
            existing_member,
            new_threshold
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        return then finalize(proposal_hash, existing_member, new_threshold);
    }

    finalize exec_remove_member(proposal_hash: field, existing_member: address, new_threshold: u8) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(new_threshold >= 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        Mapping::remove(members, existing_member);
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold as u32);

        // Update total members
        let current_members_count: u32 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(current_members_count >= 2u32);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, current_members_count - 1u32);
    }

    //////////////////////////////////
    /////// 3. Update Threshold //////
    //////////////////////////////////

    struct UpdateThresholdProposal {
        id: u32,
        new_threshold: u8
    }

    transition exec_update_threshold(public id: u32, public new_threshold: u8) {
        let proposal: UpdateThresholdProposal = UpdateThresholdProposal {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        return then finalize(proposal_hash, new_threshold);
    }

    finalize exec_update_threshold(proposal_hash: field, new_threshold: u8) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(new_threshold >= 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold as u32);
    }

    ////////////////////////////////////////////
    /////// 4. Approve Chain on Bridge ////////
    ///////////////////////////////////////////

    struct ApproveChainBridgeProposal {
        id: u32,
        chain_id: u128
    }

    transition exec_approve_chain_bridge(public id: u32, public chain_id: u128) {
        let proposal: ApproveChainBridgeProposal = ApproveChainBridgeProposal {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/approve_chain(chain_id);

        return then finalize(proposal_hash);
    }

    finalize exec_approve_chain_bridge(proposal_hash: field) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    //////////////////////////////////
    /////// 5. Enable Service ////////
    //////////////////////////////////

    struct EnableServiceProposal {
        id: u32,
        service: address
    }

    transition exec_enable_service(public id: u32, public service: address) {
        let proposal: EnableServiceProposal = EnableServiceProposal {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/add_service(service);

        return then finalize(proposal_hash);
    }

    finalize exec_enable_service(proposal_hash: field) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    //////////////////////////////////
    /////// 6. Withdraw Chain ////////
    /////////////////////////////////

    struct DisapproveChainBridge {
        id: u32,
        chain_id: u128
    }

    transition exec_disapprove_chain_bridge(public id: u32, public chain_id: u128) {
        let proposal: DisapproveChainBridge = DisapproveChainBridge {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/disapprove_chain(chain_id);

        return then finalize(proposal_hash);
    }

    finalize exec_disapprove_chain_bridge(proposal_hash: field) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    //////////////////////////////////////////////
    /////// 7. Support Chain on Token Service ////
    //////////////////////////////////////////////

    struct SupportChainTS {
        id: u32,
        chain_id: u128,
        token_service: [u8; 32]
    }

    transition exec_support_chain_ts(public id: u32, public chain_id: u128, public token_service: [u8; 32]) {
        let proposal: SupportChainTS = SupportChainTS {
            id,
            chain_id,
            token_service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/support_chain(chain_id, token_service);

        return then finalize(proposal_hash);
    }

    finalize exec_support_chain_ts(proposal_hash: field) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    //////////////////////////////
    ////// 8. Add New Token //////
    //////////////////////////////

    struct SupportToken {
        id: u32,
        name: [u8; 32],
        symbol: [u8; 16],
        decimals: u8,
        origin_chain_id: u128,
        origin_contract_address: [u8; 32]
    }

    transition exec_add_new_token(public id: u32, public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u128, public origin_contract_address: [u8; 32]) {
        let proposal: SupportToken = SupportToken {
            id,
            name,
            symbol,
            decimals,
            origin_chain_id,
            origin_contract_address
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        wrapped_token.aleo/add_token(name, symbol, decimals, origin_chain_id, origin_contract_address);

        return then finalize(proposal_hash);
    }

    finalize exec_add_new_token(proposal_hash: field) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    /////////////////////////////////
    ///////  9. Enable Token ////////
    /////////////////////////////////

    struct EnableToken {
        id: u32,
        token_id: address,
        minimum_transfer: u64,
        outgoing_percentage: u16,
        time: u32
    }

    transition exec_enable_new_token(public id: u32, public token_id: address, public minimum_transfer: u64, public outgoing_percentage: u16, public time: u32) {
        let proposal: EnableToken  = EnableToken {
            id,
            token_id,
            minimum_transfer,
            outgoing_percentage,
            time
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/enable_token(token_id, minimum_transfer, outgoing_percentage, time);

        return then finalize(proposal_hash);
    }

    finalize exec_enable_new_token(proposal_hash: field) {
        // Get the threshold
        let threshold: u32 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold as u8);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }


}