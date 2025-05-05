import vlink_council_v5.aleo;
import vlink_token_service_v5.aleo;

program vlink_token_service_council_v5.aleo
{
     //////////////////////////////////////////////
    /////// Token Service: Transfer Ownership ////
    //////////////////////////////////////////////

    const SELF_ADDRESS: address = aleo1ywd9h0gql58sqcxlvy6m5vjg2wm9h56umyaudazwmw5cjjv2sygq9yr6he;

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

    struct TsTransferOwnership {
        id: u32,
        new_owner: address
    }

    async transition ts_transfer_ownership(public id: u32, public new_owner: address, public voters: [address; 5]) -> Future{
        let proposal: TsTransferOwnership = TsTransferOwnership {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let transfer_ownership: Future = vlink_token_service_v5.aleo/transfer_ownership_ts(new_owner);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
        let add_token : Future = vlink_token_service_v5.aleo/add_token_ts(token_id, min_transfer, max_transfer, outgoing_percentage, time, max_no_cap, token_address, token_service, chain_id, pub_platform_fee, pri_platform_fee, pub_relayer_fee, pri_relayer_fee);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
        id: u32,
        chain_id: u128,
        token_id: field,
    }

    async transition ts_remove_token(public id: u32, public chain_id: u128, public token_id: field, public voters: [address; 5]) -> Future{
        let proposal: TsRemoveToken  = TsRemoveToken {
            id,
            chain_id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let remove_token : Future = vlink_token_service_v5.aleo/remove_token_ts(chain_id, token_id);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_remove_token(remove_token, external_execute);
    }

    async function finalize_ts_remove_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMinTransfer {
        id: u32,
        token_id: field,
        min_transfer: u128,
    }

    async transition ts_update_min_transfer(
        public id: u32, 
        public token_id: field, 
        public min_transfer: u128, 
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsUpdateMinTransfer  = TsUpdateMinTransfer {
            id,
            token_id,
            min_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let update_min_transfer: Future = vlink_token_service_v5.aleo/update_min_transfer_ts(token_id, min_transfer);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_min_transfer(update_min_transfer, external_execute);
    }

    async function finalize_ts_update_min_transfer(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Maximum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMaxTransfer {
        id: u32,
        token_id: field,
        max_transfer: u128,
    }

    async transition ts_update_max_transfer(
        public id: u32, 
        public token_id: field, 
        public max_transfer: u128, 
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsUpdateMaxTransfer  = TsUpdateMaxTransfer {
            id,
            token_id,
            max_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let update_max_transfer: Future = vlink_token_service_v5.aleo/update_max_transfer_ts(token_id, max_transfer);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_max_transfer(update_max_transfer, external_execute);
    }

    async function finalize_ts_update_max_transfer(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    ////////////////////////////////////////////
    ///////  Token Service: Pause Token ////////
    ////////////////////////////////////////////

    struct TsPauseToken {
        id: u32,
        token_id: field,
    }

    async transition ts_pause_token(
        public id: u32, 
        public token_id: field, 
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsPauseToken  = TsPauseToken {
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let pause : Future = vlink_token_service_v5.aleo/pause_token_ts(token_id);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
        id: u32,
        token_id: field,
    }

    async transition ts_unpause_token(
        public id: u32, 
        public token_id: field, 
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsUnpauseToken  = TsUnpauseToken {
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let unpause : Future = vlink_token_service_v5.aleo/unpause_token_ts(token_id);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
            id,
            token_id,
            percentage,
            duration,
            threshold_no_limit
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let update_withdrawal_limit: Future = vlink_token_service_v5.aleo/update_withdrawal_limit(token_id, percentage, duration, threshold_no_limit);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
            id,
            token_id,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_release_cc: Future = vlink_token_service_v5.aleo/holding_release(token_id,receiver,amount);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
            id,
            token_id,
            pre_image,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_release_cc: (token_registry.aleo/Token, Future) = vlink_token_service_v5.aleo/holding_release_private(token_id,receiver,pre_image,amount);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
        id: u32,
        new_owner: address
    }

    async transition holding_ownership_transfer(
        public id: u32,
        public new_owner: address,
        public voters : [address; 5]
    ) -> Future{
        let proposal: TransferOwnershipHolding  = TransferOwnershipHolding {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_ownership_transfer_cc: Future = vlink_token_service_v5.aleo/holding_transfer_ownership(new_owner);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
            id,
            token_name,
            symbol,
            decimals,
            max_supply
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let token_id: field = BHP256::hash_to_field(token_name);
        
        let register_token: Future = token_registry.aleo/register_token(token_id, token_name, symbol, decimals, max_supply, false, SELF_ADDRESS);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
            id,
            token_id,
            admin,
            external_authorization_party,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let token_management: Future = token_registry.aleo/update_token_management(token_id, admin, external_authorization_party);
        
        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
            id,
            token_id, 
            account,
            role
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let set_role: Future = token_registry.aleo/set_role(token_id, account, role);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_set_role_token(set_role, external_execute);
    }

    async function finalize_set_role_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
    //////////////////////////////////////////////////////
    ///////  Token Service : Update Token Service ////////
    //////////////////////////////////////////////////////

    struct UpdateTokenServiceAddress {
        id: u32,
        chain_id: u128,
        token_id: field,
        token_service_address: [u8; 20]
    }

    async transition ts_update_token_service_address(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public token_service_address: [u8; 20],
        public voters: [address; 5],
    ) -> Future{
        let proposal: UpdateTokenServiceAddress  = UpdateTokenServiceAddress {
            id,
            chain_id,
            token_id, 
            token_service_address
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let update_other_TS : Future = vlink_token_service_v5.aleo/update_other_chain_tokenservice(chain_id, token_id, token_service_address);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_TS(update_other_TS, external_execute);
    }

    async function finalize_ts_update_TS(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    struct UpdateTokenAddress {
        id: u32,
        chain_id: u128,
        token_id: field,
        token_address: [u8; 20]
    }

    async transition ts_update_other_token_address(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public token_address: [u8; 20],
        public voters: [address; 5],
    ) -> Future{
        let proposal: UpdateTokenAddress  = UpdateTokenAddress{
            id,
            chain_id,
            token_id, 
            token_address
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let update_other_TA: Future = vlink_token_service_v5.aleo/update_other_chain_tokenaddress(chain_id, token_id, token_address);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_TA(update_other_TA, external_execute);
    }

    async function finalize_ts_update_TA(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    //////////////////////////////////////////////////////////////
    ///////  Token Service : Add Chain to exisiting token ////////
    //////////////////////////////////////////////////////////////

    struct AddChainExistingToken {
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
        let add_chain: Future = vlink_token_service_v5.aleo/add_chain_to_existing_token(chain_id, token_id, token_service_address, token_address, pub_platform_fee, pri_platform_fee, pub_relayer_fee, pri_relayer_fee);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

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
            id,
            chain_id,
            token_id, 
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let remove_address: Future = vlink_token_service_v5.aleo/remove_other_chain_addresses(chain_id, token_id);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_remove_OC_addresses(remove_address, external_execute);
    }

    async function finalize_remove_OC_addresses(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }


    // struct UpdateRelayerFee {
    //     id: u32,
    //     chain_id: u128,
    //     token_id: field,
    //     public_fee: u128,
    //     private_fee: u128
    // }

    // async transition ts_update_relayer_fee(
    //     public id: u32,
    //     public chain_id: u128,
    //     public token_id: field,
    //     public public_fee: u128,
    //     public private_fee: u128,
    //     public voters: [address; 5],
    // ) -> Future {
    //     let proposal: UpdateRelayerFee = UpdateRelayerFee {
    //         id,
    //         chain_id,
    //         token_id,
    //         public_fee,
    //         private_fee
    //     };
    //     let proposal_hash: field = BHP256::hash_to_field(proposal);

    //     let update_relayer_fee: Future = vlink_token_service_v5.aleo/update_relayer_fee(chain_id, token_id, public_fee, private_fee);

    //     let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

    //     return finalize_ts_update_RF(update_relayer_fee, external_execute);
    // }

    // async function finalize_ts_update_RF(f0: Future, f1: Future) {
    //     f0.await();
    //     f1.await();
    // }



    // struct UpdatePlatformFee {
    //     id: u32,
    //     chain_id: u128,
    //     token_id: field,
    //     public_fee: u32,
    //     private_fee: u32
    // }
 
    // async transition ts_update_platform_fee(
    //     public id: u32,
    //     public chain_id: u128,
    //     public token_id: field,
    //     public public_fee: u32,
    //     public private_fee: u32,
    //     public voters: [address; 5],
    // ) -> Future {
    //     let proposal: UpdatePlatformFee = UpdatePlatformFee {
    //         id,
    //         chain_id,
    //         token_id,
    //         public_fee,
    //         private_fee
    //     };
    //     let proposal_hash: field = BHP256::hash_to_field(proposal);

    //     let update_platform_fee: Future = vlink_token_service_v5.aleo/update_platform_fee(chain_id, token_id, public_fee, private_fee);

    //     let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

    //     return finalize_ts_update_PF(update_platform_fee, external_execute);
    // }

    // async function finalize_ts_update_PF(f0: Future, f1: Future) {
    //     f0.await();
    //     f1.await();
    // }

    struct UpdateFees {
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
            id,
            chain_id,
            token_id,
            public_relayer_fee,
            private_relayer_fee,
            public_platform_fee,
            private_platform_fee  
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let update_relayer_fee: Future = vlink_token_service_v5.aleo/update_relayer_fee(chain_id, token_id, public_relayer_fee, private_relayer_fee);

        let update_platform_fee: Future = vlink_token_service_v5.aleo/update_platform_fee(chain_id, token_id, public_platform_fee, private_platform_fee);

        let external_execute: Future = vlink_council_v5.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_PF(update_relayer_fee, update_platform_fee, external_execute);
    }

    async function finalize_ts_update_PF(f0: Future, f1: Future, f2: Future) {
        f0.await();
        f1.await();
        f2.await();
    }
}