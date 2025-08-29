import vlink_council_v07.aleo;
import vlink_token_service_v7.aleo;

program vlink_token_service_council_v07.aleo
{


    // for upgrade
    @noupgrade
    async constructor() {}


     //////////////////////////////////////////////
    /////// Token Service: Transfer Ownership ////
    //////////////////////////////////////////////

    const SELF_ADDRESS: address = vlink_token_service_council_v07.aleo;  

    const TAG_TS_TRANSFER_OWNERSHIP: u8 = 1u8;
    const TAG_TS_ADD_TOKEN: u8 = 2u8;
    const TAG_TS_REMOVE_TOKEN: u8 = 3u8; 
    const TAG_TS_UPDATE_MAX_MIN_TRANSFER: u8 = 4u8;
    const TAG_TS_PAUSE_TOKEN: u8 = 5u8;
    const TAG_TS_UNPAUSE_TOKEN: u8 = 6u8; 
    const TAG_TS_UP_OUTGOING_PERCENT: u8 = 7u8;
    const TAG_HOLDING_RELEASE: u8 = 8u8;
    const TAG_HOLDING_RELEASE_PRIVATE: u8 = 9u8;
    const TAG_HOLDING_OWNERSHIP_TRANSFER: u8 = 10u8;
    const TAG_TS_REGISTER_TOKEN: u8 = 11u8;
    const TAG_UPDATE_TOKEN_METADATA: u8 = 12u8;
    const TAG_SET_ROLE_TOKEN: u8 = 13u8;
    const TAG_TS_UP_TS_SETTING: u8 = 14u8;
    const TAG_TS_ADD_CHAIN_TO_ET: u8 = 15u8;
    const TAG_TS_REMOVE_OTHER_CHAIN_ADD: u8 = 16u8;
    const TAG_TS_UPDATE_FEES: u8 = 17u8;
    const TAG_REMOVE_ROLE: u8 = 18u8;

    struct TsTransferOwnership {
        tag: u8,
        id: u32,
        new_owner: address
    }

    async transition ts_transfer_ownership(public id: u32, public new_owner: address, public voters: [address; 5]) -> Future{
        let proposal: TsTransferOwnership = TsTransferOwnership {
            tag: TAG_TS_TRANSFER_OWNERSHIP,
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let transfer_ownership: Future = vlink_token_service_v7.aleo/transfer_ownership_ts(new_owner);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_transfer_ownership(transfer_ownership, external_execute);

    }

    async function finalize_ts_transfer_ownership(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    


    //////////////////////////////////////////////
    ///////  Token Service: Add Token ////////
    //////////////////////////////////////////////

    struct TsAddToken {
        tag: u8,
        id: u32,
        token_id: field,
        min_transfer: u128,
        max_transfer: u128,
        outgoing_percentage: u32,
        time: u32,
        max_no_cap: u128,
        token_address: [u8; 20],
        token_service: [u8; 20],
        chain_id: u128,
        pub_platform_fee: u32,
        pri_platform_fee: u32,
        pub_relayer_fee: u128,
        pri_relayer_fee: u128,
    }

    async transition ts_add_token(
        public id: u32, 
        public token_id: field, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public outgoing_percentage: u32, 
        public time: u32,
        public max_no_cap: u128,
        public voters: [address; 5],
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128,
        public pub_platform_fee: u32,
        public pri_platform_fee: u32,
        public pub_relayer_fee: u128,
        public pri_relayer_fee: u128,
    ) -> Future{
        let proposal: TsAddToken  = TsAddToken {
            tag: TAG_TS_ADD_TOKEN,
            id,
            token_id,
            min_transfer,
            max_transfer,
            outgoing_percentage,
            time,
            max_no_cap,
            token_address,
            token_service,
            chain_id,
            pub_platform_fee,
            pri_platform_fee,
            pub_relayer_fee,
            pri_relayer_fee
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let add_token : Future = vlink_token_service_v7.aleo/add_token_ts(token_id, min_transfer, max_transfer, outgoing_percentage, time, max_no_cap, token_address, token_service, chain_id, pub_platform_fee, pri_platform_fee, pub_relayer_fee, pri_relayer_fee);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_add_token(add_token, external_execute);
    }

    async function finalize_ts_add_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    /////////////////////////////////////////////
    ///////  Token Service: Remove Token ////////
    /////////////////////////////////////////////

    struct TsRemoveToken {
        tag: u8,
        id: u32,
        chain_id: u128,
        token_id: field,
    }

    async transition ts_remove_token(public id: u32, public chain_id: u128, public token_id: field, public voters: [address; 5]) -> Future{
        let proposal: TsRemoveToken  = TsRemoveToken {
            tag: TAG_TS_REMOVE_TOKEN,
            id,
            chain_id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let remove_token : Future = vlink_token_service_v7.aleo/remove_token_ts(chain_id, token_id);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_remove_token(remove_token, external_execute);
    }

    async function finalize_ts_remove_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMaxMinTransfer {
        tag: u8,
        id: u32,
        token_id: field,
        max_transfer: u128,
        min_transfer: u128,
    }

    async transition ts_update_max_min_transfer(
        public id: u32, 
        public token_id: field, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public voters: [address; 5],      
    ) -> Future{
        let proposal: TsUpdateMaxMinTransfer  = TsUpdateMaxMinTransfer {
            tag: TAG_TS_UPDATE_MAX_MIN_TRANSFER,
            id,
            token_id,
            max_transfer,
            min_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let update_min_transfer: Future = vlink_token_service_v7.aleo/update_min_transfer_ts(token_id, min_transfer);

        let update_max_transfer: Future = vlink_token_service_v7.aleo/update_max_transfer_ts(token_id, max_transfer);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_mm_transfer(update_min_transfer, update_max_transfer, external_execute);
    }

    async function finalize_ts_update_mm_transfer(f0: Future, f1: Future, f2:Future) {
        f0.await();
        f1.await();
        f2.await();
    }

    ////////////////////////////////////////////
    ///////  Token Service: Pause Token ////////
    ////////////////////////////////////////////

    struct TsPauseToken {
        tag: u8,
        id: u32,
        token_id: field,
    }

    async transition ts_pause_token(
        public id: u32, 
        public token_id: field, 
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsPauseToken  = TsPauseToken {
            tag: TAG_TS_PAUSE_TOKEN,
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let pause : Future = vlink_token_service_v7.aleo/pause_token_ts(token_id);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_pause_token(pause, external_execute);
    }

    async function finalize_ts_pause_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    //////////////////////////////////////////////
    ///////  Token Service: Unpause Token ////////
    //////////////////////////////////////////////

    struct TsUnpauseToken {
        tag: u8,
        id: u32,
        token_id: field,
    }

    async transition ts_unpause_token(
        public id: u32, 
        public token_id: field, 
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsUnpauseToken  = TsUnpauseToken {
            tag: TAG_TS_UNPAUSE_TOKEN,
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let unpause : Future = vlink_token_service_v7.aleo/unpause_token_ts(token_id);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_unpause_token(unpause, external_execute);

    }

    async function finalize_ts_unpause_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Withdrawal Limit ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateWithdrawalLimit {
        tag: u8,
        id: u32,
        token_id: field,
        percentage: u32,
        duration: u32,
        threshold_no_limit: u128
    }

    async transition ts_update_outgoing_percentage(
        public id: u32, 
        public token_id: field, 
        public percentage: u32, 
        public duration: u32,
        public threshold_no_limit: u128,
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsUpdateWithdrawalLimit  = TsUpdateWithdrawalLimit {
            tag: TAG_TS_UP_OUTGOING_PERCENT,
            id,
            token_id,
            percentage,
            duration,
            threshold_no_limit
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let update_withdrawal_limit: Future = vlink_token_service_v7.aleo/update_withdrawal_limit(token_id, percentage, duration, threshold_no_limit);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_limit(update_withdrawal_limit, external_execute);
    }

    async function finalize_ts_update_limit(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    ////////////////////////////////////////////////
    ///////  Holding Program : Release Fund ////////
    ////////////////////////////////////////////////

    struct HoldingRelease {
        tag: u8,
        id: u32,
        token_id: field,
        receiver: address,
        amount: u128
    }

    async transition holding_release(
        public id: u32,
        public token_id: field,
        public receiver: address,
        public amount: u128,
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: HoldingRelease  = HoldingRelease {
            tag: TAG_HOLDING_RELEASE,
            id,
            token_id,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_release_cc: Future = vlink_token_service_v7.aleo/holding_release(token_id,receiver,amount);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_holding_release(holding_release_cc, external_execute);
    }

    async function finalize_holding_release(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }



    //////////////////////////////////////////////////////
    ////// Holding Program : Private HOlding Release /////
    //////////////////////////////////////////////////////

    struct HoldingReleasePrivate {
        tag: u8,
        id: u32,
        token_id: field,
        pre_image: field,
        receiver: address,
        amount: u128
    }

    async transition holding_release_private(
        public id: u32,
        public token_id: field,
        receiver: address,
        pre_image: field,
        public amount: u128,
        public voters: [address; 5],
        
    ) -> (token_registry.aleo/Token, Future){
        let proposal: HoldingReleasePrivate  = HoldingReleasePrivate {
            tag: TAG_HOLDING_RELEASE_PRIVATE,
            id,
            token_id,
            pre_image,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_release_cc: (token_registry.aleo/Token, Future) = vlink_token_service_v7.aleo/holding_release_private(token_id,receiver,pre_image,amount);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return (holding_release_cc.0, finalize_HLD_release_private(holding_release_cc.1, external_execute));
    }

    async function finalize_HLD_release_private(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }


    
    //////////////////////////////////////////////////////
    ///////  Holding Program : Transfer Ownership ////////
    //////////////////////////////////////////////////////

    struct TransferOwnershipHolding {
        tag: u8,
        id: u32,
        new_owner: address
    }

    async transition holding_ownership_transfer(
        public id: u32,
        public new_owner: address,
        public voters : [address; 5]
    ) -> Future{
        let proposal: TransferOwnershipHolding  = TransferOwnershipHolding {
            tag: TAG_HOLDING_OWNERSHIP_TRANSFER,
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_ownership_transfer_cc: Future = vlink_token_service_v7.aleo/holding_transfer_ownership(new_owner);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_holding_OWN_transfer(holding_ownership_transfer_cc, external_execute);
    }

    async function finalize_holding_OWN_transfer(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    ////////////////////////////////////////////////
    ///////  Token Service : Register Token ////////
    ////////////////////////////////////////////////

    struct RegisterToken {
        tag: u8,
        id: u32,
        token_name: u128,
        symbol: u128,
        decimals: u8,
        max_supply: u128
    }

    async transition ts_register_token(
        public id: u32,
        public token_name: u128,
        public symbol: u128,
        public decimals: u8,
        public max_supply: u128,
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: RegisterToken  = RegisterToken {
            tag: TAG_TS_REGISTER_TOKEN,
            id,
            token_name,
            symbol,
            decimals,
            max_supply
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let token_id: field = BHP256::hash_to_field(token_name);
        
        let register_token: Future = token_registry.aleo/register_token(token_id, token_name, symbol, decimals, max_supply, false, SELF_ADDRESS);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_register_token(register_token, external_execute);
    }

    async function finalize_ts_register_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    /////////////////////////////////////////////////
    ///// Update token metadata /////////////////////
    /////////////////////////////////////////////////
    struct UpdateTokenMetadata{
        tag: u8,
        id: u32,
        token_id: field, 
        admin: address,
        external_authorization_party: address
    }
    async transition update_token_metadata(
        public id: u32,
        public token_id: field,
        public admin: address,
        public external_authorization_party: address,
        public voters: [address; 5]
    ) -> Future{
        let proposal: UpdateTokenMetadata  = UpdateTokenMetadata {
            tag: TAG_UPDATE_TOKEN_METADATA,
            id,
            token_id,
            admin,
            external_authorization_party,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let token_management: Future = token_registry.aleo/update_token_management(token_id, admin, external_authorization_party);
        
        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_update_TK_MD(token_management, external_execute);
    }

    async function finalize_update_TK_MD(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    // //////////////////////////////////////////////////////
    // ///// Token Service : Give minting/burning role //////
    // //////////////////////////////////////////////////////
    // 1u8 => minter, 2u8 => burner and 3u8 => supply_manager (we could give supply manager to token_service)

    struct SetRoleForToken {
        tag: u8,
        id: u32,
        token_id: field,
        account: address,
        role: u8
    }

    async transition set_role_token(
        public id: u32,
        public token_id: field,
        public account: address,
        public role: u8,
        public voters: [address; 5]
    ) -> Future{
        let proposal: SetRoleForToken  = SetRoleForToken {
            tag: TAG_SET_ROLE_TOKEN,
            id,
            token_id, 
            account,
            role
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let set_role: Future = token_registry.aleo/set_role(token_id, account, role);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_set_role_token(set_role, external_execute);
    }

    async function finalize_set_role_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    //////////////////////////////////////////////////////
    ///////  Token Service : Update Token Service ////////
    //////////////////////////////////////////////////////

    struct UpdateTokenServiceSetting {
        tag: u8,
        id: u32,
        chain_id: u128,
        token_id: field,
        token_service_address: [u8; 20],
        token_address: [u8; 20]
    }

    async transition ts_update_token_service_setting(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public token_service_address: [u8; 20],
        public token_address: [u8; 20],
        public voters: [address; 5],
    ) -> Future{
        let proposal: UpdateTokenServiceSetting  = UpdateTokenServiceSetting {
            tag: TAG_TS_UP_TS_SETTING,
            id,
            chain_id,
            token_id, 
            token_service_address,
            token_address
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let update_other_TS : Future = vlink_token_service_v7.aleo/update_other_chain_tokenservice(chain_id, token_id, token_service_address);
        
        let update_other_TA: Future = vlink_token_service_v7.aleo/update_other_chain_tokenaddress(chain_id, token_id, token_address);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_TS(update_other_TS, update_other_TA, external_execute);
    }

    async function finalize_ts_update_TS(f0: Future, f1: Future, f2: Future) {
        f0.await();
        f1.await();
        f2.await();
    }

    //////////////////////////////////////////////////////////////
    ///////  Token Service : Add Chain to exisiting token ////////
    //////////////////////////////////////////////////////////////

    struct AddChainExistingToken {
        tag: u8,
        id: u32,
        chain_id: u128,
        token_id: field,
        token_service_address: [u8; 20],
        token_address: [u8; 20],
        pub_platform_fee: u32,
        pri_platform_fee: u32,
        pub_relayer_fee: u128,
        pri_relayer_fee: u128,
    }

    async transition ts_add_chain_to_existing_token(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public token_service_address: [u8; 20],
        public token_address: [u8; 20],
        public voters: [address; 5],
        public pub_platform_fee: u32,
        public pri_platform_fee: u32,
        public pub_relayer_fee: u128,
        public pri_relayer_fee: u128,
    ) -> Future{
        let proposal: AddChainExistingToken  = AddChainExistingToken {
            tag: TAG_TS_ADD_CHAIN_TO_ET,
            id,
            chain_id,
            token_id, 
            token_service_address,  
            token_address,
            pub_platform_fee,
            pri_platform_fee,
            pub_relayer_fee,
            pri_relayer_fee
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let add_chain: Future = vlink_token_service_v7.aleo/add_chain_to_existing_token(chain_id, token_id, token_service_address, token_address, pub_platform_fee, pri_platform_fee, pub_relayer_fee, pri_relayer_fee);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_add_chain(add_chain, external_execute);
    }

    async function finalize_add_chain(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }


    //////////////////////////////////////////////////////
    ///////  Token Service : Remove Token Service ////////
    //////////////////////////////////////////////////////

    struct RemoveOtherChainAddresses {
        tag: u8,
        id: u32,
        chain_id: u128,
        token_id: field,
    }

    async transition ts_remove_other_chain_addresses(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public voters: [address; 5],
    ) -> Future{
        let proposal: RemoveOtherChainAddresses  = RemoveOtherChainAddresses {
            tag: TAG_TS_REMOVE_OTHER_CHAIN_ADD,
            id,
            chain_id,
            token_id, 
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let remove_address: Future = vlink_token_service_v7.aleo/remove_other_chain_addresses(chain_id, token_id);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_remove_OC_addresses(remove_address, external_execute);
    }

    async function finalize_remove_OC_addresses(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    struct UpdateFees {
        tag: u8,
        id: u32,
        chain_id: u128,
        token_id: field,
        public_relayer_fee: u128,
        private_relayer_fee: u128,
        public_platform_fee: u32,
        private_platform_fee: u32
    }
 
    async transition ts_update_fees(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public public_relayer_fee: u128,
        public private_relayer_fee: u128,
        public public_platform_fee: u32,
        public private_platform_fee: u32,
        public voters: [address; 5],
    ) -> Future {
        let proposal: UpdateFees = UpdateFees {
            tag: TAG_TS_UPDATE_FEES,
            id,
            chain_id,
            token_id,
            public_relayer_fee,
            private_relayer_fee,
            public_platform_fee,
            private_platform_fee  
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let update_relayer_fee: Future = vlink_token_service_v7.aleo/update_relayer_fee(chain_id, token_id, public_relayer_fee, private_relayer_fee);

        let update_platform_fee: Future = vlink_token_service_v7.aleo/update_platform_fee(chain_id, token_id, public_platform_fee, private_platform_fee);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_PF(update_relayer_fee, update_platform_fee, external_execute);
    }

    async function finalize_ts_update_PF(f0: Future, f1: Future, f2: Future) {
        f0.await();
        f1.await();
        f2.await();
    }


    struct RemoveRole {
        tag: u8,
        id: u32,
        token_id: field,
        account: address
    }

    async transition remove_role(
        public id: u32,
        public token_id: field,
        public account: address,
        public voters: [address; 5]
    ) -> Future {
        let proposal: RemoveRole  = RemoveRole {
            tag: TAG_REMOVE_ROLE,
            id,
            token_id,
            account
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let remove_role_access: Future = token_registry.aleo/remove_role(token_id,account);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_remove_role(remove_role_access, external_execute);
    }

    async function finalize_remove_role(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

}