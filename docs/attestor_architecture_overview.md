This document presents architectural overview of attestor. The basic task/function of attestor is to pull packet from the source chain, validate it against chain-analysis and submit it's signature to the common database for users to collect and submit enough signatures to the target chain. Attestor should not miss any packet.

Internally we have divided attestor into two services called ChainService and SigningService.

### ChainService
This service manages all the packets that it needs to process from all the source chains. Note that this service waits 24 hours before picking up a packet so that chain-analysis have enough time to whitelist or blacklist the addresses in the packets.

The brief workflow is as follow:
1. ChainService picks up the packet from the source chain
2. It then sends addresses to chain-analysis which returns __*isWhite*__ status.
3. It hashes the packet compatible to the target chain. So for example, if target chain is aleo then it computes BHP256 hash of the packet and for the ethereum as target chain it computes Keccak256 hash of the packet.
4. It then combines this hash with __*isWhite*__ status and again computes hash compatible to target chain.
5. It sends this hash to signing service. Signing service signs the hash and returns the signature.
6. It submits this signature with packet information to the common database for users to collect them later.

ChainService is responsible for retrying signature delivery if any error occurs in between. It maintains retryPacket list for all failed packets. It ensures guaranteed processing and signature submission of all packets to the common database.

In the case where somehow attestor misses some packet, user can always make request to council and council shall put this packet information to the common database. Attestor routinely checks if it has to process any left out packets from this database as well. Here is the simple flow how this is done:

1. Attestor checks if there is any missing packet info in database queue.
2. It pulls the info and verifies packet info against blockchain.
3. It then repeats steps outlined in the above section.


*Attestor shall always consider blockchain to be the source of truth.*

### Signing Service
Attestor might require support/maintainence from devops at some point in time. From security point of view it is vulnerable to store wallet info in the system as devops can dump and take away wallet info. It therefore seems better to segregate attestor into chain-service and signing-service where signing-service will run as a standalone server and chain-service will request it to sign its message.

Signing service shall whitelist chain-service and shall only serve request from it. However it is still vulnerable to sign any messages from chain-service blindly. Therefore it seems it is better to let signing-service hash the packet and sign it and respond it to the chain-service.

We developed signing-service to expose its service via network socket(http protocol) so that we can have flexibility to run chain-service and signing-service as two different process in same machine by either individually running each process or by running each service as docker container with proper user access management. Another way is to run these services in different machines.