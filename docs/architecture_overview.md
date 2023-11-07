# Table of Contents

1. [Architecture Overview](#architecture-overview)
   - [Introduction](#introduction)
   - [Assumptions] (#Assumptions)
   - [Common Data Structures](#common-data-structures)
   - [Logical Components](#logical-components)
2. [Common Data Structures](#common-data-structures)
   - [NetworkAddress](#networkaddress)
   - [Packet](#packet)
   - [TokenMessage](#tokenmessage)
3. [Logical Components](#logical-components)
   - [Common Contracts](#common-contracts)
     - [Bridge Contract](#bridge-contract)
     - [Token Service Contract](#token-service-contract)
       - [Token Contract Storage Structure](#token-contract-storage-structure)
       - [Token Service Contract Interface](#token-service-contract-interface)
     - [Holding Contract](#holding-contract)
    - [Additional Components](#additional-components)
        - [Token Contract - Aleo](#token-contract--aleo)
        - [Multisig Contract - Aleo](#multisig-contract--aleo)
        - [Ethereum Multisig](#ethereum-multisig)
   - [Attestor](#attestor)
     - [Workflow Steps](#workflow-steps)
     - [Data Structures](#data-structures)
     - [Components Overview](#components-overview)
     - [Reference For Implementation](#reference-for-implementation)
         - [Chain Config Interface](#chain-config-interface)
            - [Message Interface](#message-interface)
            - [Store Interface](#store-interface)
            - [Client Interface](#client-interface)
            - [Chain Interface](#chain-interface)
            - [Receiver Interface](#receiver-interface)
            - [Sender Interface](#sender-interface)
            - [Relayer Interface](#relayer-interface)
            - [Bridge Interface](#bridge-interface)
4. [ Key Management](#key-management)
5. [Fee Management](#fee-management)
6. [System Error And Recovery](#system-error-and-recovery)
7. [Safeguarding Against Disasters](#safeguarding-against-disaster)
5. [Glossary](#glossary)

# Architecture Overview

This document provides detailed requirements and design guidelines for the smart contracts required for the Aleo-Eth Multisig bridge. This will make sure that we have a general consensus on workflow of the bridge and also keep the spec uniform over multiple languages or platforms. There might be platform specific deviations in implementation details but it is expected the overall architecture will remain consistent on every platform.


## Introduction

This is a trusted  bridge platform that is designed to help move assets between Ethereum and Aleo blockchain.

## Assumptions
The design of the platform relies on following assumptions to be correct.
### Trustable Participants
It is assumed that the parties that will be running the attestor for the bridge can be trusted because of their self-interest and reputation.It is assumed the majority of participants wont collude to attack the bridge.

### Guaranteed Delivery
It is assumed that delivery of valid messages is guaranteed and messages will not be lost in process. Messages are persisted on source and target which will help ensure this.

### Finality Is Ensured
It is assumed that only the messages that are included in finalized blocks are attested by the participants and attestor will ensure that submission of message is also included in finalized block.

### Message Delivery Is Sponsored
It is assumed that the fee required for delivery of messages is sponsored by the participants that will be running the attestor nodes. 



## Common Data Structures
All components of bridge agree to some common data structures which are as follows:

```
pub struct NetworkAddress {
    pub chain_id:u32,
    pub address:String,
}
```

NetworkAddress
: It is the data structure that should allow us to point to any resource in any network uniquely.
Can also be represented as single string url as : `{chain_id}/{address}`.

| ChainId |  Uniquely assigned number for a chain to identify them in the network. |
|---------|---|
| Address | Address of contract or package name that resides on the chain specified by chain id  |

```
pub struct Packet{
    version:u64,
    destination:NetworkAddress,
    source:NetworkAddress,
    sequence:u128,
    message:[u8;32],
    height:String,
    nonce:[u8;32],
}

```
Packet
: It consists of all the information that is required for the components in our bridge to process the message, verify it and execute it

| Name        | Remarks                                                                             |
|-------------|-------------------------------------------------------------------------------------|
| Version     | Packet versioning for future enhancements or changes.                               |
| Destination | Target chain’s chain id and token contract address represented as network address. |
| Source      | Source chain id and contact address of token contract in source chain              |
| Sequence    | sequence no of the packet for the target chain id.                                  |
| Message     | keccak256 hash of the token message contents.                                       |
| Height      | Height of the source chain                                                          |
| Nonce       | Accumulated hash of previous nonce and sequence to prevent bruteforce attempts      |

```
pub struct TokenMessage {
    pub denom:String,
    pub amount: u128,
    pub receiver_address:String,
}

```
Token Message
: It is the message created by a token contract to transfer or withdraw assets.

| Name             | Remarks                                                                           |
|------------------|-----------------------------------------------------------------------------------|
| Denom            | The field represents the type of token we are dealing with like “USDT” or “wUSDT” |
| Amount           | The amount of fungibles to be transferred.                                        |
| Receiver Address | Address of the receiver on the target chain.                                      |










## Logical Components
Key logical components in the platform and their interfaces are describe below in detail.

### Common Contracts
Each participating chain will have at least two contracts i.e. Bridge Contract and TokenService Contract. 
There may be more contracts depending on the platform requirements.

#### Bridge Contract
Bridge contract is responsible for sending and receiving messages and does not concern with the contents of the message.
It will make sure that the message is accessible only to the contract that the message was addressed to.
[BridgeContract Design And Interface](bridge_contract.md)



#### Token Service Contract
This contract is responsible for interacting with other er20 tokens to mint/burn and pass relevant information to bridge contract as a Token Message.
##### Token Contract Storage Structure

| Name      | Structure      | Remarks                                       |
|-----------|----------------|-----------------------------------------------|
| TVL       | token_id=>u128 | Total Volume Locked On Contract               |
| Blacklist | address=>bool  | List of black listed address on current chain |
| Supported Tokens | token_id=>bool  | List of tokens recognized by the contract and status of the token (enabled/disabled) |

##### Token Service Contract Interface
``` 
pub trait TokenContract{
    pub fn transfer(&self,recipient:String, token:Token)->String;
    pub fn withdraw(&self,packet:Packet,msg:TokenMessage);
    pub fn get_transfer_info(sequence_no:u128)->TokenMessage;
    pub fn validate_blacklisted(address:String)->bool;

    pub fn enable_token(address: String);
    pub fn disable_token(address: String);
    pub fn add_to_blacklist(address: String);
    pub fn remove_from_blacklist(address: String);
}


```
Transfer
: This method will be invoked by the frontend/user to transfer assets from one chain to another. User will provide the recipient address of the target chain and asset in the current chain that needs to be transferred.For verified request token contract will call send_message on bridge contract with message hash and destination address. Bridge contract will return sequence number which token contract will concat with message hash to generate unique transfer id and store all relevant info as TransferInfo. Token contract will also update the TVL data.

Withdraw
: This method will be invoked on the target chain once the user has called transfer on the current chain. Users will need to provide the packet and token message to unlock.withdraw the asset. The token contract will recompute the expected packet hash and query bridge contract to consume the message. Bridge contract will return positive boolean value if message is consumed then token contract can proceed to unlock the asset and update the TVL as well.

GetTransfer Info
: Frontend can use this to query original Token Message using transfer id generated by transfer method.

Validate Blacklist
: Frontend can query on eth side to check if address is already on our blacklist or not.

Enable Token
: This will either create a new entry on supported token or enable it if it is disabled. Called by governance.

Disable Token
: This will temporarily disable moving of the token specified in case of a disaster.Called by governance.

Add To Blacklist
: Add an address of a malicious user in blacklist to prevent it from utilizing the token service.Called by givernance.

Remove Blacklist
: Remove a user from blacklist. Called by governance.

#### Holding Contract
This contract is reponsible for holding disputed funds and transfers. In event of transfer being initiated to an address that is blacklisted on target chain, the token service contract on target chain will lock the funds in holding contract. The funds can be released by council multisig once the dispute has been settled for the blacklisted address.
[Contract Design And Interface](holding_contract.md)






### Additional Components
Apart from above two contracts there might be additional contracts depending on the platform.These contracts are covered here.

##### Wrapped Token Contract - Aleo
The Wrapped Token Contract is responsible for managing the minting, burning, and transfer of all wrapped assets.

``` 
pub trait WrappedToken{
    pub fn add(name: String, symbol: String, decimals: u8, origin_contract: NetworkAddress);
    pub fn mint(recipient: String, amount: u128, token_id: String);
    pub fn burn(recipient: String, amount: u128, token_id: String);
    pub fn transfer(recipient: String, amount: u128, token_id: String);
}
```
Add Token:
This method will be invoked by the council to support new wrapped tokens. When a token is added, a `token_id` is generated to identify the token.

Mint:
This method will be invoked by the user to mint the token after locking it first on `origin_contract`. Message with right `recipient` and `amount` should exist on the bridge contract with enough attestations to be able to mint the token. Once minted, the message on the bridge contract should be marked as consumed.

Burn:
This method will be invoked by the user to transfer the token back to the `origin_contract`.

Transfer:
This method is used to transfer the tokens in the new network. 


##### MultiSig Contract - Aleo
To be based on Puzzle's multisig.

##### Ethereum Multisig
Gnosis Safe Multisig will be maintained using council keys which will also follow majority threshold. 
The multisig will be used to deploy contracts, upgrade contracts and update contract configurations/blacklists.



### Attestor
Attestor is the bridge component that will be responsible for detecting new messages, validating them and broadcasting them to the target network by calling the target bridge contract. Each attestor entity will be running their own full node of the involved chains and listen for incoming messages. Attestors do not have knowledge of other attestors in the network and are concerned only with verifying messages it has seen in the network. It will follow the following steps to make sure that the messages are delivered infallibly.

![Attestor Workflow](images/attestor.png)

#### Workflow Steps
 - Listen/Poll for new packets from source chain contract.
 - On arrival of a new packet, compute its packet hash and sign it to create a signature.
- Call the target bridge contract with the packet and the signature.
- If the call is successful and the packet is in the finalized block the delivery is considered complete else stash the packet in the retry queue.
 - Periodically check the retry queue and try to resend if the packet hasn't already reached quorum on the target chain.

#### Data Structures
```C
pub struct ChainConfig {
    name:String,
    chain_id:u32,
    bridge_contract:String,
    node_url:String,
    start_height:u64,
    secret_path:String,
}
 
```
Chain Config
: Config object that holds the necessary information required to connect to a chain and interact with it.

| Property        | Remarks                                                             |
|-----------------|---------------------------------------------------------------------|
| Name            | Human readable name of the chain.                                   |
| ChainId         | Uniquely assigned number for chain to distinguish it in the network. |
| Bridge Contract | Address of the bridge contract of current chain                     |
| NodeUrl         | RPC Url or Http endpoint for current chain                          |
| StartHeight     | Height from which to start scanning for messages, default 0         |
| SecretPath      |  Path to config of secret used to send transactions to the chain.|



AppConfig
: Application level config that is supplied to the program to run it with different params and also to fine tune the entire program.

```C
pub struct AppConfig {
    chains:Vec<ChainConfig>
    // other application specific configs
    // ...
}
 
```

Receiver
: Component that is responsible for polling relevant events/messages from the source chain.
It encapsulates the client adapter for the particular chain and its config.

```C
pub struct Receiver {
    client: Client,
    config:ChainConfig,
}


```

Sender
: Similar to the receiver but it's responsible for submitting transactions to the target chain. It will also have an instance of keys/wallet required to communicate with the target chain.

```C
pub struct Sender {
    client: Client,
    config:ChainConfig,
    wallet:Wallet,
}


```

Relayer
: Pair of sender and receiver that will handle propagation of messages from source to target chain. Each relayer instance itself will be a coroutine to ensure that the delivery of message is synchronous but the bridge itself stays asynchronous. This simplifies tracking of packets and improves overall performance as well.

```C
pub struct Relayer {
    source:Receiver,
    target:Sender,
}

```

#### Components Overview
![Bridge](images/bridge.png)

#### Architecture Overview
![Architecture](images/contained.png)


#### Reference For Implementation
Chain Config Interface
```C
pub trait IChainConfig:Send+Sync{
    fn get_chain_id(&self) -> u32;
    fn get_node_url(&self) -> String;
}
```
Message Interface
```C 
pub trait IMessage {
    fn get_source_address(&self) -> NetworkAddress;
    fn get_target_address(&self) -> NetworkAddress;
    fn get_sequence(&self) -> u128;
    fn get_hash(&self) -> [u8; 32];
}
```

Store Interface
```C 
pub trait IStore<T: IMessage> {
    fn get_current_sequence(&self, target_chain_id: u32) -> u128;
    fn log_success(&mut self, message: impl IMessage);
    fn queue_retry(&mut self, message: impl IMessage);
    fn remove_retry(&mut self, target_chain_id: u32, sequence: u128);
    fn get_next_retry(&self, target_chain_id: u32) -> Option<T>;
    fn save_checkpoint(&mut self, target_chain_id: u32, sequence: u128);
}

```

Client Interface

```C 
pub trait IClient<T: IMessage> {
    type Response: Into<Option<T>>;
    type Error;
    type Config: IClientConfig;

    fn poll_message(&self, target_chain_id: u32, sequence: u128) -> Self::Response;
    fn publish_message(&self, message: &impl IMessage) -> Result<(), Self::Error>;
}
```

Chain Interface
```C 
pub trait IChain<M: IMessage> {
    type Config: IChainConfig;

    type Client: IClient<M>;
    type Store: IStore<M>;
   

    fn get_config(&self) -> &Self::Config;
    fn get_client(&self) -> &Self::Client;
    fn get_target_chain_id(&self) -> u32;

    fn get_store(&self) -> &Self::Store;
    fn get_store_mut(&mut self) -> &mut Self::Store;

    // close db cleanup resources
    fn stop(&self);
}
```

Receiver Interface 

```C 
pub trait IReceiver<M: IMessage>: IChain<M> {
    // check if retry timeout has elapsed
    fn has_retry_elapsed(&self) -> bool;

    // forward retry packet if ready else query new packet.
    fn receive(&self) -> Option<M> {
        let retry = self.get_next_retry();
        if retry.is_none() {
            let sequence = self
                .get_store()
                .get_current_sequence(self.get_target_chain_id())
                + 1;
            let res = self
                .get_client()
                .poll_message(self.get_target_chain_id(), sequence);
            return res.into();
        }
        return retry;
    }

    fn get_next_retry(&self) -> Option<M> {
        if !self.has_retry_elapsed() {
            return None;
        }
        return self.get_store().get_next_retry(self.get_target_chain_id());
    }
}
```

Sender Interface

```C 
pub trait ISender<M: IMessage>: IChain<M> {
    fn send(&mut self, msg: M) {
        let res = self.get_client().publish_message(&msg);
        if res.is_err() {
            self.get_store_mut().queue_retry(msg);
        }
    }
}
```

Relayer Interface

```C 
pub trait IRelayer<M: IMessage, Source: IReceiver<M>, Target: ISender<M>> {
    fn get_source_chain(&self) -> &Source;
    fn get_target_chain(&mut self) -> &mut Target;
    fn is_shutting_down(&self) -> bool;

    fn new(source_chain:Box<dyn IChainConfig>,target_chain:Box<dyn IChainConfig>)->Self;

    fn sleep(&self);

    fn relay(&mut self) {
        loop {
            let m = self.get_source_chain().receive();
            if let Some(msg) = m {
                self.get_target_chain().send(msg);
            }
            if self.is_shutting_down() {
                self.get_source_chain().stop();
                self.get_target_chain().stop();
                break;
            }
            self.sleep();
        }
    }
}

```

Bridge Interface

```C 
pub trait IBridge<M: IMessage, Source: IReceiver<M>, Target: ISender<M>>{
    type Relay:IRelayer<M,Source,Target>;

    fn get_chains(&self)->&HashMap<u32,Box<dyn IChainConfig>>;

    fn get_relays(&self)->&HashMap<u32,u32>;

    fn run(&self){
        let mut handles=vec![];
        for r in self.get_relays().iter() {
            let source_chain=self.get_chains().get(r.0).cloned().unwrap();
               let target_chain=self.get_chains().get(r.0).cloned().unwrap();
               
            let h= tokio::task::spawn(async move {
               let relay =IRelayer::new(source_chain, target_chain);
               relay.relay();

            });
            handles.push(h);

        }
    }
}
```

## Workflows
### Bridge Asset into Aleo (Lock on Ethereum, Mint on Aleo)
1. Ethereum users lock assets (ETH, USDC, USDT) on the Token Contract (on Ethereum) and specify the Aleo address on which it should be minted.
2. Token Contract publishes this message to Bridge Contract (on Ethereum).
3. Validators will pick up the message. 
4. Validators verify the message and queue it on the Bridge Contract (on Aleo).

Once sufficient validators (k out of N) have verified and queued the message it can be unlocked and used on Aleo. To use it on Aleo:

5. Aleo user call request to mint wrapped assets (wETH, wUSDC) on the Token Contract (on Aleo).
6. Token contract checks if the requested asset can be minted. To mint the asset, the bridge contract (on Aleo) needs to have received validation from at least k/N validators.
7. If the message exists and has enough validation, it can be minted. 
Token contract mints the wrapped assets.

#### Notes:
A. The Ethereum that wants to lock assets (on Step 1) are checked against blacklisted addresses for OFAC compliance.
B. The address to unlock is specified on the message itself. So anyone is able to call the unlock method and the locked asset will be minted on the right Aleo address.
C. Once minted, the message is marked as consumed on Bridge contract (on Aleo) and cannot be used again. This prevents double spending.

### Bridge Asset out of Aleo (Burn on Aleo, unlock on Ethereum)
1. Aleo users burn their asset (wETH, wUSDC) on the Token Contract (on Aleo) and specify the Ethereum address on which asset (ETH, USDC) should be unlocked.
2. Token Contract publishes this message to Bridge Contract (on Aleo). It is stored as mapping on the Bridge Contract.
3. Validators will pick up the message by checking if there are any new outgoing messages. This can be done by querying the mapping with the expected sequence number of the new message.
4. Validators verify the message and queue it on the Bridge Contract (on Ethereum).

Once sufficient validators (k out of N) have verified and queued the message it can be unlocked and used again on Ethereum. To use it on Ethereum:

5. Ethereum user call request to unlock assets (ETH, USDC) on the Token Contract (on Ethereum).
6. Token contract checks if the requested asset can be unlocked. To mint the asset, the bridge contract (on Ethereum) needs to have received validation from at least k/N validators.
7. If the message exists and has enough validation, it can be unlocked.
8. Token contract unlocks the locked assets.

Notes:
A. The address to unlock is checked against blacklisted addresses for OFAC compliance at step 6.
B. The address to mint is specified on the message itself. So anyone is able to call the mint method and the wrapped asset will be locked on the right Ethereum address.




## Key Management
Each team involved in maintaining attestors for the bridge platform are required to have 2 set of keys. Which are as follows.

**Attesting Key**
This key will be used in attestor machine instance to sign the relevant messages.

**Council Key**
This key will be used to participate in multisig processes like updating attestor list,updating blacklist and upgrading the contract and deploying the contract as well.

## Fee Management
The fee required to relay messages from one end to another will be paid by the attestor itself for now. Since every attestor will be relaying the message to target chain it becomes possible to drain attestors of their funds by transferring very dust amounts frequently. To overcome this we will set a minimium amount that can be bridged out or bridged in. This can also be overcome by adding message passing fee on the transaction cost itself as well once we have the swap metrics between Aleo/Eth pair.

## System Error And Recovery
The platform being a stateful application it is imperative that following measures are taken for fault tolerance.
- *Checkpoints*: Determine checkpoints in application state transitions and save them in storage so that it can continue from the checkpoint on recovery.
- *Database Snapshots*: Since the data persisted will be minimal it would make sense to take periodic and rotating snapshot of entire database as a backup.
- *Backup Restoration* : Design and implement backup restoration process that is easy to apply and well tested in realistic scenarios. 

## Safeguarding Against Disaster
To address disasters that may occur outside of the system itself following measures can be taken beforehand.
- *Limits On Withdrawls*: Define limits on contracts that will disallow users to withdraw funds that are huge in proportion in a single transaction. E.g. Min of (10% of total user fund or 10K).
- *Immediate Blacklisting* : Maintain onchain blacklist of users so that malicious actors can be stopped abruptly.




## Glossary

Attestor
: It is the bridge component that is responsible for detecting new messages,signing them to prove their validity and submitting them to target chain.

Gas Station
: Third party service or provider that sponsors transaction on users behalf for special use cases.

