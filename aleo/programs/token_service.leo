// The 'token_service' program.

import token_bridge.aleo;
import multi_token_support_program.aleo;
import holding.aleo;

program token_service.aleo {

    struct WithdrawalLimit {
        // Withdrawal limit represented as basis points.
        // For example, 10% is represented as 1000 (10% = 10_00 in basis points).
        percentage: u16,
        // The duration for which the withdrawal limit is applicable, measured in block heights.
        // Info: 360 blocks per hour (approx)
        // Reference: https://github.com/AleoHQ/snarkVM/blob/testnet3/console/network/src/lib.rs#L115
        duration: u32,
        // The liquidity amount beyond which the withdrawal limit does not apply.
        // This helps to address the increased difficulty in withdrawing as the available liquidity decreases.
        threshold_no_limit: u128,
    }

    struct TokenOwner {
        account: address,
        token_id: field
    }

    struct ChainToken{
        // Id of one of the supported chains.
        chain_id: u128,
        // Token_id of the aleo token.
        token_id: field
    }

    struct Holder{
        account : address, 
        token_id : field 
    }

     struct TokenMetadata {
        token_id: field,
        name: u128, // ASCII text represented in bits, and the u128 value of the bitstring
        symbol: u128, // ASCII text represented in bits, and the u128 value of the bitstring
        decimals: u8,
        supply: u128,
        max_supply: u128,
        admin: address,
        external_authorization_required: bool, // whether or not this token requires authorization from an external program before transferring
        external_authorization_party: address
    }

    /// Stores the owner of this program
    /// The owner can be another program or wallet
    /// key = true: returns the address of the owner
    /// key = false: returns Null
    mapping owner_TS: bool => address;

    /// Stores the total supply of the token
    /// Key is the address of the token program
    mapping total_supply: field => u128;

    /// Stores whether the tokens are added to the service.
    mapping added_tokens: field => bool;

    /// Stores the minimum amount that can be transferred via Token Service
    /// Key is address of the token program
    mapping min_transfers: field => u128;

    /// Stores the maximum amount that can be transferred via Token Service
    /// Key is address of the token program
    mapping max_transfers: field => u128;

    /// Stores the maximum percentage that can be transferred in the given duration
    /// Key is the address of the token program
    mapping token_withdrawal_limits: field => WithdrawalLimit;
    
    /// Tracks the maximum amount that can be withdrawn until the next snapshot
    /// Key is the address of the token program
    mapping token_snapshot_withdrawal: field => u128;

    /// Tracks the height when the last snapshot happened
    /// Key is the address of the token program
    mapping token_snapshot_height: field => u32;

    /// Tracks the amount withdrawn between the snapshots
    /// Key is the address of the token program
    mapping token_amount_withdrawn: field => u128;

    /// Tracks if the token is paused/unpaused
    /// Key is the address of the token program
    mapping token_status: field => bool;

    /// Tracks the token service address of other chains
    /// Key is the combination of chain_id and token_id
    mapping other_chain_token_service: ChainToken => [u8; 32];
    mapping other_chain_token_address: ChainToken => [u8; 32];

    const OWNER_INDEX: bool = true;
    const PAUSED_VALUE: bool = true;
    const UNPAUSED_VALUE: bool = false;

    const HOLDING_ADDRESS: address = aleo1f4xc78ykumx4pac8hlnle66nxptux3pwm2q24fslvhns3wh4tqgsj8f7yu;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize the token service program
    /// Note: This function must be allowed to be called only once.
    transition initialize_ts(public owner: address) {
        return then finalize(owner);
    }

    finalize initialize_ts(owner: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(owner_TS, OWNER_INDEX));

        // Set the owner program
        Mapping::set(owner_TS, OWNER_INDEX, owner);

    }

    ////////////////////////////////
    ///// Transfer Ownership ///////
    ////////////////////////////////

    /// Update the existing owner
    /// Can only be called by owner
    transition transfer_ownership_ts(public new_owner: address) {
        return then finalize(self.caller, new_owner);
    }

    finalize transfer_ownership_ts(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(owner_TS, OWNER_INDEX, new_owner);
    }


    /////////////////////////////////////////////////
    ///// Update token_service of other chain ///////
    /////////////////////////////////////////////////
    transition update_other_chain_ts(
        public chain_id: u128,
        public token_id: field,
        token_service_address: [u8; 20]
    ) {
        return then finalize(self.caller, chain_id, token_id, token_service_address);
    }
    finalize update_other_chain_ts(from:address, chain_id:u128, token_id: field, token_service_address: [u8;20]){
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);
        let chaintokeninfo:ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: token_id
        };
        Mapping::contains(other_chain_token_service, chaintokeninfo);
        Mapping::set(other_chain_token_service, chaintokeninfo, pad_20_to_32(token_service_address));
    }

    /////////////////////////////////////////////////
    ///// Update token_address of other chain ///////
    /////////////////////////////////////////////////
    transition update_other_chain_ta(
        public chain_id: u128,
        public token_id: field,
        token_address: [u8; 20]
    ) {
        return then finalize(self.caller, chain_id, token_id, token_address);
    }
    finalize update_other_chain_ta(from:address, chain_id:u128, token_id: field, token_address: [u8;20]){
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);
        let chaintokeninfo:ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: token_id
        };
        Mapping::contains(other_chain_token_address, chaintokeninfo);
        Mapping::set(other_chain_token_address, chaintokeninfo, pad_20_to_32(token_address));
    }


    ////////////////////////////////
    ///// Add/Remove Token /////////
    ////////////////////////////////

    transition add_token_ts(
        public token_id: field, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public percentage: u16, 
        public duration: u32,
        public threshold_no_limit: u128,
        // corresponding token addresses and token service from other chain.
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128
    ) {
        assert(max_transfer >= min_transfer);
        assert(percentage <= HUNDRED_PERCENTAGE);
        return then finalize(self.caller, token_id, min_transfer, max_transfer, percentage, duration, threshold_no_limit, token_address, token_service, chain_id);
    }

    finalize add_token_ts(
        from: address, 
        token_id: field, 
        min_transfer: u128, 
        max_transfer: u128,
        percentage: u16, 
        duration: u32,
        threshold_no_limit: u128,
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128
        
    ) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        let withdrawal_limit: WithdrawalLimit = WithdrawalLimit {
            percentage,
            duration,
            threshold_no_limit
        };

        let chain_token_info:ChainToken = ChainToken{
            chain_id: chain_id, 
            token_id: token_id
        };

        assert(!Mapping::contains(added_tokens, token_id));
        Mapping::set(added_tokens, token_id, true);
        Mapping::set(other_chain_token_address, chain_token_info, pad_20_to_32(token_address));
        Mapping::set(other_chain_token_service, chain_token_info, pad_20_to_32(token_service));
        Mapping::set(token_withdrawal_limits, token_id, withdrawal_limit);
        Mapping::set(min_transfers, token_id, min_transfer);
        Mapping::set(max_transfers, token_id, max_transfer);
        Mapping::set(token_status, token_id, PAUSED_VALUE);
    }

    transition remove_token_ts(public token_id: field) {
        return then finalize(self.caller, token_id);
    }

    finalize remove_token_ts(from: address, token_id: field) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(added_tokens, token_id));
        Mapping::remove(added_tokens, token_id);
        Mapping::remove(token_withdrawal_limits, token_id);
        Mapping::remove(min_transfers, token_id);
        Mapping::remove(max_transfers, token_id);
        Mapping::remove(token_status, token_id);
    }

    /////////////////////////////////
    ///// Pause/Unpause Token ///////
    /////////////////////////////////

    transition pause_token_ts(public token_id: field) {
        return then finalize(self.caller, token_id);
    }

    finalize pause_token_ts(from: address, token_id: field) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_status, token_id));
        Mapping::set(token_status, token_id, PAUSED_VALUE);
    }

    transition unpause_token_ts(public token_id: field) {
        return then finalize(self.caller, token_id);
    }

    finalize unpause_token_ts(from: address, token_id: field) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_status, token_id));
        Mapping::set(token_status, token_id, UNPAUSED_VALUE);
    }

    /////////////////////////////////////
    ///// Update Minimum Transfer ///////
    ////////////////////////////////////

    transition update_min_transfer_ts(public token_id: field, public min_transfer: u128) {
        return then finalize(self.caller, token_id, min_transfer);
    }

    finalize update_min_transfer_ts(from: address, token_id: field, min_transfer: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        // Assert new min transfer is less than max_transfer
        let max_transfer:u128= Mapping::get(max_transfers, token_id);
        assert(min_transfer<=max_transfer);

        assert(Mapping::contains(min_transfers, token_id));
        Mapping::set(min_transfers, token_id, min_transfer);
    }

    /////////////////////////////////////
    ///// Update Maximum Transfer ///////
    ////////////////////////////////////

    transition update_max_transfer_ts(public token_id: field, public max_transfer: u128) {
        return then finalize(self.caller, token_id, max_transfer);
    }

    finalize update_max_transfer_ts(from: address, token_id: field, max_transfer: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        // Assert new min transfer is less than max_transfer
        let min_transfer:u128= Mapping::get(min_transfers, token_id);
        assert(max_transfer>=min_transfer);

        assert(Mapping::contains(max_transfers, token_id));
        Mapping::set(max_transfers, token_id, max_transfer);
    }



    /////////////////////////////////////
    ///// Update Withdrawal Limit ///////
    /////////////////////////////////////

    transition update_withdrawal_limit(public token_id: field, public percentage: u16, public duration: u32, public threshold_no_limit: u128) {
        assert(percentage <= HUNDRED_PERCENTAGE);
        return then finalize(self.caller, token_id, percentage, duration, threshold_no_limit);
    }

    finalize update_withdrawal_limit(from: address, token_id: field, percentage: u16, duration: u32, threshold_no_limit: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_withdrawal_limits, token_id));
        let withdrawal_limit: WithdrawalLimit = WithdrawalLimit {
            percentage,
            duration,
            threshold_no_limit
        };
        Mapping::set(token_withdrawal_limits, token_id, withdrawal_limit);
    }

    /////////////////////////////
    ///// Token Transfers ///////
    /////////////////////////////

    transition token_send(
        public token_id: field, 
        public receiver: [u8; 20], 
        public amount: u128,
        public dest_chain_id: u128,
        public dest_token_service: [u8;20],
        public dest_token_address: [u8;20]
    ) {

        multi_token_support_program.aleo/burn_public(token_id, self.caller, amount);
        let chain_token_info: ChainToken = ChainToken{
            chain_id: dest_chain_id,
            token_id: token_id
        };
        token_bridge.aleo/publish(
            dest_chain_id, 
            pad_20_to_32(dest_token_service), 
            pad_20_to_32(dest_token_address), 
            self.caller,
            pad_20_to_32(receiver),
            amount
        );

        return then finalize (self.caller, token_id, amount, chain_token_info, dest_token_address, dest_token_service);
    }

    finalize token_send(from: address, wrapped_token_id: field, amount: u128, chain_token_info:ChainToken, dest_token_address:[u8;20], dest_token_service:[u8;20]) {

        let min_amount: u128 = Mapping::get(min_transfers, wrapped_token_id);
        assert(amount >= min_amount);

        assert(Mapping::contains(other_chain_token_address, chain_token_info));
        let stored_token_address:[u8;32] = Mapping::get(other_chain_token_address, chain_token_info);
        assert_eq(stored_token_address, pad_20_to_32(dest_token_address));

        assert(Mapping::contains(other_chain_token_service, chain_token_info));
        let stored_token_service:[u8;32] = Mapping::get(other_chain_token_service, chain_token_info );
        assert_eq(stored_token_service, pad_20_to_32(dest_token_service));

        let max_amount: u128 = Mapping::get(max_transfers, wrapped_token_id);
        assert(amount <= max_amount);

        assert_eq(Mapping::get(token_status, wrapped_token_id), UNPAUSED_VALUE);

        let withdrawal_limit: WithdrawalLimit = Mapping::get(token_withdrawal_limits, wrapped_token_id);

        let current_supply: u128 = Mapping::get(total_supply, wrapped_token_id);
        let current_height: u32 = block.height;

        let max_withdrawal: u128 = get_x_percent_of_y(withdrawal_limit.percentage, current_supply);

        let allowed_withdrawal: u128 = Mapping::get_or_use(token_snapshot_withdrawal, wrapped_token_id, max_withdrawal);
        let snapshot_height: u32 = Mapping::get_or_use(token_snapshot_height, wrapped_token_id, 0u32);
        let amount_withdrawn: u128 = Mapping::get_or_use(token_amount_withdrawn, wrapped_token_id, 0u128);

        if ( current_height - snapshot_height > withdrawal_limit.duration) {
            Mapping::set(token_snapshot_withdrawal, wrapped_token_id, max_withdrawal);
            Mapping::set(token_snapshot_height, wrapped_token_id, current_height);
            Mapping::set(token_amount_withdrawn, wrapped_token_id, amount);

        } else {
            Mapping::set(token_amount_withdrawn, wrapped_token_id, amount_withdrawn+amount);

        }

        if (current_supply >= withdrawal_limit.threshold_no_limit) {
            let withdraw_amount:u128  = Mapping::get(token_amount_withdrawn, wrapped_token_id);
            let withdrawal_allowed:u128 = Mapping::get(token_snapshot_withdrawal, wrapped_token_id);
            assert(withdraw_amount <= withdrawal_allowed);
        }
        
        // Decrease the total supply
        Mapping::set(total_supply, wrapped_token_id, current_supply - amount);
    }

    /// Consumes msg from source at destination
    /// Requires sequence no of the source network
    transition token_receive(
        public sender: [u8; 20], 
        public token_id: field,
        public receiver: address, 
        public amount: u128, 
        public sequence: u64, 
        public height: u64, 
        public signers: [address; 5], 
        public signs: [signature; 5],
        public source_chain_id: u128, 
        public source_token_service_address: [u8; 20],
    ) -> public bool {

        // call consume on bridge
        let screening_passed: bool = token_bridge.aleo/consume(
            source_chain_id, 
            pad_20_to_32(source_token_service_address), 
            token_id, 
            pad_20_to_32(sender), 
            receiver, 
            amount, 
            sequence, 
            height, 
            signers, 
            signs
        );

        let chain_token_info: ChainToken = ChainToken{
            chain_id: source_chain_id,
            token_id: token_id
        };

        let actual_receiver: address = receiver;
        let held_amount: u128 = 0u128;

        if (!screening_passed) {
            actual_receiver = HOLDING_ADDRESS;
            held_amount = amount;
        }

        let minter:TokenOwner = TokenOwner{
            account: actual_receiver,
            token_id: token_id
        };
        let authorize_until:u32 = 4294967295u32;
        multi_token_support_program.aleo/mint_public(token_id, actual_receiver, amount, authorize_until);

        holding.aleo/hold_fund(receiver, token_id, held_amount);

        return screening_passed then finalize(token_id, amount, chain_token_info, source_token_service_address);
    }

    finalize token_receive(token_id: field, amount: u128, chain_token_info:ChainToken, source_token_service_address: [u8;20]) {

        assert_eq(Mapping::get(token_status, token_id), UNPAUSED_VALUE);

        assert(Mapping::contains(other_chain_token_service, chain_token_info));
        let stored_token_service:[u8;32] = Mapping::get(other_chain_token_service, chain_token_info );
        assert_eq(stored_token_service, pad_20_to_32(source_token_service_address));

        // Increase the total supply
        let current_supply: u128 = Mapping::get_or_use(total_supply, token_id, 0u128);
        Mapping::set(total_supply, token_id, current_supply + amount);

    }

    transition add_chain_to_existing_token(public chain_id: u128, public token_id: field, public token_service_address:[u8;20], public token_address:[u8;20]){
        let token_chain_info:ChainToken = ChainToken{
            token_id:token_id,
            chain_id:chain_id
        };
        return then finalize(self.caller, token_chain_info, token_service_address, token_address);
    }

    finalize add_chain_to_existing_token(from:address, token_chain_info: ChainToken, token_service_address:[u8;20], token_address:[u8;20]){
        // token should have already been registered previously, otherwise use add_token_ts. 
        assert(Mapping::get(added_tokens, token_chain_info.token_id));
        // only council(owner) should be able to call this
        assert_eq(from, Mapping::get(owner_TS, true));
        //set these mappings with addresses.
        Mapping::set(other_chain_token_service, token_chain_info, pad_20_to_32(token_service_address));
        Mapping::set(other_chain_token_address, token_chain_info, pad_20_to_32(token_address));
    }


    const HUNDRED_PERCENTAGE: u16 = 100_00u16;

    // x_percent: percentage representation in basis point
    // y: actual value
    inline get_x_percent_of_y(x_percent: u16, y: u128) -> u128 {
        assert(x_percent <= HUNDRED_PERCENTAGE);
        let z: u128 = (y *  (x_percent as u128)) / ( HUNDRED_PERCENTAGE as u128);
        return z;
    }

    transition holding_release(public token_id: field, public receiver: address, public amount: u128) {
        holding.aleo/release_fund(receiver, token_id, amount);
    }

    
    inline pad_20_to_32(unpadded: [u8; 20]) -> [u8; 32] {
        return [
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            0u8,
            unpadded[0u32],
            unpadded[1u32],
            unpadded[2u32],
            unpadded[3u32],
            unpadded[4u32],
            unpadded[5u32],
            unpadded[6u32],
            unpadded[7u32],
            unpadded[8u32],
            unpadded[9u32],
            unpadded[10u32],
            unpadded[11u32],
            unpadded[12u32],
            unpadded[13u32],
            unpadded[14u32],
            unpadded[15u32],
            unpadded[16u32],
            unpadded[17u32],
            unpadded[18u32],
            unpadded[19u32],
        ];
    }

}

