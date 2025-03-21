import token_registry.aleo;

program vlink_holding_v3.aleo {

    struct Holder{
        account : address, 
        token_id : field 
    }

    mapping holdings: Holder => u128;

    // mapping used as variable
    // true: address of owner 
    // false: Null
    mapping owner_holding: bool => address;

    const OWNER_INDEX: bool = true;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_holding(public owner: address) {
        return then finalize(owner);
    }

    finalize initialize_holding(owner: address) {
        // Assert holding program has not been initialized before
        assert(!Mapping::contains(owner_holding, OWNER_INDEX));

        // Set the owner program
        Mapping::set(owner_holding, OWNER_INDEX, owner);
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


    transition hold_fund(public user: address, token_id: field, public amount: u128) {
        let token_holder: Holder = Holder{
            account: user,
            token_id: token_id
        };
        return then finalize(self.caller, token_holder, amount);
    }

    finalize hold_fund(from: address, token_holder: Holder, amount: u128) {
        // Assert only owner can hold fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u128 = Mapping::get_or_use(holdings, token_holder, 0u128);

        // Increase the held amount for the token_user
        Mapping::set(holdings, token_holder, held_amount + amount);
    }

    transition release_fund(public user: address, public token_id :field, public amount: u128) {
        token_registry.aleo/transfer_public(token_id, user, amount);

        let token_holder: Holder = Holder{
            account: user,
            token_id: token_id
        };

        return then finalize(self.caller, token_holder, amount);
    }

    finalize release_fund(from: address, token_holder: Holder, amount: u128) {
        // Assert only owner can release fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u128 = Mapping::get(holdings, token_holder);

        // Decrease the held amount for the token_user
        Mapping::set(holdings, token_holder, held_amount - amount);
    }


}