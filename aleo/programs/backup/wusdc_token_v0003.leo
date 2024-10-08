// The `program` scope defines the data types, functions, and state associated with the `token` program.
program wusdc_token_v0003.aleo {
    // On-chain storage of an `account` map, with `address` as the key,
    // and `u128` as the value.
    mapping account: address => u128;

    record token {
        // The token owner.
        owner: address,
        // The token amount.
        amount: u128,
    }

    struct Approval {
        // Token Owner
        approver: address,
        // Spender Address
        spender: address
    }

    struct TokenInfo {
        // Name of the token
        // Represented as ASCII bytes
        // `USD Coin` is represented as following (hex):
        // [85u8,83u8,68u8,32u8,67u8,111u8,105u8,110u8]
        name: [u8; 8],
        // Symbol of the token
        // Represented as hexadecimal bytes for ASCII text zero-right-padded (Similar to privacy_pride)
        // `USDC` is represented as following (hex):
        // [85u8,83u8,68u8,67u8]
        symbol: [u8; 4],
        // Decimals of the token
        decimals: u8
    }

    // On-chain storage of an `approvals` map, with `hash(approver, spender)` as the key,
    // and `u128` as the value.
    mapping approvals: field => u128;

    // Store the owner of the token
    // Token Owner can mint/burn asset
    mapping token_owner: bool => address;

    // Store the information about the token
    mapping info: bool => TokenInfo;

    const OWNER_INDEX: bool = true;
    const INFO_INDEX: bool = true;

    //////////////////////////////
    /////// Initialization ///////
    //////////////////////////////

    // Initialize can only be called once
    transition initialize_token(public owner: address) {
        return then finalize(owner);
    }

    finalize initialize_token(owner: address) {
        // Assert bridge has not been initialized before
        assert(!Mapping::contains(token_owner, OWNER_INDEX));

        // Set the council program
        Mapping::set(token_owner, OWNER_INDEX, owner);

        let token_info: TokenInfo = TokenInfo {
            name: [85u8,83u8,68u8,32u8,67u8,111u8,105u8,110u8],
            symbol: [85u8,83u8,68u8,67u8],
            decimals: 6u8
        };
        Mapping::set(info, INFO_INDEX, token_info);
    }

    /// Update the existing owner program
    /// Can only be called from owner program
    transition transfer_ownership_token(public new_owner: address) {
        return then finalize(self.caller, new_owner);
    }

    finalize transfer_ownership_token(from: address, new_owner: address) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(token_owner, OWNER_INDEX);
        assert_eq(from, owner);

        // If attestor does not exist, this is expected to fail
        Mapping::set(token_owner, OWNER_INDEX, new_owner);
    }


    /////////////////////
    //// MINT & BURN ////
    /////////////////////

    transition mint_public(receiver: address, amount: u128) {
        return then finalize(self.caller, receiver, amount);
    }

    finalize mint_public(from: address, receiver: address, amount: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(token_owner, OWNER_INDEX);

        // Only owner can mint
        assert_eq(from, owner);

        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `mint_public` is reverted.
        let receiver_amount: u128 = Mapping::get_or_use(account, receiver, 0u128);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

    transition burn_public(spender: address, amount: u128) {
        return then finalize(self.caller, spender, amount);
    }

    finalize burn_public(from: address, receiver: address, amount: u128) {
        // Get the owner address
        // If program not initialized, this fails
        let owner: address = Mapping::get(token_owner, OWNER_INDEX);

        // Only owner can burn
        assert_eq(from, owner);

        // Decreases `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] - amount` underflows, `burn_public` is reverted.
        let receiver_amount: u128 = Mapping::get_or_use(account, receiver, 0u128);
        Mapping::set(account, receiver, receiver_amount - amount);
    }



    ////////////////////
    //// TRANSFERS ////
    ///////////////////

    transition transfer_public(public receiver: address, public amount: u128) {
        // Transfer the tokens publicly, by invoking the computation on-chain.
        return then finalize(self.caller, receiver, amount);
    }

    finalize transfer_public(public sender: address, public receiver: address, public amount: u128) {
        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be created.
        // If `account[sender] - amount` underflows, `transfer_public` is reverted.
        let sender_amount: u128 = Mapping::get_or_use(account, sender, 0u128);
        Mapping::set(account, sender, sender_amount - amount);
        
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_public` is reverted.
        let receiver_amount: u128 = Mapping::get_or_use(account, receiver, 0u128);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

    // The function `transfer_private` sends the specified token amount to the token receiver from the specified token record.
    transition transfer_private(sender: token, receiver: address, amount: u128) -> (token, token) {
        // Checks the given token record has sufficient balance.
        // This `sub` operation is safe, and the proof will fail if an overflow occurs.
        // `difference` holds the change amount to be returned to sender.
        let difference: u128 = sender.amount - amount;

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
    transition transfer_private_to_public(sender: token, public receiver: address, public amount: u128) -> token {
        // Checks the given token record has a sufficient token amount.
        // This `sub` operation is safe, and the proof will fail if an underflow occurs.
        // `difference` holds the change amount for the caller.
        let difference: u128 = sender.amount - amount;

        // Produces a token record with the change amount for the caller.
        let remaining: token = token {
            owner: sender.owner,
            amount: difference,
        };

        // Output the sender's change record.
        // Increment the token amount publicly for the token receiver.
        return remaining then finalize(receiver, amount);
    }

    finalize transfer_private_to_public(public receiver: address, public amount: u128) {
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_private_to_public` is reverted.
        let receiver_amount: u128 = Mapping::get_or_use(account, receiver, 0u128);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

    // The function `transfer_public_to_private` turns a specified token amount from `account` into a token record for the specified receiver.
    // This function preserves privacy for the receiver's record, however it publicly reveals the caller and the specified token amount.
    transition transfer_public_to_private(public receiver: address, public amount: u128) -> token {
        // Produces a token record for the token receiver.
        let transferred: token = token {
            owner: receiver,
            amount: amount,
        };

        // Output the receiver's record.
        // Decrement the token amount of the caller publicly.
        return transferred then finalize(self.caller, amount);
    }

    finalize transfer_public_to_private(public sender: address, public amount: u128) {
        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be created.
        // If `account[sender] - amount` underflows, `transfer_public_to_private` is reverted.
        let sender_amount: u128 = Mapping::get_or_use(account, sender, 0u128);
        Mapping::set(account, sender, sender_amount - amount);
    }

    /////////////////////////////////
    //// APPROVALS & UNAPPROVALS ////
    /////////////////////////////////


    // The function `approve_public` approves the specified token amount for the spender to be publicly spent on the network.
    transition approve_public(public spender: address, public amount: u128) {
        let approval: Approval = Approval {
            approver: self.caller,
            spender
        };
        let approval_hash: field = BHP256::hash_to_field(approval);
        return then finalize(approval_hash, amount);
    }

    finalize approve_public(approval: field, amount: u128) {
        // Increments `approvals[hash(approver, spender)]` by `amount`.
        // If `approvals[hash(approver, spender)]` does not exist, it will be created.
        let approval_amount: u128 = Mapping::get_or_use(approvals, approval, 0u128);
        Mapping::set(approvals, approval, approval_amount + amount);
    }

    // The function `unapprove_public` removes the approval of the specified token amount for the spender.
    transition unapprove_public(public spender: address, public amount: u128) {
        let approval: Approval = Approval {
            approver: self.caller,
            spender
        };
        let approval_hash: field = BHP256::hash_to_field(approval);
        return then finalize(approval_hash, amount);
    }

    finalize unapprove_public(approval: field, amount: u128) {
        // Decrements `approvals[(approver, spender)]` by `amount`.
        // If `approvals[(approver, spender)]` does not exist, the transition is reverted.
        // If `approvals[(approver, spender)] - amount` underflows, the transition is reverted.
        let approval_amount: u128 = Mapping::get(approvals, approval);
        Mapping::set(approvals, approval, approval_amount - amount);
    }

    ///////////////////////
    //// TRANSFER FROM ////
    ///////////////////////


    transition transfer_from_public(public from: address, public to: address, public amount: u128) {
        // Calculate approval hash
        let approval: Approval = Approval {
            approver: from,
            spender: self.caller
        };
        let approval_hash: field = BHP256::hash_to_field(approval);

        return then finalize(approval_hash, from, to, amount);
    }

    finalize transfer_from_public(approval: field, sender: address, receiver: address, amount: u128) {
        // Unapprove `amount` for (approver, spender) pair
        let approval_amount: u128 = Mapping::get(approvals, approval);
        Mapping::set(approvals, approval, approval_amount - amount);

        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be reverted.
        // If `account[sender] - amount` underflows, the transition is reverted.
        let sender_amount: u128 = Mapping::get(account, sender);
        Mapping::set(account, sender, sender_amount - amount);

        // Increments `account[hash(arc20, receiver)]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        let receiver_amount: u128 = Mapping::get_or_use(account, receiver, 0u128);
        Mapping::set(account, receiver, receiver_amount + amount);
    }

}