// The 'token_service' program.

import token_bridge_v0001.aleo;

program token_service_v0001.aleo {

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

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize the token service program
    /// Note: This function must be allowed to be called only once.
    transition initialize_ts(owner: address) {
        return then finalize(owner);
    }

    finalize initialize_ts(owner: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(owner_TS, true));

        // Set the owner program
        Mapping::set(owner_TS, true, owner);

    }

    ////////////////////////////////
    ///// Transfer Ownership ///////
    ////////////////////////////////

    /// Update the existing owner
    /// Can only be called from owner program
    transition transfer_ownership_ts(public new_governance: address) {
        return then finalize(self.caller, new_governance);
    }

    finalize transfer_ownership_ts(from: address, new_governance: address) {
        // Get the owner address
        // If program not initialized, this fails
        let governance: address = Mapping::get(owner_TS, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::set(owner_TS, true, new_governance);
    }

    //////////////////////////////////
    ///// Add/Remove Token ///////
    //////////////////////////////////

    transition add_token_ts(
        public token_id: address, 
        public token_connector: address, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public percentage: u16, 
        public duration: u32,
        public threshold_no_limit: u128
    ) {
        // TODO: 
        // 1. handle limits - max amounts that can be withdrawn in given time
        // 2. handle fees
        assert(max_transfer >= min_transfer);
        return then finalize(self.caller, token_id, token_connector, min_transfer, max_transfer, percentage, duration, threshold_no_limit);
    }

    finalize add_token_ts(
        from: address, 
        token_id: address, 
        token_connector: address, 
        min_transfer: u128, 
        max_transfer: u128,
        percentage: u16, 
        duration: u32,
        threshold_no_limit: u128
    ) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        let withdrawal_limit: WithdrawalLimit = WithdrawalLimit {
            percentage,
            duration,
            threshold_no_limit
        };

        Mapping::set(token_withdrawal_limits, token_id, withdrawal_limit);

        Mapping::set(min_transfers, token_id, min_transfer);
        Mapping::set(max_transfers, token_id, max_transfer);
        
        Mapping::set(token_connectors, token_id, token_connector);
    }

    transition remove_token_ts(public token_id: address) {
        return then finalize(self.caller, token_id);
    }

    finalize remove_token_ts(from: address, token_id: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        assert(Mapping::contains(token_withdrawal_limits, token_id));
        Mapping::remove(token_withdrawal_limits, token_id);
        Mapping::remove(min_transfers, token_id);
        Mapping::remove(token_connectors, token_id);
    }

    transition update_connector_ts(token_id: address, new_token_connector: address) { 
        return then finalize(self.caller, token_id, new_token_connector);
    }

    finalize update_connector_ts(from: address, token_id: address, new_token_connector: address) {
        // If the token is not supported, this fails
        let current_token_connector: address = Mapping::get(token_connectors, token_id);
        assert_eq(from, current_token_connector);

        Mapping::set(token_connectors, token_id, new_token_connector);
    }


    /////////////////////////////////////
    ///// Update Minimum Transfer ///////
    ////////////////////////////////////

    transition update_min_transfer_ts(public token_id: address, min_transfer: u128) {
        return then finalize(self.caller, token_id, min_transfer);
    }

    finalize update_min_transfer_ts(from: address, token_id: address, min_transfer: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::set(min_transfers, token_id, min_transfer);
    }

    /////////////////////////////////////
    ///// Update Maximum Transfer ///////
    ////////////////////////////////////

    transition update_max_transfer_ts(public token_id: address, max_transfer: u128) {
        return then finalize(self.caller, token_id, max_transfer);
    }

    finalize update_max_transfer_ts(from: address, token_id: address, max_transfer: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::set(max_transfers, token_id, max_transfer);
    }



    /////////////////////////////////////
    ///// Update Withdrawal Limit ///////
    /////////////////////////////////////

    transition update_withdrawal_limit(public token_id: address, public percentage: u16, public duration: u32, public threshold_no_limit: u128) {
        assert(percentage <= HUNDRED_PERCENTAGE);
        return then finalize(self.caller, token_id, percentage, duration, threshold_no_limit);
    }

    finalize update_withdrawal_limit(from: address, token_id: address, percentage: u16, duration: u32, threshold_no_limit: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);
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
        public token_id: address, 
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

        // TODO
        // 1. Handle fees 
        //   a. Percentage / Flat fee
        //   b. Based on token being transferred / credits

        // call publish on bridge contract
        token_bridge_v0001.aleo/publish(origin_chain_id, origin_token_service_address, origin_token_address, sender, receiver, amount);

        return then finalize (self.caller, token_id, amount);
    }

    finalize token_send(from: address, wrapped_addr: address, amount: u128) {

        let token_connector: address = Mapping::get(token_connectors, wrapped_addr);
        assert_eq(from, token_connector);

        let min_amount: u128 = Mapping::get(min_transfers, wrapped_addr);
        assert(amount >= min_amount);

        let max_amount: u128 = Mapping::get(max_transfers, wrapped_addr);
        assert(amount <= max_amount);

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
        public source_token_address: [u8; 32], 
        public token_id: address, 
        public sender: [u8; 32], 
        public receiver: address, 
        public actual_receiver: address, 
        public amount: u128, 
        public sequence_no_of_source_network: u64, 
        public height_of_source_network: u32, 
        signers: [address; 5], 
        signs: [signature; 5]
    ) {

        // Assert that only a connector program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);


        // call consume on bridge
        token_bridge_v0001.aleo/consume(
            source_chain_id, 
            source_token_service_address, 
            token_id, sender, 
            receiver, 
            actual_receiver, 
            amount, 
            sequence_no_of_source_network, 
            height_of_source_network, 
            signers, 
            signs
        );

        return then finalize(self.caller, token_id, amount);
    }

    finalize token_receive(connector: address, token_id: address, amount: u128) {
        let token_connector: address = Mapping::get(token_connectors, token_id);
        assert_eq(token_connector, connector);

        // Increase the total supply
        let current_supply: u128 = Mapping::get_or_use(total_supply, token_id, 0u128);
        Mapping::set(total_supply, token_id, current_supply + amount);

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

