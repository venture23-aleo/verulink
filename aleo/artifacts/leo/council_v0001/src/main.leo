// The 'council' program.
import token_bridge_v0001.aleo;
import token_service_v0001.aleo;

program council_v0001.aleo {

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

    /// Tracks the number of votes received by the given proposal
    mapping proposal_vote_counts: field => u8;

    /// Tracks if the proposal is executed or not
    mapping proposal_executed: field => bool;

    /// Stores the hash of the proposal
    /// Key is the proposalId
    /// TOTAL_PROPOSALS_INDEX keeps track of the total proposals created
    mapping proposals: u32 => field;

    /// Tracks if the given member has signed the proposal
    /// Key is hash(ProposalVote)
    /// Returns true if the member has voted
    mapping proposal_votes: field => bool;

    const TOTAL_PROPOSALS_INDEX: u32 = 0u32;

    const THRESHOLD_INDEX: bool = true;

    const TOTAL_MEMBERS_INDEX: bool = false;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize the council program
    /// Note: This function must be allowed to be called only once.
    transition initialize(public initial_members: [address; 5], public threshold: u8) {
        
        // Sanity check for threhsold
        assert(threshold >= 1u8 && threshold <= 5u8 );

        // Assert that the members are different
        assert_neq(initial_members[0u8], initial_members[1u8]);
        assert_neq(initial_members[0u8], initial_members[2u8]);
        assert_neq(initial_members[0u8], initial_members[3u8]);
        assert_neq(initial_members[0u8], initial_members[4u8]);

        assert_neq(initial_members[1u8], initial_members[2u8]);
        assert_neq(initial_members[1u8], initial_members[3u8]);
        assert_neq(initial_members[1u8], initial_members[4u8]);

        assert_neq(initial_members[2u8], initial_members[3u8]);
        assert_neq(initial_members[2u8], initial_members[4u8]);

        assert_neq(initial_members[3u8], initial_members[4u8]);

        return then finalize(initial_members, threshold);
    }

    finalize initialize(initial_members: [address; 5], threshold: u8) {
        // Assert council has not been initialized before
        assert(!Mapping::contains(settings, true));

        // Set the initial members
        for i: u8 in 0u8..5u8 {
            Mapping::set(members, initial_members[i], true);
        }

        // Set the initial initial values
        Mapping::set(settings, THRESHOLD_INDEX, threshold);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, 5u8);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, 0field);
    }

    /////////////////////////////////
    /////// Update Member Key ///////
    /////////////////////////////////

    /// Update member key to a new address
    /// Council member can use this transition to update their key to a new address
    /// This is useful in key-rotation of a member without creating new proposal to add/remove member
    transition update_member_key(new_member: address) {
        return then finalize(self.caller, new_member);
    }

    finalize update_member_key(existing_member: address, new_member: address) {
        assert(Mapping::contains(members, existing_member));
        Mapping::remove(members, existing_member);
        Mapping::set(members, new_member, true);
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

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_votes, proposal_sign));

        // Assert that the proposal id is expected
        let total_proposals: field = Mapping::get(proposals, TOTAL_PROPOSALS_INDEX);
        let expected_proposal_id: u32 = (total_proposals + 1field ) as u32;
        assert_eq(expected_proposal_id, proposal_id);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, total_proposals + 1field);

        // Store the proposal hash
        Mapping::set(proposals, proposal_id, proposal_hash);

        // Set that the member has signed the packet
        Mapping::set(proposal_votes, proposal_sign, true);

        // Set the vote for proposal to be 1
        Mapping::set(proposal_vote_counts, proposal_hash, 1u8);

    }

    ////////////////////
    /////// Vote ///////
    ////////////////////

    transition vote(proposal_hash: field, public new_threshold: u8) {
        let from: address = self.caller;

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalVote {
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
        assert(!Mapping::contains(proposal_votes, proposal_sign));

        // Set that the member has signed the packet
        Mapping::set(proposal_votes, proposal_sign, true);

        // Get the votes for the proposal
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);

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



    ///////////////////////////////////////////
    /////// Bridge: Transfer Ownership ////////
    ///////////////////////////////////////////

    struct TbUpdateGovernance {
        id: u32,
        new_owner: address
    }

    transition tb_update_governance(public id: u32, public new_owner: address) {
        let proposal: TbUpdateGovernance = TbUpdateGovernance {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0001.aleo/transfer_ownership_tb(new_owner);

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

    // TODO: Change name to co_add_attestor
    transition tb_add_attestor(public id: u32, public new_attestor: address, new_threshold: u8) {
        let proposal: TbAddAttestor = TbAddAttestor {
            id,
            new_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_bridge_v0001.aleo/add_attestor_tb(new_attestor, new_threshold);

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
        token_bridge_v0001.aleo/remove_attestor_tb(existing_attestor, new_threshold);

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
        token_bridge_v0001.aleo/update_threshold_tb(new_threshold);

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
        token_bridge_v0001.aleo/enable_chain_tb(chain_id);

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
        token_bridge_v0001.aleo/disable_chain_tb(chain_id);

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
        token_bridge_v0001.aleo/enable_service_tb(service);

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
        token_bridge_v0001.aleo/disable_service_tb(service);

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

    //////////////////////////////////////////////
    /////// Token Service: Transfer Ownership ////
    //////////////////////////////////////////////

    struct TsTransferOwnership {
        id: u32,
        new_owner: address
    }

    transition ts_transfer_ownership(public id: u32, public new_owner: address) {
        let proposal: TsTransferOwnership = TsTransferOwnership {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0001.aleo/transfer_ownership_ts(new_owner);

        return then finalize(proposal_hash);
    }

    finalize ts_transfer_ownership(proposal_hash: field) {
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
        minimum_transfer: u128,
        outgoing_percentage: u16,
        time: u32
    }

    transition ts_support_token(
        public id: u32, 
        public token_id: address, 
        public connector: address, 
        public minimum_transfer: u128, 
        public outgoing_percentage: u16, 
        public time: u32
    ) {
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
        token_service_v0001.aleo/support_token_ts(token_id, connector, minimum_transfer, outgoing_percentage, time);

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
        token_service_v0001.aleo/remove_token_ts(token_id);

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

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMinimumTransfer {
        id: u32,
        token_id: address,
        minimum_transfer: u128,
    }

    transition ts_update_minimum_transfer(
        public id: u32, 
        public token_id: address, 
        public minimum_transfer: u128, 
    ) {
        let proposal: TsUpdateMinimumTransfer  = TsUpdateMinimumTransfer {
            id,
            token_id,
            minimum_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0001.aleo/update_minimum_transfer_ts(token_id, minimum_transfer);

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

    transition ts_update_outgoing_percentage(
        public id: u32, 
        public token_id: address, 
        public outgoing_percentage: u16, 
        public timeframe: u32
    ) {
        let proposal: TsUpdateOutgoingPercentage  = TsUpdateOutgoingPercentage {
            id,
            token_id,
            outgoing_percentage,
            timeframe
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0001.aleo/update_outgoing_percentage_ts(token_id, outgoing_percentage, timeframe);

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

    ////////////////////////////////////////////////
    ///////  Holding Program : Release Fund ////////
    ////////////////////////////////////////////////

    struct HoldingRelease {
        id: u32,
        token_id: address,
        connector: address,
        receiver: address,
        amount: u128
    }

    transition holding_release(
        public id: u32,
        public token_id: address,
        public receiver: address,
        public amount: u128
    ) {
        let proposal: HoldingRelease  = HoldingRelease {
            id,
            token_id,
            connector: self.caller,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        return then finalize(proposal_hash);
    }

    finalize holding_release(proposal_hash: field) {
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

    ///////////////////////////////////////////
    ///////  Connector Program: Update ////////
    ///////////////////////////////////////////

    struct ConnectorUpdate {
        id: u32,
        token_id: address,
        connector: address,
        new_connector: address
    }

    transition connector_update (
        public id: u32,
        public token_id: address,
        public new_connector: address,
    ) {
        let proposal: ConnectorUpdate  = ConnectorUpdate {
            id,
            token_id,
            connector: self.caller,
            new_connector
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        return then finalize(proposal_hash);
    }

    finalize connector_update(proposal_hash: field) {
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

    ////////////////////////////////////////////////
    /////// External Program: Execute Proposal /////
    ////////////////////////////////////////////////

    struct ExternalProposal {
        id: u32,
        external_program: address
        proposal_hash: field,
    }

    transition external_execute(public id: u32, public proposal_hash: field) {
        let external_proposal: ExternalProposal = ExternalProposal {
            id,
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



}