// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {TokenServiceV2} from "../../main/tokenservice/TokenServiceV2.sol";
import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";

import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {PredicateService} from "../../main/tokenservice/predicate/PredicateService.sol";

import {FeeCollector} from "./FeeCollector.sol";

import "hardhat/console.sol";


/// @title TokenServiceV2 Contract
/// @dev Inherits TokenService and PredicateService for predicate-based authorization
contract TokenServiceV3 is TokenServiceV2 {
    using SafeERC20 for IIERC20;

    function setFeeCollector(
        FeeCollector _feeCollector
    ) external virtual onlyOwner {
        feeCollector = _feeCollector;
    }

    function _packetify(
        uint256 version,
        address tokenAddress,
        uint256 amount,
        string memory receiver
    ) internal view virtual returns (PacketLibrary.OutPacket memory packet) {
        packet = _packetify(tokenAddress, amount, receiver);
        packet.version = version;
        console.log("Versions: %s", version);
    }

    function privateTransfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver
    ) public virtual whenNotPaused nonReentrant {
        _transfer(tokenAddress, amount, receiver, PacketLibrary.VERSION_PRIVATE_TRANSFER);
    }

    function privateTransfer(
        string memory receiver
    ) public payable virtual whenNotPaused nonReentrant {
        _transfer(receiver, PacketLibrary.VERSION_PRIVATE_TRANSFER);
    }

    function privateTransfer(
        string memory receiver,
        PredicateMessage calldata predicateMessage)
    public payable virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            receiver,
            predicateMessage,
            msg.sender,
            msg.value),
            "TokenService: unauthorizedFromPredicate");

        _transfer(receiver, PacketLibrary.VERSION_PRIVATE_TRANSFER_PREDICATE);
    }

    function privateTransfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        PredicateMessage calldata predicateMessage
    ) external virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            tokenAddress,
            amount,
            receiver,
            predicateMessage,
            msg.sender,
            0
        ), "TokenService: unauthorizedFromPredicate");

        _transfer(tokenAddress, amount, receiver, PacketLibrary.VERSION_PRIVATE_TRANSFER_PREDICATE);
    }

    /// @notice Transfers ETH with predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    function transfer(
        string memory receiver
    ) public payable virtual override whenNotPaused nonReentrant {
        uint256 version = (feeCollector.relayerFees(ETH_TOKEN) > 0) ? PacketLibrary.VERSION_PUBLIC_TRANSFER_EXECUTOR : PacketLibrary.VERSION_PUBLIC_TRANSFER;
        // Perform ETH transfer
        _transfer(receiver, version);
    }

    /// @notice Transfers ERC20 tokens with predicate authorization
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the transferred tokens
    function transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver
    ) public virtual override whenNotPaused nonReentrant {
        uint256 version = (feeCollector.relayerFees(tokenAddress) > 0) ? PacketLibrary.VERSION_PUBLIC_TRANSFER_EXECUTOR : PacketLibrary.VERSION_PUBLIC_TRANSFER;
        // Perform ERC20 token transfer
        _transfer(tokenAddress, amount, receiver, version);
    }

    /// @notice Transfers ETH with predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    /// @param predicateMessage Predicate authorization message
    function transfer(
        string calldata receiver,
        PredicateMessage calldata predicateMessage
    ) public payable virtual override whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            receiver, 
            predicateMessage, 
            msg.sender, 
            msg.value),
            "TokenService: unauthorizedFromPredicate") ;
        
        uint256 version = (feeCollector.relayerFees(ETH_TOKEN) > 0) ? PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTOR : PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE;

        // Perform ETH transfer
        _transfer(receiver, version);
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
        PredicateMessage calldata predicateMessage
    ) external virtual override whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            tokenAddress,
            amount,
            receiver,
            predicateMessage,
            msg.sender,
            0
        ), "TokenService: unauthorizedFromPredicate");

        uint256 version = (feeCollector.relayerFees(tokenAddress) > 0) ? PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTOR : PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE;

        // Perform ERC20 token transfer
        _transfer(tokenAddress, amount, receiver, version);
    }

    /// @notice Internal function to handle ETH transfers
    /// @param receiver The intended receiver of the ETH
    function _transfer(string memory receiver, uint256 version) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "TokenService: InvalidReceiverAddress"
        );

        require(msg.value > 0, "TokenService: TransferAmountMustBeGreaterThanZero");

        uint256 payingFees;
        if (version > 10) {
            payingFees = (feeCollector.privatePlatformFees(ETH_TOKEN)*msg.value)/100000;
        } else {
            payingFees = (feeCollector.platformFees(ETH_TOKEN)*msg.value)/100000;
        }

        if (payingFees > 0) {
            (bool sent, ) = payable(address(feeCollector)).call{value: payingFees}("");
            require(sent, "TokenService: ethFeesTransferFailed");
        }
        erc20Bridge.sendMessage(_packetify(version, ETH_TOKEN, msg.value-payingFees, receiver));
    }

    /// @notice Internal function to handle ERC20 transfers
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the tokens
    function _transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        uint256 version
    ) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "TokenService: InvalidReceiverAddress"
        );
        require(tokenAddress != ETH_TOKEN, "ETHTransferNotAllowed");

        require(amount > 0, "TokenService: TransferAmountMustBeGreaterThanZero");
        uint256 actualFees = 0;
        if (version > 10) {
            actualFees = (feeCollector.privatePlatformFees(tokenAddress) * amount) / 100000;
        } else {
            actualFees = (feeCollector.platformFees(tokenAddress)*amount) / 100000;
        }

        if (actualFees > 0) {
            IIERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                address(feeCollector),
                actualFees
            );
        }

        IIERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amount-actualFees
        );

        erc20Bridge.sendMessage(_packetify(version, tokenAddress, amount-actualFees, receiver));
    }

    /// @notice Transfers ERC20 tokens to the destination chain via the bridge
    /// @param packet incoming packet containing information to withdraw
    /// @param signatures arrays of signature of attestor
    function withdraw(
        PacketLibrary.InPacket memory packet,
        bytes memory signatures
    ) external virtual override nonReentrant whenNotPaused {
        require(
            packet.destTokenService.addr == address(this),
            "TokenService: invalidTokenService"
        );

        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        require(isEnabledToken(tokenAddress), "TokenService: invalidToken");
        
        uint256 amount = packet.message.amount;
        uint256 version = packet.version;
        uint256 feesDeductedAmount = 0;

        uint256 executorFeesAmount = feeCollector.relayerFees(tokenAddress);

        if ((version == PacketLibrary.VERSION_PRIVATE_TRANSFER_EXECUTOR || 
        version == PacketLibrary.VERSION_PUBLIC_TRANSFER_EXECUTOR || 
        version == PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTOR ) && executorFeesAmount > 0){
            require(amount > executorFeesAmount, "TokenService: FeesExceedTransferAmount");
            feesDeductedAmount = amount - executorFeesAmount;
        }else{
            feesDeductedAmount = amount;
            executorFeesAmount = 0;
        }

        PacketLibrary.Vote quorum = erc20Bridge.consume(packet, signatures);

        if (
            PacketLibrary.Vote.NAY == quorum ||
            blackListService.isBlackListed(receiver)
        ) {
            if (tokenAddress == ETH_TOKEN) {
                // eth lock
                if(executorFeesAmount > 0){
                    (bool sent, ) = payable(msg.sender).call{value: executorFeesAmount}("");
                    require(sent, "TokenService: ethFeesWithdrawFailed");
                }
                holding.lock{value: feesDeductedAmount}(receiver);
            } else {
                if(executorFeesAmount > 0){
                    IIERC20(tokenAddress).safeTransfer(address(holding), executorFeesAmount);
                }
                IIERC20(tokenAddress).safeTransfer(address(holding), feesDeductedAmount);
                holding.lock(receiver, tokenAddress, feesDeductedAmount);
            }
        } else if (quorum == PacketLibrary.Vote.YEA) {
            if (tokenAddress == ETH_TOKEN) {
                bool sent;
                // eth transfer
                if(executorFeesAmount > 0){
                    (sent, ) = payable(msg.sender).call{value: executorFeesAmount}("");
                    require(sent, "TokenService: ethFeesWithdrawFailed");
                }
                (sent, ) = payable(receiver).call{value: feesDeductedAmount}("");
                require(sent, "TokenService: ethWithdrawFailed");
            } else {
                if(executorFeesAmount > 0){
                    IIERC20(tokenAddress).safeTransfer(msg.sender, executorFeesAmount);
                }
                IIERC20(tokenAddress).safeTransfer(receiver, feesDeductedAmount);
            }
        } else {
            revert("TokenService: insufficientQuorum");
        }
    }
 
    uint256[49] private __gap;

    FeeCollector public feeCollector;
}
