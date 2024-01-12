import wrapped_tokens.aleo;

program holding.aleo {

    // mapping used as variable
    // true: address of council 
    // false: Null
    mapping governance_holding: bool => address;

    struct TokenAcc {
        user: address,
        token_id: address
    }

    mapping holdings: TokenAcc => u64;

    inline token_service_program() -> address {
        return aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3;
    }

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_holding(public council: address) {
        return then finalize(council);
    }

    finalize initialize_holding(council: address) {
        // Assert holding program has not been initialized before
        assert(!Mapping::contains(governance_holding, true));

        // Set the council program
        Mapping::set(governance_holding, true, council);
    }

    ///////////////////////////////
    ///// Update Governance ///////
    ///////////////////////////////

    /// Update the existing governance program
    /// Can only be called from council/governance program
    transition update_governance_holding(public new_governance: address) {
        return then finalize(self.caller, new_governance);
    }

    finalize update_governance_holding(from: address, new_governance: address) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_holding, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::set(governance_holding, true, new_governance);
    }


    transition hold_fund(public token_id: address, public user: address, public amount: u64) {
        // Assert that only token service program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        assert_neq(self.signer, self.caller);
        assert_eq(self.caller, token_service_program());

        return then finalize(token_id, user, amount);
    }

    finalize hold_fund(token_id: address, user: address, amount: u64) {
        let token_user: TokenAcc = TokenAcc {
            user,
            token_id
        };
        let held_amount: u64 = Mapping::get_or_use(holdings, token_user, 0u64);

        // Increase the held amount for the token_user
        Mapping::set(holdings, token_user, held_amount + amount);
    }

    transition release_fund(public token_id: address, public user: address, public amount: u64) {
        wrapped_tokens.aleo/transfer_public(user, amount, token_id);
        return then finalize(token_id, user, amount, self.caller);
    }

    finalize release_fund(token_id: address, user: address, amount: u64, caller: address) {
        // Assert only governance can release fund
        let governance: address = Mapping::get(governance_holding, true);
        assert_eq(governance, caller);

        let token_user: TokenAcc = TokenAcc {
            user,
            token_id
        };
        let held_amount: u64 = Mapping::get(holdings, token_user);

        // Increase the held amount for the token_user
        Mapping::set(holdings, token_user, held_amount - amount);
    }


}