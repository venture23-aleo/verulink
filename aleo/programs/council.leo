// The 'council' program.
import bridge.aleo;
import token_service.aleo;
import wrapped_token.aleo;

program council.aleo {

    // Members of the Council
    mapping members: address => bool;

    // TODO: if only two keys
    // bool => u8 can be used; alt only 1 key can be used
    // keys setting index
    // 0 -> | 0: not initialized | 1: initialized |
    // 1 -> threshold required for execution
    mapping settings: u8 => u8;

    // key is hash(proposal)
    mapping proposal_vote_counts: field => u8;
    mapping proposal_executed: field => bool;

    struct ProposalSign {
        proposal: field,
        member: address
    }
    // key is hash(hash(proposal), member)
    mapping proposal_vote_signs: field => bool;

    // key is ProposalType
    // 1. Add New Member
    // 2. Remove Existing Member
    // 3. Update Threshold
    // ...
    mapping proposal_counts: u8 => u32;

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

    ////////////////////////////////
    /////// 1. Add New Member //////
    ////////////////////////////////
    // Note: This fails if we are trying to add the same member for the second time
    // But no need to add the same member again. New address can be used.
    // TODO: Fix this

    struct AddMemberProposal {
        id: u32,
        new_member: address,
        new_threshold: u8
    }
    mapping add_member_proposals: u32 => AddMemberProposal;

    inline add_member_type() -> u8 {
        return 1u8;
    }

    // 1. Propose
    transition prop_add_member(public id: u32, public new_member: address, public new_threshold: u8) {
        let proposal: AddMemberProposal = AddMemberProposal {
            id,
            new_member,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_add_member(from: address, proposal: AddMemberProposal, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, add_member_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(add_member_proposals, id, proposal);
        Mapping::set(proposal_counts, add_member_type(), id + 1u32);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    // 2. Vote
    transition vote_add_member(public id: u32, public new_member: address, public new_threshold: u8) {
        let proposal: AddMemberProposal = AddMemberProposal {
            id,
            new_member,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_add_member(from: address, proposal_hash: field, proposal_sign: field) {
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

    // 3. Execute
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
        Mapping::set(settings, 1u8, new_threshold);
    }

    /////////////////////////////////
    /////// 2. Remove A Member //////
    /////////////////////////////////
    
    struct RemoveMemberProposal {
        id: u32,
        existing_member: address,
        new_threshold: u8
    }

    mapping remove_member_proposals: u32 => RemoveMemberProposal;

    inline remove_member_type() -> u8 {
        return 2u8;
    }

    // 1. Propose
    transition prop_remove_member(public id: u32, public existing_member: address, new_threshold: u8) {
        let proposal: RemoveMemberProposal = RemoveMemberProposal {
            id,
            existing_member,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_remove_member(from: address, proposal: RemoveMemberProposal, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, remove_member_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(remove_member_proposals, id, proposal);
        Mapping::set(proposal_counts, remove_member_type(), id + 1u32);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    // 2. Vote
    transition vote_remove_member(public id: u32, public existing_member: address, new_threshold: u8) {
        let proposal: RemoveMemberProposal = RemoveMemberProposal {
            id,
            existing_member,
            new_threshold
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_remove_member(from: address, proposal_hash: field, proposal_sign: field) {
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

    // 3. Execute
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
        Mapping::set(settings, 1u8, new_threshold);
    }

    //////////////////////////////////
    /////// 3. Update Threshold //////
    //////////////////////////////////

    struct UpdateThresholdProposal {
        id: u32,
        new_threshold: u8
    }

    mapping update_threshold_proposals: u32 => UpdateThresholdProposal;

    inline update_threshold_type() -> u8 {
        return 3u8;
    }

    // 1. Propose
    transition prop_update_threshold(public id: u32, public new_threshold: u8) {
        let proposal: UpdateThresholdProposal = UpdateThresholdProposal {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_update_threshold(from: address, proposal: UpdateThresholdProposal, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, update_threshold_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(update_threshold_proposals, id, proposal);
        Mapping::set(proposal_counts, update_threshold_type(), id + 1u32);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    // 2. Vote
    transition vote_update_threshold(public id: u32, public new_threshold: u8) {
        let proposal: UpdateThresholdProposal = UpdateThresholdProposal {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_update_threshold(from: address, proposal_hash: field, proposal_sign: field) {
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

    // 3. Execute
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

    ////////////////////////////////////////////
    /////// 4. Approve Chain on Bridge ////////
    ///////////////////////////////////////////

    struct ApproveChainBridgeProposal {
        id: u32,
        chain_id: u32
    }

    mapping approve_chain_bridge_proposals: u32 => ApproveChainBridgeProposal;

    inline approve_chain_on_bridge_type() -> u8 {
        return 4u8;
    }

    transition prop_approve_chain_bridge(public id: u32, public chain_id: u32) {
        let proposal: ApproveChainBridgeProposal = ApproveChainBridgeProposal {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_approve_chain_bridge(from: address, proposal: ApproveChainBridgeProposal, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, approve_chain_on_bridge_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(approve_chain_bridge_proposals, id, proposal);
        Mapping::set(proposal_counts, approve_chain_on_bridge_type(), id + 1u32);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition vote_approve_chain_bridge(public id: u32, public chain_id: u32) {
        let proposal: ApproveChainBridgeProposal = ApproveChainBridgeProposal {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_approve_chain_bridge(from: address, proposal_hash: field, proposal_sign: field) {
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

    transition exec_approve_chain_bridge(public id: u32, public chain_id: u32) {
        let proposal: ApproveChainBridgeProposal = ApproveChainBridgeProposal {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

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


    //////////////////////////////////
    /////// 5. Enable Service ////////
    //////////////////////////////////

    struct EnableServiceProposal {
        id: u32,
        service: address
    }

    mapping enable_service_proposals: u32 => EnableServiceProposal;

    inline enable_service_type() -> u8 {
        return 5u8;
    }

    transition prop_enable_service(public id: u32, public service: address) {
        let proposal: EnableServiceProposal = EnableServiceProposal {
            id,
            service
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_enable_service(from: address, proposal: EnableServiceProposal, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, enable_service_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(enable_service_proposals, id, proposal);
        Mapping::set(proposal_counts, enable_service_type(), id + 1u32);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition vote_enable_service(public id: u32, public service: address) {
        let proposal: EnableServiceProposal = EnableServiceProposal {
            id,
            service
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_enable_service(from: address, proposal_hash: field, proposal_sign: field) {
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

    transition exec_enable_service(public id: u32, public service: address) {
        let proposal: EnableServiceProposal = EnableServiceProposal {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

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

    //////////////////////////////////
    /////// 6. Withdraw Chain ////////
    /////////////////////////////////

    struct DisapproveChainBridge {
        id: u32,
        chain_id: u32
    }

    mapping disapprove_chain_proposals: u32 => DisapproveChainBridge;

    inline disapprove_chain_type() -> u8 {
        return 6u8;
    }

    transition prop_disapprove_chain_bridge(public id: u32, public chain_id: u32) {
        let proposal: DisapproveChainBridge = DisapproveChainBridge {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_disapprove_chain_bridge(from: address, proposal: DisapproveChainBridge, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, disapprove_chain_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(disapprove_chain_proposals, id, proposal);
        Mapping::set(proposal_counts, enable_service_type(), id + 1u32);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition vote_disapprove_chain_bridge(public id: u32, public chain_id: u32) {
        let proposal: DisapproveChainBridge = DisapproveChainBridge {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_disapprove_chain_bridge(from: address, proposal_hash: field, proposal_sign: field) {
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


    transition exec_disapprove_chain_bridge(public id: u32, public chain_id: u32) {
        let proposal: DisapproveChainBridge = DisapproveChainBridge {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

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

    //////////////////////////////////////////////
    /////// 7. Support Chain on Token Service ////
    //////////////////////////////////////////////

    struct SupportChainTS {
        id: u32,
        chain_id: u32,
        token_service: [u8; 32]
    }

    mapping support_chain_ts_proposals: u32 => SupportChainTS;

    inline support_chain_ts_type() -> u8 {
        return 7u8;
    }

    transition prop_support_chain_ts(public id: u32, public chain_id: u32, public token_service: [u8; 32]) {
        let proposal: SupportChainTS = SupportChainTS {
            id,
            chain_id,
            token_service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_support_chain_ts(from: address, proposal: SupportChainTS, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, support_chain_ts_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(support_chain_ts_proposals, id, proposal);
        Mapping::set(proposal_counts, support_chain_ts_type(), id + 1u32);


        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition vote_support_chain_ts(public id: u32, public chain_id: u32, public token_service: [u8; 32]) {
        let proposal: SupportChainTS = SupportChainTS {
            id,
            chain_id,
            token_service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_support_chain_ts(from: address, proposal_hash: field, proposal_sign: field) {
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

    transition exec_support_chain_ts(public id: u32, public chain_id: u32, public token_service: [u8; 32]) {
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
    ////// 8. Add New Token //////
    //////////////////////////////

    struct SupportToken {
        id: u32,
        name: [u8; 32],
        symbol: [u8; 16],
        decimals: u8,
        origin_chain_id: u32,
        origin_contract_address: [u8; 32]
    }

    mapping support_token_proposals: u32 => SupportToken;

    inline support_token_type() -> u8 {
        return 8u8;
    }

    transition prop_add_new_token(public id: u32, public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u32, public origin_contract_address: [u8; 32]) {
        
        let proposal: SupportToken = SupportToken {
            id,
            name,
            symbol,
            decimals,
            origin_chain_id,
            origin_contract_address
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_add_new_token(from: address, proposal: SupportToken, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, support_token_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(support_token_proposals, id, proposal);
        Mapping::set(proposal_counts, support_token_type(), id + 1u32);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition vote_add_new_token(public id: u32, public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u32, public origin_contract_address: [u8; 32]) {
        let proposal: SupportToken = SupportToken {
            id,
            name,
            symbol,
            decimals,
            origin_chain_id,
            origin_contract_address
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_add_new_token(from: address, proposal_hash: field, proposal_sign: field) {
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


    transition exec_add_new_token(public id: u32, public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u32, public origin_contract_address: [u8; 32]) {
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
        let threshold: u8 = Mapping::get(settings, 1u8);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        assert(votes >= threshold);

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

    mapping enable_token_proposals: u32 => EnableToken;

    inline enable_token_proposal_type() -> u8 {
        return 9u8;
    }

    transition prop_enable_new_token(public id: u32, public token_id: address, public minimum_transfer: u64, public outgoing_percentage: u16, public time: u32) {
        let proposal: EnableToken  = EnableToken {
            id,
            token_id,
            minimum_transfer,
            outgoing_percentage,
            time
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal, proposal_hash, proposal_sign);
    }

    finalize prop_enable_new_token(from: address, proposal: EnableToken, proposal_hash: field, proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_vote_signs, proposal_sign));

        // Assert proposal.id is the current proposal count
        let id: u32 = Mapping::get_or_use(proposal_counts, enable_token_proposal_type(), 1u32);
        assert_eq(proposal.id, id);
        Mapping::set(enable_token_proposals, id, proposal);
        Mapping::set(proposal_counts, enable_token_proposal_type(), id + 1u32);


        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get_or_use(proposal_vote_counts, proposal_hash, 0u8);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

    }

    transition vote_enable_new_token(public id: u32, public token_id: address, public minimum_transfer: u64, public outgoing_percentage: u16, public time: u32) {
        let proposal: EnableToken  = EnableToken {
            id,
            token_id,
            minimum_transfer,
            outgoing_percentage,
            time
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalSign {
                proposal: proposal_hash,
                member: from
            }
        );

        return then finalize(from, proposal_hash, proposal_sign);
    }

    finalize vote_enable_new_token(from: address, proposal_hash: field, proposal_sign: field) {
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