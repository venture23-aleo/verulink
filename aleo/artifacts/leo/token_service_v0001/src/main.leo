// The 'token_service' program.

import token_bridge_v0001.aleo;

program token_service_v0001.aleo {

    // key is chain_id
    // value is address of the token service contract on chain (with chain_id)
    mapping token_service_contracts: u128 => [u8; 32];

    // mapping used as variable
    // true: address of owner
    // false: Null
    mapping owner_TS: bool => address;

    // tracks the total supply of the token
    mapping total_supply: address => u128;

    // key is token_id
    mapping token_connectors: address => address;

    // minimum amount that can be transferred via Token Service
    // represented as actual value
    // key is token_id
    mapping minimum_transfers: address => u128;

    // TODO: Check if this makes sense as global variable instead of per_token basis
    struct OutgoingPercentageInTime {
        outgoing_percentage: u16, // represented as basis points; 10% = 10_00
        timeframe: u32 // defined in terms of block height
    }
    // maximum percentage that can be transferred in the given timeframe
    // key is token_id
    mapping max_outgoing_percentage: address => OutgoingPercentageInTime;
    
    // maximum liquidity after which we do not care about max_outgoing_percentage
    // key is token_id
    mapping maximum_liquidity_for_no_cap: address => u32;

    // tracks the last time the token was minted/burned
    mapping last_token_update: address => u32;
    // tracks the minimum supply that should be available after the token update
    mapping last_min_supply: address => u128;

    inline max_basis_point() -> u16 {
        return 10000u16;
    }

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
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

    transition support_chain_ts(public chain_id: u128, public token_service_address: [u8; 32]) {
        return then finalize(self.caller, chain_id, token_service_address);
    }

    finalize support_chain_ts(from: address, chain_id: u128, token_service_address: [u8; 32]) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::set(token_service_contracts, chain_id, token_service_address);
    }

    transition remove_chain_ts(public chain_id: u128) {
        return then finalize(self.caller, chain_id);
    }

    finalize remove_chain_ts(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::remove(token_service_contracts, chain_id);
    }


    transition support_token_ts(public token_id: address, public token_connector: address, public minimum_transfer: u128, public outgoing_percentage: u16, public timeframe: u32) {
        // TODO: 
        // 1. handle limits - max amounts that can be withdrawn in given time
        // 2. handle fees
        return then finalize(self.caller, token_id, token_connector, minimum_transfer, outgoing_percentage, timeframe);
    }

    finalize support_token_ts(from: address, token_id: address, token_connector: address, minimum_transfer: u128, outgoing_percentage: u16, timeframe: u32) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        let outgoing_percentage_in_time: OutgoingPercentageInTime = OutgoingPercentageInTime {
            outgoing_percentage,
            timeframe
        };

        Mapping::set(max_outgoing_percentage, token_id, outgoing_percentage_in_time);

        Mapping::set(minimum_transfers, token_id, minimum_transfer);
        
        Mapping::set(token_connectors, token_id, token_connector);
    }

    transition update_token_connector_ts(public token_id: address, public new_token_connector: address) {
        // TODO: 
        // 1. handle limits - max amounts that can be withdrawn in given time
        // 2. handle fees
        return then finalize(self.caller, token_id, new_token_connector);
    }

    finalize update_token_connector_ts(from: address, token_id: address, new_token_connector: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::set(token_connectors, token_id, new_token_connector);
    }


    transition remove_token_ts(public token_id: address) {
        return then finalize(self.caller, token_id);
    }

    finalize remove_token_ts(from: address, token_id: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::remove(max_outgoing_percentage, token_id);
        Mapping::remove(minimum_transfers, token_id);
        Mapping::remove(token_connectors, token_id);
    }

    transition update_token_connector(token_id: address, token_connector: address) { 
        return then finalize(self.caller, token_id, token_connector);
    }
    finalize update_token_connector(from: address, token_id: address, token_connector: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::set(token_connectors, token_id, token_connector);
    }

    transition update_minimum_transfer_ts(public token_id: address, minimum_transfer: u128) {
        return then finalize(self.caller, token_id, minimum_transfer);
    }

    finalize update_minimum_transfer_ts(from: address, token_id: address, minimum_transfer: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);

        Mapping::set(minimum_transfers, token_id, minimum_transfer);
    }


    transition update_outgoing_percentage_ts(public token_id: address, outgoing_percentage: u16, timeframe: u32) {
        assert(outgoing_percentage <= HUNDRED_PERCENTAGE);
        return then finalize(self.caller, token_id, outgoing_percentage, timeframe);
    }

    finalize update_outgoing_percentage_ts(from: address, token_id: address, outgoing_percentage: u16, timeframe: u32) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(from, owner);
        let outgoing_percentage_in_time: OutgoingPercentageInTime = OutgoingPercentageInTime {
            outgoing_percentage,
            timeframe
        };

        Mapping::set(max_outgoing_percentage, token_id, outgoing_percentage_in_time);
    }

    transition token_send(public token_id: address, public receiver: [u8; 32], public amount: u128, public origin_chain_id: u128, origin_token_address: [u8; 32], origin_token_service_address: [u8; 32]) {
        // Assert that only a connector program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);

        // TODO
        // If fee is set require credits token for publishing

        // call publish on bridge contract
        token_bridge_v0001.aleo/publish(origin_chain_id, origin_token_service_address, origin_token_address, self.caller, receiver, amount);

        return then finalize (self.caller, token_id, amount);
    }

    finalize token_send(connector: address, wrapped_addr: address, amount: u128) {

        let token_connector: address = Mapping::get(token_connectors, wrapped_addr);
        assert_eq(token_connector, connector);

        let min_amount: u128 = Mapping::get(minimum_transfers, wrapped_addr);
        assert(amount >= min_amount);

        // TODO: 
        // 1. handle fees

        let current_supply: u128 = Mapping::get(total_supply, wrapped_addr);
        
        let outgoing_percentage_in_time: OutgoingPercentageInTime = Mapping::get(max_outgoing_percentage, wrapped_addr);
        let percentage_in_basis_points: u16 = outgoing_percentage_in_time.outgoing_percentage;
        let token_timeframe: u32 = outgoing_percentage_in_time.timeframe;
        let min_required_supply: u128 = get_x_percent_of_y(HUNDRED_PERCENTAGE - percentage_in_basis_points, current_supply);
        let last_update: u32 = Mapping::get_or_use(last_token_update, wrapped_addr, 0u32);
        let last_min_required_supply: u128 = Mapping::get_or_use(last_min_supply, wrapped_addr, min_required_supply);

        let current_block_height: u32 = block.height;

        let new_min_required_supply: u128 = get_new_min_required_supply(
            current_supply, 
            amount, 
            current_block_height, 
            last_update, 
            last_min_required_supply, 
            percentage_in_basis_points, 
            token_timeframe
        );

        Mapping::set(last_token_update, wrapped_addr, block.height);
        Mapping::set(last_min_supply, wrapped_addr, new_min_required_supply);
        
        // Decrease the total supply
        Mapping::set(total_supply, wrapped_addr, current_supply - amount);
    }

    /// Consumes msg from source at destination
    /// Requires sequence no of the source network
    transition token_receive(source_chain_id: u128, source_token_service_address: [u8; 32], source_token_address: [u8; 32], public token_id: address, public sender: [u8; 32], public receiver: address, public actual_receiver: address, public amount: u128, public sequence_no_of_source_network: u64, public height_of_source_network: u32) {

        // Assert that only a connector program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);


        // call consume on bridge
        token_bridge_v0001.aleo/consume(source_chain_id, source_token_service_address, token_id, sender, receiver, actual_receiver, amount, sequence_no_of_source_network, height_of_source_network);

        return then finalize(self.caller, token_id, amount);
    }

    finalize token_receive(connector: address, token_id: address, amount: u128) {
        let token_connector: address = Mapping::get(token_connectors, token_id);
        assert_eq(token_connector, connector);

        // Increase the total supply
        let current_supply: u128 = Mapping::get_or_use(total_supply, token_id, 0u128);
        Mapping::set(total_supply, token_id, current_supply + amount);

    }

    inline sub_to_zero(a: u128, b: u128) -> u128 {
        let c: u128 = a > b ? a.sub_wrapped(b) : 0u128;
        return c;
    }
    inline get_max(a: u128, b: u128) -> u128 {
        let max: u128 = a > b ? a : b;
        return max;
    }

    const HUNDRED_PERCENTAGE: u16 = 100_00u16;

    // x_percent: percentage representation in basis point
    // y: actual value
    inline get_x_percent_of_y(x_percent: u16, y: u128) -> u128 {
        assert(x_percent <= HUNDRED_PERCENTAGE);
        let z: u128 = (y *  (x_percent as u128)) / ( HUNDRED_PERCENTAGE as u128);
        return z;
    }

    // TODO: verify this logic
    inline get_new_min_required_supply(current_supply: u128, transfer_amount: u128, current_block: u32, last_update: u32, last_min_required_supply: u128, percentage: u16, timeframe: u32 ) -> u128 {
        // If percentage = 10
        // then min_required_supply = 90% of current_supply
        let min_required_supply: u128 = get_x_percent_of_y(HUNDRED_PERCENTAGE - percentage, current_supply);

        // If percentage = 10
        // then max_withdraw = 10% of current_supply
        let max_withdraw_in_timeframe: u128 = get_x_percent_of_y(percentage, current_supply);

        let time_passed: u32 = current_block - last_update;

        let max_withdraw_from_last_update: u128 = (max_withdraw_in_timeframe * time_passed as u128 ) / ( timeframe as u128);
        let new_min_required_supply: u128 = sub_to_zero(last_min_required_supply, max_withdraw_from_last_update);

        // Select the max
        new_min_required_supply = get_max(new_min_required_supply, min_required_supply);

        assert(current_supply - transfer_amount >= new_min_required_supply);

        return new_min_required_supply;
    }

}