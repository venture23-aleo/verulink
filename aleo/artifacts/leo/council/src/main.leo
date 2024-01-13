// The 'council' program.
import token_bridge.aleo;
import token_service.aleo;

program council.aleo {

    // Members of the Council
    mapping members: address => bool;

    const THRESHOLD_INDEX: bool = true;
    const TOTAL_MEMBERS_INDEX: bool = false;
    mapping settings: bool => u8;

    // key is hash(proposal)
    mapping proposal_vote_counts: field => u8;
    mapping proposal_executed: field => bool;

    const TOTAL_PROPOSALS_INDEX: u32 = 0u32;
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
    transition initialize(public m1: address, public m2: address, public m3: address, public m4: address, public m5: address, public threshold: u8) {
        // TODO: Assert that the members are different
        return then finalize(m1, m2, m3, m4, m5, threshold);
    }

    finalize initialize(m1: address, m2: address, m3: address, m4: address, m5: address, threshold: u8) {
        // Assert council has not been initialized before
        assert(!Mapping::contains(settings, true));

        Mapping::set(members, m1, true);
        Mapping::set(members, m2, true);
        Mapping::set(members, m3, true);
        Mapping::set(members, m4, true);
        Mapping::set(members, m5, true);

        // Set the initial initial values
        Mapping::set(settings, THRESHOLD_INDEX, threshold);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, 5u8);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, 0field);
    }

    transition update_member(new_member: address) {
        return then finalize(self.caller, new_member);
    }

    finalize update_member(existing_member: address, new_member: address) {
        Mapping::remove(members, existing_member);
        Mapping::set(members, new_member, true);
    }


    ///////////////////////
    /////// Propose ///////
    ///////////////////////

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
        let total_proposals: field = Mapping::get(proposals, TOTAL_PROPOSALS_INDEX);
        let expected_proposal_id: u32 = (total_proposals + 1field ) as u32;
        assert_eq(expected_proposal_id, proposal_id);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, total_proposals + 1field);

        // Store the proposal hash
        Mapping::set(proposals, proposal_id, proposal_hash);

        // Set that the member has signed the packet
        Mapping::set(proposal_vote_signs, proposal_sign, true);

        // Set the vote for proposal to be 1
        Mapping::set(proposal_vote_counts, proposal_hash, 1u8);

    }

    ////////////////////
    /////// Vote ///////
    ////////////////////

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

    ////////////////////////////////////////////////
    /////// External Program: Execute Proposal /////
    ////////////////////////////////////////////////

    struct ExternalProposal {
        external_program: address
        proposal_hash: field,
    }

    transition external_execute(proposal_hash: field) {
        let external_proposal: ExternalProposal = ExternalProposal {
            external_program: self.caller,
            proposal_hash,
        };

        let external_proposal_hash: field = BHP256::hash_to_field(external_proposal);

        return then finalize(external_proposal_hash);
    }

    finalize external_execute(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    //////////////////////////////////////
    /////// Council: Add New Member //////
    //////////////////////////////////////

    struct AddMember {
        id: u32,
        new_member: address,
        new_threshold: u8
    }

    transition add_member(public id: u32, public new_member: address, public new_threshold: u8) {
        let proposal: AddMember = AddMember {
            id,
            new_member,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        return then finalize(proposal_hash, new_member, new_threshold);
    }

    finalize add_member(proposal_hash: field, new_member: address, new_threshold: u8) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

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

    transition remove_member(public id: u32, public existing_member: address, new_threshold: u8) {
        let proposal: RemoveMember = RemoveMember {
            id,
            existing_member,
            new_threshold
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);

        return then finalize(proposal_hash, existing_member, new_threshold);
    }

    finalize remove_member(proposal_hash: field, existing_member: address, new_threshold: u8) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        let current_members_count: u8 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(current_members_count >= 2u8);
        assert(new_threshold >= 1u8 && new_threshold < current_members_count);

        // Execute the proposal
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

    transition update_threshold(public id: u32, public new_threshold: u8) {
        let proposal: UpdateThreshold = UpdateThreshold {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        assert(new_threshold >= 1u8);

        return then finalize(proposal_hash, new_threshold);
    }

    finalize update_threshold(proposal_hash: field, new_threshold: u8) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        let total_members: u8 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(new_threshold <= total_members);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold);
    }

    //////////////////////////////////////////
    /////// Bridge: Update Governance ////////
    //////////////////////////////////////////

    struct TbUpdateGovernance {
        id: u32,
        new_governance: address
    }

    transition tb_update_governance(public id: u32, public new_governance: address) {
        let proposal: TbUpdateGovernance = TbUpdateGovernance {
            id,
            new_governance
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/update_governance_tb(new_governance);

        return then finalize(proposal_hash);
    }

    finalize tb_update_governance(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

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

    transition tb_add_attestor(public id: u32, public new_attestor: address, new_threshold: u8) {
        let proposal: TbAddAttestor = TbAddAttestor {
            id,
            new_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/add_attestor_tb(new_attestor, new_threshold);

        return then finalize(proposal_hash);
    }

    finalize tb_add_attestor(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

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

    transition tb_remove_attestor(public id: u32, public existing_attestor: address, new_threshold: u8) {
        let proposal: TbRemoveAttestor = TbRemoveAttestor {
            id,
            existing_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/remove_attestor_tb(existing_attestor, new_threshold);

        return then finalize(proposal_hash);
    }

    finalize tb_remove_attestor(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

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

    transition tb_update_threshold(public id: u32, public new_threshold: u8) {
        let proposal: TbUpdateThreshold = TbUpdateThreshold {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/update_threshold_tb(new_threshold);

        return then finalize(proposal_hash);
    }

    finalize tb_update_threshold(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////////////
    /////// Bridge: Enable Chain ////////
    //////////////////////////////////////

    struct TbEnableChain {
        id: u32,
        chain_id: u128
    }

    transition tb_enable_chain(public id: u32, public chain_id: u128) {
        let proposal: TbEnableChain = TbEnableChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/enable_chain_tb(chain_id);

        return then finalize(proposal_hash);
    }

    finalize tb_enable_chain(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////////////
    /////// Bridge: Disable Chain /////////
    ///////////////////////////////////////

    struct TbDisableChain {
        id: u32,
        chain_id: u128
    }

    transition disapprove_chain_bridge(public id: u32, public chain_id: u128) {
        let proposal: TbDisableChain = TbDisableChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/disable_chain_tb(chain_id);

        return then finalize(proposal_hash);
    }

    finalize disapprove_chain_bridge(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    ///////////////////////////////////////
    /////// Bridge: Enable Service ////////
    ///////////////////////////////////////

    struct TbEnableService {
        id: u32,
        service: address
    }

    transition tb_enable_service(public id: u32, public service: address) {
        let proposal: TbEnableService = TbEnableService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/enable_service_tb(service);

        return then finalize(proposal_hash);
    }

    finalize tb_enable_service(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    ///////////////////////////////////////
    /////// Bridge: Disable Service ////////
    ///////////////////////////////////////

    struct TbDisableService {
        id: u32,
        service: address
    }

    transition tb_disable_service(public id: u32, public service: address) {
        let proposal: TbEnableService = TbEnableService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge.aleo/disable_service_tb(service);

        return then finalize(proposal_hash);
    }

    finalize tb_disable_service(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

    }

    /////////////////////////////////////////////
    /////// Wrapped Token: Update Governance ////
    /////////////////////////////////////////////

    // struct WtUpdateGovernance {
    //     id: u32,
    //     new_governance: address
    // }

    // transition wt_update_governance(public id: u32, public new_governance: address) {
    //     let proposal: WtUpdateGovernance = WtUpdateGovernance {
    //         id,
    //         new_governance
    //     };
    //     let proposal_hash: field = BHP256::hash_to_field(proposal);

    //     // Execute the proposal
    //     wrapped_tokens.aleo/update_governance_wt(new_governance);

    //     return then finalize(proposal_hash);
    // }

    // finalize wt_update_governance(proposal_hash: field) {
    //     // Get the threshold
    //     let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

    //     // Get the votes for the proposal
    //     let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

    //     assert(votes >= threshold);

    //     // Ensure that the proposal has not been executed
    //     assert(!Mapping::contains(proposal_executed, proposal_hash));

    //     // Mark the proposal as executed
    //     Mapping::set(proposal_executed, proposal_hash, true);
    // }


    // //////////////////////////////////////
    // ////// Wrapped Token: Add Token //////
    // //////////////////////////////////////

    // struct WtAddToken {
    //     id: u32,
    //     name: [u8; 32],
    //     symbol: [u8; 16],
    //     decimals: u8,
    //     origin_chain_id: u128,
    //     origin_contract_address: [u8; 32]
    // }

    // transition wt_add_token(public id: u32, public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u128, public origin_contract_address: [u8; 32]) {
    //     let proposal: WtAddToken = WtAddToken {
    //         id,
    //         name,
    //         symbol,
    //         decimals,
    //         origin_chain_id,
    //         origin_contract_address
    //     };

    //     let proposal_hash: field = BHP256::hash_to_field(proposal);

    //     // Execute the proposal
    //     wrapped_tokens.aleo/add_token_wt(name, symbol, decimals, origin_chain_id, origin_contract_address);

    //     return then finalize(proposal_hash);
    // }

    // finalize wt_add_token(proposal_hash: field) {
    //     // Get the threshold
    //     let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

    //     // Get the votes for the proposal
    //     let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

    //     assert(votes >= threshold);

    //     // Ensure that the proposal has not been executed
    //     assert(!Mapping::contains(proposal_executed, proposal_hash));

    //     // Mark the proposal as executed
    //     Mapping::set(proposal_executed, proposal_hash, true);

    // }

    /////////////////////////////////////////////
    /////// Token Service: Update Governance ////
    /////////////////////////////////////////////

    struct TsUpdateGovernance {
        id: u32,
        new_governance: address
    }

    transition ts_update_governance(public id: u32, public new_governance: address) {
        let proposal: TsUpdateGovernance = TsUpdateGovernance {
            id,
            new_governance
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/update_governance_ts(new_governance);

        return then finalize(proposal_hash);
    }

    finalize ts_update_governance(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    /////////////////////////////////////////
    /////// Token Service: Support Chain ///
    ////////////////////////////////////////

    struct TsSupportChain {
        id: u32,
        chain_id: u128,
        token_service: [u8; 32]
    }

    transition ts_support_chain(public id: u32, public chain_id: u128, public token_service: [u8; 32]) {
        let proposal: TsSupportChain = TsSupportChain {
            id,
            chain_id,
            token_service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/support_chain_ts(chain_id, token_service);

        return then finalize(proposal_hash);
    }

    finalize ts_support_chain(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    /////////////////////////////////////////
    /////// Token Service: Remove Chain ////
    ////////////////////////////////////////

    struct TsRemoveChain {
        id: u32,
        chain_id: u128,
    }

    transition ts_remove_chain(public id: u32, public chain_id: u128) {
        let proposal: TsRemoveChain = TsRemoveChain {
            id,
            chain_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/remove_chain_ts(chain_id);

        return then finalize(proposal_hash);
    }

    finalize ts_remove_chain(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    //////////////////////////////////////////////
    ///////  Token Service: Support Token ////////
    //////////////////////////////////////////////

    struct TsSupportToken {
        id: u32,
        token_id: address,
        connector: address,
        minimum_transfer: u64,
        outgoing_percentage: u16,
        time: u32
    }

    transition ts_support_token(public id: u32, public token_id: address, connector: address, public minimum_transfer: u64, public outgoing_percentage: u16, public time: u32) {
        let proposal: TsSupportToken  = TsSupportToken {
            id,
            token_id,
            connector,
            minimum_transfer,
            outgoing_percentage,
            time
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/support_token_ts(token_id, connector, minimum_transfer, outgoing_percentage, time);

        return then finalize(proposal_hash);
    }

    finalize ts_support_token(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

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
        token_id: address,
    }

    transition ts_remove_token(public id: u32, public token_id: address) {
        let proposal: TsRemoveToken  = TsRemoveToken {
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/remove_token_ts(token_id);

        return then finalize(proposal_hash);
    }

    finalize ts_remove_token(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    /////////////////////////////////////////////////
    ///////  Token Service: Update Connector ////////
    /////////////////////////////////////////////////

    struct TsUpdateConnector {
        id: u32,
        token_id: address,
        new_connector: address,
    }

    transition ts_update_token_connector(public id: u32, public token_id: address, public new_connector: address) {
        let proposal: TsUpdateConnector  = TsUpdateConnector {
            id,
            token_id,
            new_connector,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/update_token_connector_ts(token_id, new_connector);

        return then finalize(proposal_hash);
    }

    finalize ts_update_token_connector(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }


    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMinimumTransfer {
        id: u32,
        token_id: address,
        minimum_transfer: u64,
    }

    transition ts_update_minimum_transfer(public id: u32, public token_id: address, public minimum_transfer: u64, public outgoing_percentage: u16, public time: u32) {
        let proposal: TsUpdateMinimumTransfer  = TsUpdateMinimumTransfer {
            id,
            token_id,
            minimum_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/update_minimum_transfer_ts(token_id, minimum_transfer);

        return then finalize(proposal_hash);
    }

    finalize ts_update_minimum_transfer(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ///////////////////////////////////////////////////////////
    ///////  Token Service: Update Outgoing Percentage ////////
    ///////////////////////////////////////////////////////////

    struct TsUpdateOutgoingPercentage {
        id: u32,
        token_id: address,
        outgoing_percentage: u16,
        timeframe: u32
    }

    transition ts_update_outgoing_percentage(public id: u32, public token_id: address, public outgoing_percentage: u16, public timeframe: u32) {
        let proposal: TsUpdateOutgoingPercentage  = TsUpdateOutgoingPercentage {
            id,
            token_id,
            outgoing_percentage,
            timeframe
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/update_outgoing_percentage_ts(token_id, outgoing_percentage, timeframe);

        return then finalize(proposal_hash);
    }

    finalize ts_update_outgoing_percentage(proposal_hash: field) {
        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ////////////////////////////////////////////////////
    ///////  Holding Program: Update Governance ////////
    ///////////////////////////////////////////////////

    // struct HoldingUpdateGovernance {
    //     id: u32,
    //     new_governance: address
    // }

    // transition holding_update_governance(public id: u32, new_governance: address) {
    //     let proposal: HoldingUpdateGovernance  = HoldingUpdateGovernance {
    //         id,
    //         new_governance
    //     };
    //     let proposal_hash: field = BHP256::hash_to_field(proposal);

    //     // Execute the proposal
    //     holding.aleo/update_governance_holding(new_governance);

    //     return then finalize(proposal_hash);
    // }

    // finalize holding_update_governance(proposal_hash: field) {
    //     // Get the threshold
    //     let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

    //     // Get the votes for the proposal
    //     let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

    //     assert(votes >= threshold);

    //     // Ensure that the proposal has not been executed
    //     assert(!Mapping::contains(proposal_executed, proposal_hash));

    //     // Mark the proposal as executed
    //     Mapping::set(proposal_executed, proposal_hash, true);
    // }


    // ///////////////////////////////////////////////
    // ///////  Holding Program: Release Fund ////////
    // ///////////////////////////////////////////////

    // struct ReleaseFund {
    //     id: u32,
    //     token_id: address,
    //     user: address,
    //     amount: u64
    // }

    // transition release_fund_from_holding(public id: u32, public token_id: address, public user: address, public amount: u64) {
    //     let proposal: ReleaseFund  = ReleaseFund {
    //         id,
    //         token_id,
    //         user,
    //         amount
    //     };
    //     let proposal_hash: field = BHP256::hash_to_field(proposal);

    //     // Execute the proposal
    //     holding.aleo/release_fund(token_id, user, amount);

    //     return then finalize(proposal_hash);
    // }

    // finalize release_fund_from_holding(proposal_hash: field) {
    //     // Get the threshold
    //     let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

    //     // Get the votes for the proposal
    //     let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

    //     assert(votes >= threshold);

    //     // Ensure that the proposal has not been executed
    //     assert(!Mapping::contains(proposal_executed, proposal_hash));

    //     // Mark the proposal as executed
    //     Mapping::set(proposal_executed, proposal_hash, true);
    // }

}