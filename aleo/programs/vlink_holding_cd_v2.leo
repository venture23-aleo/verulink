import credits.aleo;

program vlink_holding_cd_v2.aleo {


    // for upgrade
    @noupgrade
    async constructor() {}

    
    struct Holder{
        account : address, 
        token_id : field 
    }

    mapping holdings: Holder => u64;

    // mapping used as variable
    // true: address of owner 
    // false: Null
    mapping owner_holding: bool => address;

    const OWNER_INDEX: bool = true;

    const INITIALIZER_ADDRESS : address = aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px; 

    const ALEO_CREDITS_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field; // The native token address of the Aleo network
   


    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    async transition initialize_holding(public owner: address) -> Future{
        assert_eq(self.caller, INITIALIZER_ADDRESS);
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

        // set the owner of the program
        Mapping::set(owner_holding, OWNER_INDEX, new_owner);
    }


    async transition hold_fund(public user: address, public amount: u64) -> Future{
        let token_holder: Holder = Holder{
            account: user,
            token_id: ALEO_CREDITS_TOKEN_ID
        };
        return(finalize_hold_fund(self.caller, token_holder, amount));
    }

    async function finalize_hold_fund(from: address, token_holder: Holder, amount: u64) {
        // Assert only owner can hold fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u64 = Mapping::get_or_use(holdings, token_holder, 0u64);

        // Increase the held amount for the token_user
        Mapping::set(holdings, token_holder, held_amount + amount);
    }

    async transition release_fund(public user: address, public amount: u64) -> Future {
        let transfer: Future = credits.aleo/transfer_public(user, amount);

        let token_holder: Holder = Holder{
            account: user,
            token_id: ALEO_CREDITS_TOKEN_ID
        };

        return (finalize_release_fund(self.caller, token_holder, amount, transfer));
    }

    async function finalize_release_fund(from: address, token_holder: Holder, amount: u64, f0: Future) {
        f0.await();
        // Assert only owner can release fund
        let owner: address = Mapping::get(owner_holding, OWNER_INDEX);
        assert_eq(from, owner);

        let held_amount: u64 = Mapping::get(holdings, token_holder);

        // Decrease the held amount for the token_user
        Mapping::set(holdings, token_holder, held_amount - amount);
    }


}