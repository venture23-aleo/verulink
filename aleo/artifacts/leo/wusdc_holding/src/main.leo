import wusdc_token.aleo;

program wusdc_holding.aleo {

    // mapping used as variable
    // true: address of council 
    // false: Null
    mapping governance_holding: bool => address;

    mapping holdings: address => u64;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_wusdc_holding() {
        return then finalize(self.caller);
    }

    finalize initialize_wusdc_holding(connector: address) {
        // Assert holding program has not been initialized before
        assert(!Mapping::contains(governance_holding, true));

        // Set the council program
        Mapping::set(governance_holding, true, connector);
    }

    ///////////////////////////////
    ///// Update Governance ///////
    ///////////////////////////////

    /// Update the existing governance program
    /// Can only be called from council/governance program
    transition update_governance_wusdc_holding(public new_governance: address) {
        return then finalize(self.caller, new_governance);
    }

    finalize update_governance_wusdc_holding(from: address, new_governance: address) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_holding, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::set(governance_holding, true, new_governance);
    }


    transition hold_fund(public user: address, public amount: u64) {
        // Assert that only token service program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        return then finalize(self.caller, user, amount);
    }

    finalize hold_fund(from: address, user: address, amount: u64) {
        assert_eq(Mapping::get(governance_holding, true), from);

        let held_amount: u64 = Mapping::get_or_use(holdings, user, 0u64);

        // Increase the held amount for the token_user
        Mapping::set(holdings, user, held_amount + amount);
    }

    transition release_fund(public user: address, public amount: u64) {
        wusdc_token.aleo/transfer_public(user, amount);
        return then finalize(user, amount, self.caller);
    }

    finalize release_fund(user: address, amount: u64, caller: address) {
        // Assert only governance can release fund
        let governance: address = Mapping::get(governance_holding, true);
        assert_eq(governance, caller);

        let held_amount: u64 = Mapping::get(holdings, user);

        // Increase the held amount for the token_user
        Mapping::set(holdings, user, held_amount - amount);
    }


}