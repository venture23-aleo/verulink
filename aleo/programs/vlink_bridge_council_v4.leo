import vlink_council_v4.aleo;
import vlink_token_bridge_v4.aleo;

program vlink_bridge_council_v4.aleo
{
    ///////////////////////////////////////////
    /////// Bridge: Transfer Ownership ////////
    ///////////////////////////////////////////

    struct TbTransferOwnership {
        id: u32,
        new_owner: address
    }

    async transition tb_transfer_ownership(public id: u32, public new_owner: address, public voters: [address; 5]) -> Future{
        let proposal: TbTransferOwnership = TbTransferOwnership {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let transfer_ownership_tb: Future = vlink_token_bridge_v4.aleo/transfer_ownership_tb(new_owner);

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_transfer_ownership(transfer_ownership_tb, external_execute);
    }

    async function finalize_tb_transfer_ownership(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    /////////////////////////////////////
    /////// Bridge: Add Attestor ////////
    /////////////////////////////////////

    struct TbAddAttestor {
        id: u32,
        new_attestor: address,
        new_threshold: u8
    }

    async transition tb_add_attestor(public id: u32, public new_attestor: address, public new_threshold: u8, public voters: [address; 5])  -> Future{
        let proposal: TbAddAttestor = TbAddAttestor {
            id,
            new_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let add_attestor: Future = vlink_token_bridge_v4.aleo/add_attestor_tb(new_attestor, new_threshold);

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_add_attestor(add_attestor, external_execute);
    }

    async function finalize_tb_add_attestor(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }


    ////////////////////////////////////////
    /////// Bridge: Remove Attestor ////////
    ///////////////////////////////////////

    struct TbRemoveAttestor {
        id: u32,
        existing_attestor: address,
        new_threshold: u8
    }

    async transition tb_remove_attestor(public id: u32, public existing_attestor: address, public new_threshold: u8, public voters: [address; 5]) -> Future{
        let proposal: TbRemoveAttestor = TbRemoveAttestor {
            id,
            existing_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let remove_attestor: Future = vlink_token_bridge_v4.aleo/remove_attestor_tb(existing_attestor, new_threshold);

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_remove_attestor(remove_attestor, external_execute);
    }

    async function finalize_tb_remove_attestor(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    /////////////////////////////////////////
    /////// Bridge: Update Threshold ////////
    /////////////////////////////////////////

    struct TbUpdateThreshold {
        id: u32,
        new_threshold: u8
    }

    async transition tb_update_threshold(public id: u32, public new_threshold: u8, public voters: [address; 5]) -> Future{
        let proposal: TbUpdateThreshold = TbUpdateThreshold {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let update_threshold : Future = vlink_token_bridge_v4.aleo/update_threshold_tb(new_threshold);

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_update_threshold(update_threshold, external_execute);
    }

    async function finalize_tb_update_threshold(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    //////////////////////////////////
    /////// Bridge: Add Chain ////////
    //////////////////////////////////

    struct TbAddChain {
        id: u32,
        chain_id: u128
    }

    async transition tb_add_chain(public id: u32, public chain_id: u128, public voters: [address; 5]) -> Future{
        let proposal: TbAddChain = TbAddChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let add_chain: Future = vlink_token_bridge_v4.aleo/add_chain_tb(chain_id);

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);
        
        return finalize_tb_add_chain(add_chain, external_execute);
    }

    async function finalize_tb_add_chain(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }


    ///////////////////////////////////////
    /////// Bridge: Remove Chain /////////
    ///////////////////////////////////////

    struct TbRemoveChain {
        id: u32,
        chain_id: u128
    }

    async transition tb_remove_chain(public id: u32, public chain_id: u128, public voters: [address; 5]) -> Future{
        let proposal: TbRemoveChain = TbRemoveChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let remove_chain: Future = vlink_token_bridge_v4.aleo/remove_chain_tb(chain_id);
        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_remove_chain(remove_chain, external_execute);

    }

    async function finalize_tb_remove_chain(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    ///////////////////////////////////////
    /////// Bridge: Add Service ////////
    ///////////////////////////////////////

    struct TbAddService {
        id: u32,
        service: address
    }

    async transition tb_add_service(public id: u32, public service: address, public voters: [address; 5]) -> Future{
        let proposal: TbAddService = TbAddService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let add_service: Future = vlink_token_bridge_v4.aleo/add_service_tb(service);

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_add_service(add_service, external_execute);

    }

    async function finalize_tb_add_service(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    ///////////////////////////////////////
    /////// Bridge: Remove Service ////////
    ///////////////////////////////////////

    struct TbRemoveService {
        id: u32,
        service: address
    }

    async transition tb_remove_service(public id: u32, public service: address, public voters: [address; 5]) -> Future{
        let proposal: TbRemoveService = TbRemoveService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let remove_service: Future =  vlink_token_bridge_v4.aleo/remove_service_tb(service);

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_remove_service(remove_service, external_execute);
    }

    async function finalize_tb_remove_service(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    //////////////////////////////
    /////// Bridge: Pause ////////
    //////////////////////////////

    struct TbPause {
        id: u32,
    }

    async transition tb_pause(public id: u32, public voters: [address; 5]) -> Future{
        let proposal: TbPause = TbPause {
            id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let pause: Future = vlink_token_bridge_v4.aleo/pause_tb();

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_pause(pause, external_execute);
    }

    async function finalize_tb_pause(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }

    //////////////////////////////
    /////// Bridge: Unpause ////////
    //////////////////////////////

    struct TbUnpause {
        id: u32,
    }

    async transition tb_unpause(public id: u32, public voters: [address; 5]) -> Future{
        let proposal: TbUnpause = TbUnpause {
            id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        let unpause: Future = vlink_token_bridge_v4.aleo/unpause_tb();

        let external_execute: Future = vlink_council_v4.aleo/external_execute(id, proposal_hash, voters);

        return finalize_tb_unpause(unpause, external_execute);
    }

    async function finalize_tb_unpause(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
}