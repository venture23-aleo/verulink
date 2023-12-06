// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

abstract contract IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external virtual;
    function transfer(address recipient, uint256 amount) external virtual;
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

interface IERC20TokenBridge {
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

    function sendMessage(OutPacket memory packet) external;
    function consume(uint256 chainId, uint256 sequence) external returns (InPacket memory);
    function chainId() external view returns (uint256);
}

abstract contract BlackListService is Ownable {
    event BlackListAdded(address addr);
    event BlackListRemoved(address addr);

    mapping(address => bool) blackLists;

    function addToBlackList(address addr) external onlyOwner {
        emit BlackListAdded(addr);
        blackLists[addr] = true;
    }
    function removeFromBlackList(address addr) external onlyOwner {
        emit BlackListRemoved(addr);
        delete blackLists[addr];
    }
    function isBlackListed(address addr) public view returns (bool) {
        return blackLists[addr];
    }
}

abstract contract ERC20TokenSupport is Ownable {
    struct Token {
        address tokenAddress;
        IERC20TokenBridge.OutNetworkAddress destTokenAddress;
        IERC20TokenBridge.OutNetworkAddress destTokenService;
        uint256 minValue;
        uint256 maxValue;
        bool enabled;
    }

    mapping(address => Token) public supportedTokens;

    event TokenAdded(Token token);

    function isSupportedToken(address token) public view returns (bool) {
        return supportedTokens[token].tokenAddress == token;
    }

    function isSupportedToken(address token, uint256 destChainId) public view returns (bool) {
        return supportedTokens[token].destTokenAddress.chainId == destChainId;
    }

    function addToken(
        address tokenAddress, 
        uint256 destChainId, 
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min, 
        uint256 max) public onlyOwner {
            Token memory token = Token(tokenAddress,
                                        IERC20TokenBridge.OutNetworkAddress(destChainId, destTokenAddress),
                                        IERC20TokenBridge.OutNetworkAddress(destChainId, destTokenService),
                                        min,
                                        max,
                                        true);
            supportedTokens[tokenAddress] = token;
            emit TokenAdded(token);
    }

    function removeToken(address tokenAddress) public onlyOwner {
        require(isSupportedToken(tokenAddress), "Token not supported");
        delete supportedTokens[tokenAddress];
    }
}

contract ERC20TokenService is BlackListService, ERC20TokenSupport {

    struct TokenMessage {
        string denom;
        uint256 amount;
        string receiverAddress;
    }

    
    address erc20Bridge;

    // token address => amount
    mapping(address => uint256) public valueLocked;

    Holding holding;
    

    IERC20TokenBridge.InNetworkAddress public self;

    constructor(address bridge, address _owner) {
        owner = _owner;
        erc20Bridge = bridge;
        self = IERC20TokenBridge.InNetworkAddress(
            IERC20TokenBridge(bridge).chainId(), 
            address(this)
        );
    }

    function setHolding(Holding _holding) public onlyOwner {
        holding = _holding;
    }

    event Withdrawn(uint256 amount);

    function transfer(address tokenAddress, uint256 amount, string memory receiver, uint256 destChainId) external {
        require(!isBlackListed(msg.sender), "Sender Blacklisted");
        require(isSupportedToken(tokenAddress,destChainId), "Unknown token Address");

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);

        IERC20TokenBridge.OutTokenMessage memory message = IERC20TokenBridge.OutTokenMessage(
            supportedTokens[tokenAddress].destTokenAddress.addr, 
            amount, 
            receiver
        );

        IERC20TokenBridge.OutPacket memory packet ;
        packet.source = self;
        packet.destination = supportedTokens[tokenAddress].destTokenService;
        packet.message = message;
        packet.height = block.number;

        valueLocked[tokenAddress] += amount;

        IERC20TokenBridge(erc20Bridge).sendMessage(packet);
    }

    function withdraw(uint256 chainId, uint256 sequence) external {
        IERC20TokenBridge.InPacket memory packet = IERC20TokenBridge(erc20Bridge).consume(chainId, sequence);
        require(packet.destination.addr == address(this),"Packet not intended for this Token Service");
        address receiver = packet.message.receiverAddress;
        require(receiver != address(0), "Receiver Zero Address");
        require(isSupportedToken(packet.message.destTokenAddress), "Token not supported");
        if(isBlackListed(receiver)) {
            IERC20(packet.message.destTokenAddress).transfer(address(holding), packet.message.amount);
            holding.lock(receiver, packet.message.destTokenAddress, packet.message.amount);
        }
        address tokenAddress = packet.message.destTokenAddress;
        emit Withdrawn(packet.message.amount);
        IERC20(tokenAddress).transfer(receiver, packet.message.amount);
    }
}

contract Holding is Ownable {
    // user address => token address => amount
    mapping(address => mapping(address => uint256)) locked;

    mapping(address => mapping(address => uint256)) unlocked;

    address public tokenService;

    constructor(address _owner, address _tokenService) {
        owner = _owner;
        tokenService = _tokenService;
    }

    function updateTokenService(address _tokenService) public onlyOwner {
        tokenService = _tokenService;
    }

    function lock(address user, address token, uint256 amount) public {
        require(msg.sender == tokenService, "Caller is not registered Token Service");
        locked[user][token] += amount;
    }

    function unlock(address user, address token, uint256 amount) public onlyOwner {
        require(locked[user][token] >= amount, "Insufficient amount");
        locked[user][token] -= amount;
        unlocked[user][token] += amount;
    }

    function release(address user, address token, uint256 amount) public {
        require(unlocked[user][token] >= amount, "Insufficient amount");
        IERC20(token).transfer(user, amount);
    }
}