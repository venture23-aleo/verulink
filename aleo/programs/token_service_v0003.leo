// The 'token_service' program.

import token_bridge_v0003.aleo;
import mtsp.aleo;
import holding_v0003.aleo;
import council.aleo;

program token_service_v0003.aleo {

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

    ////////////////////////////////////
    ///// Register token to MTSP ///////
    ////////////////////////////////////
    transition register_token(
        public token_name: u128,
        public symbol: u128,
        public decimals: u8,
        public max_supply: u128
    )-> field {
        let token_id: field = BHP256::hash_to_field(token_name);
        mtsp.aleo/register_token();
        return token_id then finalize(self.caller);
    }
    finalize register_token(from:address){
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);
    }

    //////////////////////////////////
    ///// Add/Remove Token ///////
    //////////////////////////////////

    transition add_token_ts(
        public token_id: field, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public percentage: u16, 
        public duration: u32,
        public threshold_no_limit: u128,
        // corresponding token addresses and token service from the eth side.
    ) {
        assert(max_transfer >= min_transfer);
        assert(percentage <= HUNDRED_PERCENTAGE);
        return then finalize(self.caller, token_id, min_transfer, max_transfer, percentage, duration, threshold_no_limit);
    }

    finalize add_token_ts(
        from: address, 
        token_id: field, 
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

        assert(!Mapping::contains(added_tokens, token_id));
        Mapping::set(added_tokens, token_id, true);
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
        Mapping::remove(token_withdrawal_limits, token_id);
        Mapping::remove(min_transfers, token_id);
        Mapping::remove(max_transfers, token_id);
        Mapping::remove(token_status, token_id);
    }


    // transition update_connector_ts(public token_address: address, public new_token_connector: address) { 
    //     return then finalize(self.caller, token_address, new_token_connector);
    // }

    // finalize update_connector_ts(from: address, token_address: address, new_token_connector: address) {
    //     // If the token is not supported, this must fail
    //     let current_token_connector: address = Mapping::get(token_connectors, token_address);
    //     assert_eq(from, current_token_connector);

    //     Mapping::set(token_connectors, token_address, new_token_connector);
    // }

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
        public amount: u128
    ) {

        let owner:TokenOwner = TokenOwner{
            account: self.caller,
            token_id:token_id
        };
        mtsp.aleo/burn_public(owner, amount);
        token_bridge_v0003.aleo/publish(
            origin_chain_id(), 
            origin_token_service_address(), 
            origin_token_address(), 
            self.caller,
            pad_20_to_32(receiver),
            amount
        );

        return then finalize (self.caller, token_id, amount);
    }

    finalize token_send(from: address, wrapped_token_id: field, amount: u128) {

        let min_amount: u128 = Mapping::get(min_transfers, wrapped_token_id);
        assert(amount >= min_amount);

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
            // allowed_withdrawal=max_withdrawal;
            // snapshot_height = current_height;
            // amount_withdrawn = amount;
            Mapping::set(token_snapshot_withdrawal, wrapped_token_id, max_withdrawal);
            Mapping::set(token_snapshot_height, wrapped_token_id, current_height);
            Mapping::set(token_amount_withdrawn, wrapped_token_id, amount);

        } else {
            // amount_withdrawn = amount_withdrawn + amount;
            Mapping::set(token_snapshot_withdrawal, wrapped_token_id, allowed_withdrawal);
            Mapping::set(token_snapshot_height, wrapped_token_id, snapshot_height);
            Mapping::set(token_amount_withdrawn, wrapped_token_id, amount_withdrawn+amount);

        }

        if (current_supply >= withdrawal_limit.threshold_no_limit) {
            assert(amount_withdrawn <= allowed_withdrawal);
        }

        // Mapping::set(token_snapshot_withdrawal, wrapped_addr, allowed_withdrawal);
        // Mapping::set(token_snapshot_height, wrapped_addr, snapshot_height);
        // Mapping::set(token_amount_withdrawn, wrapped_addr, amount_withdrawn);
        
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
        public signs: [signature; 5]
        // public source_chain_id: u128, 
        // public source_token_service_address: [u8; 32], 
        // public token_address: address, 
    ) -> bool {

        // call consume on bridge
        let screening_passed: bool = token_bridge_v0003.aleo/consume(
            origin_chain_id(), 
            origin_token_service_address(), 
            token_id, 
            pad_20_to_32(sender), 
            receiver, 
            amount, 
            sequence, 
            height, 
            signers, 
            signs
        );
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
        mtsp.aleo/mint_public(token_id, actual_receiver, amount, authorize_until);

        holding_v0003.aleo/hold_fund(receiver, token_id, held_amount);

        return screening_passed then finalize(self.caller, token_id, amount);
    }

    finalize token_receive(connector: address, token_id: field, amount: u128) {

        assert_eq(Mapping::get(token_status, token_id), UNPAUSED_VALUE);

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

    transition wusdc_release(public proposal_id: u32, public token_id: field, public receiver: address, public amount: u128, public voters: [address; 5]) {
        council.aleo/holding_release(proposal_id, token_id, receiver, amount, voters);
        holding_v0003.aleo/release_fund(receiver, token_id, amount);
    }


    // Chain Id of the network
    // Chain Id is generated as {network_type}:{chain_id} where `network_id` is represented as ASCII and `chain_id` is a number, `:` is separator
    // For Ethereum Sepolia testnet, chain_id: `eth:11155111` -> 28556963657430695
    inline origin_chain_id() -> u128 {
        return 28556963657430695u128;
    }

    // Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formatted as following:
    inline origin_token_address() -> [u8; 32] {
        return [0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 211u8, 66u8, 192u8, 49u8, 69u8, 60u8, 102u8, 166u8, 214u8, 194u8, 162u8, 61u8, 109u8, 168u8, 108u8, 48u8, 173u8, 160u8, 140u8, 121u8];
    }

    // Token Service Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formatted as following:
    inline origin_token_service_address() -> [u8; 32] {
        return [0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 37u8, 138u8, 119u8, 59u8, 25u8, 252u8, 200u8, 149u8, 142u8, 12u8, 225u8, 177u8, 177u8, 60u8, 131u8, 10u8, 80u8, 186u8, 124u8, 17u8];
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
            unpadded[1u32],origin_token_service_address
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

