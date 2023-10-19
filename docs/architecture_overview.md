# Architecture Overview

This document provides detailed requirements and design guidelines for the smart contracts required for the Aleo-Eth Multisig bridge. This will make sure that we have a general consensus on workflow of the bridge and also keep the spec uniform over multiple languages or platforms. There might be platform specific deviations in implementation details but it is expected the overall architecture will remain consistent on every platform.


## Aleo-Eth Multisig Bridge

This is a trusted  bridge platform that is designed to help move assets between Ethereum and Aleo blockchain.

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
| Destination | Target chain’s chain id and bridge contract address represented as network address. |
| Source      | Source chain id and contact address of bridge contract in source chain              |
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

### Contracts
Each participating chain will have at least two contracts i.e. Bridge Contract and TokenService Contract. 
There may be more contracts depending on the platform requirements.

#### Bridge Contract
Bridge contract is responsible for sending and receiving messages and does not concern with the contents of the message.
It will make sure that the message is accessible only to the contract that the message was addressed to.
##### Bridge Contract Storage Structure

| Name             | Structure                           | Remarks                                                        |
|------------------|-------------------------------------|----------------------------------------------------------------|
| Packet Sequence  | chain_id=>sequence                  | Sequence counter of each chain.                                |
| Outgoing Packets | (target_chain_id ,sequence)=>Packet | Queue for outgoing packets to be picked by attestors           |
| Incoming Packets | packet_hash=>Packet                 | Incoming packets that have crossed the quorum threshold.       |
| Consumed Packets | packet_hash=>bool                   | Log of consumed packets by their hash.                         |
| Packet Votes     | packet_hash=>address                | Map of packet hash and voter address to prevent double voting. |
| Pending Packets  | packet_hash=>Packet                 | Incoming packets that are not yet crossed quorum.              |
| Attestors        | address=>bool                       | List of known attestors.                                       |

##### Bridge Contract Interface
```
pub trait BridgeContract {
     fn send_message(&self,destination:NetworkAddress,msg_hash:[u8;32])->u128;
     
     fn receive_packet_batch(&self,packet:Packet,signatures:Vec<Signature>);
     
     fn receive_packet(&self,packet:Packet);
     
     fn set_attestors(&self,attestors:Vec<attestors>);
     
     fn get_attestor(&self)->Vec<attestors>;
     
     fn get_current_sequence(&self,chain_id:u32)->u128;
     
     fn is_packet_received(&self,packet_hash:[u8;32])->bool;

     fn get_outgoing_packet(&self,chain_id:u32,sequence:u128)->Option<Packet>;
  
     fn consume_packet(&self,packet_hash:[u8;32])->bool;
}



```
Send Message
: Send message will be called by external contracts that want to relay a message to a target chain. They will provide network address of target chain i.e. chain id and contact address of bridge contract on target end. Bridge contract on receiving the message creates an outgoing packet that will include this message hash and other necessary information. This outgoing queue needs to be queryable from outside using the target chain’s chain id and sequence number of packets.

Receive Packet
: Callable only by attestors in our list. The bridge contract will hash the packet then the packet is queued for voting. Once the packet reaches enough quorum it is migrated to the incoming packets queue for consumption.

Receive Packet Batch
: This will be called by our attestor or may even be called by outsiders as well. The bridge contract will hash the packet and extract the signer from the signature using that hash. If the signer is in our attestor list then the packet is queued for voting. Once the packet reaches enough quorum it is migrated to the incoming packets queue for consumption.

Set attestors
: Governance controlled entry point for updating a new attestor set.

Get attestors
: Returns currently set attestors.

Get Current Sequence
: Returns current sequence number for given target chain id.

Is Packet Received
: Invoked by attestors to check if packet has already passed quorum to avoid submitting the packet.

Get Outgoing Packet
: Invoked by attestor to see if there is a packet queued for a target chain with a given sequence number.

Consume Packet
: Will be called by external contracts to check if a message has arrived and consume it to take necessary action on their contract. The bridge contract will verify if the calling contract is the same as the target contract associated with the message. If the message is valid then it is logged in consumed messages or flagged as consumed to prevent double spending.

#### Token Service Contract
This contract is responsible for interacting with other er20 tokens to mint/burn and pass relevant information to bridge contract as a Token Message.
##### Token Contract Storage Structure

| Name      | Structure      | Remarks                                       |
|-----------|----------------|-----------------------------------------------|
| TVL       | token_id=>u128 | Total Volume Locked On Contract               |
| Blacklist | address=>bool  | List of black listed address on current chain |

##### Token Service Contract Interface
``` 
pub trait TokenContract{
    pub fn transfer(&self,recipient:String, token:Token)->String;
    pub fn withdraw(&self,packet:Packet,msg:TokenMessage);
    pub fn get_transfer_info(sequence_no:u128)->TokenMessage;
    pub fn validate_blacklisted(address:String)->bool;
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

### Attestor
Attestor is the bridge component that will be responsible for detecting new messages, validating them and broadcasting them to the target network by calling the target bridge contract. Each attestor entity will be running their own full node of the involved chains and listen for incoming messages. Attestors do not have knowledge of other attestors in the network and are concerned only with verifying messages it has seen in the network. It will follow the following steps to make sure that the messages are delivered infallibly.

![Attestor Workflow](attestor.png)

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
![Bridge](bridge.png)

#### Architecture Overview
![Architecture](contained.png)


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










## Glossary

Attestor
: It is the bridge component that is responsible for detecting new messages,signing them to prove their validity and submitting them to target chain.

Gas Station
: Third party service or provider that sponsors transaction on users behalf for special use cases.


