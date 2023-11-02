## Data Structures
### Holding
```
pub struct Holding {
    funds: HashMap<String, u128>,
    locked: bool,
}
```

The code snippet defines a struct called `Holding` with two fields: `funds` and `locked`. The `funds` field is of type `HashMap<String, u128>` and is used to store the funds of each denomination associated with the holding. The `locked` field is of type `bool` and indicates whether the holding is locked or not.
___

### Contract Storage
```
pub struct HoldingContract {
    holdings: HashMap<String, Holding>,
    governance_address: String,
    token_service_address: String,
}
```

The code snippet defines a struct called `HoldingContract` with three fields: `holdings`, `governance_address`, and `token_service_address`.

### Properties
- `holdings`: A `HashMap` that stores the holdings for each address.
- `governance_address`: A `String` that represents the governance address.
- `token_service_address`: A `String` that represents the token service address.
___



## Contract Interface
```
pub trait IHoldingContract {

    // entrypoint
    fn hold_fund(&mut self, caller: String, msg: TokenMessage) -> Result<(), ContractError> {
        self.ensure_token_service(caller)?;
        self.verify_payment(&msg.denom, msg.amount);
        let mut holding = self.pop_holding(&msg.receiver_address).unwrap_or_default();
        let mut fund = holding.funds.get(&msg.denom).cloned().unwrap_or(0_u128);
        fund = fund.checked_add(msg.amount).expect("Addition Overflow");
        holding.funds.insert(msg.denom, fund);

        Ok(())
    }
    
    fn verify_payment(&self, denom: &str, amount: u128) -> bool;

    fn ensure_governance(&self, caller: String) -> Result<(), ContractError> {
        if self.get_governance() != caller {
            return Err(ContractError::Unauthorized);
        }
        return Ok(());
    }
    // entrypoint
    fn unlock_holding(&mut self, caller: String, address: String) -> Result<(), ContractError> {
        self.ensure_governance(caller)?;
        if let Some(mut holding) = self.pop_holding(&address) {
            holding.locked = false;
            self.insert_holding(&address, holding);
        }

        Ok(())
    }
    // entrypoint
    fn release_holding(&mut self, address: String) -> Result<(), ContractError> {
        let holding = self
            .pop_holding(&address)
            .ok_or(ContractError::NoFundsLocked)?;
        if holding.locked {
            return Err(ContractError::FundsLocked);
        }
        holding
            .funds
            .into_iter()
            .map(|f| return self.refund(&address, f.0, f.1))
            .collect::<Result<Vec<()>, ContractError>>()?;
        Ok(())
    }

    fn refund(&self, address: &str, denom: String, amount: u128) -> Result<(), ContractError>;

    fn pop_holding(&mut self, address: &str) -> Option<Holding>;
    fn insert_holding(&mut self, address: &str, holding: Holding) -> Option<Holding>;

    fn ensure_token_service(&self, caller: String) -> Result<(), ContractError> {
        if self.get_token_service() != caller {
            return Err(ContractError::Unauthorized);
        }
        return Ok(());
    }

    fn get_token_service(&self) -> String;
    fn get_governance(&self) -> String;
}
```
## Hold Fund (EntryPoint)
 It takes in a `caller` string and a `TokenMessage` struct as parameters and returns a `Result` with an empty tuple or a `ContractError` if an error occurs.

### Inputs
- `caller` (String): The address of the caller.
- `msg` (TokenMessage): A struct containing information about the token transfer, including the denomination, amount, and receiver address.
___
### Flow
1. The method first calls the `ensure_token_service` function to check if the caller is authorized to hold funds.
2. It then calls the `verify_payment` function to validate the payment details.
3. The method retrieves the holding for the receiver address using the `pop_holding` function. If no holding exists, it creates a new default holding.
4. It retrieves the current fund amount for the specified denomination from the holding. If no fund exists, it defaults to 0.
5. The method adds the amount from the token message to the fund, checking for overflow.
6. The updated fund is inserted back into the holding.
7. The method returns an empty tuple if all operations are successful.
___
### Outputs
- `Result<(), ContractError>`: An empty tuple if the operation is successful or a `ContractError` if an error occurs.
___

## Verify Payment
It takes two parameters, `denom` (a string) and `amount` (an unsigned 128-bit integer), and returns a boolean value.


### Inputs
- `denom`: A string representing the denomination of the payment.
- `amount`: An unsigned 128-bit integer representing the amount of the payment.
___
### Flow
1. The method `verify_payment` takes two parameters, `denom` and `amount`.
2. The method calls platform specific method to verify the amount paid on contract call.
___
### Outputs
- A boolean value indicating whether the payment is verified or not.
___

## Ensure Governance
The code snippet is a method called `ensure_governance` that takes a `caller` parameter and returns a `Result` indicating whether the caller is authorized or not.


### Inputs
- `caller` (String): The address of the caller.
___
### Flow
1. The method compares the result of calling the `get_governance` method on `self` (the `HoldingContract` instance) with the `caller` parameter.
2. If the two values are not equal, it returns an `Err` variant of the `ContractError` enum with the value `Unauthorized`.
3. If the values are equal, it returns an `Ok` variant with an empty tuple `()`.
___
### Outputs
- `Result<(), ContractError>`: An `Ok` variant with an empty tuple `()` if the caller is authorized, or an `Err` variant with the value `Unauthorized` if the caller is not authorized.
___

## Unlock Holding (EntryPoint)
The code snippet is a method called `unlock_holding` that takes in two parameters, `caller` and `address`, and returns a `Result` indicating success or failure. It is responsible for unlocking a holding by setting its `locked` flag to `false`.

### Inputs
- `caller` (String): The caller's address.
- `address` (String): The address of the holding to be unlocked.
___
### Flow
1. The method first calls the `ensure_governance` method to check if the caller has the necessary authorization.
2. If the caller is authorized, it retrieves the holding associated with the given address using the `pop_holding` method.
3. If a holding is found, it sets the `locked` flag of the holding to `false`.
4. Finally, it inserts the updated holding back into the holdings map using the `insert_holding` method.
___
### Outputs
- `Result<(), ContractError>`: Returns `Ok(())` if the holding was successfully unlocked, or an error of type `ContractError` if there was an unauthorized access or if no holding was found for the given address.
___

## Release Holding (EntryPoint)
The code snippet is a method called `release_holding` that is part of the `IHoldingContract` trait implementation. It releases the funds held in a specific holding by checking if the holding is locked and then refunding the funds to the specified address.It is permissionless so anyone should be able to call it.


### Inputs
- `self`: a mutable reference to the `HoldingContract` instance.
- `address`: a `String` representing the address of the holding to be released.
___
### Flow
1. The method first tries to retrieve the holding associated with the specified address using the `pop_holding` method. If the holding does not exist, it returns an `Err` with the `NoFundsLocked` error.
2. If the holding is locked, it returns an `Err` with the `FundsLocked` error.
3. It then iterates over the funds in the holding and calls the `refund` method for each fund, passing the address, denomination, and amount.
4. If all the refunds are successful, it returns `Ok(())` indicating that the holding has been released.
___
### Outputs
- `Result<(), ContractError>`: Returns `Ok(())` if the holding is successfully released, or an `Err` with the appropriate error (`NoFundsLocked` or `FundsLocked`) if the holding does not exist or is locked.
___

## Refund
The code snippet is a method called `refund` that belongs to the `IHoldingContract` trait. It takes in an address, a denomination, and an amount as inputs and returns a `Result` with an empty tuple as the success value or a `ContractError` as the error value.

### Inputs
- `address`: A string representing the address to refund the funds to.
- `denom`: A string representing the denomination of the funds.
- `amount`: An unsigned 128-bit integer representing the amount of funds to refund.
___
### Flow
1. The method `refund` is called with the `address`, `denom`, and `amount` as inputs.
2. Calls platform specific payment method for specified denom and amount.
3. The method returns a `Result` with an empty tuple as the success value or a `ContractError` as the error value.
___
### Outputs
- If the refund is successful, the method returns `Ok(())`.
- If there is an error during the refund process, the method returns a `ContractError`.
___

## Pop Holding
The code snippet is a method called `pop_holding` that belongs to the `HoldingContract` struct. It takes a string `address` as input and returns an `Option<Holding>`.


### Inputs
- `address` (string): The address of the holding to be popped.
___
### Flow
1. The method `pop_holding` is called with an `address` as input.
2. The method removes the holding associated with the given `address` from the `holdings` HashMap of the `HoldingContract` .
3. The removed holding is returned as an `Option<Holding>`. If a holding with the given `address` exists, it is returned as `Some(holding)`. If no holding exists with the given `address`, `None` is returned.
4. This ensures prevention from `re-entrancy attack` since the holding has been removed from storage before calling payments.  
___
### Outputs
- `Option<Holding>`: The holding associated with the given `address`, if it exists.
___
## Insert Holding
The code snippet is a method called `insert_holding` that belongs to the `HoldingContract` struct. It takes an address and a `Holding` object as input and returns an `Option<Holding>`.

### Inputs
- `address`: A string representing the address where the holding will be inserted.
- `holding`: A `Holding` object that will be inserted into the contract.
___
### Flow
1. The method `insert_holding` is called with an address and a `Holding` object as input.
2. The method inserts the `Holding` object into the `holdings` HashMap of the `HoldingContract` struct using the address as the key.
3. The method returns an `Option<Holding>` which represents the previous value associated with the address, if any.
___
### Outputs
- An `Option<Holding>` which represents the previous value associated with the address, if any.
___
## Ensure Token Service
The code snippet is a method called `ensure_token_service` that takes a `caller` parameter and returns a `Result` indicating whether the caller is authorized or not.

### Inputs
- `caller` (String): The address of the caller.
___
### Flow
1. The method compares the result of calling the `get_token_service` method on `self` (the `HoldingContract` instance) with the `caller` parameter.
2. If the two values are not equal, it returns an `Err` variant of the `ContractError` enum with the value `Unauthorized`.
3. If the two values are equal, it returns an `Ok` variant indicating that the caller is authorized.
___
### Outputs
- `Result<(), ContractError>`: An `Ok` variant if the caller is authorized, or an `Err` variant with the value `Unauthorized` if the caller is not authorized.
___

## Get TokenService
The code snippet is a method called `get_token_service` that belongs to the `IHoldingContract` trait.

### Inputs
No inputs are required for this code snippet.
___
### Flow
The `get_token_service` method returns the token service address stored in the `HoldingContract` storage. It does not modify any data or perform any calculations. It simply retrieves and returns the value of the `token_service_address` field.
___
### Outputs
The method returns a `String` representing the token service address.
___
## Get Governance
The code snippet is a method called `get_governance` that belongs to the `IHoldingContract` trait.


### Inputs
No inputs are required for this code snippet.
___
### Flow
1. The method `get_governance` is called on an instance of the `HoldingContract` struct.
2. The method returns the governance address as a `String`.
___
### Outputs
- The governance address as a `String`.
___










