// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {TokenServiceV2} from "../../main/tokenservice/TokenServiceV2.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {PredicateService} from "../../main/tokenservice/predicate/PredicateService.sol";
import {IBlackListService} from "../../common/interface/tokenservice/IBlackListService.sol";
import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";
import {FeeCollector} from "./FeeCollector.sol";


/// @title TokenServiceV2 Contract
/// @dev Inherits TokenService and PredicateService for predicate-based authorization
contract TokenServiceV3 is TokenServiceV2 {
    using SafeERC20 for IIERC20;

    event PlatformFeesPaid(address indexed tokenAddress, uint256 amount);

    function setFeeCollector(
        FeeCollector _feeCollector
    ) external virtual onlyOwner {
        feeCollector = _feeCollector;
    }

    function setBlackListService(
        IBlackListService _blackListService
    ) external virtual onlyOwner {
        require(address(_blackListService) != address(0), "TokenService: BlackListServiceCannotBeZero");
        require(address(blackListService) != address(_blackListService), "TokenService: BlackListServiceCannotBeSameAsCurrent");
        blackListService = _blackListService;
    }

    function _packetify(
        uint256 version,
        address tokenAddress,
        uint256 amount,
        string memory receiver
    ) internal view virtual returns (PacketLibrary.OutPacket memory packet) {
        packet = _packetify(tokenAddress, amount, receiver);
        packet.version = version;
    }

    function privateTransfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        bool isRelayerOn,
        bytes calldata data
    ) public virtual whenNotPaused nonReentrant {
        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PRIVATE_TRANSFER_RELAYER : PacketLibrary.VERSION_PRIVATE_TRANSFER;
        _transfer(tokenAddress, amount, receiver, version, data);
    }

    function privateTransfer(
        string memory receiver,
        bool isRelayerOn,
        bytes calldata data
    ) public payable virtual whenNotPaused nonReentrant {
        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PRIVATE_TRANSFER_RELAYER : PacketLibrary.VERSION_PRIVATE_TRANSFER;
        _transfer(receiver, version, data);
    }

    function privateTransfer(
        string memory receiver,
        PredicateMessage calldata predicateMessage,
        bool isRelayerOn,
        bytes calldata data
    )public payable virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            receiver,
            predicateMessage,
            msg.sender,
            msg.value),
            "TokenService: unauthorizedFromPredicate");

        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PRIVATE_TRANSFER_PREDICATE_RELAYER : PacketLibrary.VERSION_PRIVATE_TRANSFER_PREDICATE;
        _transfer(receiver, version, data);
    }

    function privateTransfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        PredicateMessage calldata predicateMessage,
        bool isRelayerOn,
        bytes calldata data
    ) external virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            tokenAddress,
            amount,
            receiver,
            predicateMessage,
            msg.sender,
            0
        ), "TokenService: unauthorizedFromPredicate");

        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PRIVATE_TRANSFER_PREDICATE_RELAYER : PacketLibrary.VERSION_PRIVATE_TRANSFER_PREDICATE;
        _transfer(tokenAddress, amount, receiver, version, data);
    }

    /// @notice Transfers ETH without predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    function transfer(
        string memory receiver,
        bool isRelayerOn,
        bytes calldata data
    ) public payable virtual whenNotPaused nonReentrant {
        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PUBLIC_TRANSFER_RELAYER : PacketLibrary.VERSION_PUBLIC_TRANSFER;
        // Perform ETH transfer
        _transfer(receiver, version, data);
    }

    /// @notice Transfers ERC20 tokens without predicate authorization
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the transferred tokens
    function transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        bool isRelayerOn,
        bytes calldata data
    ) public virtual whenNotPaused nonReentrant {
        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PUBLIC_TRANSFER_RELAYER : PacketLibrary.VERSION_PUBLIC_TRANSFER;
        // Perform ERC20 token transfer
        _transfer(tokenAddress, amount, receiver, version, data);
    }

    /// @notice Transfers ETH with predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    /// @param predicateMessage Predicate authorization message
    function transfer(
        string calldata receiver,
        PredicateMessage calldata predicateMessage,
        bool isRelayerOn,
        bytes calldata data
    ) public payable virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            receiver, 
            predicateMessage, 
            msg.sender, 
            msg.value),
            "TokenService: unauthorizedFromPredicate") ;
        
        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_RELAYER : PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE;

        // Perform ETH transfer
        _transfer(receiver, version, data);
    }

    /// @notice Transfers ERC20 tokens with predicate authorization
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the transferred tokens
    /// @param predicateMessage Predicate authorization message
    function transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        PredicateMessage calldata predicateMessage,
        bool isRelayerOn,
        bytes calldata data
    ) external virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            tokenAddress,
            amount,
            receiver,
            predicateMessage,
            msg.sender,
            0
        ), "TokenService: unauthorizedFromPredicate");

        uint256 version = isRelayerOn ? PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_RELAYER : PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE;

        // Perform ERC20 token transfer
        _transfer(tokenAddress, amount, receiver, version, data);
    }

    /// @notice Internal function to handle fee calculations and transfers
    /// @param tokenAddress The address of the token
    /// @param amount The total amount to calculate fees from
    /// @param version The version number to determine fee type
    /// @return amountToTransfer The amount remaining after fees
    function _handleFees(
        address tokenAddress,
        uint256 amount,
        uint256 version
    ) internal virtual returns (uint256 amountToTransfer) {
        require(amount > 0, "TokenService: notEnoughAmount");
        uint256 payingFees = 0;

        if (version > 10) {
            payingFees = (feeCollector.privatePlatformFees(tokenAddress) * amount) / 100000;
        } else {
            payingFees = (feeCollector.platformFees(tokenAddress) * amount) / 100000;
        }

        if (payingFees > 0) {
            if(tokenAddress == ETH_TOKEN){
                collectedFees[ETH_TOKEN] += payingFees;
                (bool sent, ) = payable(address(feeCollector)).call{value: payingFees}("");
                require(sent, "TokenService: feesTransferFailed");
                emit PlatformFeesPaid(ETH_TOKEN, payingFees);
            }else{
            collectedFees[tokenAddress] += payingFees;
            IIERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                address(feeCollector),
                payingFees
            );
                emit PlatformFeesPaid(tokenAddress, payingFees);
            }
        }

        amountToTransfer = amount - payingFees;
    }

    /// @notice Internal function to handle ETH transfers
    /// @param receiver The intended receiver of the ETH
    function _transfer(string memory receiver, uint256 version, bytes memory data) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "TokenService: InvalidReceiverAddress"
        );

        uint256 amountToTransfer = _handleFees(address(1), msg.value, version);

        erc20Bridge.sendMessage(_packetify(version, ETH_TOKEN, amountToTransfer, receiver), data);
    }

    /// @notice Internal function to handle ERC20 transfers
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the tokens
    function _transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        uint256 version,
        bytes memory data
    ) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "TokenService: InvalidReceiverAddress"
        );
        require(tokenAddress != ETH_TOKEN, "TokenService: ethNotAllowed");

        uint256 amountToTransfer = _handleFees(tokenAddress, amount, version);

        IIERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amountToTransfer
        );

        erc20Bridge.sendMessage(_packetify(version, tokenAddress, amountToTransfer, receiver), data);
    }

    /// @notice Transfers ERC20 tokens to the destination chain via the bridge
    /// @param packet incoming packet containing information to withdraw
    /// @param signatures arrays of signature of attestor
    function withdraw(
        PacketLibrary.InPacket memory packet,
        bytes memory signatures
    ) external virtual nonReentrant whenNotPaused {
        require(
            packet.destTokenService.addr == address(this),
            "TokenService: invalidDestTokenService"
        );

        require(destChainId == packet.sourceTokenService.chainId, "TokenService: invalidSourceChainId");
        require(self.chainId == packet.destTokenService.chainId, "TokenService: invalidDestChainId");

        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        uint256 amount = packet.message.amount;

        require(isEnabledToken(tokenAddress), "TokenService: invalidToken");
        require(amount > 0, "TokenService: invalidAmount");
         require(
            keccak256(abi.encodePacked(packet.sourceTokenService.addr)) == 
            keccak256(abi.encodePacked(supportedTokens[tokenAddress].destTokenService)),
            "TokenService: invalidSourceTokenService"
        );  

        PacketLibrary.Vote quorum = erc20Bridge.consume(packet, signatures);

        if (
            PacketLibrary.Vote.NAY == quorum ||
            blackListService.isBlackListed(receiver)
        ) {
            if (tokenAddress == ETH_TOKEN) {
                holding.lock{value: amount}(receiver);
            } else {
                IIERC20(tokenAddress).safeTransfer(address(holding), amount);
                holding.lock(receiver, tokenAddress, amount);
            }
        } else if (quorum == PacketLibrary.Vote.YEA) {
            if (tokenAddress == ETH_TOKEN) {
                bool sent;
                (sent, ) = payable(receiver).call{value: amount}("");
                require(sent, "TokenService: ethWithdrawFailed");
            } else {
                IIERC20(tokenAddress).safeTransfer(receiver, amount);
            }
        } else {
            revert("TokenService: insufficientQuorum");
        }
    }


    FeeCollector public feeCollector;
    mapping(address => uint256) public collectedFees;
 
    uint256[44] private __gap;

    
}
