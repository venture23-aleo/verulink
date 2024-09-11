import wusdc_token_v0003.aleo;

program wusdc_holding_v0003.aleo {

    mapping holdings: address => u128;

    // mapping used as variable
    // true: address of owner 
    // false: Null
    mapping owner_holding: bool => address;

    const OWNER_INDEX: bool = true;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_holding() {
        return then finalize(self.caller);
    }

    finalize initialize_holding(connector: address) {
        // Assert holding program has not been initialized before
        assert(!Mapping::contains(owner_holding, OWNER_INDEX));

        // Set the owner program
        Mapping::set(owner_holding, OWNER_INDEX, connector);
    }

    ///////////////////////////////
    ///// Transfer Ownership //////
    ///////////////////////////////

    /// Update the existing owner program
    /// Can only be called from owner/owner program
    transition transfer_ownership_holding(public new_owner: address) {
        return then finalize(self.caller, new_owner);
    }

    finalize transfer_ownership_holding(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        // If attestor does not exist, this is expected to fail
        Mapping::set(owner_holding, OWNER_INDEX, new_owner);
    }


    transition hold_fund(public user: address, public amount: u128) {
        return then finalize(self.caller, user, amount);
    }

    finalize hold_fund(from: address, user: address, amount: u128) {
        // Assert only owner can hold fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u128 = Mapping::get_or_use(holdings, user, 0u128);

        // Increase the held amount for the token_user
        Mapping::set(holdings, user, held_amount + amount);
    }

    transition release_fund(public user: address, public amount: u128) {
        wusdc_token_v0003.aleo/transfer_public(user, amount);
        return then finalize(self.caller, user, amount);
    }

    finalize release_fund(from: address, user: address, amount: u128) {
        // Assert only owner can release fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u128 = Mapping::get(holdings, user);

        // Decrease the held amount for the token_user
        Mapping::set(holdings, user, held_amount - amount);
    }


}