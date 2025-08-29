import vlink_council_v07.aleo;
import vlink_token_service_cd_v7.aleo;

program vlink_token_service_cd_cncl_v07.aleo
{

    // for upgrade
    @noupgrade
    async constructor() {}

    
     //////////////////////////////////////////////
    /////// Token Service: Transfer Ownership ////
    //////////////////////////////////////////////

    const TAG_TS2_TRANSFER_OWNERSHIP: u8 = 1u8;
    const TAG_TS2_ADD_TOKEN: u8 = 2u8;
    const TAG_TS2_UPDATE_MAX_MIN_TRANSFER: u8 = 3u8;
    const TAG_TS2_PAUSE_TOKEN: u8 = 4u8;
    const TAG_TS2_UNPAUSE_TOKEN: u8 = 5u8; 
    const TAG_HOLDING2_RELEASE: u8 = 6u8;
    const TAG_HOLDING2_OWNERSHIP_TRANSFER: u8 = 7u8;
    const TAG_TS2_UP_TS_SETTING: u8 = 8u8;
    const TAG_TS2_ADD_CHAIN_TO_ET: u8 = 9u8;
    const TAG_TS2_REMOVE_OTHER_CHAIN_ADD: u8 = 10u8;
    const TAG_TS2_UPDATE_FEES: u8 = 11u8;
    const TAG_WITHDRAW_FEES: u8 =12u8;

    struct TsTransferOwnership {
        tag: u8,
        id: u32,
        new_owner: address
    }

    async transition ts_transfer_ownership(public id: u32, public new_owner: address, public voters: [address; 5]) -> Future{
        let proposal: TsTransferOwnership = TsTransferOwnership {
            tag: TAG_TS2_TRANSFER_OWNERSHIP,
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let transfer_ownership: Future = vlink_token_service_cd_v7.aleo/transfer_ownership_ts(new_owner);

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

    struct TsAddTokenInfo {
        tag: u8,
        id: u32,
        min_transfer: u64,
        max_transfer: u64,
        token_address: [u8; 20],
        token_service: [u8; 20],
        chain_id: u128,
        fee_platform: u32
    }

    async transition ts_add_token_info(
        public id: u32, 
        public min_transfer: u64, 
        public max_transfer: u64, 
        public voters: [address; 5],
        public token_address: [u8; 20],
        public token_service: [u8; 20],
        public chain_id: u128,
        public fee_platform: u32
    ) -> Future{
        let proposal: TsAddTokenInfo  = TsAddTokenInfo {
            tag: TAG_TS2_ADD_TOKEN,
            id,
            min_transfer,
            max_transfer,
            token_address,
            token_service,
            chain_id,
            fee_platform, 
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let add_token : Future = vlink_token_service_cd_v7.aleo/add_token_info(min_transfer, max_transfer, token_address, token_service, chain_id, fee_platform);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_add_token(add_token, external_execute);
    }

    async function finalize_ts_add_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    ////////////////////////////////////////////////////////
    ///////  Token Service: Update Minimum Transfer ////////
    ////////////////////////////////////////////////////////

    struct TsUpdateMaxMinTransfer {
        tag: u8,
        id: u32,
        chain_id: u128,
        max_transfer: u64,
        min_transfer: u64,
    }

    async transition ts_update_max_min_transfer(
        public id: u32, 
        public chain_id: u128,
        public min_transfer: u64, 
        public max_transfer: u64, 
        public voters: [address; 5],      
    ) -> Future{
        let proposal: TsUpdateMaxMinTransfer  = TsUpdateMaxMinTransfer {
            tag: TAG_TS2_UPDATE_MAX_MIN_TRANSFER,
            id,
            chain_id,
            max_transfer,
            min_transfer,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let update_min_transfer: Future = vlink_token_service_cd_v7.aleo/update_min_transfer_ts(chain_id, min_transfer);

        let update_max_transfer: Future = vlink_token_service_cd_v7.aleo/update_max_transfer_ts(chain_id, max_transfer);

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
        chain_id: u128
    }

    async transition ts_pause_token(
        public id: u32, 
        public chain_id: u128,
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsPauseToken  = TsPauseToken {
            tag: TAG_TS2_PAUSE_TOKEN,
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let pause : Future = vlink_token_service_cd_v7.aleo/pause_token_ts(chain_id);

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
        chain_id: u128
    }

    async transition ts_unpause_token(
        public id: u32, 
        public chain_id: u128,
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: TsUnpauseToken  = TsUnpauseToken {
            tag: TAG_TS2_UNPAUSE_TOKEN,
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let unpause : Future = vlink_token_service_cd_v7.aleo/unpause_token_ts(chain_id);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_unpause_token(unpause, external_execute);

    }

    async function finalize_ts_unpause_token(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    ////////////////////////////////////////////////
    ///////  Holding Program : Release Fund ////////
    ////////////////////////////////////////////////

    struct HoldingRelease {
        tag: u8,
        id: u32,
        receiver: address,
        amount: u64
    }

    async transition holding_release(
        public id: u32,
        public receiver: address,
        public amount: u64,
        public voters: [address; 5],
        
    ) -> Future{
        let proposal: HoldingRelease  = HoldingRelease {
            tag: TAG_HOLDING2_RELEASE,
            id,
            receiver,
            amount
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_release_cc: Future = vlink_token_service_cd_v7.aleo/holding_release(receiver,amount);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_holding_release(holding_release_cc, external_execute);
    }

    async function finalize_holding_release(f0: Future, f1: Future) {
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
            tag: TAG_HOLDING2_OWNERSHIP_TRANSFER,
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let holding_ownership_transfer_cc: Future = vlink_token_service_cd_v7.aleo/holding_transfer_ownership(new_owner);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_holding_OWN_transfer(holding_ownership_transfer_cc, external_execute);
    }

    async function finalize_holding_OWN_transfer(f0: Future, f1: Future) {
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
        token_service_address: [u8; 20],
        token_address: [u8; 20]
    }

    async transition ts_update_token_service_setting(
        public id: u32,
        public chain_id: u128,
        public token_service_address: [u8; 20],
        public token_address: [u8; 20],
        public voters: [address; 5],
    ) -> Future{
        let proposal: UpdateTokenServiceSetting  = UpdateTokenServiceSetting {
            tag: TAG_TS2_UP_TS_SETTING,
            id,
            chain_id,
            token_service_address,
            token_address
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let update_other_TS : Future = vlink_token_service_cd_v7.aleo/update_other_chain_tokenservice(chain_id, token_service_address);
        
        let update_other_TA: Future = vlink_token_service_cd_v7.aleo/update_other_chain_tokenaddress(chain_id, token_address);

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
        token_service_address: [u8; 20],
        token_address: [u8; 20],
        fee_platform: u32
    }

    async transition ts_add_chain_to_existing_token(
        public id: u32,
        public chain_id: u128,
        public token_service_address: [u8; 20],
        public token_address: [u8; 20],
        public fee_platform: u32, 
        public voters: [address; 5]
    ) -> Future{
        let proposal: AddChainExistingToken  = AddChainExistingToken {
            tag: TAG_TS2_ADD_CHAIN_TO_ET,
            id,
            chain_id,
            token_service_address,  
            token_address,
            fee_platform
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let add_chain: Future = vlink_token_service_cd_v7.aleo/add_chain_to_existing_token(chain_id, token_service_address, token_address, fee_platform);

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
        chain_id: u128
    }

    async transition ts_remove_other_chain_addresses(
        public id: u32,
        public chain_id: u128,
        public voters: [address; 5],
    ) -> Future{
        let proposal: RemoveOtherChainAddresses  = RemoveOtherChainAddresses {
            tag: TAG_TS2_REMOVE_OTHER_CHAIN_ADD,
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

       // Execute the proposal
        let remove_address: Future = vlink_token_service_cd_v7.aleo/remove_other_chain_addresses(chain_id);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_remove_OC_addresses(remove_address, external_execute);
    }

    async function finalize_remove_OC_addresses(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }



    //////////////////////////////////////////////////////
    ///////////  Token Service : Update Fees /////////////
    //////////////////////////////////////////////////////

    struct UpdateFees {
        tag: u8,
        id: u32,
        chain_id: u128,
        fee_platform: u32,
    }
 
    async transition ts_update_fees(
        public id: u32,
        public chain_id: u128,
        public fee_platform: u32,
        public voters: [address; 5],
    ) -> Future {
        let proposal: UpdateFees = UpdateFees {
            tag: TAG_TS2_UPDATE_FEES,
            id,
            chain_id,
            fee_platform, 
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        let update_fees: Future = vlink_token_service_cd_v7.aleo/update_fees(chain_id, fee_platform);

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_ts_update_PF(update_fees, external_execute);
    }

    async function finalize_ts_update_PF(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    //////////////////////////////////////////////////////
    ///////////  Token Service : Withdraw Fees /////////////
    //////////////////////////////////////////////////////

    struct WithdrawalCreditsFees {
        tag: u8,
        id: u32,
        receiver: address,
        amount: u64
    }

    async transition withdraw_fees(public id: u32, public receiver: address, public amount: u64, public voters: [address; 5]) -> Future{
        assert(amount > 0u64);
        let proposal: WithdrawalCreditsFees = WithdrawalCreditsFees {
            tag: TAG_WITHDRAW_FEES,
            id,
            receiver,
            amount
        };

        let proposal_hash: field = BHP256::hash_to_field(proposal);


        let withdraw_fee: Future = credits.aleo/transfer_public(
            receiver,
            amount
        );

        let external_execute: Future = vlink_council_v07.aleo/external_execute(id, proposal_hash, voters);

        return finalize_withdraw_fees(withdraw_fee, external_execute);
    } 

    async function finalize_withdraw_fees(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

}