## Data Structures
### InPacketQueue
```
pub struct InPacketQueue {
    pub packet: Packet,
    pub vote_count: u32,
}
```
 The code snippet defines a struct called `InPacketQueue` which represents a queue for incoming packets. It has two fields: `packet` which stores the incoming packet and `vote_count` which keeps track of the number of votes received for the packet.

 ### Config
 ```
 pub struct Config {
    pub governance_address: String,
    pub chain_id: u32,
}
 ```
 The code snippet defines a struct called `Config` with two public fields: `governance_address` and `chain_id`. Field `governance_address` stores address of governance wallet and `chain_id` stores chain_id of host platform.

 ### InitMsg
 ```
 pub struct InitMsg {
    self_chain_id: u32,
    attestors: Vec<String>,
    nonce_seed: [u8; 32],
}
 ```
The `InitMsg` struct is used to pass the initialization message for the contract. It contains three fields:
1. `self_chain_id`: represents the chain ID of the current host chain.
2. `attestors`: addresses of the attestors.
3. `nonce_seed`: holds the seed for generating nonces.

 ### Contract Storage
 ```
 pub struct BridgeContract {
    pending_packets: HashMap<PacketHash, InPacketQueue>,
    incoming_packets: HashMap<PacketHash, Packet>,
    packet_votes: HashMap<(String, PacketHash), bool>,
    consumed_packets: HashMap<PacketHash, bool>,
    attestors: HashMap<String, bool>,
    chain_sequence: HashMap<u32, u128>,
    nonce: [u8; 32],
    registered_services: HashMap<String, bool>,
    allowed_target_chains: HashMap<u32, bool>,
    config: Option<Config>,
    outgoing_packets: HashMap<(u32, u128), Packet>,
}
 ```
 | Name             | Structure                           | Remarks                                                        |
|------------------|-------------------------------------|----------------------------------------------------------------|
| Chain Sequence  | chain_id=>sequence                  | Sequence counter of each chain.                                |
| Outgoing Packets | (target_chain_id ,sequence)=>Packet | Queue for outgoing packets to be picked by attestors           |
| Incoming Packets | packet_hash=>Packet                 | Incoming packets that have crossed the quorum threshold.       |
| Consumed Packets | packet_hash=>bool                   | Log of consumed packets by their hash.                         |
| Packet Votes     | (packet_hash,address)=>bool                | Map of packet hash + voter address to prevent double voting. |
| Pending Packets  | packet_hash=>Packet                 | Incoming packets that are not yet crossed quorum.              |
| Attestors        | address=>bool                       | List of known attestors.                                       |
| Registered Services  | address=>bool                    | Should return true for supported services only. Initially, token service contract will be the only supported service.|
| Allowed Target Chains        | chain_id=>bool                       | List of recognized target chains.                  |
| Config        | single nullable item config                     | Info on governance address and chain id                |
| Nonce        | single random value in bytes                     | Updatable value to be used as nonce                    |


### Contract Interface
```
pub trait IBridgeContract {
    fn init_contract(&mut self, caller: String, msg: InitMsg) -> Result<(), ContractError> {
        if let None = self.get_config() {
            let config = Config {
                governance_address: caller,
                chain_id: msg.self_chain_id,
            };
            self.set_attestors(msg.attestors);
            self.set_config(config);
            self.set_nonce(msg.nonce_seed);
        }
        return Err(ContractError::AlreadyInit);
    }
    fn send_message(
        &mut self,
        caller: String,
        destination: NetworkAddress,
        msg:TokenMessage,
    ) -> Result<u128, ContractError> {
       self.ensure_registered_service(&caller)?;
        let target_chain_id=destination.chain_id;
        self.ensure_allowed_target_chain(target_chain_id)?;
        let self_chain_id = self
            .get_own_chain_id()
            .ok_or(ContractError::ContractNotInit)?;
        let target_chain_id=destination.chain_id;

        let next_sequence = self.get_current_sequence(destination.chain_id) + 1;
        let packet = Packet {
            destination: destination,
            height: self.get_host_height(),
            message: msg_hash,
            sequence: next_sequence,
            source: NetworkAddress::new(self_chain_id, &caller),
            version: 1,
            nonce: self.get_nonce(),
        };
        let next_nonce = self.hash(&[self.get_nonce(), self.hash_packet(&packet)].concat());
        self.set_nonce(next_nonce);
        self.queue_outgoing_packet(packet)?;
        self.set_chain_sequence(target_chain_id, next_sequence);

        Ok(next_sequence)
    }

    fn receive_packet_batch(
        &mut self,
        caller: String,
        packet: Vec<Packet>,
    ) -> Result<Vec<()>, ContractError> {
        let result = packet
            .into_iter()
            .map(|p| return self.receive_packet(caller.clone(), p))
            .collect::<Result<Vec<()>, ContractError>>();
        return result;
    }

    fn receive_packet(&mut self, caller: String, packet: Packet) -> Result<(), ContractError> {
        self.ensure_attestor(&caller)?;

        let packet_hash = self.hash_packet(&packet);
        self.ensure_not_voted(&caller, &packet_hash)?;
        let mut packet_queue = self
            .get_packet_queue(&packet_hash)
            .unwrap_or(InPacketQueue::new(packet.clone()));
        packet_queue.vote_count = packet_queue.vote_count + 1;
        if self.has_qurom(packet_queue.vote_count) {
            self.set_incoming_packet(&packet_hash, packet);
        }

        self.set_packet_vote(&caller, &packet_hash);
        self.set_inpacket_queue(&packet_hash, packet_queue);
        Ok(())
    }

    fn consume_packet(
        &mut self,
        caller: String,
        packet_hash: [u8; 32],
    ) -> Result<(), ContractError> {
        self.ensure_registered_service(&caller)?;
        self.ensure_not_consumed(&packet_hash)?;
        let packet = self
            .get_incoming_packet(&packet_hash)
            .ok_or(ContractError::PacketNotFound)?;
        let self_chain_id = self
            .get_own_chain_id()
            .ok_or(ContractError::ContractNotInit)?;
        if packet.destination != NetworkAddress::new(self_chain_id, &caller) {
            return Err(ContractError::Unauthorized);
        }

        self.set_packet_consumed(&packet_hash);

        Ok(())
    }
    // ensure governance
    fn register_service(&mut self, address: String) -> Result<(), ContractError>;
    // ensure governance
    fn remove_service(&mut self, address: String) -> Result<(), ContractError>;
    // ensure governance
    fn set_attestors(&mut self, attestors: Vec<String>);
   
    fn get_attestors(&self) -> Vec<String>;

    fn get_current_sequence(&self, chain_id: u32) -> u128;
    fn get_nonce(&self) -> [u8; 32];
    // private
    fn set_nonce(&mut self, nonce: [u8; 32]);

    fn is_packet_received(&self, packet_hash: [u8; 32]) -> bool;

    fn get_outgoing_packet(&self, chain_id: u32, sequence: u128) -> Option<Packet>;

    fn get_incoming_packet(&self, hash: &PacketHash) -> Option<Packet>;
    // private
    fn set_incoming_packet(&mut self, hash: &PacketHash, packet: Packet) -> Option<Packet>;
    // ensure governance
    fn add_target_chain(&mut self, chain_id: u32);
    // ensure governance
    fn remove_target_chain(&mut self, chain_id: u32);

    fn get_host_height(&self) -> String;

    fn get_own_chain_id(&self) -> Option<ChainId>;
    // private
    fn queue_outgoing_packet(&mut self, packet: Packet) -> Result<(), ContractError>;

    fn hash_packet(&self, packet: &Packet) -> [u8; 32];

    fn hash(&self, bytes: &[u8]) -> [u8; 32];

    fn ensure_registered_service(&self, caller: &str) -> Result<(), ContractError>;
    fn ensure_attestor(&self, caller: &str) -> Result<(), ContractError>;
    fn ensure_not_consumed(&self, hash: &PacketHash) -> Result<(), ContractError>;
    fn ensure_allowed_target_chain(&self, chain_id: u32) -> Result<(), ContractError>;

    fn get_packet_queue(&self, hash: &PacketHash) -> Option<InPacketQueue>;
    fn ensure_not_voted(
        &self,
        attestor: &str,
        packet_hash: &PacketHash,
    ) -> Result<(), ContractError>;
    // private
    fn set_packet_vote(&mut self, attestor: &str, hash: &PacketHash);
    // private
    fn set_inpacket_queue(&mut self, hash: &PacketHash, queue: InPacketQueue);
    //private
    fn set_packet_consumed(&mut self, hash: &PacketHash);
    fn has_qurom(&self, count: u32) -> bool;
    // private
    fn set_config(&mut self, config: Config);
    fn get_config(&self) -> Option<Config>;
}
```
## Init Contract (EntryPoint)
The code snippet is a method called `init_contract` that initializes the contract by setting the configuration, attestors, and nonce if the contract has not been initialized before.


### Inputs
- `caller`: A string representing the address of the caller.
- `msg`: An `InitMsg` struct containing the self chain ID, attestors, and nonce seed.
___
### Flow
1. Check if the contract has already been initialized by calling the `get_config` method. If the result is `None`, proceed to the next step.
2. Create a new `Config` struct with the `governance_address` set to the `caller` and the `chain_id` set to `msg.self_chain_id`.
3. Set the attestors of the contract to `msg.attestors` by calling the `set_attestors` method.
4. Set the configuration of the contract to the newly created `Config` struct by calling the `set_config` method.
5. Set the nonce of the contract to `msg.nonce_seed` by calling the `set_nonce` method.
6. Return an error of type `ContractError::AlreadyInit` to indicate that the contract has already been initialized.
___
### Outputs
- If the contract has not been initialized before, the method returns `Ok(())`.
- If the contract has already been initialized, the method returns an error of type `ContractError::AlreadyInit`.
___

## Send Message (EntryPoint)
The code snippet is a method called `send_message` that sends a message from one network address to another. It performs several checks to ensure that the sender is a registered service and that the destination chain is allowed. It then creates a packet with the necessary information, such as the destination address, message hash, and sequence number. Finally, it updates the nonce and queues the outgoing packet.

### Inputs
- `caller` (String): The address of the sender.
- `destination` (NetworkAddress): The address of the recipient.
- `msg` (TokenMessage): Message containing token transfer details for target chain.
___
### Flow
1. Check if the sender is a registered service using the `ensure_registered_service` method.
2. Check if the destination chain is allowed using the `ensure_allowed_target_chain` method.
3. Get the chain ID of the sender's own chain using the `get_own_chain_id` method.
4. Get the current sequence number for the destination chain using the `get_current_sequence` method and increment it by 1.
5. Create a new packet with the destination address, host height, message hash, sequence number, source address, version, and nonce.
6. Update the nonce by hashing the current nonce and the packet using the `hash` method.
7. Queue the outgoing packet using the `queue_outgoing_packet` method.
8. Save incremented sequence to storage.
___
### Outputs
- Result<u128, ContractError>: The sequence number of the sent message, wrapped in a `Result` indicating success or an error if any of the checks fail.
___

## Receive Packet Batch (EntryPoint)
The code snippet is a method called `receive_packet_batch` that receives a batch of packets and processes them one by one by calling the `receive_packet` method for each packet. It returns a result indicating whether the processing was successful or if an error occurred.

### Inputs
- `caller` (String): The caller's identifier.
- `packets` (Vec<Packet>): A batch of packets to be processed.
___
### Flow
1. The method `receive_packet_batch` takes in the `caller` and `packets` as input.
2. It uses the `into_iter` method to iterate over each packet in the `packets` vector.
3. For each packet, it calls the `receive_packet` method, passing the `caller` and the current packet as arguments.
4. The `receive_packet` method processes the packet and returns a result indicating success or failure.
5. The `map` function collects the results of each `receive_packet` call into a vector.
6. The `collect` method is used to collect the results into a single `Result` object.
7. The `receive_packet_batch` method returns the collected results.
___
### Outputs
- `Result<Vec<()>, ContractError>`: A result indicating whether the processing of the packet batch was successful or if an error occurred.
___

## Receive Packet (EntryPoint)
The code snippet is a method called `receive_packet` that is part of the `IBridgeContract` trait implementation for the `BridgeContract` struct. It receives a packet and performs several operations related to packet handling and voting.

### Inputs
- `self` (mutable reference to `BridgeContract`): The instance of the `BridgeContract` struct.
- `caller` (String): The address of the caller.
- `packet` (Packet): The packet to be received.
___
### Flow
1. The method first ensures that the caller is an attestor by calling the `ensure_attestor` function.
2. It then calculates the hash of the packet using the `hash_packet` function.
3. The method checks if the caller has already voted for the packet by calling the `ensure_not_voted` function.
4. If there is an existing packet queue for the hash, it retrieves it using the `get_packet_queue` function. Otherwise, it creates a new `InPacketQueue` with the received packet.
5. The vote count of the packet queue is incremented by 1.
6. If the vote count reaches the quorum, the received packet is set as the incoming packet using the `set_incoming_packet` function.
7. The caller's vote for the packet is recorded using the `set_packet_vote` function.
8. The updated packet queue is stored using the `set_inpacket_queue` function.
9. The method returns `Ok(())` to indicate successful execution.
___
### Outputs
- `Result<(), ContractError>`: An empty result indicating success or an error of type `ContractError` if any of the required conditions are not met.
___

## Consume Packet (EntryPoint)
The code snippet is a method called `consume_packet` that is part of the `IBridgeContract` trait implementation in the `BridgeContract` struct. It consumes a packet by marking it as consumed in the contract.

### Inputs
- `caller` (String): The address of the caller who wants to consume the packet.
- `packet_hash` ([u8; 32]): The hash of the packet to be consumed.
___
### Flow
1. Check if the caller is a registered service by calling the `ensure_registered_service` function.
2. Check if the packet has not been consumed yet by calling the `ensure_not_consumed` function.
3. Get the incoming packet with the given packet hash by calling the `get_incoming_packet` function. If the packet does not exist, return an error.
4. Get the chain ID of the contract by calling the `get_own_chain_id` function. If the chain ID is not initialized, return an error.
5. Check if the destination of the packet matches the caller's network address. If not, return an error.
6. Mark the packet as consumed by calling the `set_packet_consumed` function.
___
### Outputs
- Result<(), ContractError>: An empty result indicating success or an error if any of the checks fail.
___





