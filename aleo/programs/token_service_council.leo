import council.aleo;
import token_service_v0003.aleo;

program token_service_council.aleo
{
     //////////////////////////////////////////////
    /////// Token Service: Transfer Ownership ////
    //////////////////////////////////////////////

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
        token_service_v0003.aleo/transfer_ownership_ts(new_owner);

        council.aleo/external_execute(id, proposal_hash, voters);

    }


    //////////////////////////////////////////////
    ///////  Token Service: Add Token ////////
    //////////////////////////////////////////////

    struct TsAddToken {
        id: u32,
        token_address: address,
        connector: address,
        min_transfer: u128,
        max_transfer: u128,
        outgoing_percentage: u16,
        time: u32,
        max_no_cap: u128
    }

    transition ts_add_token(
        public id: u32, 
        public token_address: address, 
        public connector: address, 
        public min_transfer: u128, 
        public max_transfer: u128, 
        public outgoing_percentage: u16, 
        public time: u32,
        public max_no_cap: u128,
        public voters: [address; 5],
    ) {
        let proposal: TsAddToken  = TsAddToken {
            id,
            token_address,
            connector,
            min_transfer,
            max_transfer,
            outgoing_percentage,
            time,
            max_no_cap
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0003.aleo/add_token_ts(token_address, connector, min_transfer, max_transfer, outgoing_percentage, time, max_no_cap);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    /////////////////////////////////////////////
    ///////  Token Service: Remove Token ////////
    /////////////////////////////////////////////

    struct TsRemoveToken {
        id: u32,
        token_address: address,
    }

    transition ts_remove_token(public id: u32, public token_address: address, public voters: [address; 5]) {
        let proposal: TsRemoveToken  = TsRemoveToken {
            id,
            token_address,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0003.aleo/remove_token_ts(token_address);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMinTransfer {
        id: u32,
        token_address: address,
        min_transfer: u128,
    }

    transition ts_update_min_transfer(
        public id: u32, 
        public token_address: address, 
        public min_transfer: u128, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsUpdateMinTransfer  = TsUpdateMinTransfer {
            id,
            token_address,
            min_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0003.aleo/update_min_transfer_ts(token_address, min_transfer);

        council.aleo/external_execute(id, proposal_hash, voters);
    }

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Maximum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMaxTransfer {
        id: u32,
        token_address: address,
        max_transfer: u128,
    }

    transition ts_update_max_transfer(
        public id: u32, 
        public token_address: address, 
        public max_transfer: u128, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsUpdateMaxTransfer  = TsUpdateMaxTransfer {
            id,
            token_address,
            max_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0003.aleo/update_max_transfer_ts(token_address, max_transfer);

        council.aleo/external_execute(id, proposal_hash, voters);
    }


    ////////////////////////////////////////////
    ///////  Token Service: Pause Token ////////
    ////////////////////////////////////////////

    struct TsPauseToken {
        id: u32,
        token_address: address,
    }

    transition ts_pause_token(
        public id: u32, 
        public token_address: address, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsPauseToken  = TsPauseToken {
            id,
            token_address,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0003.aleo/pause_token_ts(token_address);

        council.aleo/external_execute(id, proposal_hash, voters);

    }

    //////////////////////////////////////////////
    ///////  Token Service: Unpause Token ////////
    //////////////////////////////////////////////

    struct TsUnpauseToken {
        id: u32,
        token_address: address,
    }

    transition ts_unpause_token(
        public id: u32, 
        public token_address: address, 
        public voters: [address; 5],
        
    ) {
        let proposal: TsUnpauseToken  = TsUnpauseToken {
            id,
            token_address,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0003.aleo/unpause_token_ts(token_address);

        council.aleo/external_execute(id, proposal_hash, voters);

    }


    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Withdrawal Limit ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateWithdrawalLimit {
        id: u32,
        token_address: address,
        percentage: u16,
        duration: u32,
        threshold_no_limit: u128
    }

    transition ts_update_outgoing_percentage(
        public id: u32, 
        public token_address: address, 
        public percentage: u16, 
        public duration: u32,
        public threshold_no_limit: u128,
        public voters: [address; 5],
        
    ) {
        let proposal: TsUpdateWithdrawalLimit  = TsUpdateWithdrawalLimit {
            id,
            token_address,
            percentage,
            duration,
            threshold_no_limit
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        token_service_v0003.aleo/update_withdrawal_limit(token_address, percentage, duration, threshold_no_limit);

        council.aleo/external_execute(id, proposal_hash, voters);
    }


}