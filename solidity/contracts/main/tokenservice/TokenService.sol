// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IBridge} from "../../common/interface/bridge/IBridge.sol";
import {Pausable} from "../../common/Pausable.sol";
import {TokenSupport} from "../../base/tokenservice/TokenSupport.sol";
import {IBlackListService} from "../../common/interface/tokenservice/IBlackListService.sol";
import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";
import {Holding} from "../Holding.sol";
import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {Initializable} from "@thirdweb-dev/contracts/extension/Initializable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract TokenService is 
    Pausable,
    TokenSupport, 
    Initializable,
    Upgradeable
{
    IBridge erc20Bridge;
    IBlackListService blackListService;
    Holding holding;
    PacketLibrary.InNetworkAddress public self;

    function initialize(
        address bridge, 
        uint256 _chainId,
        uint256 _destChainId,
        address _owner,
        address _blackListService
    ) public virtual initializer {
        super._initialize(_owner, _destChainId);
        erc20Bridge = IBridge(bridge);
        self = PacketLibrary.InNetworkAddress(
            _chainId, 
            address(this)
        );
        blackListService = IBlackListService(_blackListService);
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == _owner_);
    }

    function tokenType() public pure returns (string memory) {
        return "ERC20";
    }

    function setHolding(Holding _holding) public onlyOwner {
        holding = _holding;
    }

    function transferToVault(address token, uint256 amount) public onlyOwner {
        require(isEnabledToken(token), "Token not supported");
        address vault = address(supportedTokens[token].vault);
        if(token == address(0)) {
            (bool sent,) = vault.call{value: amount}("");
            require(sent, "ETH Transfer Failed");
        }else {
            require(IIERC20(token).transfer(vault, amount), "ERC20 Transfer Failed");
        }
    }

    function _packetify(address tokenAddress, uint256 amount, string memory receiver) 
        internal view returns (PacketLibrary.OutPacket memory packet)
    {
        require(!blackListService.isBlackListed(msg.sender), "Sender Blacklisted");
        require(isEnabledToken(tokenAddress), "Token not supported");
        require(isAmountInRange(tokenAddress, amount), "Amount out of range");

        packet.sourceTokenService = self;
        packet.destTokenService = PacketLibrary.OutNetworkAddress(
            destChainId,
            supportedTokens[tokenAddress].destTokenService
        );
        packet.message = PacketLibrary.OutTokenMessage(
            msg.sender,
            supportedTokens[tokenAddress].destTokenAddress, 
            amount, 
            receiver
        );
        packet.height = block.number;

        return packet;
    }

    function transfer(string memory receiver) external whenNotPaused onlyProxy payable {
        erc20Bridge.sendMessage(_packetify(address(0), msg.value, receiver));
    }

    function transfer(address tokenAddress, uint256 amount, string memory receiver) external whenNotPaused onlyProxy {
        require(tokenAddress != address(0), "Only ERC20 Tokens");
        require(IIERC20(tokenAddress).transferFrom(msg.sender, address(this), amount), "Tokens Transfer Failed");
        erc20Bridge.sendMessage(_packetify(tokenAddress, amount, receiver));
    }

    function withdraw(PacketLibrary.InPacket memory packet, bytes[] memory sigs) external whenNotPaused onlyProxy {
        require(packet.destTokenService.addr == address(this),"Invalid Token Service");
        
        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        uint256 amount = packet.message.amount;

        require(isEnabledToken(tokenAddress), "Invalid Token");
        PacketLibrary.Vote quorum = erc20Bridge.consume(packet, sigs);

        if(PacketLibrary.Vote.NAY == quorum || blackListService.isBlackListed(receiver)) {
            if(tokenAddress == address(0)) {
                // eth lock
                holding.lock{value:amount}(receiver);
            }else {
                require(IIERC20(tokenAddress).transfer(address(holding), amount),"Token transfer failed");
                holding.lock(receiver, tokenAddress, amount);
            }
        }else if(quorum == PacketLibrary.Vote.YEA){
            if(tokenAddress == address(0)) {
                // eth transfer
                (bool sent,) = receiver.call{value: amount}("");
                require(sent, "ETH Withdraw Failed");
            }else {
                require(IIERC20(tokenAddress).transfer(receiver, amount), "Withdraw Failed");
            }  
        }else {
            revert("Insufficient Quorum");
        }
    }
}