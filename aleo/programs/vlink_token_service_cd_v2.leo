// The 'token_service' program.
import vlink_token_bridge_v2.aleo;
import vlink_holding_cd_v2.aleo;

program vlink_token_service_cd_v2.aleo {

    struct ChainToken{
        // Id of one of the supported chains.
        chain_id: u128,
        // Token_id of the aleo token.
        token_id: field
    }

    /// Stores the owner of this program
    /// The owner can be another program or wallet
    /// key = true: returns the address of the owner
    /// key = false: returns Null
    mapping owner_TS: bool => address;

    /// Stores the total supply of the token
    /// Key is the token_id of the token program
    mapping total_supply: ChainToken => u64;


    /// Stores the minimum amount that can be transferred via Token Service
    /// Key is token_id of the token program
    mapping min_transfers: ChainToken => u64;

    /// Stores the maximum amount that can be transferred via Token Service
    /// Key is token_id of the token program
    mapping max_transfers: ChainToken => u64;

    /// Tracks if the token is paused/unpaused
    /// Key is the token_id of the token program
    mapping status: ChainToken => bool;

    /// Tracks the total amount of a certain token being held
    /// Key is the token_id of the token.
    mapping token_holding: field => u64;  // initialize

    /// Tracks the token service address of other chains
    /// Key is the combination of chain_id and token_id
    mapping other_chain_token_service: ChainToken => [u8; 32];  // token
    mapping other_chain_token_address: ChainToken => [u8; 32];  // token

    // flat fee that will be taken by the relayer
    mapping relayer_fee: ChainToken => u64;

    //percentage of the fee that will be taken by the platform
    mapping platform_fee: ChainToken => u32;

    const ALEO_CREDITS_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field; // The native token address of the Aleo network

    const OWNER_INDEX: bool = true;
    const PAUSED_VALUE: bool = true;
    const UNPAUSED_VALUE: bool = false;

    const HOLDING_ADDRESS: address = vlink_holding_cd_v2.aleo;

    const ZERO_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;
 
    const INITIALIZER_ADDRESS : address = aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px;

    const VERSION: u8 = 1u8;

    const HUNDRED_PERCENTAGE: u32 = 100_000u32;  

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
            token_id: ALEO_CREDITS_TOKEN_ID
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
            token_id: ALEO_CREDITS_TOKEN_ID
        };
        assert(Mapping::contains(other_chain_token_address, chaintokeninfo));
        Mapping::set(other_chain_token_address, chaintokeninfo, pad_20_to_32(token_address));
    }

    /////////////////////////////////////////////////
    ///// REmove token_service of other chain ///////
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
            token_id: ALEO_CREDITS_TOKEN_ID
        };

        // check if other chain token service exists in the mapping and remove it.
        assert(Mapping::contains(other_chain_token_service, chaintokeninfo));
        Mapping::remove(other_chain_token_service, chaintokeninfo);
        // check if other chain token address exists in the mapping and remove it.
        assert(Mapping::contains(other_chain_token_address, chaintokeninfo));
        Mapping::remove(other_chain_token_address, chaintokeninfo);

        Mapping::remove(platform_fee, chaintokeninfo);
        Mapping::remove(relayer_fee, chaintokeninfo);
    }


    ////////////////////////////////
    ///// Add/Remove Token /////////
    ////////////////////////////////

    async transition add_token_info(
        public min_transfer: u64, 
        public max_transfer: u64, 
        // corresponding token addresses and token service from other chain.
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128,
        public fee_platform: u32,
        public fee_relayer: u64,
    ) -> Future{
        assert(max_transfer >= min_transfer);
        assert(fee_platform <= HUNDRED_PERCENTAGE);
        return finalize_add_token_info(self.caller, min_transfer, max_transfer, token_address, token_service, chain_id, fee_platform, fee_relayer);
    }

    async function finalize_add_token_info(
        from: address, 
        min_transfer: u64, 
        max_transfer: u64,
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128,
        public fee_platform: u32,
        public fee_relayer: u64,
    ) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        let chain_token_info:ChainToken = ChainToken{
            chain_id: chain_id, 
            token_id: ALEO_CREDITS_TOKEN_ID
        };

        Mapping::set(other_chain_token_address, chain_token_info, pad_20_to_32(token_address));
        Mapping::set(other_chain_token_service, chain_token_info, pad_20_to_32(token_service));
        Mapping::set(min_transfers, chain_token_info, min_transfer);
        Mapping::set(max_transfers, chain_token_info, max_transfer);
        Mapping::set(status, chain_token_info, PAUSED_VALUE);
        Mapping::set(platform_fee, chain_token_info, fee_platform);
        Mapping::set(relayer_fee, chain_token_info, fee_relayer);
    }

    /////////////////////////////////
    ///// Pause/Unpause Token ///////
    /////////////////////////////////

    async transition pause_token_ts(public chain_id: u128) -> Future{
        return finalize_pause_token_ts(self.caller, chain_id);
    }

    async function finalize_pause_token_ts(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        let chain_token_info:ChainToken = ChainToken{
            chain_id: chain_id, 
            token_id: ALEO_CREDITS_TOKEN_ID
        };
        Mapping::set(status, chain_token_info, PAUSED_VALUE);
    }

    async transition unpause_token_ts(public chain_id: u128) -> Future{
        return finalize_unpause_token_ts(self.caller, chain_id);
    }

    async function finalize_unpause_token_ts(from: address, chain_id: u128) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        let chain_token_info:ChainToken = ChainToken{
            chain_id: chain_id, 
            token_id: ALEO_CREDITS_TOKEN_ID
        };
        Mapping::set(status, chain_token_info, UNPAUSED_VALUE);
    }

    /////////////////////////////////////
    ///// Update Minimum Transfer ///////
    ////////////////////////////////////

    async transition update_min_transfer_ts(public chain_id: u128, public min_transfer: u64) -> Future{
        return finalize_update_min_transfer_ts(self.caller, chain_id, min_transfer);
    }

    async function finalize_update_min_transfer_ts(from: address, chain_id: u128, min_transfer: u64) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        let chain_token_info:ChainToken = ChainToken{
            chain_id: chain_id, 
            token_id: ALEO_CREDITS_TOKEN_ID
        };

        // Assert new min transfer is less than max_transfer
        let max_transfer: u64 = Mapping::get(max_transfers, chain_token_info);
        assert(min_transfer <= max_transfer);

        assert(Mapping::contains(min_transfers, chain_token_info));
        Mapping::set(min_transfers, chain_token_info, min_transfer);
    }

    /////////////////////////////////////
    ///// Update Maximum Transfer ///////
    ////////////////////////////////////

    async transition update_max_transfer_ts(public chain_id: u128, public max_transfer: u64) -> Future{
        return finalize_update_max_transfer_ts(self.caller, chain_id, max_transfer);
    }

    async function finalize_update_max_transfer_ts(from: address, chain_id: u128, max_transfer: u64) {
        // Get the owner address
        // If program not initialized, this must fail
        let owner: address = Mapping::get(owner_TS, OWNER_INDEX);
        assert_eq(from, owner);

        let chain_token_info:ChainToken = ChainToken{
            chain_id: chain_id, 
            token_id: ALEO_CREDITS_TOKEN_ID
        };

        // Assert new max transfer is greater than min_transfer
        let min_transfer: u64= Mapping::get(min_transfers, chain_token_info);
        assert(max_transfer>=min_transfer);

        assert(Mapping::contains(max_transfers, chain_token_info));
        Mapping::set(max_transfers, chain_token_info, max_transfer);
    }


    /////////////////////////////
    ///// Token Transfers ///////
    /////////////////////////////

    async transition token_send_public(
        public receiver: [u8; 20], 
        public amount: u64,
        public dest_chain_id: u128,
        public dest_token_service: [u8;20],
        public dest_token_address: [u8;20],
        public fee_platform: u64, 
        public is_relayer_on: bool
        ) -> Future{

        assert_neq(self.caller, ZERO_ADDRESS);
        // lock funds
        let transfer_from_user: Future = credits.aleo/transfer_public_as_signer(self.address, amount - fee_platform);
        // transfer platform fee
        let transfer_platform_fee: Future = credits.aleo/transfer_public_as_signer(vlink_token_service_cd_cuncl_v2.aleo, fee_platform);

        let chain_token_info: ChainToken = ChainToken{
            chain_id: dest_chain_id,
            token_id: ALEO_CREDITS_TOKEN_ID
        };

        let version: u8 = VERSION;

        let publish : Future = vlink_token_bridge_v2.aleo/publish(
            version,
            dest_chain_id, 
            pad_20_to_32(dest_token_service), 
            pad_20_to_32(dest_token_address), 
            self.signer,
            pad_20_to_32(receiver),
            (amount - fee_platform) as u128
        );

        return finalize_token_send_public(amount, chain_token_info, dest_token_address, dest_token_service, fee_platform, transfer_from_user, transfer_platform_fee, publish);
    }

    async function finalize_token_send_public(amount: u64, chain_token_info:ChainToken, dest_token_address:[u8;20], dest_token_service:[u8;20], fee_platform:u64, f0: Future, f1: Future, f2: Future) {
        f0.await();
        f1.await();
        f2.await();

        // ASSERT FEE OF AGRUMENT AND OF MAPPING
        let fee_in_percentage: u32 = Mapping::get(platform_fee, chain_token_info);
        let fee_in_amount: u64 = get_x_percent_of_y(fee_in_percentage, amount);
        assert_eq(fee_in_amount, fee_platform);

        assert_eq(Mapping::get(status, chain_token_info), UNPAUSED_VALUE);

        let min_amount: u64 = Mapping::get(min_transfers, chain_token_info);
        assert(amount - fee_platform >= min_amount);

        let max_amount: u64 = Mapping::get(max_transfers, chain_token_info);
        assert(amount - fee_platform <= max_amount);

        let stored_token_service:[u8;32] = Mapping::get(other_chain_token_service, chain_token_info );
        assert_eq(stored_token_service, pad_20_to_32(dest_token_service));

        let stored_token_address:[u8;32] = Mapping::get(other_chain_token_address, chain_token_info );
        assert_eq(stored_token_address, pad_20_to_32(dest_token_address));

        // Increase the total supply
        let current_supply: u64 = Mapping::get_or_use(total_supply, chain_token_info, 0u64);
        Mapping::set(total_supply, chain_token_info, current_supply + amount - fee_platform);
    }


    /// Consumes msg from source at destination
    /// Requires sequence no of the source network
    async transition token_receive_public(
        public sender: [u8; 20], 
        public receiver: address, 
        public amount: u64, 
        public sequence: u64, 
        public height: u64, 
        public signers: [address; 5], 
        public signs: [signature; 5],
        public source_chain_id: u128, 
        public source_token_service_address: [u8; 20],
        public fee_relayer: u64,
    ) -> (public bool, Future) {
        assert_neq(self.caller, ZERO_ADDRESS);
        assert_neq(receiver, ZERO_ADDRESS);
        const version: u8 = 1u8;
        // call consume on bridge
        let screening_passed: (bool, Future) = vlink_token_bridge_v2.aleo/consume(
            version,
            source_chain_id, 
            pad_20_to_32(source_token_service_address), 
            ALEO_CREDITS_TOKEN_ID, 
            pad_20_to_32(sender), 
            receiver, 
            amount as u128, 
            sequence, 
            height, 
            signers, 
            signs
        );

        let chain_token_info: ChainToken = ChainToken{
            chain_id: source_chain_id,
            token_id: ALEO_CREDITS_TOKEN_ID
        };

        assert(amount >= fee_relayer); 

        // TODO: rename fee_relayer to relayer_fee
        // TODO: add test cases for private case

        let actual_receiver: address = receiver;
        let held_amount: u64 = 0u64;
        let fee_receiver: address = self.caller;

        if (!screening_passed.0) {
            actual_receiver = HOLDING_ADDRESS;
            held_amount = amount;
            fee_receiver = actual_receiver;
        }

        // send to receiver
        let send_to_user: Future = credits.aleo/transfer_public(actual_receiver, amount - fee_relayer);

        // send to relayer
        let send_to_relayer: Future = credits.aleo/transfer_public(fee_receiver, fee_relayer);

        let hold: Future = vlink_holding_cd_v2.aleo/hold_fund(receiver, held_amount);

        return (screening_passed.0, finalize_token_receive_public(amount, held_amount, chain_token_info, source_token_service_address, fee_relayer, screening_passed.1, send_to_user, send_to_relayer, hold));
    }

    async function finalize_token_receive_public(amount: u64, held_amount:u64, chain_token_info:ChainToken, source_token_service_address: [u8;20], fee_relayer:u64, f0: Future, f1: Future, f2: Future, f3: Future) {
        f0.await();
        f1.await();
        f2.await();
        f3.await();
        assert_eq(Mapping::get(status, chain_token_info), UNPAUSED_VALUE);

        assert(Mapping::contains(other_chain_token_service, chain_token_info));

        // comparing fee
        assert_eq(Mapping::get(relayer_fee, chain_token_info), fee_relayer);

        let stored_token_service:[u8;32] = Mapping::get(other_chain_token_service, chain_token_info );
        assert_eq(stored_token_service, pad_20_to_32(source_token_service_address));

        // Increase the total supply
        let current_supply: u64 = Mapping::get_or_use(total_supply, chain_token_info, 0u64);
        Mapping::set(total_supply, chain_token_info, current_supply - amount);

        // Increase the held amount
        let previously_held_amount:u64 = Mapping::get_or_use(token_holding, ALEO_CREDITS_TOKEN_ID, 0u64);
        Mapping::set(token_holding, ALEO_CREDITS_TOKEN_ID, previously_held_amount+held_amount);
    }


    async transition add_chain_to_existing_token(public chain_id: u128, public token_service_address:[u8;20], public token_address:[u8;20], public fee_platform: u32, public fee_relayer: u64) -> Future{
        let token_chain_info:ChainToken = ChainToken{
            chain_id:chain_id,
            token_id:ALEO_CREDITS_TOKEN_ID
        };

        assert(fee_platform <= HUNDRED_PERCENTAGE);

        return finalize_add_chain_to_EX_token(self.caller, token_chain_info, token_service_address, token_address, fee_platform, fee_relayer);
    }

    async function finalize_add_chain_to_EX_token(from:address, token_chain_info: ChainToken, token_service_address:[u8;20], token_address:[u8;20], public fee_platform: u32, public fee_relayer: u64){
        assert(!Mapping::contains(other_chain_token_service, token_chain_info));
        assert(!Mapping::contains(other_chain_token_address, token_chain_info));
        // only council(owner) should be able to call this
        assert_eq(from, Mapping::get(owner_TS, OWNER_INDEX));
        //set these mappings with addresses.
        Mapping::set(other_chain_token_service, token_chain_info, pad_20_to_32(token_service_address));
        Mapping::set(other_chain_token_address, token_chain_info, pad_20_to_32(token_address));
        Mapping::set(platform_fee, token_chain_info, fee_platform);
        Mapping::set(relayer_fee, token_chain_info, fee_relayer);
    }


    // x_percent: percentage representation in basis point
    // y: actual value
    inline get_x_percent_of_y(x_percent: u32, y: u64) -> u64 {
        assert(x_percent <= HUNDRED_PERCENTAGE);
        let z: u64 = (y *  (x_percent as u64)) / ( HUNDRED_PERCENTAGE as u64);
        return z;
    }

    async transition holding_release(public receiver: address, public amount: u64) -> Future{
        let release: Future = vlink_holding_cd_v2.aleo/release_fund(receiver, amount);
        return finalize_holding_release(self.caller, amount, release);
    }
    async function finalize_holding_release(from:address, amount:u64, f0: Future){
        f0.await();
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(owner, from);
        let held_amount:u64 = Mapping::get(token_holding, ALEO_CREDITS_TOKEN_ID);
        Mapping::set(token_holding, ALEO_CREDITS_TOKEN_ID, held_amount-amount);
    }


    async transition holding_transfer_ownership(public new_owner: address) -> Future{
        assert_neq(new_owner, ZERO_ADDRESS);
        let transfer_ownership: Future = vlink_holding_cd_v2.aleo/transfer_ownership_holding(new_owner);
        return finalize_holding_TF_OWN(self.caller, transfer_ownership);
    }
    async function finalize_holding_TF_OWN(from:address, f0: Future){
        f0.await();
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(owner, from);
    }

    async transition update_fees(public chain_id: u128, public fee_relayer: u64, public fee_platform: u32) -> Future{
        assert(fee_platform <= HUNDRED_PERCENTAGE);
        return finalize_update_fees(self.caller, chain_id, fee_relayer, fee_platform);
    }

    async function finalize_update_fees(from:address, public chain_id: u128, public fee_relayer: u64, public fee_platform: u32){
        let chain_token_info: ChainToken = ChainToken{
            chain_id: chain_id,
            token_id: ALEO_CREDITS_TOKEN_ID
        };
        let owner: address = Mapping::get(owner_TS, true);
        assert_eq(owner, from);
        assert(Mapping::contains(platform_fee, chain_token_info));
        Mapping::set(platform_fee, chain_token_info, fee_platform);

        assert(Mapping::contains(relayer_fee, chain_token_info));
        Mapping::set(relayer_fee, chain_token_info, fee_relayer);
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
