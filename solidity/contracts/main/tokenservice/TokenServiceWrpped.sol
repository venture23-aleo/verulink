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
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TokenServiceWrapped Contract
/// @dev This contract implements OwnableUpgradeable, Pausable, TokenSupport, ReentrancyGuardUpgradeable, and Upgradeable contracts.
contract TokenServiceWrapped is
    OwnableUpgradeable,
    Pausable,
    TokenSupport,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IIERC20;

    /// @dev Address of the Bridge contract
    IBridge public erc20Bridge;

    /// @dev Address of the BlackListService contract
    IBlackListService public blackListService;

    /// @dev Address of the Holding contract
    Holding public holding;

    /// @dev Information about the token service's network address
    PacketLibrary.InNetworkAddress public self;

    constructor() {
        _disableInitializers();
    }

    /// @dev Initializes the TokenService contract
    /// @param _bridge Address of the bridge contract
    /// @param _owner Address of the contract owner
    /// @param _chainId Chain ID of the token service
    /// @param _destChainId Chain ID of the destination network
    /// @param _blackListService Address of the BlackListService contract
    function initialize(
        address _bridge,
        address _owner,
        uint256 _chainId,
        uint256 _destChainId,
        address _blackListService
    ) public initializer {
        require(_bridge != address(0), "TokenService: bridge zero address");
        require(_owner != address(0), "TokenService: owner zero address");
        require(_blackListService != address(0), "TokenService: blacklist zero address");
        require(_chainId != 0, "TokenService: invalid chain id");
        require(_destChainId != 0, "TokenService: invalid dest chain id");

        __Ownable_init();
        __ReentrancyGuard_init();
        
        erc20Bridge = IBridge(_bridge);
        self = PacketLibrary.InNetworkAddress(_chainId, address(this));
        destChainId = _destChainId;
        blackListService = IBlackListService(_blackListService);
        _transferOwnership(_owner);
    }

    /// @notice Returns the type of token managed by the TokenService
    /// @return string representation of the token type ("ERC20")
    function tokenType() public pure virtual returns (string memory) {
        return "ERC20";
    }

    /// @notice Sets the Holding contract for token locking, callable by owner only
    /// @param _holding Address of the Holding contract
    function setHolding(Holding _holding) external virtual onlyOwner {
        require(address(_holding) != address(0), "TokenService: holdingZeroAddress");
        require(address(holding) != address(_holding), "TokenService: SameAsCurrentHoldingAddress");
        holding = _holding;
    }

    /// @notice Updates the bridge contract address
    /// @param _bridge New bridge contract address
    function setBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "TokenService: bridgeZeroAddress");
        require(address(erc20Bridge) != address(_bridge), "TokenService: SameAsCurrentBridgeAddress");
        erc20Bridge = IBridge(_bridge);
    }

    /// @notice Updates the blacklist service address
    /// @param _blackListService New blacklist service address
    function setBlackListService(address _blackListService) external onlyOwner {
        require(_blackListService != address(0), "TokenService: blacklistZeroAddress");
        require(address(blackListService) != address(_blackListService), "TokenService: SameAsCurrentBlacklistAddress");
        blackListService = IBlackListService(_blackListService);
    }

    /// @notice Transfers tokens to the vault
    /// @param token Address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    function transferToVault(
        address token,
        uint256 amount
    ) external virtual onlyOwner nonReentrant {
        require(isEnabledToken(token), "TokenService: token not supported");
        address vault = supportedTokens[token].vault;
        require(vault != address(0), "TokenService: vault zero address");
        require(amount > 0, "TokenService: invalid amount");
        IIERC20(token).safeTransfer(vault, amount);
    }

    /// @dev Creates an OutPacket representation of the transaction details
    /// @param version Protocol version
    /// @param tokenAddress Address of the ERC20 token (or address(0) for ETH)
    /// @param amount Amount of tokens or ETH to be transferred
    /// @param receiver The intended receiver of the transferred tokens or ETH
    /// @return packet representation of the transaction
    function _packetify(
        uint256 version,
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
        require(self.addr == address(this), "TokenService: selfAddressMismatch");
        require(
            isAmountInRange(tokenAddress, amount),
            "TokenService: amount out of range"
        );
        require(bytes(receiver).length > 0, "TokenService: empty receiver");

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
        packet.version = version;
    }

    /// @notice Processes incoming token transfers from other chains
    /// @param packet The incoming packet with transfer details
    /// @param signatures Validator signatures for the packet
    function tokenReceive(
        PacketLibrary.InPacket memory packet,
        bytes memory signatures
    ) external virtual nonReentrant whenNotPaused {
        require(
            packet.destTokenService.addr == address(this),
            "TokenService: invalid dest token service"
        );

        require(destChainId == packet.sourceTokenService.chainId, "TokenService: invalidSourceChainId");

        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        uint256 amount = packet.message.amount;

        require(isEnabledToken(tokenAddress), "TokenService: invalid token");
        require(
            keccak256(bytes(packet.sourceTokenService.addr)) == keccak256(bytes(supportedTokens[tokenAddress].destTokenService)),
            "TokenService: invalid source token service"
        );
        require(amount > 0, "TokenService: invalid amount");

        PacketLibrary.Vote quorum = erc20Bridge.consume(packet, signatures);

        if (
            PacketLibrary.Vote.NAY == quorum ||
            blackListService.isBlackListed(receiver)
        ) {
            require(address(holding) != address(0), "TokenService: holding not set");
            IIERC20(tokenAddress).safeTransfer(address(holding), amount);
            holding.lock(receiver, tokenAddress, amount);
        } else if (quorum == PacketLibrary.Vote.YEA) {
            IIERC20(tokenAddress).safeTransfer(receiver, amount);
        } else {
            revert("TokenService: insufficient quorum");
        }
    }

    /// @notice Sends tokens to another chain
    /// @param version Protocol version
    /// @param tokenAddress Address of the token to send
    /// @param amount Amount of tokens to send
    /// @param receiver Receiver address on the destination chain
    function tokenSend(
        uint256 version,
        address tokenAddress,
        uint256 amount,
        string memory receiver
    ) external virtual nonReentrant whenNotPaused {
        require(amount > 0, "TokenService: invalid amount");
        require(bytes(receiver).length > 0, "TokenService: empty receiver");
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "TokenService: invalid receiver address"
        );

        IIERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        PacketLibrary.OutPacket memory packet = _packetify(
            version,
            tokenAddress,
            amount,
            receiver
        );

        erc20Bridge.sendMessage(packet, "");
    }

    /// @notice Internal function to handle fee calculations and transfers
    /// @param tokenAddress The address of the token
    /// @param amount The total amount to calculate fees from
    /// @return amountToTransfer The amount remaining after fees
    function _handleFees(
        address tokenAddress,
        uint256 amount
    ) internal virtual returns (uint256 amountToTransfer) {
        require(amount > 0, "TokenService: notEnoughAmount");
        uint256 payingFees = (feeCollector.platformFees(tokenAddress) * amount) / 100000;

        if (payingFees > 0) {
            collectedFees[tokenAddress] += payingFees;
            IIERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                address(feeCollector),
                payingFees
            );
                emit PlatformFeesPaid(tokenAddress, payingFees);
            }
        amountToTransfer = amount - payingFees;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap; // Reduced to account for new state variables
}