// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {BlackListService} from "./abstract/tokenservice/BlackListService.sol";
import {ERC20TokenSupport} from "./abstract/tokenservice/ERC20TokenSupport.sol";
import {IERC20TokenBridge} from "./Common/Interface/bridge/IERC20TokenBridge.sol";
import {IERC20} from "./Common/Interface/tokenservice/IERC20.sol";
import {Holding} from "./HoldingContract.sol";

contract ERC20TokenService is BlackListService, ERC20TokenSupport {
    address erc20Bridge;

    // token address => amount
    // mapping(address => uint256) public valueLocked;

    Holding public holding;
    

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

        // valueLocked[tokenAddress] += amount;

        IERC20TokenBridge(erc20Bridge).sendMessage(packet);
    }

    function withdraw(uint256 chainId, uint256 sequence) external {
        IERC20TokenBridge.InPacket memory packet = IERC20TokenBridge(erc20Bridge).consume(chainId, sequence);
        require(packet.destination.addr == address(this),"Packet not intended for this Token Service");
        address receiver = packet.message.receiverAddress;
        require(receiver != address(0), "Receiver Zero Address");
        address tokenAddress = packet.message.destTokenAddress;
        require(isSupportedToken(tokenAddress), "Token not supported");
        if(isBlackListed(receiver)) {
            IERC20(tokenAddress).transfer(address(holding), packet.message.amount);
            holding.lock(receiver, tokenAddress, packet.message.amount);
        }else {
            emit Withdrawn(packet.message.amount);
            IERC20(tokenAddress).transfer(receiver, packet.message.amount);
        }
    }
}