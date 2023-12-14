// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import {BlackListService} from "./abstract/tokenservice/BlackListService.sol";
import {ERC20TokenSupport} from "./abstract/tokenservice/ERC20TokenSupport.sol";
import {IERC20TokenBridge} from "./common/interface/bridge/IERC20TokenBridge.sol";
import {IERC20} from "./common/interface/tokenservice/IERC20.sol";
import {Holding} from "./HoldingContract.sol";
import "./common/libraries/Lib.sol";

contract ERC20TokenService is BlackListService, 
    ERC20TokenSupport, 
    Upgradeable 
{
    address erc20Bridge;
    uint public num;
    Holding holding;
    PacketLibrary.InNetworkAddress public self;
        
    function doubleNum() external {
        num *=2;
    }

    function initialize(address bridge, 
        uint256 _chainId, 
        address _usdc, 
        address _usdt,
        address _owner
    ) external initializer {
        owner = _owner;
        erc20Bridge = bridge;
        self = PacketLibrary.InNetworkAddress(
            _chainId, 
            address(this)
        );
        BlackListService.initialize(_usdc, _usdt);
    }

    function _authorizeUpgrade(address) internal view override {
        msg.sender == owner;
    }

    function setHolding(Holding _holding) public onlyOwner {
        holding = _holding;
    }

    function transfer(address tokenAddress, uint256 amount, string memory receiver, uint256 destChainId) external {
        require(!isBlackListed(msg.sender), "Sender Blacklisted");
        require(isSupportedToken(tokenAddress,destChainId), "Unknown token Address");

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);

        PacketLibrary.OutTokenMessage memory message = PacketLibrary.OutTokenMessage(
            supportedTokens[tokenAddress].destTokenAddress.addr, 
            amount, 
            receiver
        );

        PacketLibrary.OutPacket memory packet ;
        packet.source = self;
        packet.destination = supportedTokens[tokenAddress].destTokenService;
        packet.message = message;
        packet.height = block.number;

        IERC20TokenBridge(erc20Bridge).sendMessage(packet);
    }

    function withdraw(PacketLibrary.InPacket memory packet) external {
        IERC20TokenBridge(erc20Bridge).consume(packet);
        require(packet.destination.addr == address(this),"Packet not intended for this Token Service");
        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        require(isSupportedToken(tokenAddress), "Token not supported");
        if(isBlackListed(receiver)) {
            IERC20(tokenAddress).transfer(address(holding), packet.message.amount);
            holding.lock(receiver, tokenAddress, packet.message.amount);
        }else {
            IERC20(tokenAddress).transfer(receiver, packet.message.amount);
        }
    }
}