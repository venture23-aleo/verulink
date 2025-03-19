import vlink_council_v2.aleo;
import vlink_token_bridge_v2.aleo;

program vlink_bridge_council_v2.aleo
{
    ///////////////////////////////////////////
    /////// Bridge: Transfer Ownership ////////
    ///////////////////////////////////////////

    struct TbTransferOwnership {
        id: u32,
        new_owner: address
    }

    transition tb_transfer_ownership(public id: u32, public new_owner: address, public voters: [address; 5]) {
        let proposal: TbTransferOwnership = TbTransferOwnership {
            id,
            new_owner
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/transfer_ownership_tb(new_owner);

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);
    }

    /////////////////////////////////////
    /////// Bridge: Add Attestor ////////
    /////////////////////////////////////

    struct TbAddAttestor {
        id: u32,
        new_attestor: address,
        new_threshold: u8
    }

    transition tb_add_attestor(public id: u32, public new_attestor: address, public new_threshold: u8, public voters: [address; 5]) {
        let proposal: TbAddAttestor = TbAddAttestor {
            id,
            new_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/add_attestor_tb(new_attestor, new_threshold);

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);
    }

    ////////////////////////////////////////
    /////// Bridge: Remove Attestor ////////
    ///////////////////////////////////////

    struct TbRemoveAttestor {
        id: u32,
        existing_attestor: address,
        new_threshold: u8
    }

    transition tb_remove_attestor(public id: u32, public existing_attestor: address, public new_threshold: u8, public voters: [address; 5]) {
        let proposal: TbRemoveAttestor = TbRemoveAttestor {
            id,
            existing_attestor,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/remove_attestor_tb(existing_attestor, new_threshold);

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);
    }

    /////////////////////////////////////////
    /////// Bridge: Update Threshold ////////
    /////////////////////////////////////////

    struct TbUpdateThreshold {
        id: u32,
        new_threshold: u8
    }

    transition tb_update_threshold(public id: u32, public new_threshold: u8, public voters: [address; 5]) {
        let proposal: TbUpdateThreshold = TbUpdateThreshold {
            id,
            new_threshold
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/update_threshold_tb(new_threshold);

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);
    }

    //////////////////////////////////
    /////// Bridge: Add Chain ////////
    //////////////////////////////////

    struct TbAddChain {
        id: u32,
        chain_id: u128
    }

    transition tb_add_chain(public id: u32, public chain_id: u128, public voters: [address; 5]) {
        let proposal: TbAddChain = TbAddChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/add_chain_tb(chain_id);

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);

    }


    ///////////////////////////////////////
    /////// Bridge: Remove Chain /////////
    ///////////////////////////////////////

    struct TbRemoveChain {
        id: u32,
        chain_id: u128
    }

    transition tb_remove_chain(public id: u32, public chain_id: u128, public voters: [address; 5]) {
        let proposal: TbRemoveChain = TbRemoveChain {
            id,
            chain_id
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/remove_chain_tb(chain_id);
        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);

    }

    ///////////////////////////////////////
    /////// Bridge: Add Service ////////
    ///////////////////////////////////////

    struct TbAddService {
        id: u32,
        service: address
    }

    transition tb_add_service(public id: u32, public service: address, public voters: [address; 5]) {
        let proposal: TbAddService = TbAddService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/add_service_tb(service);

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);

    }

    ///////////////////////////////////////
    /////// Bridge: Remove Service ////////
    ///////////////////////////////////////

    struct TbRemoveService {
        id: u32,
        service: address
    }

    transition tb_remove_service(public id: u32, public service: address, public voters: [address; 5]) {
        let proposal: TbRemoveService = TbRemoveService {
            id,
            service
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/remove_service_tb(service);

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);

    }

    //////////////////////////////
    /////// Bridge: Pause ////////
    //////////////////////////////

    struct TbPause {
        id: u32,
    }

    transition tb_pause(public id: u32, public voters: [address; 5]) {
        let proposal: TbPause = TbPause {
            id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/pause_tb();

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);
    }

    //////////////////////////////
    /////// Bridge: Unpause ////////
    //////////////////////////////

    struct TbUnpause {
        id: u32,
    }

    transition tb_unpause(public id: u32, public voters: [address; 5]) {
        let proposal: TbUnpause = TbUnpause {
            id,
        };
        let proposal_hash: field = BHP256::hash_to_field(proposal);

        // Execute the proposal
        vlink_token_bridge_v2.aleo/unpause_tb();

        vlink_council_v2.aleo/external_execute(id, proposal_hash, voters);
    }
}