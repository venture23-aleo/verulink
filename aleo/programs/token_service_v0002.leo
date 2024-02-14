// The 'token_service' program.

import token_bridge_v0002.aleo;

program token_service_v0002.aleo {

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


    /// Stores the owner of this program
    /// The owner can be another program or wallet
    /// key = true: returns the address of the owner
    /// key = false: returns Null
    mapping owner_TS: bool => address;

    /// Stores the total supply of the token
    /// Key is the address of the token program
    mapping total_supply: address => u128;

    /// Stores the address of connector for a given token
    /// Key is the address of the token program
    mapping token_connectors: address => address;

    /// Stores the minimum amount that can be transferred via Token Service
    /// Key is address of the token program
    mapping min_transfers: address => u128;

    /// Stores the minimum amount that can be transferred via Token Service
    /// Key is address of the token program
    mapping max_transfers: address => u128;

    /// Stores the maximum percentage that can be transferred in the given duration
    /// Key is the address of the token program
    mapping token_withdrawal_limits: address => WithdrawalLimit;
    
    /// Tracks the maximum amount that can be withdrawn until the next snapshot
    /// Key is the address of the token program
    mapping token_snapshot_withdrawal: address => u128;

    /// Tracks the height when the last snapshot happened
    /// Key is the address of the token program
    mapping token_snapshot_height: address => u32;

    /// Tracks the amount withdrawn between the snapshots
    /// Key is the address of the token program
    mapping token_amount_withdrawn: address => u128;

    /// Tracks if the token is paused/unpaused
    /// Key is the address of the token program
    mapping token_status: address => bool;

    const OWNER_INDEX: bool = true;
    const PAUSED_VALUE: bool = true;
    const UNPAUSED_VALUE: bool = false;

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

    //////////////////////////////////
    ///// Add/Remove Token ///////
    //////////////////////////////////

    transition add_token_ts(
        public token_address: address, 
        public token_connector: address, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public percentage: u16, 
        public duration: u32,
        public threshold_no_limit: u128
    ) {
        assert(max_transfer >= min_transfer);
        return then finalize(self.caller, token_address, token_connector, min_transfer, max_transfer, percentage, duration, threshold_no_limit);
    }

    finalize add_token_ts(
        from: address, 
        token_address: address, 
        token_connector: address, 
        min_transfer: u128, 
        max_transfer: u128,
        percentage: u16, 
        duration: u32,
        threshold_no_limit: u128
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

        assert(!Mapping::contains(token_connectors, token_address));
        Mapping::set(token_connectors, token_address, token_connector);
        Mapping::set(token_withdrawal_limits, token_address, withdrawal_limit);
        Mapping::set(min_transfers, token_address, min_transfer);
        Mapping::set(max_transfers, token_address, max_transfer);
        Mapping::set(token_status, token_address, PAUSED_VALUE);
    }

    transition remove_token_ts(public token_address: address) {
        return then finalize(self.caller, token_address);
    }

    finalize remove_token_ts(from: address, token_address: address) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_connectors, token_address));
        Mapping::remove(token_connectors, token_address);
        Mapping::remove(token_withdrawal_limits, token_address);
        Mapping::remove(min_transfers, token_address);
        Mapping::remove(max_transfers, token_address);
        Mapping::remove(token_status, token_address);
    }


    transition update_connector_ts(public token_address: address, public new_token_connector: address) { 
        return then finalize(self.caller, token_address, new_token_connector);
    }

    finalize update_connector_ts(from: address, token_address: address, new_token_connector: address) {
        // If the token is not supported, this must fail
        let current_token_connector: address = Mapping::get(token_connectors, token_address);
        assert_eq(from, current_token_connector);

        Mapping::set(token_connectors, token_address, new_token_connector);
    }

    /////////////////////////////////
    ///// Pause/Unpause Token ///////
    /////////////////////////////////

    transition pause_token_ts(public token_address: address) {
        return then finalize(self.caller, token_address);
    }

    finalize pause_token_ts(from: address, token_address: address) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_status, token_address));
        Mapping::set(token_status, token_address, PAUSED_VALUE);
    }

    transition unpause_token_ts(public token_address: address) {
        return then finalize(self.caller, token_address);
    }

    finalize unpause_token_ts(from: address, token_address: address) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_status, token_address));
        Mapping::set(token_status, token_address, UNPAUSED_VALUE);
    }

    /////////////////////////////////////
    ///// Update Minimum Transfer ///////
    ////////////////////////////////////

    transition update_min_transfer_ts(public token_address: address, public min_transfer: u128) {
        return then finalize(self.caller, token_address, min_transfer);
    }

    finalize update_min_transfer_ts(from: address, token_address: address, min_transfer: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(min_transfers, token_address));
        Mapping::set(min_transfers, token_address, min_transfer);
    }

    /////////////////////////////////////
    ///// Update Maximum Transfer ///////
    ////////////////////////////////////

    transition update_max_transfer_ts(public token_address: address, public max_transfer: u128) {
        return then finalize(self.caller, token_address, max_transfer);
    }

    finalize update_max_transfer_ts(from: address, token_address: address, max_transfer: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(max_transfers, token_address));
        Mapping::set(max_transfers, token_address, max_transfer);
    }



    /////////////////////////////////////
    ///// Update Withdrawal Limit ///////
    /////////////////////////////////////

    transition update_withdrawal_limit(public token_address: address, public percentage: u16, public duration: u32, public threshold_no_limit: u128) {
        assert(percentage <= HUNDRED_PERCENTAGE);
        return then finalize(self.caller, token_address, percentage, duration, threshold_no_limit);
    }

    finalize update_withdrawal_limit(from: address, token_address: address, percentage: u16, duration: u32, threshold_no_limit: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_withdrawal_limits, token_address));
        let withdrawal_limit: WithdrawalLimit = WithdrawalLimit {
            percentage,
            duration,
            threshold_no_limit
        };
        Mapping::set(token_withdrawal_limits, token_address, withdrawal_limit);
    }

    /////////////////////////////
    ///// Token Transfers ///////
    /////////////////////////////

    transition token_send(
        public token_address: address, 
        public sender: address, 
        public receiver: [u8; 32], 
        public amount: u128, 
        public origin_chain_id: u128, 
        public origin_token_address: [u8; 32], 
        public origin_token_service_address: [u8; 32]
    ) {
        // Assert that only a connector program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);

        // call publish on bridge contract
        token_bridge_v0002.aleo/publish(origin_chain_id, origin_token_service_address, origin_token_address, sender, receiver, amount);

        return then finalize (self.caller, token_address, amount);
    }

    finalize token_send(from: address, wrapped_addr: address, amount: u128) {

        let token_connector: address = Mapping::get(token_connectors, wrapped_addr);
        assert_eq(from, token_connector);

        let min_amount: u128 = Mapping::get(min_transfers, wrapped_addr);
        assert(amount >= min_amount);

        let max_amount: u128 = Mapping::get(max_transfers, wrapped_addr);
        assert(amount <= max_amount);

        assert_eq(Mapping::get(token_status, wrapped_addr), UNPAUSED_VALUE);

        let withdrawal_limit: WithdrawalLimit = Mapping::get(token_withdrawal_limits, wrapped_addr);

        let current_supply: u128 = Mapping::get(total_supply, wrapped_addr);
        let current_height: u32 = block.height;

        let max_withdrawal: u128 = get_x_percent_of_y(withdrawal_limit.percentage, current_supply);

        let allowed_withdrawal: u128 = Mapping::get_or_use(token_snapshot_withdrawal, wrapped_addr, max_withdrawal);
        let snapshot_height: u32 = Mapping::get_or_use(token_snapshot_height, wrapped_addr, 0u32);
        let amount_withdrawn: u128 = Mapping::get_or_use(token_amount_withdrawn, wrapped_addr, 0u128);

        if ( current_height - snapshot_height > withdrawal_limit.duration) {
            allowed_withdrawal = max_withdrawal;
            snapshot_height = current_height;
            amount_withdrawn = amount;
        } else {
            amount_withdrawn = amount_withdrawn + amount;
        }

        if (current_supply >= withdrawal_limit.threshold_no_limit) {
            assert(amount_withdrawn <= allowed_withdrawal);
        }

        Mapping::set(token_snapshot_withdrawal, wrapped_addr, allowed_withdrawal);
        Mapping::set(token_snapshot_height, wrapped_addr, snapshot_height);
        Mapping::set(token_amount_withdrawn, wrapped_addr, amount_withdrawn);
        
        // Decrease the total supply
        Mapping::set(total_supply, wrapped_addr, current_supply - amount);
    }

    /// Consumes msg from source at destination
    /// Requires sequence no of the source network
    transition token_receive(
        public source_chain_id: u128, 
        public source_token_service_address: [u8; 32], 
        public token_address: address, 
        public sender: [u8; 32], 
        public receiver: address, 
        public amount: u128, 
        public sequence_no_of_source_network: u64, 
        public height_of_source_network: u64, 
        public signers: [address; 5], 
        public signs: [signature; 5]
    ) -> bool {

        // Assert that only a connector program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);


        // call consume on bridge
        let screening_passed: bool = token_bridge_v0002.aleo/consume(
            source_chain_id, 
            source_token_service_address, 
            token_address, 
            sender, 
            receiver, 
            amount, 
            sequence_no_of_source_network, 
            height_of_source_network, 
            signers, 
            signs
        );

        return screening_passed then finalize(self.caller, token_address, amount);
    }

    finalize token_receive(connector: address, token_address: address, amount: u128) {
        let token_connector: address = Mapping::get(token_connectors, token_address);
        assert_eq(token_connector, connector);

        assert_eq(Mapping::get(token_status, token_address), UNPAUSED_VALUE);

        // Increase the total supply
        let current_supply: u128 = Mapping::get_or_use(total_supply, token_address, 0u128);
        Mapping::set(total_supply, token_address, current_supply + amount);

    }


    const HUNDRED_PERCENTAGE: u16 = 100_00u16;

    // x_percent: percentage representation in basis point
    // y: actual value
    inline get_x_percent_of_y(x_percent: u16, y: u128) -> u128 {
        assert(x_percent <= HUNDRED_PERCENTAGE);
        let z: u128 = (y *  (x_percent as u128)) / ( HUNDRED_PERCENTAGE as u128);
        return z;
    }

}

