// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@thirdweb-dev/contracts/extension/Initializable.sol";
import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import {BlackListService} from "./base/tokenservice/BlackListService.sol";
import {ERC20TokenSupport} from "./base/tokenservice/ERC20TokenSupport.sol";
import {IERC20TokenBridge} from "./common/interface/bridge/IERC20TokenBridge.sol";
import {IERC20} from "./common/interface/tokenservice/IERC20.sol";
import {Holding} from "./HoldingContract.sol";
import "./common/libraries/Lib.sol";
import {Ownable} from "./common/Ownable.sol";

contract ERC20TokenService is Ownable, BlackListService, 
    ERC20TokenSupport, 
    Initializable,
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

    function _packetify(address tokenAddress, uint256 amount, string memory receiver, uint256 destChainId) 
        private returns (PacketLibrary.OutPacket memory packet){
        require(!isBlackListed(msg.sender), "Sender Blacklisted");
        require(isEnabledToken(tokenAddress,destChainId), "Token not supported");
        require(isAmountInRange(tokenAddress, amount), "Transfer amount not in range");

        PacketLibrary.OutTokenMessage memory message = PacketLibrary.OutTokenMessage(
            msg.sender,
            supportedTokens[tokenAddress].destTokenAddress.addr, 
            amount, 
            receiver
        );

        // PacketLibrary.OutPacket memory packet ;
        packet.sourceTokenService = self;
        packet.destTokenService = supportedTokens[tokenAddress].destTokenService;
        packet.message = message;
        packet.height = block.number;

        return packet;
    }

    function transfer(string memory receiver, uint256 destChainId) external payable {
        PacketLibrary.OutPacket memory packet = _packetify(address(0), msg.value, receiver, destChainId);
        IERC20TokenBridge(erc20Bridge).sendMessage(packet);
    }

    function transfer(address tokenAddress, uint256 amount, string memory receiver, uint256 destChainId) external {
        require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount), "ETH Transfer Failed");

        PacketLibrary.OutPacket memory packet = _packetify(tokenAddress, amount, receiver, destChainId); 
        IERC20TokenBridge(erc20Bridge).sendMessage(packet);
    }

    function withdraw(PacketLibrary.InPacket memory packet) external {
        PacketLibrary.Vote quorum = IERC20TokenBridge(erc20Bridge).consume(packet);
        require(packet.destTokenService.addr == address(this),"Packet not for this Token Service");
        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        uint256 amount = packet.message.amount;
        require(isEnabledToken(tokenAddress, packet.sourceTokenService.chainId), "Token either disabled or not supported");
        if(isBlackListed(receiver) || quorum == PacketLibrary.Vote.NAY) {
            if(tokenAddress == address(0)) {
                // eth lock
                holding.lockETH{value:amount}(receiver, tokenAddress, amount);
            }else {
                IERC20(tokenAddress).transfer(address(holding), amount);
                holding.lock(receiver, tokenAddress, amount);
            }
        }else {
            if(tokenAddress == address(0)) {
                // eth transfer
                (bool sent, bytes memory data) = receiver.call{value: amount}("");
                require(sent, "ETH Transfer Failed");
            }else {
                require(IERC20(tokenAddress).transfer(receiver, amount), "Withdraw Failed");
            }  
        }
    }
}