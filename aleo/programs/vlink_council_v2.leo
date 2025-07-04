import token_registry.aleo;

program vlink_council_v2.aleo {

    struct ProposalVote {
        // Hash of the proposal
        proposal: field,
        // Address of the member who have signed the proposal
        member: address
    }

    struct ProposalVoterKey {
        // Hash of the proposal
        proposal: field,
        // Index at which the member voted for the proposal
        index: u8
    }

    /// Tracks if the address is an attestor
    /// Returns true if the address is a member
    /// Returns null/false otherwise
    mapping members: address => bool;

    /// Stores the threshold and the total attestors
    /// key = true : returns the threshold
    /// key = false : returns the total attestors
    mapping settings: bool => u8;

    /// Stores the hash of the proposal
    /// Key is the proposalId
    /// TOTAL_PROPOSALS_INDEX keeps track of the total proposals created
    mapping proposals: u32 => field;

    /// Tracks the number of votes received by the given proposal
    mapping proposal_vote_counts: field => u8;

    /// Tracks if the given member has signed the proposal
    /// Key is hash(ProposalVote)
    /// Returns true if the member has voted
    mapping proposal_votes: field => bool;

    /// Tracks if the voters for the given proposal
    /// index in the ProposalVoterKey increases with each vote
    mapping proposal_voters: ProposalVoterKey => address;

    /// Tracks if the proposal is executed or not
    mapping proposal_executed: field => bool;

    // Tracks for the whitelisted address to call external execute function
    mapping whitelisted_callers: address => bool;

    // Tracks for proposal dealine in block height
    mapping proposal_deadline: field => u32;

    const TOTAL_PROPOSALS_INDEX: u32 = 0u32;

    const THRESHOLD_INDEX: bool = true;
    const TOTAL_MEMBERS_INDEX: bool = false;

    /// This is the maximum number of members that can be added in council program
    /// In case of more than five council, new contract needs to be deployed
    const NUM_OF_ALLOWED_MEMBERS: u8 = 5u8;

    const ZERO_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;

    const INITIALIZER_ADDRESS : address = aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px;

    const TAG_ADD_MEMBER: u8 = 1u8;
    const TAG_REMOVE_MEMBER: u8 = 2u8;
    const TAG_WITHDRAW_FEES: u8 = 3u8;
    const TAG_UPDATE_THRESHOLD: u8 = 4u8;
    const TAG_UPDATE_WHITELISTED_CALLER: u8 = 5u8;     


    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize the council program
    /// Note: This function must be allowed to be called only once.
    async transition initialize(public initial_members: [address; 5], public threshold: u8) -> Future{
        assert_eq(self.caller, INITIALIZER_ADDRESS);
        let unique_members: u8 = get_valid_unique_address_count(initial_members);

        // Sanity check for threshold
        assert(threshold > 0u8 && threshold <= unique_members );

        return finalize_initialize(initial_members, threshold, unique_members);
    }

    async function finalize_initialize(initial_members: [address; 5], threshold: u8, total: u8) {
        // Assert council has not been initialized before
        assert(!Mapping::contains(settings, true));

        // Set the initial members
        for i: u8 in 0u8..NUM_OF_ALLOWED_MEMBERS {
            Mapping::set(members, initial_members[i], true);
        }
        Mapping::set(members, ZERO_ADDRESS, true);

        // Set the initial initial values
        Mapping::set(settings, THRESHOLD_INDEX, threshold);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, total);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, 0field);

        // since for now we have only two council that can call external_execute, they are hardcoded here
        Mapping::set(whitelisted_callers, vlink_token_service_council_v2.aleo, true);
        Mapping::set(whitelisted_callers, vlink_token_bridge_council_v2.aleo, true);

    }

    ///////////////////////
    /////// Propose ///////
    ///////////////////////

    async transition propose(public id: u32, public proposal_hash: field) -> Future{
        let from: address = self.caller;
        assert_neq(from, ZERO_ADDRESS);

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalVote {
                proposal: proposal_hash,
                member: from
            }
        );

        let zero_proposal_sign: field = BHP256::hash_to_field(
            ProposalVote {
                proposal: proposal_hash,
                member: ZERO_ADDRESS
            }
        );

        return finalize_propose(from, id, proposal_hash, proposal_sign, zero_proposal_sign);
    }

    async function finalize_propose(from: address, proposal_id: u32, proposal_hash: field, proposal_sign: field, zero_proposal_sign: field) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the proposal id is expected
        let total_proposals: field = Mapping::get(proposals, TOTAL_PROPOSALS_INDEX);
        let expected_proposal_id: u32 = (total_proposals + 1field ) as u32;
        assert_eq(expected_proposal_id, proposal_id);
        Mapping::set(proposals, TOTAL_PROPOSALS_INDEX, total_proposals + 1field);

        // Store the proposal hash
        Mapping::set(proposals, proposal_id, proposal_hash);

        // Set the initial voter
        let first_proposal_voter_key: ProposalVoterKey = ProposalVoterKey {
            proposal: proposal_hash,
            index: 0u8
        };
        Mapping::set(proposal_voters, first_proposal_voter_key, from);

        // Set the vote for the proposal to be 1
        Mapping::set(proposal_vote_counts, proposal_hash, 1u8);

        // set the 7 day proposal dealine, 201600 block is produced in 7 days, assuming 1 block is made in 3 sec
        Mapping::set(proposal_deadline, proposal_hash, block.height+201600u32);

        // Set that the proposer and the zero address has signed
        Mapping::set(proposal_votes, proposal_sign, true);
        Mapping::set(proposal_votes, zero_proposal_sign, true);
    }

    ///////////////////////
    /////// Vote ///////
    ///////////////////////

    async transition vote(public proposal_hash: field, acceptance: bool) -> Future{
        let from: address = self.caller;
        assert_neq(from, ZERO_ADDRESS);

        let proposal_sign: field = BHP256::hash_to_field(
            ProposalVote {
                proposal: proposal_hash,
                member: from
            }
        );

        return finalize_vote(from, proposal_hash, proposal_sign, acceptance);
    }

    async function finalize_vote(from: address, proposal_hash: field, proposal_sign: field, acceptance: bool) {
        // Assert that the proposal/vote is from valid member
        assert(Mapping::get(members, from));

        // Assert that the member has not signed the same proposal earlier
        assert(!Mapping::contains(proposal_votes, proposal_sign));

        // check if proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // check if deadline has not been crossed 
        assert(block.height < Mapping::get(proposal_deadline, proposal_hash));

        // Set the voter address in a proper index
        let votes: u8 = Mapping::get(proposal_vote_counts, proposal_hash);
        let voter_key: ProposalVoterKey = ProposalVoterKey {
            proposal: proposal_hash,
            index: votes
        };
        Mapping::set(proposal_voters, voter_key, from);

        // Set that the member has voted the proposal
        Mapping::set(proposal_votes, proposal_sign, acceptance);

        // Increase the votes by 1
        Mapping::set(proposal_vote_counts, proposal_hash, votes + 1u8);
    }

    //////////////////////////////////////
    /////// Council: Add New Member //////
    //////////////////////////////////////

    struct AddMember {
        tag: u8,
        id: u32,
        new_member: address,
        new_threshold: u8
    }

    async transition add_member(public id: u32, public new_member: address, public new_threshold: u8, public voters: [address; 5]) -> Future{
        assert(new_threshold > 0u8);
        let proposal: AddMember = AddMember {
            tag: TAG_ADD_MEMBER,
            id,
            new_member,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let votes: u8 = get_valid_unique_address_count(voters);
        let vote_keys: [field; 5] = get_proposal_vote_keys(proposal_hash, voters);

        return finalize_add_member(proposal_hash, new_member, new_threshold, voters, vote_keys, votes);
    }

    async function finalize_add_member(proposal_hash: field, new_member: address, new_threshold: u8, voters: [address; 5], vote_keys: [field; 5], votes: u8) {
        // threshold should not be greater than current member count 
        let current_members_count: u8 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(new_threshold < current_members_count); 

        // assertion where member count should not be greater than 5
        assert(current_members_count+1u8 <= NUM_OF_ALLOWED_MEMBERS);

        for i: u8 in 0u8..NUM_OF_ALLOWED_MEMBERS {
            assert(Mapping::contains(members, voters[i]));
            assert(Mapping::get(proposal_votes, vote_keys[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // check if deadline has not been crossed 
        assert(block.height < Mapping::get(proposal_deadline, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        assert(!Mapping::contains(members, new_member));
        Mapping::set(members, new_member, true);
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold);

        // Update total members
        assert(new_threshold <= current_members_count + 1u8);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, current_members_count + 1u8);
    }

    //////////////////////////////////////////
    /////// Council: Remove A Member /////////
    //////////////////////////////////////////
    
    struct RemoveMember {
        tag: u8,
        id: u32,
        existing_member: address,
        new_threshold: u8
    }

    async transition remove_member(public id: u32, public existing_member: address, public new_threshold: u8, public voters: [address; 5]) -> Future{
        assert_neq(existing_member, ZERO_ADDRESS);
        assert(new_threshold > 0u8);
        let proposal: RemoveMember = RemoveMember {
            tag: TAG_REMOVE_MEMBER,
            id,
            existing_member,
            new_threshold
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);
        let votes: u8 = get_valid_unique_address_count(voters);
        let vote_keys: [field; 5] = get_proposal_vote_keys(proposal_hash, voters);        

        return finalize_remove_member(proposal_hash, existing_member, new_threshold, voters, vote_keys, votes);
    }

    async function finalize_remove_member(proposal_hash: field, existing_member: address, new_threshold: u8, voters: [address; 5], vote_keys: [field; 5], votes: u8) {
        // Ensure that the votes are from valid members
        for i: u8 in 0u8..NUM_OF_ALLOWED_MEMBERS {
            assert(Mapping::contains(members, voters[i]));
            assert(Mapping::get(proposal_votes, vote_keys[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // check if deadline has not been crossed 
        assert(block.height < Mapping::get(proposal_deadline, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        let current_members_count: u8 = Mapping::get(settings, TOTAL_MEMBERS_INDEX);
        assert(current_members_count > 1u8);
        assert(new_threshold < current_members_count);

        // Execute the proposal
        assert(Mapping::contains(members, existing_member));
        Mapping::remove(members, existing_member);
        Mapping::set(settings, THRESHOLD_INDEX, new_threshold);
        Mapping::set(settings, TOTAL_MEMBERS_INDEX, current_members_count - 1u8);
    }

    struct Withdrawal {
        tag: u8,
        id: u32,
        token_id: field,
        receiver: address,
        amount: u128
    }

    async transition withdraw_fees(public id: u32, public token_id:field, public receiver: address, public amount: u128, public voters: [address; 5]) -> Future{
        assert(amount > 0u128);
        let proposal: Withdrawal = Withdrawal {
            tag: TAG_WITHDRAW_FEES,
            id,
            token_id,
            receiver,
            amount
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);
        let votes: u8 = get_valid_unique_address_count(voters);
        let vote_keys: [field; 5] = get_proposal_vote_keys(proposal_hash, voters);

        let withdraw_fee: Future = token_registry.aleo/transfer_public(
            token_id,
            receiver,
            amount
        );

        return finalize_withdraw_fees(proposal_hash, amount, voters, vote_keys, votes, withdraw_fee);
    }

    async function finalize_withdraw_fees(proposal_hash: field, amount: u128, voters: [address; 5], vote_keys: [field; 5], votes: u8, f0: Future) {
        f0.await();
        // Ensure that the votes are from valid members
        for i: u8 in 0u8..NUM_OF_ALLOWED_MEMBERS {
            assert(Mapping::contains(members, voters[i]));
            assert(Mapping::get(proposal_votes, vote_keys[i]));
        }

        // check if deadline has not been crossed 
        assert(block.height < Mapping::get(proposal_deadline, proposal_hash));

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    }

    ////////////////////////////////////////
    /////// Council: Update Threshold //////
    ////////////////////////////////////////

    struct UpdateThreshold {
        tag: u8,
        id: u32,
        new_threshold: u8
    }

    async transition update_threshold(public id: u32, public new_threshold: u8, public voters: [address; 5]) -> Future{
        assert(new_threshold > 0u8);

        let proposal: UpdateThreshold = UpdateThreshold {
            tag: TAG_UPDATE_THRESHOLD,
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);
        let votes: u8 = get_valid_unique_address_count(voters);
        let vote_keys: [field; 5] = get_proposal_vote_keys(proposal_hash, voters);

        return finalize_update_threshold(proposal_hash, new_threshold, voters, vote_keys, votes);
    }

    async function finalize_update_threshold(proposal_hash: field, new_threshold: u8, voters: [address;5], vote_keys: [field; 5], votes: u8) {
        // Ensure that the votes are from valid members
        for i: u8 in 0u8..NUM_OF_ALLOWED_MEMBERS {
            assert(Mapping::contains(members, voters[i]));
            assert(Mapping::get(proposal_votes, vote_keys[i]));
        }

        // check if deadline has not been crossed 
        assert(block.height < Mapping::get(proposal_deadline, proposal_hash));

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



    ////////////////////////////////////////////////
    /////// Whitelisted callers: Execute Proposal /////
    ////////////////////////////////////////////////

    struct WhitelistedCaller {
        tag: u8,
        id: u32,
        caller: address,
        status: bool
    }

    async transition update_whitelisted_caller(public id: u32, public caller: address, public status: bool, public voters: [address; 5]) -> Future{
        let proposal: WhitelistedCaller = WhitelistedCaller {
            tag: TAG_UPDATE_WHITELISTED_CALLER,
            id,
            caller,
            status
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);
        let votes: u8 = get_valid_unique_address_count(voters);
        let vote_keys: [field; 5] = get_proposal_vote_keys(proposal_hash, voters);

        return finalize_update_whitelisted(proposal_hash, caller, status, voters, vote_keys, votes);
    }

    async function finalize_update_whitelisted(proposal_hash: field, caller: address, status: bool, voters: [address;5], vote_keys: [field; 5], votes: u8) {
        // Ensure that the votes are from valid members
        for i: u8 in 0u8..NUM_OF_ALLOWED_MEMBERS {
            assert(Mapping::contains(members, voters[i]));
            assert(Mapping::get(proposal_votes, vote_keys[i]));
        }

        // check if deadline has not been crossed 
        assert(block.height < Mapping::get(proposal_deadline, proposal_hash));

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);

        // Execute the proposal
        if (status == false) {
            Mapping::remove(whitelisted_callers, caller);
        } else {
            Mapping::set(whitelisted_callers, caller, true);
        }   
    }




    ////////////////////////////////////////////////
    /////// External Program: Execute Proposal /////
    ////////////////////////////////////////////////

    async transition external_execute(public id: u32, public proposal_hash: field, public voters: [address; 5]) -> Future{
        let votes: u8 = get_valid_unique_address_count(voters);
        let vote_keys: [field; 5] = get_proposal_vote_keys(proposal_hash, voters);

        return finalize_external_execute(proposal_hash, voters, vote_keys, votes, self.caller);
    }

    async function finalize_external_execute(proposal_hash: field, voters: [address; 5], vote_keys: [field; 5], votes: u8, caller: address) {
        // check if caller is whitelisted
        assert(Mapping::contains(whitelisted_callers, caller));

        // check if deadline has not been crossed 
        assert(block.height < Mapping::get(proposal_deadline, proposal_hash));

        // Ensure that the votes are from valid members
        for i: u8 in 0u8..NUM_OF_ALLOWED_MEMBERS {
            assert(Mapping::contains(members, voters[i]));
            assert(Mapping::get(proposal_votes, vote_keys[i]));
        }

        // Get the threshold
        let threshold: u8 = Mapping::get(settings, THRESHOLD_INDEX);

        assert(votes >= threshold);

        // Ensure that the proposal has not been executed
        assert(!Mapping::contains(proposal_executed, proposal_hash));

        // Mark the proposal as executed
        Mapping::set(proposal_executed, proposal_hash, true);
    } 

    // Validates that the addresses are unique except for ZERO_ADDRESS
    // Returs the count of the unique addresses
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

    inline get_proposal_vote_keys(proposal_hash: field, voters: [address; 5]) -> [field; 5] {
        return ( [
            BHP256::hash_to_field(ProposalVote {
                proposal: proposal_hash,
                member: voters[0u8]
            }),
            BHP256::hash_to_field(ProposalVote {
                proposal: proposal_hash,
                member: voters[1u8]
            }),
            BHP256::hash_to_field(ProposalVote {
                proposal: proposal_hash,
                member: voters[2u8]
            }),
            BHP256::hash_to_field(ProposalVote {
                proposal: proposal_hash,
                member: voters[3u8]
            }),
            BHP256::hash_to_field(ProposalVote {
                proposal: proposal_hash,
                member: voters[4u8]
            })
        ]);
    }

}