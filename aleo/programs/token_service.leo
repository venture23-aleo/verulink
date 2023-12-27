// The 'token_service' program.

import wrapped_token.leo;
import bridge.leo;

program token_service.aleo {

    // Contract on different (foreign) chain
    struct TSForeignContract {
        // Chain Id other network where the `contract_address` exists
        chain_id: u32,
        // Address of the contract on the other chain
        contract_address: [u8; 32]
    }

    struct TokenOrigin {
        // Chain Id of the origin network
        chain_id: u32,
        // Address of the token service contract on the origin network
        token_service_address: [u8; 32],
        // Address of the token contract on the origin network; Ex: USDC on Ethereum
        token_address: [u8; 32],
    }

    // key is chain_id
    // value is address of the token service contract on chain (with chain_id)
    mapping token_service_contracts: u32 => [u8; 32];

    // mapping outgoing_messages: field => MsgTokenSend;

    // mapping used as variable
    // true: address of council 
    // false: Null
    mapping council_program_TS: bool => address;

    // minimum amount that can be transferred via Token Service
    // key is token_id
    mapping minimum_transfers: address => u64;

    // `this` returns the address of the program
    // TODO: replace the address with address of this program
    // Referencing: https://github.com/AleoHQ/snarkVM/blob/testnet3/console/program/src/id/to_address.rs
    // Address of the program is computed as:
    // hash_to_group_psd4(&[self.name().to_field(), self.network().to_field()]);
    inline this() -> address {
        return aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3;
    }

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    // Initialize must be called from council program
    transition token_service_initialize() {
        // Assert that only a program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);
        return then finalize(self.caller);
    }

    finalize token_service_initialize(council: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(council_program_TS, true));

        // Set the council program
        Mapping::set(council_program_TS, true, council);
    }


    transition support_chain(public chain_id: u32, public token_service_address: [u8; 32]) {
        return then finalize(self.caller, chain_id, token_service_address);
    }

    finalize support_chain(from: address, chain_id: u32, token_service_address: [u8; 32]) {
        // Get the council address
        // If program not initialized, this fails
        let council: address = Mapping::get(council_program_TS, true);
        assert_eq(from, council);

        Mapping::set(token_service_contracts, chain_id, token_service_address);
    }

    transition enable_token(public token_id: address, public minimum_transfer: u64) {
        // TODO: 
        // 1. handle limits - max amounts that can be withdrawn in given time
        // 2. handle fees
        return then finalize(self.caller, token_id, minimum_transfer);
    }

    finalize enable_token(from: address, token_id: address, minimum_transfer: u64) {
        // Get the council address
        // If program not initialized, this fails
        let council: address = Mapping::get(council_program_TS, true);
        assert_eq(from, council);

        Mapping::set(minimum_transfers, token_id, minimum_transfer);
    }

    transition token_send(public token_id: address, public receiver: [u8; 32], public amount: u64, public origin: TokenOrigin) {
        // TODO
        // If fee is set require credits token for publishing

        // call burn on wrapped token
        wrapped_token.leo/burn(amount, token_id, origin.chain_id, origin.token_address);

        // call publish on bridge contract
        bridge.leo/publish(origin.chain_id, origin.token_service_address, origin.token_address, self.caller, receiver, amount);

        // return then finalize (self.caller, origin, msg, msg_hash);
        return then finalize (token_id, origin, amount);
    }

    // finalize token_send(wrapped_addr: address, origin: TokenOrigin, msg: MsgTokenSend, msg_hash: field) {
    finalize token_send(wrapped_addr: address, origin: TokenOrigin, amount: u64) {

        // Assert that it can only be published to the token service program on the origin network
        let origin_token_service_contract: [u8; 32] = Mapping::get(token_service_contracts, origin.chain_id);
        assert_eq(origin_token_service_contract, origin.token_service_address);

        let min_amount: u64 = Mapping::get(minimum_transfers, wrapped_addr);
        assert(amount >= min_amount);

        // Mapping::set(outgoing_messages, msg_hash, msg);

        // TODO: 
        // 1. handle limits - max amounts that can be withdrawn in given time
        // 2. handle fees

    }

    /// Consumes msg from source at destination
    /// Requires sequence no of the source network
    transition token_receive(public source: TokenOrigin, public token_id: address, public sender: [u8; 32], public receiver: address, public amount: u64, public sequence_no_of_source_network: u32, public height_of_source_network: u32) {

        // call consume on bridge
        bridge.leo/consume(source.chain_id, source.token_service_address, token_id, sender, receiver, amount, sequence_no_of_source_network, height_of_source_network);

        // call mint on wrapped token
        wrapped_token.leo/mint(receiver, amount, token_id, source.chain_id, source.token_address);
    }

}