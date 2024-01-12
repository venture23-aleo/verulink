// The `program` scope defines the data types, functions, and state associated with the `token` program.
program wusdc_token.aleo {
    // On-chain storage of an `account` map, with `address` as the key,
    // and `u64` as the value.
    mapping account: address => u64;

    record token {
        // The token owner.
        owner: address,
        // The token amount.
        amount: u64,
    }

    struct Approval {
        // Token Owner
        approver: address,
        // Spender Address
        spender: address
    }

    // On-chain storage of an `approvals` map, with `hash(approver, spender)` as the key,
    // and `u64` as the value.
    mapping approvals: field => u64;

    mapping governance_wusdc: bool => address;
    const GOVERNANCE_INDEX: bool = true;

    ///////////////////////////////////////////
    /////// Initialization & Governance ///////
    ///////////////////////////////////////////

    // Initialize can only be called once
    // Initialize must be called from council program
    transition token_initialize(governance: address) {
        return then finalize(governance);
    }

    finalize token_initialize(governance: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(governance_wusdc, true));

        // Set the council program
        Mapping::set(governance_wusdc, true, governance);
    }

    /// Update the existing governance program
    /// Can only be called from council/governance program
    transition update_governance_wusdc(public new_governance: address) {
        return then finalize(self.caller, new_governance);
    }

    finalize update_governance_wusdc(from: address, new_governance: address) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_wusdc, true);
        assert_eq(from, governance);

        // If attestor does not exist, this is expected to fail
        Mapping::set(governance_wusdc, true, new_governance);
    }


    /////////////////////
    //// MINT & BURN ////
    /////////////////////

    transition mint_public(receiver: address, amount: u64, chain_id: u128, contract_address: [u8; 32]) {
        // Verify origin
        assert_eq(chain_id, origin_chain_id());
        assert_eq(contract_address, origin_contract_address());

        return then finalize(self.caller, receiver, amount);
    }

    finalize mint_public(minter: address, receiver: address, amount: u64) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_wusdc, true);

        // Only governance can mint
        assert_eq(minter, governance);

        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_public` is reverted.
        let receiver_amount: u64 = Mapping::get_or_use(account, receiver, 0u64);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

    transition burn_public(spender: address, amount: u64, chain_id: u128, contract_address: [u8; 32]) {
        // Verify origin
        assert_eq(chain_id, origin_chain_id());
        assert_eq(contract_address, origin_contract_address());

        return then finalize(self.caller, spender, amount);
    }

    finalize burn_public(burner: address, receiver: address, amount: u64) {
        // Get the governance address
        // If program not initialized, this fails
        let governance: address = Mapping::get(governance_wusdc, true);

        // Only governace can burn
        assert_eq(burner, governance);

        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_public` is reverted.
        let receiver_amount: u64 = Mapping::get_or_use(account, receiver, 0u64);
        Mapping::set(account, receiver, receiver_amount + amount);
    }



    ////////////////////
    //// TRANSFERS ////
    ///////////////////

    transition transfer_public(public receiver: address, public amount: u64) {
        // Transfer the tokens publicly, by invoking the computation on-chain.
        return then finalize(self.caller, receiver, amount);
    }

    finalize transfer_public(public sender: address, public receiver: address, public amount: u64) {
        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be created.
        // If `account[sender] - amount` underflows, `transfer_public` is reverted.
        let sender_amount: u64 = Mapping::get_or_use(account, sender, 0u64);
        Mapping::set(account, sender, sender_amount - amount);
        
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_public` is reverted.
        let receiver_amount: u64 = Mapping::get_or_use(account, receiver, 0u64);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

    // The function `transfer_private` sends the specified token amount to the token receiver from the specified token record.
    transition transfer_private(sender: token, receiver: address, amount: u64) -> (token, token) {
        // Checks the given token record has sufficient balance.
        // This `sub` operation is safe, and the proof will fail if an overflow occurs.
        // `difference` holds the change amount to be returned to sender.
        let difference: u64 = sender.amount - amount;

        // Produce a token record with the change amount for the sender.
        let remaining: token = token {
            owner: sender.owner,
            amount: difference,
        };

        // Produce a token record for the specified receiver.
        let transferred: token = token {
            owner: receiver,
            amount: amount,
        };

        // Output the sender's change record and the receiver's record.
        return (remaining, transferred);
    }

    // The function `transfer_private_to_public` turns a specified token amount from a token record into public tokens for the specified receiver.
    // This function preserves privacy for the sender's record, however it publicly reveals the token receiver and the token amount.
    transition transfer_private_to_public(sender: token, public receiver: address, public amount: u64) -> token {
        // Checks the given token record has a sufficient token amount.
        // This `sub` operation is safe, and the proof will fail if an underflow occurs.
        // `difference` holds the change amount for the caller.
        let difference: u64 = sender.amount - amount;

        // Produces a token record with the change amount for the caller.
        let remaining: token = token {
            owner: sender.owner,
            amount: difference,
        };

        // Output the sender's change record.
        // Increment the token amount publicly for the token receiver.
        return remaining then finalize(receiver, amount);
    }

    finalize transfer_private_to_public(public receiver: address, public amount: u64) {
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_private_to_public` is reverted.
        let receiver_amount: u64 = Mapping::get_or_use(account, receiver, 0u64);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

    // The function `transfer_public_to_private` turns a specified token amount from `account` into a token record for the specified receiver.
    // This function preserves privacy for the receiver's record, however it publicly reveals the caller and the specified token amount.
    transition transfer_public_to_private(public receiver: address, public amount: u64) -> token {
        // Produces a token record for the token receiver.
        let transferred: token = token {
            owner: receiver,
            amount: amount,
        };

        // Output the receiver's record.
        // Decrement the token amount of the caller publicly.
        return transferred then finalize(self.caller, amount);
    }

    finalize transfer_public_to_private(public sender: address, public amount: u64) {
        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be created.
        // If `account[sender] - amount` underflows, `transfer_public_to_private` is reverted.
        let sender_amount: u64 = Mapping::get_or_use(account, sender, 0u64);
        Mapping::set(account, sender, sender_amount - amount);
    }

    /////////////////////////////////
    //// APPROVALS & UNAPPROVALS ////
    /////////////////////////////////


    // The function `approve_public` approves the specified token amount for the spender to be publicly spent on the network.
    transition approve_public(public spender: address, public amount: u64) {
        let approval: Approval = Approval {
            approver: self.caller,
            spender
        };
        let approval_hash: field = BHP256::hash_to_field(approval);
        return then finalize(approval_hash, amount);
    }

    finalize approve_public(approval: field, amount: u64) {
        // Increments `approvals[hash(approver, spender)]` by `amount`.
        // If `approvals[hash(approver, spender)]` does not exist, it will be created.
        let approval_amount: u64 = Mapping::get_or_use(approvals, approval, 0u64);
        Mapping::set(approvals, approval, approval_amount + amount);
    }

    // The function `unapprove_public` removes the approval of the specified token amount for the spender.
    transition unapprove_public(public spender: address, public amount: u64) {
        let approval: Approval = Approval {
            approver: self.caller,
            spender
        };
        let approval_hash: field = BHP256::hash_to_field(approval);
        return then finalize(approval_hash, amount);
    }

    finalize unapprove_public(approval: field, amount: u64) {
        // Decrements `approvals[(approver, spender)]` by `amount`.
        // If `approvals[(approver, spender)]` does not exist, the transition is reverted.
        // If `approvals[(approver, spender)] - amount` underflows, the transition is reverted.
        let approval_amount: u64 = Mapping::get(approvals, approval);
        Mapping::set(approvals, approval, approval_amount - amount);
    }

    ///////////////////////
    //// TRANSFER FROM ////
    ///////////////////////


    transition transfer_from_public(public from: address, public to: address, public amount: u64) {
        // Calculate approval hash
        let approval: Approval = Approval {
            approver: from,
            spender: self.caller
        };
        let approval_hash: field = BHP256::hash_to_field(approval);

        return then finalize(approval_hash, from, to, amount);
    }

    finalize transfer_from_public(approval: field, sender: address, receiver: address, amount: u64) {
        // Unapprove `amount` for (approver, spender) pair
        let approval_amount: u64 = Mapping::get(approvals, approval);
        Mapping::set(approvals, approval, approval_amount - amount);

        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be reverted.
        // If `account[sender] - amount` underflows, the transition is reverted.
        let sender_amount: u64 = Mapping::get(account, sender);
        Mapping::set(account, sender, sender_amount - amount);

        // Increments `account[hash(arc20, receiver)]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        let receiver_amount: u64 = Mapping::get_or_use(account, receiver, 0u64);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

    // Name of the token
    // Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
    // Example: `USD Coin` is represented as following (hex):
    // [55 53 44 20 43 6f 69 6e 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00]
    // Storing in const? Error [ETYC0372080]: The value of a const declaration must be a literal
    inline name() -> [u8; 32] {
        return [ 85u8, 83u8, 68u8, 32u8, 67u8, 111u8, 105u8, 110u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8 ];
    }

    // Symbol of the token
    // Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
    // Example: `USDC` is represented as following (hex):
    // [55 53 44 43 00 00 00 00 00 00 00 00 00 00 00 00] 
    inline symbol() -> [u8; 16] {
        return [ 85u8, 83u8, 68u8, 67u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8 ];
    }

    // Decimals of the token
    inline decimals() -> u8 {
        return 6u8;
    }

    // Chain Id of the network
    // Chain Id is generated as {network_type}:{chain_id} where `network_id` is represented as ASCII and `chain_id` is a number, `:` is separator
    // For Ethereum mainnet, chain_id: `evm:1` -> 27236160417
    inline origin_chain_id() -> u128 {
        return 27236160417u128;
    }

    // Contract Address of the original token on the origin chain
    // Represented as bytes32 zero-left-padded (Similar to Wormhole address)
    // Example: Contract Address of USDC on Ethereum
    // For EVM Chains, 20 bytes is formated as following:
    inline origin_contract_address() -> [u8; 32] {
        return [ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 160u8, 184u8, 105u8, 145u8, 198u8, 33u8, 139u8, 54u8, 193u8, 209u8, 157u8, 74u8, 46u8, 158u8, 176u8, 206u8, 54u8, 6u8, 235u8, 72u8 ] ;
    }

}