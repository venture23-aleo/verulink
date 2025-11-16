// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IBridge} from "../../common/interface/bridge/IBridge.sol";
import {IBlackListService} from "../../common/interface/tokenservice/IBlackListService.sol";
import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";
import {Pausable} from "../../common/Pausable.sol";
import {TokenSupport} from "../../base/tokenservice/TokenSupport.sol";
import {Holding} from "../Holding.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TokenService Contract
/// @dev This contract implements OwnableUpgradeable, Pausable, TokenSupport, ReentrancyGuardUpgradeable, and Upgradeable contracts.
contract TokenService is
    OwnableUpgradeable,
    Pausable,
    TokenSupport,
    ReentrancyGuardUpgradeable,
    Upgradeable
{
    using SafeERC20 for IIERC20;

    // VerulinkPredicate verulinkpredicate;

    /// @dev immutable Address of Eth
    address immutable ETH_TOKEN = address(1);

    /// @dev Address of the Bridge contract
    IBridge erc20Bridge;

    /// @dev Address of the BlackListService contract
    IBlackListService blackListService;

    /// @dev Address of the Holding contract
    Holding holding;

    /// @dev Information about the token service's network address
    PacketLibrary.InNetworkAddress public self;


    /// @dev Initializes the TokenService contract
    /// @param bridge Address of the bridge contract
    /// @param _chainId Chain ID of the token service
    /// @param _destChainId Chain ID of the destination network
    /// @param _blackListService Address of the BlackListService contract
    function TokenService_init(
        address bridge,
        address _owner,
        uint256 _chainId,
        uint256 _destChainId,
        address _blackListService
    ) public virtual initializer {
        __Ownable_init_unchained();
        __TokenSupport_init_unchained(_destChainId);
        __Pausable_init_unchained();
        __ReentrancyGuard_init_unchained();
        erc20Bridge = IBridge(bridge);
        self = PacketLibrary.InNetworkAddress(_chainId, address(this));
        blackListService = IBlackListService(_blackListService);
        _transferOwnership(_owner);
    }

    receive() external virtual payable onlyOwner {}

    /// @dev Authorizes an upgrade only if the caller is the owner
    function _authorizeUpgrade(address) internal view virtual override {
        require(msg.sender == owner());
    }

    /// @notice Returns the type of token managed by the TokenService
    /// @return string representation of the token type ("ERC20")
    function tokenType() public pure virtual returns (string memory) {
        return "ERC20";
    }

    /// @notice Sets the Holding contract for token locking, callable by owner only
    /// @param _holding Address of the Holding contract
    function setHolding(Holding _holding) external virtual onlyOwner {
        holding = _holding;
    }

    /// @notice Transfers ETH to the vault and locks it in the Holding contract
    /// @param token  Address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    function transferToVault(
        address token,
        uint256 amount
    ) external virtual onlyOwner nonReentrant {
        require(isEnabledToken(token), "TokenService: token not supported");
        address vault = supportedTokens[token].vault;
        require(vault != address(0), "TokenService: vault zero address");
        if (token == ETH_TOKEN) {
            (bool sent, ) = payable(vault).call{value: amount}("");
            require(sent, "TokenService: eth transfer failed");
        } else {
            IIERC20(token).safeTransfer(vault, amount);
        }
    }

    /// @dev Creates an OutPacket representation of the transaction details
    /// @param tokenAddress Address of the ERC20 token (or address(0) for ETH)
    /// @param amount Amount of tokens or ETH to be transferred
    /// @param receiver The intended receiver of the transferred tokens or ETH
    /// @return packet representation of the transaction
    function _packetify(
        address tokenAddress,
        uint256 amount,
        string memory receiver
    ) internal view virtual returns (PacketLibrary.OutPacket memory packet) {
        require(
            !blackListService.isBlackListed(msg.sender),
            "TokenService: sender blacklisted"
        );
        require(
            isEnabledToken(tokenAddress),
            "TokenService: token not supported"
        );
        require(
            isAmountInRange(tokenAddress, amount),
            "TokenService: amount out of range"
        );

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
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}