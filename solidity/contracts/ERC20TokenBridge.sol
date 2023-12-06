// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

abstract contract PacketManager {
    struct OutNetworkAddress {
        uint256 chainId;
        string addr; 
    }

    struct InNetworkAddress {
        uint256 chainId;
        address addr; 
    }
    
    struct OutTokenMessage {
        string destTokenAddress;
        uint256 amount;
        string receiverAddress;
    }

    struct InTokenMessage {
        address destTokenAddress;
        uint256 amount;
        address receiverAddress;
    }

    struct OutPacket {
        uint256 version;
        uint256 sequence;
        InNetworkAddress source;
        OutNetworkAddress destination;
        OutTokenMessage message;
        uint256 height;
    }

    struct InPacket {
        uint256 version;
        uint256 sequence;
        OutNetworkAddress source;
        InNetworkAddress destination;
        InTokenMessage message;
        uint256 height;
    }

    InNetworkAddress public self;

    function _validateConfig() internal virtual {}

    function incomingPacketExists(InPacket memory packet) public view virtual returns (bool) {}
    function _setIncomingPacket(InPacket memory packet) internal virtual {}
    function getIncomingPacket(uint256 chainId, uint256 sequence) public view virtual returns (InPacket memory) {}
    function _removeIncomingPacket(InPacket memory packet) internal virtual {}

    function isPacketConsumed(InPacket memory packet) public view virtual returns (bool){}
    function _setConsumedPacket(InPacket memory packet) internal virtual {}

    function _setOutgoingPacket(OutPacket memory packet) internal virtual {}
    function _getQuorumRequired() internal view virtual returns (uint256) {}
}

abstract contract IncomingPacketManager is PacketManager {
    function _preValidateInPacket(InPacket memory packet) internal view virtual {}
    function _updateInPacketState(InPacket memory packet, uint256 action) internal virtual {}
    function _postValidateInPacket(InPacket memory packet) internal view virtual {}
}

contract Ownable {
    address public owner;
    modifier onlyOwner {
        require(msg.sender == owner, "Not owner");
        _;
    }
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}

abstract contract BridgeTokenServiceManager is Ownable {
    event TokenServiceAdded(address tokenService);
    event TokenServiceRemoved(address tokenService);

    mapping(address => bool) internal tokenServices;

    function isRegisteredTokenService(address tokenService) public view virtual returns(bool);

    function addTokenService(address tokenService) external onlyOwner {
        require(tokenService != address(0), "Zero Address");
        require(!isRegisteredTokenService(tokenService), "Token Service already added");
        tokenServices[tokenService] = true;
        emit TokenServiceAdded(tokenService);
    }

    function removeTokenService(address tokenService) external onlyOwner {
        require(isRegisteredTokenService(tokenService), "Unknown Token Service");
        delete tokenServices[tokenService];
        emit TokenServiceRemoved(tokenService);
    }

    // address public tokenService;

    // function updateTokenService(address service) external {
    //     require(service != address(0), "Zero Address");
    //     tokenService = service;
    //     emit TokenServiceAdded(service);
    // }
}

abstract contract ChainManager is Ownable {
    event ChainAdded(PacketManager.OutNetworkAddress chain);
    event ChainRemoved(uint256 chainId);

    mapping(uint256 => PacketManager.OutNetworkAddress) public chains;

    function isSupportedChain(uint256 chainId) public view returns (bool) {
        return chains[chainId].chainId != 0;
    }

    function addChain(uint256 chainId, string memory destBridgeAddress) public onlyOwner {
        require(!isSupportedChain(chainId), "Chain already supported");
        chains[chainId] = PacketManager.OutNetworkAddress(chainId, destBridgeAddress);
        emit ChainAdded(chains[chainId]);
    }

    function removeChain(uint256 chainId) public onlyOwner {
        require(isSupportedChain(chainId), "Unknown chainId");
        delete chains[chainId];
        emit ChainRemoved(chainId);
    }
}

abstract contract AttestorManager is Ownable{
    event AttestorAdded(address attestor, uint256 quorum);
    event AttestorRemoved(address attestor, uint256 quorum);

    mapping(address => bool) private attestors;
    uint256 quorumRequired;

    function isAttestor(address attestor) public view returns (bool) {
        return attestors[attestor];
    }

    function addAttestor(address attestor, uint256 newQuorumRequired) public onlyOwner {
        require(attestor != address(0), "Zero Address");
        attestors[attestor] = true;
        quorumRequired = newQuorumRequired;
        emit AttestorAdded(attestor, newQuorumRequired);
    }

    function removeAttestor(address attestor, uint256 newQuorumRequired) public onlyOwner {
        if(isAttestor(attestor)) {
            delete attestors[attestor];
            quorumRequired = newQuorumRequired;
            emit AttestorRemoved(attestor, newQuorumRequired);
        }
    }
}

abstract contract ConsumedPacketManagerImpl is IncomingPacketManager {
    event Consumed(InPacket packet);

    function _preValidateInPacket(InPacket memory packet) internal view override virtual {
        super._preValidateInPacket(packet);
        require(!isPacketConsumed(packet), "Packet already consumed");
    }

    function _updateInPacketState(InPacket memory packet, uint256 action) internal override virtual {
        super._updateInPacketState(packet, action);
        if(!incomingPacketExists(packet) || action != 2) return; // 2 to represent consume operation, 1 to receive packet operation
        _removeIncomingPacket(packet);
        _setConsumedPacket(packet);
    }

    function consume(uint256 chainId, uint256 sequence) external returns (InPacket memory){
        InPacket memory packet = getIncomingPacket(chainId, sequence);
        require(packet.source.chainId != 0 && packet.sequence !=0, "Zero Packet");
        _preValidateInPacket(packet);
        _updateInPacketState(packet, 2);
        //emit Consumed(packet);
        return packet;
    }
}

abstract contract IncomingPacketManagerImpl is IncomingPacketManager {
    event Voted(InPacket packet, address voter);
    event AlreadyVoted(InPacket packet, address voter);

    // chainId => sequence => vote count
    mapping(uint256 => mapping(uint256 => uint256)) public votes;
    // chainId => sequence => attestor address => bool
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private voted;

    function _receivePacket(InPacket memory packet) internal {
        _preValidateInPacket(packet);
        _updateInPacketState(packet, 1);
        _postValidateInPacket(packet);
    }
    
    function receivePacket(InPacket memory packet) external {
        _validateConfig();
        _receivePacket(packet);
    }

    function receivePacketBatch(InPacket[] memory packets) external {
        _validateConfig();
        for(uint256 i=0;i<packets.length;i++) {
            _receivePacket(packets[i]);
        }
    }

    function isRegisteredTokenService (address tokenService) public view virtual returns (bool);

    function _preValidateInPacket(InPacket memory packet) internal view override virtual {
        super._preValidateInPacket(packet);
        if(incomingPacketExists(packet)) return;
        require(self.chainId == packet.destination.chainId, "Packet not intended for this Chain");
        require(isRegisteredTokenService(packet.destination.addr), "Unknown Token Service");
    }

    function _updateInPacketState(InPacket memory packet, uint256 action) internal override virtual {
        if(action != 1) return; // 2 to represent consume operation, 1 to receive operation
        
        super._updateInPacketState(packet, action);

        if(hasVoted(packet, msg.sender)) {
            emit AlreadyVoted(packet, msg.sender);
            return;
        }

        emit Voted(packet, msg.sender);
        voted[packet.source.chainId][packet.sequence][msg.sender] = true;
        votes[packet.source.chainId][packet.sequence]+=1;
        if(hasQuorumReached(packet) && !incomingPacketExists(packet)) {
            _setIncomingPacket(packet);
        }
    }

    function hasQuorumReached(InPacket memory packet) public view returns (bool) {
        return votes[packet.source.chainId][packet.sequence] >= _getQuorumRequired();
    }

    function hasVoted(InPacket memory packet, address voter) public view returns (bool) {
        return voted[packet.source.chainId][packet.sequence][voter];
    }
}

abstract contract OutgoingPacketManagerImpl is PacketManager {
    event NewPacket(OutPacket packet);

    function _beforeTokenBridge(uint256 destChainId) internal virtual {}
    function _afterTokenBridge(OutPacket memory packet) internal virtual {}

    // chainId => sequence number
    mapping(uint256 => uint256) public sequences;

    function _incrementSequence(uint256 _chainId) internal returns (uint256) {
        sequences[_chainId] += 1;
        return sequences[_chainId];
    }

    function sendMessage(OutPacket memory packet) external {
        _beforeTokenBridge(packet.destination.chainId);
        //Packet memory packet = _createPacket(sourceTokenService, destNetworkAddress, message);
        
        packet.version = 1;
        packet.sequence = _incrementSequence(packet.destination.chainId);

         _setOutgoingPacket(packet);

        emit NewPacket(packet);
        _afterTokenBridge(packet);
    }

    
}

contract ERC20TokenBridge is PacketManager, 
    IncomingPacketManagerImpl, 
    ConsumedPacketManagerImpl, 
    OutgoingPacketManagerImpl, 
    Ownable,
    AttestorManager,
    BridgeTokenServiceManager,
    ChainManager
{
    // chainId => sequence => Packet
    mapping(uint256 => mapping(uint256 => InPacket)) private incomingPackets;
    mapping(uint256 => mapping(uint256 => InPacket)) public consumedPackets;
    mapping(uint256 => mapping(uint256 => OutPacket)) public outgoingPackets;

    function isRegisteredTokenService(address tokenService) public view override(BridgeTokenServiceManager, IncomingPacketManagerImpl) returns(bool) {
        return tokenServices[tokenService];
    }
    
    function _preValidateInPacket(InPacket memory packet) internal view override (IncomingPacketManagerImpl, ConsumedPacketManagerImpl) {
        require(isSupportedChain(packet.source.chainId), "Unknown chainId");
        super._preValidateInPacket(packet);
    }

    function _updateInPacketState(InPacket memory packet, uint256 action) internal override (IncomingPacketManagerImpl, ConsumedPacketManagerImpl) {
        super._updateInPacketState(packet, action);
    }

    constructor(uint256 _chainId) {
        owner = msg.sender;
        addAttestor(msg.sender, 1);
        
        //addChain(2, "target");
        //addChain(1, "self");

        self = InNetworkAddress(
            _chainId, 
            address(this)
        );
    }

    function incomingPacketExists(InPacket memory packet) public view override returns (bool) {
        return incomingPackets[packet.source.chainId][packet.sequence].sequence == packet.sequence;
    }
    
    function _setIncomingPacket(InPacket memory packet) internal override {
        incomingPackets[packet.source.chainId][packet.sequence] = packet;
    }

    function getIncomingPacket(uint256 _chainId, uint256 sequence) public view override returns (InPacket memory) {
        return incomingPackets[_chainId][sequence];
    }

    function _removeIncomingPacket(InPacket memory packet) internal override {
        delete incomingPackets[packet.source.chainId][packet.sequence];
    }

    function _beforeTokenBridge(uint256 destChainId) internal override {
        super._beforeTokenBridge(destChainId);
        require(isRegisteredTokenService(msg.sender), "Caller is not registered Token Service");
        require(isSupportedChain(destChainId), "Destination Chain not supported");
    }

    function isPacketConsumed(InPacket memory packet) public view override returns (bool) {
        return consumedPackets[packet.source.chainId][packet.sequence].sequence == packet.sequence;
    }

    function _setConsumedPacket(InPacket memory packet) internal override {
        consumedPackets[packet.source.chainId][packet.sequence] = packet;
    }

    function _setOutgoingPacket(OutPacket memory packet) internal override {
        outgoingPackets[packet.destination.chainId][packet.sequence] = packet;
    }

    function _validateConfig() internal view override {
        require(isAttestor(msg.sender), "Unknown Attestor");
    }

    function _getQuorumRequired() internal view override returns (uint256) {
        return quorumRequired;
    }

    function chainId() public view returns (uint256) {
        return self.chainId;
    }
}