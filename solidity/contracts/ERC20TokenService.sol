// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import {BlackListService} from "./abstract/tokenservice/BlackListService.sol";
import {ERC20TokenSupport} from "./abstract/tokenservice/ERC20TokenSupport.sol";
import {IERC20TokenBridge} from "./common/interface/bridge/IERC20TokenBridge.sol";
import {IERC20} from "./common/interface/tokenservice/IERC20.sol";
import {Holding} from "./HoldingContract.sol";
import "./common/libraries/Lib.sol";
import {Ownable} from "./common/Ownable.sol";

contract ERC20TokenService is Ownable, BlackListService, 
    ERC20TokenSupport, 
    Upgradeable 
{
    address erc20Bridge;
    Holding holding;
    PacketLibrary.InNetworkAddress public self;

    function initialize(address bridge, 
        uint256 _chainId, 
        address _usdc, 
        address _usdt,
        address _owner
    ) public initializer {
        erc20Bridge = bridge;
        self = PacketLibrary.InNetworkAddress(
            _chainId, 
            address(this)
        );
        BlackListService.initialize(_owner, _usdc, _usdt);
    }

    function tokenType() public pure returns (string memory) {
        return "ERC20";
    }

    function _authorizeUpgrade(address) internal view override {
        msg.sender == owner;
    }

    function setHolding(Holding _holding) public onlyOwner {
        holding = _holding;
    }

    function transfer(address tokenAddress, uint256 amount, string memory receiver, uint256 destChainId) external {
        require(!isBlackListed(msg.sender), "Sender Blacklisted");
        require(isEnabledToken(tokenAddress,destChainId), "Token either disabled or not supported");

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);

        PacketLibrary.OutTokenMessage memory message = PacketLibrary.OutTokenMessage(
            msg.sender,
            supportedTokens[tokenAddress][destChainId].destTokenAddress.addr, 
            amount, 
            receiver
        );

        PacketLibrary.OutPacket memory packet ;
        packet.sourceTokenService = self;
        packet.destTokenService = supportedTokens[tokenAddress][destChainId].destTokenService;
        packet.message = message;
        packet.height = block.number;

        IERC20TokenBridge(erc20Bridge).sendMessage(packet);
    }

    function withdraw(PacketLibrary.InPacket memory packet) external {
        IERC20TokenBridge(erc20Bridge).consume(packet);
        require(packet.destTokenService.addr == address(this),"Packet not intended for this Token Service");
        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        require(isEnabledToken(tokenAddress, packet.sourceTokenService.chainId), "Token either disabled or not supported");
        if(isBlackListed(receiver)) {
            IERC20(tokenAddress).transfer(address(holding), packet.message.amount);
            holding.lock(receiver, tokenAddress, packet.message.amount);
        }else {
            IERC20(tokenAddress).transfer(receiver, packet.message.amount);
        }
    }
}