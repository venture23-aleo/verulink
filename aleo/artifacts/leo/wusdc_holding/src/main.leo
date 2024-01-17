import wusdc_token.aleo;

program wusdc_holding.aleo {

    // mapping used as variable
    // true: address of owner 
    // false: Null
    mapping owner_holding: bool => address;

    mapping holdings: address => u128;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_wusdc_holding() {
        return then finalize(self.caller);
    }

    finalize initialize_wusdc_holding(connector: address) {
        // Assert holding program has not been initialized before
        assert(!Mapping::contains(owner_holding, true));

        // Set the owner program
        Mapping::set(owner_holding, true, connector);
    }

    ///////////////////////////////
    ///// Transfer Ownership ///////
    ///////////////////////////////

    /// Update the existing owner program
    /// Can only be called from owner/owner program
    transition transfer_ownership_wusdc_holdin(public new_owner: address) {
        return then finalize(self.caller, new_owner);
    }

    finalize transfer_ownership_wusdc_holdin(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_holding, true);
        assert_eq(from, owner);

        // If attestor does not exist, this is expected to fail
        Mapping::set(owner_holding, true, new_owner);
    }


    transition hold_fund(public user: address, public amount: u128) {
        // Assert that only token service program can call this method
        // Referencing: https://github.com/AleoHQ/snarkVM/pull/2020
        // self.signer = tx.origin
        // self.caller = msg.sender
        return then finalize(self.caller, user, amount);
    }

    finalize hold_fund(from: address, user: address, amount: u128) {
        assert_eq(Mapping::get(owner_holding, true), from);

        let held_amount: u128 = Mapping::get_or_use(holdings, user, 0u128);

        // Increase the held amount for the token_user
        Mapping::set(holdings, user, held_amount + amount);
    }

    transition release_fund(public user: address, public amount: u128) {
        wusdc_token.aleo/transfer_public(user, amount);
        return then finalize(user, amount, self.caller);
    }

    finalize release_fund(user: address, amount: u128, caller: address) {
        // Assert only owner can release fund
        let owner: address = Mapping::get(owner_holding, true);
        assert_eq(owner, caller);

        let held_amount: u128 = Mapping::get(holdings, user);

        // Increase the held amount for the token_user
        Mapping::set(holdings, user, held_amount - amount);
    }


}