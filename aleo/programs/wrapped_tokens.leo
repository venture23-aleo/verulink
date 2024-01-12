// The 'wrapped_token' program.
program wrapped_tokens.aleo {

    record wrapped_token {
        owner: address,
        token_id: address,
        amount: u64
    }

    // Contract on different (foreign) chain
    // Prefixed with WT to represent Wrapped Token
    // Used prefix to fix Error [EAST0372007]: struct `ForeignContract` shadowed by bridge.leo on TokenService
    struct WTForeignContract {
        // Chain Id of Other Network
        chain_id: u128,
        // Contract Address of the Service Program
        // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
        // For EVM Chains, 20 bytes is formated as following:
        // [00 00 00 00 00 00 00 00 00 00 00 00 d8 da 6b f2 69 64 af 9d 7e ed 9e 03 e5 34 15 d3 7a a9 60 45]
        contract_address: [u8; 32]
    }

    struct TokenInfo {
        // Name of the token
        // Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
        // Example: `USD Coin` is represented as following:
        // [55 53 44 20 43 6f 69 6e 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00]
        name: [u8; 32],
        // Symbol of the token
        // Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
        // Example: `USDC` is represented as following:
        // [55 53 44 43 00 00 00 00 00 00 00 00 00 00 00 00] 
        symbol: [u8; 16],
        // Decimals of the token
        decimals: u8
    }

    struct WrappedTokenInfo {
        token_info: TokenInfo,
        origin: WTForeignContract
    }

    // key is token_id
    // generated as Hash(token_info, foreign_contract)
    mapping token_info: address => TokenInfo;
    mapping token_origin: address => WTForeignContract;
    mapping token_supply: address => u64;

    struct TokenAccount {
        user: address,
        token_id: address
    }
    // TODO: check if there is any significant gas cost to storing key as struct vs key as hash(struct)
    mapping token_balances: TokenAccount => u64;


    // mapping used as variable
    // true: address of council 
    // false: Null
    mapping governance_WT: bool => address;

    inline token_service_program() -> address {
        return aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3;
    }

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    // Initialize must be called from council program
    transition wrapped_token_initialize(governance: address) {
        return then finalize(governance);
    }

    finalize wrapped_token_initialize(governance: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(governance_WT, true));

        // Set the council program
        Mapping::set(governance_WT, true, governance);
    }

    ///////////////////////////////
    ///// Update Governance ///////
    ///////////////////////////////

    /// Update the existing governance program
    /// Can only be called from council/governance program
    transition update_governance_wt(public new_governance: address) {
        return then finalize(self.caller, new_governance);
    }

    finalize update_governance_wt(from: address, new_governance: address) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_WT, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::set(governance_WT, true, new_governance);
    }


    transition add_token_wt(public name: [u8; 32], public symbol: [u8; 16], public decimals: u8, public origin_chain_id: u128, public origin_contract_address: [u8; 32]) {
        let new_token_id: address = BHP256::hash_to_address(WrappedTokenInfo {
            token_info: TokenInfo {
                name, 
                symbol,
                decimals
            },
            origin: WTForeignContract {
                chain_id: origin_chain_id,
                contract_address: origin_contract_address,
            }
        });
        return then finalize(self.caller, new_token_id, name, symbol, decimals, origin_chain_id, origin_contract_address);
    }

    finalize add_token_wt(from: address, token_id: address, name: [u8; 32], symbol: [u8; 16], decimals: u8, origin_chain_id: u128, origin_contract_address: [u8; 32]) {
        // Get the council address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_WT, true);
        assert_eq(from, governance);

        // Ensure the same token has not been added
        assert(!Mapping::contains(token_info, token_id));

        let origin_contract: WTForeignContract = WTForeignContract {
            chain_id: origin_chain_id,
            contract_address: origin_contract_address,
        };

        let new_token_info: TokenInfo = TokenInfo {
            name,
            symbol,
            decimals
        };

        // Set the information about token
        Mapping::set(token_info, token_id, new_token_info);
        Mapping::set(token_origin, token_id, origin_contract);
    }

    transition transfer_public(receiver: address, amount: u64, token_id: address) {
        return then finalize(self.caller, token_id, receiver, amount);
    }

    finalize transfer_public(sender: address, token_id: address, receiver: address, amount: u64) {
        assert(Mapping::contains(token_info, token_id));
        assert(Mapping::contains(token_origin, token_id));


        let token_sender: TokenAccount = TokenAccount {
            user: sender,
            token_id
        };
        let token_receiver: TokenAccount = TokenAccount {
            user: receiver,
            token_id
        };

        let sender_balance: u64 = Mapping::get(token_balances, token_sender);
        Mapping::set(token_balances, token_sender, sender_balance - amount);

        let receiver_balance: u64 = Mapping::get_or_use(token_balances, token_receiver, 0u64);
        Mapping::set(token_balances, token_receiver, receiver_balance + amount);
    }

    transition transfer_private(sender: wrapped_token, receiver: address, amount: u64) -> (wrapped_token, wrapped_token) {
        let difference: u64 = sender.amount - amount;

        let remaining: wrapped_token = wrapped_token {
            owner: sender.owner,
            amount: difference,
            token_id: sender.token_id
        };

        let transferred: wrapped_token = wrapped_token {
            owner: receiver,
            amount,
            token_id: sender.token_id
        };

        return (remaining, transferred);
    }

    transition transfer_private_to_public(sender: wrapped_token, receiver: address, amount: u64) -> wrapped_token {
        let difference: u64 = sender.amount - amount;

        let remaining: wrapped_token = wrapped_token {
            owner: sender.owner,
            amount: difference,
            token_id: sender.token_id
        };

        return remaining then finalize(sender.token_id, receiver, amount);

    }

    finalize transfer_private_to_public(token_id: address, receiver: address, amount: u64) {
        let token_receiver: TokenAccount = TokenAccount {
            user: receiver,
            token_id
        };
        let receiver_balance: u64 = Mapping::get_or_use(token_balances, token_receiver, 0u64);
        Mapping::set(token_balances, token_receiver, receiver_balance + amount);
    }

    transition transfer_public_to_private(receiver: address, amount: u64, token_id: address) -> wrapped_token {
        let transferred: wrapped_token = wrapped_token {
            owner: receiver,
            token_id,
            amount
        };
        return transferred then finalize(token_id, self.caller, amount);
    }

    finalize transfer_public_to_private(token_id: address, sender: address, amount: u64) {
        let token_sender: TokenAccount = TokenAccount {
            user: sender,
            token_id
        };
        let sender_balance: u64 = Mapping::get(token_balances, token_sender);
        Mapping::set(token_balances, token_sender, sender_balance - amount);
    }

    transition mint(receiver: address, amount: u64, token_id: address, from_chain_id: u128, from_contract_address: [u8;32]) {
        // Assert that only token service program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);
        assert_eq(self.caller, token_service_program());

        // Cannot directly pass struct as parameter in cross-contract call.
        // So construct from struct on `finalize` instead
        // Issue: https://github.com/AleoHQ/leo/issues/3269
        // let from: WTForeignContract = WTForeignContract {
        //     chain_id: from_chain_id,
        //     contract_address: from_contract_address
        // };

        return then finalize(receiver, amount, token_id, from_chain_id, from_contract_address);
    }

    finalize mint(receiver: address, amount: u64, token_id: address, from_chain_id: u128, from_contract_address: [u8;32]) {
        // Assert the token is minted from the origin
        let from: WTForeignContract = WTForeignContract {
            chain_id: from_chain_id,
            contract_address: from_contract_address
        };
        let origin: WTForeignContract = Mapping::get(token_origin, token_id);
        assert_eq(origin, from);

        let token_receiver: TokenAccount = TokenAccount {
            user: receiver,
            token_id
        };
        // Increase the balance of the receiver
        let receiver_balance: u64 = Mapping::get_or_use(token_balances, token_receiver, 0u64);
        Mapping::set(token_balances, token_receiver, receiver_balance + amount);

        // Increase the total supply
        let existing_supply: u64 = Mapping::get_or_use(token_supply, token_id, 0u64);
        Mapping::set(token_supply, token_id, existing_supply + amount);
    }

    transition burn(amount: u64, token_id: address, to_chain_id: u128, to_contract_address: [u8; 32]) {
        // Assert that only token service program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);
        assert_eq(self.caller, token_service_program());

        // Cannot directly pass struct as parameter in cross-contract call.
        // So construct from struct on `finalize` instead
        // Issue: https://github.com/AleoHQ/leo/issues/3269
        // let to: WTForeignContract = WTForeignContract {
        //     chain_id: to_chain_id,
        //     contract_address: to_contract_address
        // };

        return then finalize(self.signer, amount, token_id, to_chain_id, to_contract_address);

    }

    finalize burn(sender: address, amount: u64, token_id: address, to_chain_id: u128, to_contract_address: [u8; 32]) {
        // Assert the token is burned to the origin
        let to: WTForeignContract = WTForeignContract {
            chain_id: to_chain_id,
            contract_address: to_contract_address
        };
        let origin: WTForeignContract = Mapping::get(token_origin, token_id);
        assert_eq(origin, to);

        let token_sender: TokenAccount = TokenAccount {
            user: sender,
            token_id
        };

        // Decrease the balance of the sender
        let sender_balance: u64 = Mapping::get(token_balances, token_sender);
        Mapping::set(token_balances, token_sender, sender_balance - amount);

        // Decrease the total supply
        let existing_supply: u64 = Mapping::get(token_supply, token_id);
        Mapping::set(token_supply, token_id, existing_supply - amount);
    }

}