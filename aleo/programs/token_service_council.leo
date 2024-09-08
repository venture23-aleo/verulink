import council.aleo;
import token_service.aleo;

program token_service_council.aleo
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

    transition ts_transfer_ownership(public id: u32, public new_owner: address, public voters: [address; 5]) {
        let proposal: TsTransferOwnership = TsTransferOwnership {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/transfer_ownership_ts(new_owner);

        council.aleo/external_execute(id, proposal_hash, voters);

    }


    //////////////////////////////////////////////
    ///////  Token Service: Add Token ////////
    //////////////////////////////////////////////

    struct TsAddToken {
        id: u32,
        token_id: field,
        min_transfer: u128,
        max_transfer: u128,
        outgoing_percentage: u16,
        time: u32,
        max_no_cap: u128,
        token_address: [u8; 20],
        token_service: [u8; 20],
        chain_id: u128
    }

    transition ts_add_token(
        public id: u32, 
        public token_id: field, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public outgoing_percentage: u16, 
        public time: u32,
        public max_no_cap: u128,
        public voters: [address; 5],
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128
    ) {
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
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/add_token_ts(token_id, min_transfer, max_transfer, outgoing_percentage, time, max_no_cap, token_address, token_service, chain_id);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    /////////////////////////////////////////////
    ///////  Token Service: Remove Token ////////
    /////////////////////////////////////////////

    struct TsRemoveToken {
        id: u32,
        token_id: field,
    }

    transition ts_remove_token(public id: u32, public token_id: field, public voters: [address; 5]) {
        let proposal: TsRemoveToken  = TsRemoveToken {
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/remove_token_ts(token_id);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMinTransfer {
        id: u32,
        token_id: field,
        min_transfer: u128,
    }

    transition ts_update_min_transfer(
        public id: u32, 
        public token_id: field, 
        public min_transfer: u128, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsUpdateMinTransfer  = TsUpdateMinTransfer {
            id,
            token_id,
            min_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/update_min_transfer_ts(token_id, min_transfer);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Maximum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMaxTransfer {
        id: u32,
        token_id: field,
        max_transfer: u128,
    }

    transition ts_update_max_transfer(
        public id: u32, 
        public token_id: field, 
        public max_transfer: u128, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsUpdateMaxTransfer  = TsUpdateMaxTransfer {
            id,
            token_id,
            max_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/update_max_transfer_ts(token_id, max_transfer);

        council.aleo/external_execute(id, proposal_hash, voters);
    }


    ////////////////////////////////////////////
    ///////  Token Service: Pause Token ////////
    ////////////////////////////////////////////

    struct TsPauseToken {
        id: u32,
        token_id: field,
    }

    transition ts_pause_token(
        public id: u32, 
        public token_id: field, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsPauseToken  = TsPauseToken {
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/pause_token_ts(token_id);

        council.aleo/external_execute(id, proposal_hash, voters);

    }

    //////////////////////////////////////////////
    ///////  Token Service: Unpause Token ////////
    //////////////////////////////////////////////

    struct TsUnpauseToken {
        id: u32,
        token_id: field,
    }

    transition ts_unpause_token(
        public id: u32, 
        public token_id: field, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsUnpauseToken  = TsUnpauseToken {
            id,
            token_id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/unpause_token_ts(token_id);

        council.aleo/external_execute(id, proposal_hash, voters);

    }


    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Withdrawal Limit ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateWithdrawalLimit {
        id: u32,
        token_id: field,
        percentage: u16,
        duration: u32,
        threshold_no_limit: u128
    }

    transition ts_update_outgoing_percentage(
        public id: u32, 
        public token_id: field, 
        public percentage: u16, 
        public duration: u32,
        public threshold_no_limit: u128,
        public voters: [address; 5],
        
    ) {
        let proposal: TsUpdateWithdrawalLimit  = TsUpdateWithdrawalLimit {
            id,
            token_id,
            percentage,
            duration,
            threshold_no_limit
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service.aleo/update_withdrawal_limit(token_id, percentage, duration, threshold_no_limit);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    ////////////////////////////////////////////////
    ///////  Holding Program : Release Fund ////////
    ////////////////////////////////////////////////

    struct HoldingRelease {
        id: u32,
        token_id: field,
        connector: address,
        receiver: address,
        amount: u128
    }

    transition holding_release(
        public id: u32,
        public token_id: field,
        public receiver: address,
        public amount: u128,
        public voters: [address; 5],
        
    ) {
        let proposal: HoldingRelease  = HoldingRelease {
            id,
            token_id,
            connector: self.caller,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        token_service.aleo/holding_release(token_id,receiver,amount);

        council.aleo/external_execute(id, proposal_hash, voters);
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

    transition ts_register_token(
        public id: u32,
        public token_name: u128,
        public symbol: u128,
        public decimals: u8,
        public max_supply: u128,
        public voters: [address; 5],
        
    ) {
        let proposal: RegisterToken  = RegisterToken {
            id,
            token_name,
            symbol,
            decimals,
            max_supply
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let token_id: field = BHP256::hash_to_field(token_name);
        multi_token_support_program.aleo/register_token(token_id, token_name, symbol, decimals, max_supply, false, SELF_ADDRESS);

        council.aleo/external_execute(id, proposal_hash, voters);
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
    transition update_token_metadata(
        public id: u32,
        public token_id: field,
        public admin: address,
        public external_authorization_party: address,
        public voters: [address; 5]
    ) {
        let proposal: UpdateTokenMetadata  = UpdateTokenMetadata {
            id,
            token_id,
            admin,
            external_authorization_party,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);
        multi_token_support_program.aleo/update_token_management(token_id, admin, external_authorization_party);
        
        council.aleo/external_execute(id, proposal_hash, voters);
    }

    // //////////////////////////////////////////////////////
    // ///// Token Service : Give minting/burning role //////
    // //////////////////////////////////////////////////////
    // 1u8 => minter, 2u8 => burner and 3u8 => supply_manager (we could give supply manager to token_service)

    struct SetRoleForToken {
        id: u32,
        token_id: field,
        account: address
        role: u8,
    }

    transition set_role_token(
        public id: u32,
        public token_id: field,
        public account: address,
        public role: u8,
        public voters: [address; 5]
    ) {
        let proposal: SetRoleForToken  = SetRoleForToken {
            id,
            token_id, 
            account,
            role
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        multi_token_support_program.aleo/set_role(token_id, account, role);

        council.aleo/external_execute(id, proposal_hash, voters);
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

    transition ts_update_token_service_address(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public token_service_address: [u8; 20],
        public voters: [address; 5],
    ) {
        let proposal: UpdateTokenServiceAddress  = UpdateTokenServiceAddress {
            id,
            chain_id,
            token_id, 
            token_service_address
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        token_service.aleo/update_other_chain_tokenservice(chain_id, token_id, token_service_address);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    struct UpdateTokenAddress {
        id: u32,
        chain_id: u128,
        token_id: field,
        token_address: [u8; 20]
    }

    transition ts_update_other_token_address(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public token_address: [u8; 20],
        public voters: [address; 5],
    ) {
        let proposal: UpdateTokenAddress  = UpdateTokenAddress{
            id,
            chain_id,
            token_id, 
            token_address
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        token_service.aleo/update_other_chain_tokenaddress(chain_id, token_id, token_address);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    //////////////////////////////////////////////////////
    ///////  Token Service : Remove Token Service ////////
    //////////////////////////////////////////////////////

    struct RemoveOtherChainAddresses {
        id: u32,
        chain_id: u128,
        token_id: field,
    }

    transition ts_remove_other_chain_addresses(
        public id: u32,
        public chain_id: u128,
        public token_id: field,
        public voters: [address; 5],
    ) {
        let proposal: RemoveOtherChainAddresses  = RemoveOtherChainAddresses {
            id,
            chain_id,
            token_id, 
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        token_service.aleo/remove_other_chain_addresses(chain_id, token_id);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

}