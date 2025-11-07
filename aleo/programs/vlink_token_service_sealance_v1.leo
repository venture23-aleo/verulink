// The 'token_service' program.

import vlink_token_bridge_v2.aleo;
import vlink_holding_sealance_v1.aleo;
import sealed_report_token.aleo;

program vlink_token_service_sealance_v1.aleo {


    // for upgrade
    @noupgrade
    async constructor() {}

    struct WithdrawalLimit {
        // Withdrawal limit represented as basis points.
        // For example, 10% is represented as 1000 (10% = 10_00 in basis points).
        percentage: u32,
        // The duration for which the withdrawal limit is applicable, measured in block heights.
        // Info: 360 blocks per hour (approx) 
        // Reference: https://github.com/AleoHQ/snarkVM/blob/testnet3/console/network/src/lib.rs#L115
        duration: u32,
        // The liquidity amount beyond which the withdrawal limit does not apply.
        // This helps to address the increased difficulty in withdrawing as the available liquidity decreases.
        threshold_no_limit: u128,
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

    /// Stores the owner of this program
    /// The owner can be another program or wallet
    /// key = true: returns the address of the owner
    /// key = false: returns Null
    mapping owner_TS: bool => address;

    /// Stores the total supply of the token
    /// Key is the token_id of the token program
    mapping total_supply: field => u128;

    /// Stores whether the tokens are added to the service.
    mapping added_tokens: field => bool;

    /// Stores the minimum amount that can be transferred via Token Service
    /// Key is token_id of the token program
    mapping min_transfers: field => u128;

    /// Stores the maximum amount that can be transferred via Token Service
    /// Key is token_id of the token program
    mapping max_transfers: field => u128;

    /// Stores the maximum percentage that can be transferred in the given duration
    /// Key is the token_id of the token program
    mapping token_withdrawal_limits: field => WithdrawalLimit;
    
    /// Tracks the maximum amount that can be withdrawn until the next snapshot
    /// Key is the token_id of the token program
    mapping token_snapshot_supply: field => u128; 

    /// Tracks the height when the last snapshot happened
    /// Key is the token_id of the token program
    mapping token_snapshot_height: field => u32; 

    /// Tracks the amount withdrawn between the snapshots
    /// Key is the token_id of the token program
    mapping token_amount_withdrawn: field => u128; 

    /// Tracks if the token is paused/unpaused
    /// Key is the token_id of the token program
    mapping token_status: field => bool;

    /// Tracks the total amount of a certain token being held
    /// Key is the token_id of the token.
    mapping token_holding: field => u128;  // initialize

    /// Tracks the token service address of other chains
    /// Key is the combination of chain_id and token_id
    mapping other_chain_token_service: ChainToken => [u8; 32];  // token
    mapping other_chain_token_address: ChainToken => [u8; 32];     // token

    //percentage of the fee that will be taken by the platform
    mapping public_platform_fee: ChainToken => u32; // token

    // flat fee that will be taken by the relayer
    mapping public_relayer_fee: ChainToken => u128;  // token

    const OWNER_INDEX: bool = true;
    const PAUSED_VALUE: bool = true;
    const UNPAUSED_VALUE: bool = false;

    const HOLDING_ADDRESS: address = vlink_holding_sealance_v1.aleo;  //TODdont use address use name O: 

    const ZERO_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;

    const AUTHORIZE_UNTIL:u32 = 4294967295u32; //highest u32 value meaning our token will be valid forever
 
    const INITIALIZER_ADDRESS : address = aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px;

    const PUBLIC_PACKET_VERSION_LIMIT: u8 = 10u8; // the maximum version of the public packet that can be processed by this program    

    // This is kept for backward compatibility with the token bridge. Doesn't represent the token id in token registry.
    // This token id must be reserved in token registry
    const TOKEN_ID: field = 11111111111field;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    /// Initialize the token service program
    /// Note: This function must be allowed to be called only once.
    // total_supply, 
    async transition initialize_ts(public owner: address) -> Future {
        assert_eq(self.caller, INITIALIZER_ADDRESS);
        return finalize_initialize_ts(owner, self.caller);
    }

    async function finalize_initialize_ts(owner: address, caller: address) {
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
    async transition transfer_ownership_ts(public new_owner: address) -> Future{
        assert_neq(new_owner, ZERO_ADDRESS);
        return finalize_transfer_ownership_ts(self.caller, new_owner);
    }

    async function finalize_transfer_ownership_ts(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        Mapping::set(owner_TS, OWNER_INDEX, new_owner);
    }


    /////////////////////////////////////////////////
    ///// Update token_service of other chain ///////
    /////////////////////////////////////////////////
    async transition update_other_chain_tokenservice(
        public chain_id: u128,
        public token_service_address: [u8; 20]
    ) -> Future{
        return finalize_update_other_chain_TS(self.caller, chain_id, token_service_address);
    }
    async function finalize_update_other_chain_TS(from:address, chain_id:u128, token_service_address: [u8;20]){
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);
        let chaintokeninfo:ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: TOKEN_ID
        };
        assert(Mapping::contains(other_chain_token_service, chaintokeninfo));
        Mapping::set(other_chain_token_service, chaintokeninfo, pad_20_to_32(token_service_address));
    }

    /////////////////////////////////////////////////
    ///// Update token_address of other chain ///////
    /////////////////////////////////////////////////
    async transition update_other_chain_tokenaddress(
        public chain_id: u128,
        public token_address: [u8; 20]
    ) -> Future{
        return finalize_update_other_chain_TA(self.caller, chain_id, token_address);
    }
    async function finalize_update_other_chain_TA(from:address, chain_id:u128, token_address: [u8;20]){
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);
        let chaintokeninfo:ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: TOKEN_ID
        };
        assert(Mapping::contains(other_chain_token_address, chaintokeninfo));
        Mapping::set(other_chain_token_address, chaintokeninfo, pad_20_to_32(token_address));
    }

    /////////////////////////////////////////////////
    ///// Remove token_service of other chain ///////
    /////////////////////////////////////////////////
    async transition remove_other_chain_addresses(
        public chain_id: u128
    ) -> Future{
        return finalize_RM_other_chain_ADD(self.caller, chain_id);
    }
    async function finalize_RM_other_chain_ADD(from:address, chain_id:u128){
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);
        let chaintokeninfo:ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: TOKEN_ID
        };

        // check if other chain token service exists in the mapping and remove it.
        assert(Mapping::contains(other_chain_token_service, chaintokeninfo));
        Mapping::remove(other_chain_token_service, chaintokeninfo);
        // check if other chain token address exists in the mapping and remove it.
        assert(Mapping::contains(other_chain_token_address, chaintokeninfo));
        Mapping::remove(other_chain_token_address, chaintokeninfo);
    }


    ////////////////////////////////
    ///// Add/Remove Token /////////
    ////////////////////////////////

    async transition add_token_ts(
        public min_transfer: u128, 
        public max_transfer: u128, 
        public percentage: u32, 
        public duration: u32,
        public threshold_no_limit: u128,
        // corresponding token addresses and token service from other chain.
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128,
        public pub_platform_fee: u32,
        public pub_relayer_fee: u128,
    ) -> Future{
        assert(max_transfer >= min_transfer);
        assert(percentage <= HUNDRED_PERCENTAGE);
        assert(pub_platform_fee <= HUNDRED_PERCENTAGE);
        return finalize_add_token_ts(self.caller, min_transfer, max_transfer, percentage, duration, threshold_no_limit, token_address, token_service, chain_id, pub_platform_fee, pub_relayer_fee);
    }

    async function finalize_add_token_ts(
        from: address, 
        min_transfer: u128, 
        max_transfer: u128,
        percentage: u32, 
        duration: u32,
        threshold_no_limit: u128,
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128,
        public pub_platform_fee: u32,
        public pub_relayer_fee: u128,
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
            token_id: TOKEN_ID
        };

        assert(!Mapping::contains(added_tokens, TOKEN_ID));
        Mapping::set(added_tokens, TOKEN_ID, true);
        Mapping::set(other_chain_token_address, chain_token_info, pad_20_to_32(token_address));
        Mapping::set(other_chain_token_service, chain_token_info, pad_20_to_32(token_service));
        Mapping::set(token_withdrawal_limits, TOKEN_ID, withdrawal_limit);
        Mapping::set(min_transfers, TOKEN_ID, min_transfer);
        Mapping::set(max_transfers, TOKEN_ID, max_transfer);
        Mapping::set(token_status, TOKEN_ID, PAUSED_VALUE);
        Mapping::set(public_platform_fee, chain_token_info, pub_platform_fee);
        Mapping::set(public_relayer_fee, chain_token_info, pub_relayer_fee);
    }

    async transition remove_token_ts(public chain_id: u128) -> Future{
        return finalize_remove_token_ts(self.caller,chain_id);
    }

    async function finalize_remove_token_ts(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        let chain_token_info:ChainToken = ChainToken{
            chain_id: chain_id, 
            token_id: TOKEN_ID
        };

        assert(Mapping::contains(added_tokens, TOKEN_ID));
        Mapping::remove(added_tokens, TOKEN_ID);
        Mapping::remove(token_withdrawal_limits, TOKEN_ID);
        Mapping::remove(min_transfers, TOKEN_ID);
        Mapping::remove(max_transfers, TOKEN_ID);
        Mapping::remove(token_status, TOKEN_ID);
        Mapping::remove(public_platform_fee, chain_token_info);
        Mapping::remove(public_relayer_fee, chain_token_info);
    }

    /////////////////////////////////
    ///// Pause/Unpause Token ///////
    /////////////////////////////////

    async transition pause_token_ts() -> Future{
        return finalize_pause_token_ts(self.caller);
    }

    async function finalize_pause_token_ts(from: address) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_status, TOKEN_ID));
        Mapping::set(token_status, TOKEN_ID, PAUSED_VALUE);
    }

    async transition unpause_token_ts() -> Future{
        return finalize_unpause_token_ts(self.caller);
    }

    async function finalize_unpause_token_ts(from: address) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_status, TOKEN_ID));
        Mapping::set(token_status, TOKEN_ID, UNPAUSED_VALUE);
    }

    /////////////////////////////////////
    ///// Update Minimum Transfer ///////
    ////////////////////////////////////

    async transition update_min_transfer_ts(public min_transfer: u128) -> Future{
        return finalize_update_min_transfer_ts(self.caller, min_transfer);
    }

    async function finalize_update_min_transfer_ts(from: address, min_transfer: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        // Assert new min transfer is less than max_transfer
        let max_transfer:u128= Mapping::get(max_transfers, TOKEN_ID);
        assert(min_transfer<=max_transfer);

        assert(Mapping::contains(min_transfers, TOKEN_ID));
        Mapping::set(min_transfers, TOKEN_ID, min_transfer);
    }

    /////////////////////////////////////
    ///// Update Maximum Transfer ///////
    ////////////////////////////////////

    async transition update_max_transfer_ts(public max_transfer: u128) -> Future{
        return finalize_update_max_transfer_ts(self.caller, max_transfer);
    }

    async function finalize_update_max_transfer_ts(from: address, max_transfer: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        // Assert new min transfer is less than max_transfer
        let min_transfer:u128= Mapping::get(min_transfers, TOKEN_ID);
        assert(max_transfer>=min_transfer);

        assert(Mapping::contains(max_transfers, TOKEN_ID));
        Mapping::set(max_transfers, TOKEN_ID, max_transfer);
    }



    /////////////////////////////////////
    ///// Update Withdrawal Limit ///////
    /////////////////////////////////////

    async transition update_withdrawal_limit(public percentage: u32, public duration: u32, public threshold_no_limit: u128) -> Future{
        assert(percentage <= HUNDRED_PERCENTAGE);
        return finalize_update_WDL_limit(self.caller, percentage, duration, threshold_no_limit);
    }

    async function finalize_update_WDL_limit(from: address, percentage: u32, duration: u32, threshold_no_limit: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        assert(Mapping::contains(token_withdrawal_limits, TOKEN_ID));
        let withdrawal_limit: WithdrawalLimit = WithdrawalLimit {
            percentage,
            duration,
            threshold_no_limit
        };
        Mapping::set(token_withdrawal_limits, TOKEN_ID, withdrawal_limit);
    }

    /////////////////////////////
    ///// Token Transfers ///////
    /////////////////////////////

    async transition token_send_public(
        public receiver: [u8; 20], 
        public amount: u128,
        public dest_chain_id: u128,
        public dest_token_service: [u8;20],
        public dest_token_address: [u8;20],
        public fee_platform: u128,
        public is_relayer_on: bool
        ) -> Future{
        assert_neq(self.caller, ZERO_ADDRESS);
        let burn: Future = sealed_report_token.aleo/burn_public(self.caller, amount);

        // transferring platform fee to the token service
        let mint: Future = sealed_report_token.aleo/mint_public(vlink_council_v2.aleo, fee_platform);

        let chain_token_info: ChainToken = ChainToken{
            chain_id: dest_chain_id,
            token_id: TOKEN_ID
        };

        let version: u8 = is_relayer_on ? 2u8 : 1u8 ;

        let publish : Future = vlink_token_bridge_v2.aleo/publish(
            version,
            dest_chain_id, 
            pad_20_to_32(dest_token_service), 
            pad_20_to_32(dest_token_address), 
            self.caller,
            pad_20_to_32(receiver),
            amount - fee_platform        
        );

        return finalize_token_send_public(amount, chain_token_info, dest_token_address, dest_token_service, fee_platform, burn, mint, publish);
    }

    async function finalize_token_send_public(amount: u128, chain_token_info:ChainToken, dest_token_address:[u8;20], dest_token_service:[u8;20], fee_platform:u128, f0: Future, f1: Future, f2: Future) {
        f0.await();
        f1.await();
        f2.await();

        // ASSERT FEE OF AGRUMENT AND OF MAPPING
        let fee_in_percentage: u32 = Mapping::get(public_platform_fee, chain_token_info);
        let fee_in_amount: u128 = get_x_percent_of_y(fee_in_percentage, amount);
        assert_eq(fee_in_amount, fee_platform);

        let min_amount: u128 = Mapping::get(min_transfers, TOKEN_ID);
        assert(amount >= min_amount);

        assert(Mapping::contains(other_chain_token_address, chain_token_info));
        let stored_token_address:[u8;32] = Mapping::get(other_chain_token_address, chain_token_info);
        assert_eq(stored_token_address, pad_20_to_32(dest_token_address));

        assert(Mapping::contains(other_chain_token_service, chain_token_info));
        let stored_token_service:[u8;32] = Mapping::get(other_chain_token_service, chain_token_info );
        assert_eq(stored_token_service, pad_20_to_32(dest_token_service));

        let max_amount: u128 = Mapping::get(max_transfers, TOKEN_ID);
        assert(amount <= max_amount);

        assert_eq(Mapping::get(token_status, TOKEN_ID), UNPAUSED_VALUE);

        let withdrawal_limit: WithdrawalLimit = Mapping::get(token_withdrawal_limits, TOKEN_ID);

        let current_supply: u128 = Mapping::get(total_supply, TOKEN_ID);
        let current_height: u32 = block.height;


        let snapshot_height: u32 = Mapping::get_or_use(token_snapshot_height, TOKEN_ID, 0u32);
        let amount_withdrawn: u128 = Mapping::get_or_use(token_amount_withdrawn, TOKEN_ID, 0u128);

        if ( current_height - snapshot_height > withdrawal_limit.duration) {
            let held_amount:u128 = Mapping::get_or_use(token_holding, TOKEN_ID, 0u128);
            Mapping::set(token_snapshot_supply, TOKEN_ID, current_supply-held_amount);
            Mapping::set(token_snapshot_height, TOKEN_ID, current_height);
            Mapping::set(token_amount_withdrawn, TOKEN_ID, amount - fee_platform);

        } else {
            Mapping::set(token_amount_withdrawn, TOKEN_ID, amount_withdrawn + amount - fee_platform);

        }
        let snapshot_supply:u128 = Mapping::get(token_snapshot_supply, TOKEN_ID);

        if (snapshot_supply >= withdrawal_limit.threshold_no_limit) {
            let withdraw_amount:u128  = Mapping::get(token_amount_withdrawn, TOKEN_ID);
            let max_withdrawal: u128 = get_x_percent_of_y(withdrawal_limit.percentage, snapshot_supply);
            assert(withdraw_amount <= max_withdrawal);
        }
        
        // Decrease the total supply
        Mapping::set(total_supply, TOKEN_ID, current_supply - amount + fee_platform);

    }

    /// Consumes msg from source at destination
    /// Requires sequence no of the source network
    async transition token_receive_public(
        public sender: [u8; 20], 
        public receiver: address, 
        public amount: u128, 
        public sequence: u64, 
        public height: u64, 
        public signers: [address; 5], 
        public signs: [signature; 5],
        public source_chain_id: u128, 
        public source_token_service_address: [u8; 20],
        public fee_relayer: u128,
        public version: u8
    ) -> (public bool, Future) {
        assert_neq(self.caller, ZERO_ADDRESS);
        assert_neq(receiver, ZERO_ADDRESS);
        assert(version < PUBLIC_PACKET_VERSION_LIMIT );

        // call consume on bridge
        let screening_passed: (bool, Future) = vlink_token_bridge_v2.aleo/consume(
            version,
            source_chain_id, 
            pad_20_to_32(source_token_service_address), 
            TOKEN_ID, 
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
            token_id: TOKEN_ID
        };

        assert(amount >= fee_relayer); 

        let actual_receiver: address = receiver;
        let held_amount: u128 = 0u128;
        let fee_receiver: address = self.caller;

        if (!screening_passed.0) {
            actual_receiver = HOLDING_ADDRESS;
            held_amount = amount;
            fee_receiver = HOLDING_ADDRESS;
        }

        if (version == 1u8 || version == 3u8) {
            fee_receiver = actual_receiver;
        }

        // minting in relayer address
        let mint_relayer: Future = sealed_report_token.aleo/mint_public(fee_receiver, fee_relayer);

        let mint: Future = sealed_report_token.aleo/mint_public(actual_receiver, amount-fee_relayer);

        let hold: Future = vlink_holding_sealance_v1.aleo/hold_fund(receiver, held_amount);



        return (screening_passed.0, finalize_token_receive_public(amount, held_amount, chain_token_info, source_token_service_address, fee_relayer, screening_passed.1, mint_relayer, mint, hold));
    }

    async function finalize_token_receive_public(amount: u128, held_amount:u128, chain_token_info:ChainToken, source_token_service_address: [u8;20], fee_relayer:u128, f0: Future, f1: Future, f2: Future, f3: Future) {
        f0.await();
        f1.await();
        f2.await();
        f3.await();
        assert_eq(Mapping::get(token_status, TOKEN_ID), UNPAUSED_VALUE);

        assert(Mapping::contains(other_chain_token_service, chain_token_info));

        // comparing fee
        assert_eq(Mapping::get(public_relayer_fee, chain_token_info), fee_relayer);

        let stored_token_service:[u8;32] = Mapping::get(other_chain_token_service, chain_token_info );
        assert_eq(stored_token_service, pad_20_to_32(source_token_service_address));

        // Increase the total supply
        let current_supply: u128 = Mapping::get_or_use(total_supply, TOKEN_ID, 0u128);
        Mapping::set(total_supply, TOKEN_ID, current_supply + amount);

        // Increase the held amount
        let previously_held_amount:u128 = Mapping::get_or_use(token_holding, TOKEN_ID, 0u128);
        Mapping::set(token_holding, TOKEN_ID, previously_held_amount+held_amount);

    }

    async transition add_chain_to_existing_token(public chain_id: u128, public token_service_address:[u8;20], public token_address:[u8;20], public pub_platform_fee: u32, public pri_platform_fee: u32, public pub_relayer_fee: u128, public pri_relayer_fee: u128) -> Future{
        let chain_token_info:ChainToken = ChainToken{
            token_id:TOKEN_ID,
            chain_id:chain_id
        };
        assert(pub_platform_fee <= HUNDRED_PERCENTAGE);
        assert(pri_platform_fee <= HUNDRED_PERCENTAGE);
        return finalize_add_chain_to_EX_token(self.caller, chain_token_info, token_service_address, token_address, pub_platform_fee, pri_platform_fee, pub_relayer_fee, pri_relayer_fee);
    }

    async function finalize_add_chain_to_EX_token(from:address, chain_token_info: ChainToken, token_service_address:[u8;20], token_address:[u8;20], public pub_platform_fee: u32, public pri_platform_fee: u32, public pub_relayer_fee: u128, public pri_relayer_fee: u128){
        assert(!Mapping::contains(other_chain_token_service, chain_token_info));
        assert(!Mapping::contains(other_chain_token_address, chain_token_info));
        // token should have already been registered previously, otherwise use add_token_ts. 
        assert(Mapping::get(added_tokens, chain_token_info.token_id));
        // only council(owner) should be able to call this
        assert_eq(from, Mapping::get(owner_TS, OWNER_INDEX));
        //set these mappings with addresses.
        Mapping::set(other_chain_token_service, chain_token_info, pad_20_to_32(token_service_address));
        Mapping::set(other_chain_token_address, chain_token_info, pad_20_to_32(token_address));
        Mapping::set(public_platform_fee, chain_token_info, pub_platform_fee);
        Mapping::set(public_relayer_fee, chain_token_info, pub_relayer_fee);
    }


    const HUNDRED_PERCENTAGE: u32 = 100_000u32;

    // x_percent: percentage representation in basis point
    // y: actual value
    inline get_x_percent_of_y(x_percent: u32, y: u128) -> u128 {
        assert(x_percent <= HUNDRED_PERCENTAGE);
        let z: u128 = (y *  (x_percent as u128)) / ( HUNDRED_PERCENTAGE as u128);
        return z;
    }

    async transition holding_release(public receiver: address, public amount: u128) -> Future{
        let release: Future = vlink_holding_sealance_v1.aleo/release_fund(receiver, amount);
        return finalize_holding_release(self.caller, amount, release);
    }
    async function finalize_holding_release(from:address, amount:u128, f0: Future){
        f0.await();
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(owner, from);
        let held_amount:u128 = Mapping::get(token_holding, TOKEN_ID);
        Mapping::set(token_holding, TOKEN_ID, held_amount-amount);
    }


    async transition holding_transfer_ownership(public new_owner: address) -> Future{
        assert_neq(new_owner, ZERO_ADDRESS);
        let transfer_ownership: Future = vlink_holding_sealance_v1.aleo/transfer_ownership_holding(new_owner);
        return finalize_holding_TF_OWN(self.caller, transfer_ownership);
    }
    async function finalize_holding_TF_OWN(from:address, f0: Future){
        f0.await();
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(owner, from);
    }

    async transition update_platform_fee(public chain_id: u128, public public_fee: u32, public private_fee: u32) -> Future{
        return finalize_update_platform_fee(self.caller, chain_id, public_fee, private_fee);
    }

    async function finalize_update_platform_fee(from:address, public chain_id: u128, public public_fee: u32, public private_fee: u32){
        let chain_token_info: ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: TOKEN_ID
        };
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(owner, from);
        assert(Mapping::contains(public_platform_fee, chain_token_info));
        Mapping::set(public_platform_fee, chain_token_info, public_fee);
    }

    async transition update_relayer_fee(public chain_id: u128, public public_fee: u128, public private_fee: u128) -> Future{
        return finalize_update_relayer_fee(self.caller, chain_id, public_fee, private_fee);
    }

    async function finalize_update_relayer_fee(from:address, public chain_id: u128, public public_fee: u128, public private_fee: u128){
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(owner, from);
        let chain_token_info: ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: TOKEN_ID
        };
        assert(Mapping::contains(public_relayer_fee, chain_token_info));
        Mapping::set(public_relayer_fee, chain_token_info, public_fee);
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
