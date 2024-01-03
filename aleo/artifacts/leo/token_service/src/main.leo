// The 'token_service' program.

import wrapped_token.aleo;
import bridge.aleo;

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

    // tracks the total supply of the token
    mapping total_supply: address => u64;

    // minimum amount that can be transferred via Token Service
    // represented as actual value
    // key is token_id
    mapping minimum_transfers: address => u64;

    // maximum percentage that can be transferred in the given timeframe
    // represented in basis points
    // timeframe is defined in terms of block height
    // key is token_id
    mapping max_outgoing_percentage: address => u16;
    mapping timeframe: address => u32;

    // tracks the last time the token was minted/burned
    mapping last_token_update: address => u32;
    // tracks the minimum supply that should be available after the token update
    mapping last_min_supply: address => u64;

    // `this` returns the address of the program
    // TODO: replace the address with address of this program
    // Referencing: https://github.com/AleoHQ/snarkVM/blob/testnet3/console/program/src/id/to_address.rs
    // Address of the program is computed as:
    // hash_to_group_psd4(&[self.name().to_field(), self.network().to_field()]);
    inline this() -> address {
        return aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3;
    }

    inline max_basis_point() -> u16 {
        return 10000u16;
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
        wrapped_token.aleo/burn(amount, token_id, origin.chain_id, origin.token_address);

        // call publish on bridge contract
        bridge.aleo/publish(origin.chain_id, origin.token_service_address, origin.token_address, self.caller, receiver, amount);

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

        let current_supply: u64 = Mapping::get(total_supply, wrapped_addr);
        // TODO: check if storing as u16 is actually better
        // or if type conversion is better
        
        // Update only from council
        let percentage_in_basis_points: u16 = Mapping::get(max_outgoing_percentage, wrapped_addr);
        let token_timeframe: u32 = Mapping::get(timeframe, wrapped_addr);

        // Updated on each token_send
        let last_update: u32 = Mapping::get_or_use(last_token_update, wrapped_addr, 0u32);
        let last_min_required_supply: u64 = Mapping::get_or_use(last_min_supply, wrapped_addr, 0u64);

        let time_passed: u32 = block.height - last_update;

        // If percentage = 10
        // then min_required_supply = 90% of current_supply
        let min_required_supply: u64 = (current_supply * ( max_basis_point() - percentage_in_basis_points) as u64) / (max_basis_point() as u64);

        // If percentage = 10
        // then max_withdraw = 10% of current_supply
        let max_withdraw_in_timeframe: u64 = current_supply * (percentage_in_basis_points as u64) / (max_basis_point() as u64);
        let max_withdraw_from_last_update: u64 = (max_withdraw_in_timeframe * time_passed as u64 ) / (token_timeframe as u64);
        let new_min_required_supply: u64 = last_min_required_supply - max_withdraw_from_last_update;
        
        // Select the max
        new_min_required_supply = new_min_required_supply > min_required_supply ? new_min_required_supply : min_required_supply;

        assert(current_supply - amount >= new_min_required_supply);

        Mapping::set(last_token_update, wrapped_addr, block.height);
        Mapping::set(last_min_supply, wrapped_addr, new_min_required_supply);
        
        // Decrease the total supply
        Mapping::set(total_supply, wrapped_addr, current_supply - amount);

    }

    /// Consumes msg from source at destination
    /// Requires sequence no of the source network
    transition token_receive(public source: TokenOrigin, public token_id: address, public sender: [u8; 32], public receiver: address, public amount: u64, public sequence_no_of_source_network: u32, public height_of_source_network: u32) {

        // call consume on bridge
        bridge.aleo/consume(source.chain_id, source.token_service_address, token_id, sender, receiver, amount, sequence_no_of_source_network, height_of_source_network);

        // call mint on wrapped token
        wrapped_token.aleo/mint(receiver, amount, token_id, source.chain_id, source.token_address);

        return then finalize(token_id, amount);
    }

    finalize token_receive(token_id: address, amount: u64) {
        // Increase the total supply
        let current_supply: u64 = Mapping::get_or_use(total_supply, token_id, 0u64);
        Mapping::set(total_supply, token_id, current_supply + amount);
    }

}