import token_registry.aleo;

program vlink_holding_v2.aleo {

    
    struct Image {
        pre_image: field,
        receiver: address
    }

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
    async transition initialize_holding(public owner: address) -> Future{
        return (finalize_initialize_holding(owner));
    }

    async function finalize_initialize_holding(owner: address) {
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
    async transition transfer_ownership_holding(public new_owner: address) -> Future{
        return (finalize_transfer_ownership(self.caller, new_owner));
    }

    async function finalize_transfer_ownership(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        // If attestor does not exist, this is expected to fail
        Mapping::set(owner_holding, OWNER_INDEX, new_owner);
    }


    async transition hold_fund(public user: address, token_id: field, public amount: u128) -> Future{
        let token_holder: Holder = Holder{
            account: user,
            token_id: token_id
        };
        return(finalize_hold_fund(self.caller, token_holder, amount));
    }

    async function finalize_hold_fund(from: address, token_holder: Holder, amount: u128) {
        // Assert only owner can hold fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u128 = Mapping::get_or_use(holdings, token_holder, 0u128);

        // Increase the held amount for the token_user
        Mapping::set(holdings, token_holder, held_amount + amount);
    }

    async transition release_fund(public user: address, public token_id :field, public amount: u128) -> Future {
        let transfer: Future = token_registry.aleo/transfer_public(token_id, user, amount);

        let token_holder: Holder = Holder{
            account: user,
            token_id: token_id
        };

        return (finalize_release_fund(self.caller, token_holder, amount, transfer));
    }

    async function finalize_release_fund(from: address, token_holder: Holder, amount: u128, f0: Future) {
        f0.await();
        // Assert only owner can release fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u128 = Mapping::get(holdings, token_holder);

        // Decrease the held amount for the token_user
        Mapping::set(holdings, token_holder, held_amount - amount);
    }

    async transition release_fund_private(receiver: address,pre_image: field, public token_id :field, public amount: u128) -> (token_registry.aleo/Token, Future) {

        let image_address: address = BHP256::hash_to_address(Image {
          pre_image,
          receiver  
        });

        let transfer_private: (token_registry.aleo/Token, Future) = token_registry.aleo/transfer_public_to_private(token_id, receiver, amount, false);

        let token_holder: Holder = Holder{
            account: image_address,
            token_id: token_id
        };

        return (transfer_private.0, finalize_release_fund_private(self.caller, token_holder, amount, transfer_private.1));
    }

    async function finalize_release_fund_private(from: address, token_holder: Holder, amount: u128, f0: Future) {
        f0.await();
        // Assert only owner can release fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u128 = Mapping::get(holdings, token_holder);

        // Decrease the held amount for the token_user
        Mapping::set(holdings, token_holder, held_amount - amount);
    }


}