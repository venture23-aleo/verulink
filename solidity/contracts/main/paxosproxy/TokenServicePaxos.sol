// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {TokenServiceV2} from "../../main/tokenservice/TokenServiceV2.sol";
import {FeeCollector} from "../tokenservice/FeeCollector.sol";
import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {ITellerWithMultiAssetSupport} from "../../common/interface/paxos/ITellerWithMultiAssetSupport.sol";
import {console} from "hardhat/console.sol";

contract TokenServicePaxos is TokenServiceV2 {
    using SafeERC20 for IIERC20;

    FeeCollector public feeCollector;
    mapping(address => uint256) public collectedFees;

    ITellerWithMultiAssetSupport public teller;

    address public bridgeToken;

    event PlatformFeesPaid(address indexed tokenAddress, uint256 amount);

    function setTeller(address _teller) external virtual onlyOwner {
        teller = ITellerWithMultiAssetSupport(_teller);
    }

    function setBridgeToken(address _token) external virtual onlyOwner {
        bridgeToken = _token;
    }

    function setFeeCollector(FeeCollector _feeCollector) external virtual onlyOwner {
        feeCollector = _feeCollector;
    }

    function _packetify(uint256 version, address tokenAddress, uint256 amount, string memory receiver)
        internal
        view
        virtual
        returns (PacketLibrary.OutPacket memory packet)
    {
        packet = _packetify(tokenAddress, amount, receiver);
        packet.version = version;
    }

    /// @notice Internal function to handle fee calculations and transfers
    /// @param tokenAddress The address of the token
    /// @param amount The total amount to calculate fees from
    /// @param version The version number to determine fee type
    /// @return amountToTransfer The amount remaining after fees
    function _handleFees(address tokenAddress, uint256 amount, uint256 version)
        internal
        virtual
        returns (uint256 amountToTransfer)
    {
        require(amount > 0, "TokenService: notEnoughAmount");
        uint256 payingFees = 0;

        if (version > 10) {
            payingFees = (feeCollector.privatePlatformFees(tokenAddress) * amount) / 100000;
        } else {
            payingFees = (feeCollector.platformFees(tokenAddress) * amount) / 100000;
        }

        if (payingFees > 0) {
            if (tokenAddress == ETH_TOKEN) {
                collectedFees[ETH_TOKEN] += payingFees;
                (bool sent,) = payable(address(feeCollector)).call{value: payingFees}("");
                require(sent, "TokenService: feesTransferFailed");
                emit PlatformFeesPaid(ETH_TOKEN, payingFees);
            } else {
                collectedFees[tokenAddress] += payingFees;
                IIERC20(tokenAddress).safeTransfer(address(feeCollector), payingFees);
                emit PlatformFeesPaid(tokenAddress, payingFees);
            }
        }

        amountToTransfer = amount - payingFees;
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
        require(erc20Bridge.validateAleoAddress(receiver), "TokenService: InvalidReceiverAddress");
        require(tokenAddress != ETH_TOKEN, "TokenService: ethNotAllowed");

        uint256 amountToTransfer = _handleFees(tokenAddress, amount, version);

        IIERC20(tokenAddress).safeTransfer(address(this), amountToTransfer);

        erc20Bridge.sendMessage(_packetify(version, tokenAddress, amountToTransfer, receiver), data);
    }

    /// @notice Transfers ERC20 tokens with predicate authorization. The user submits the borinng vault supported token.
    /// The token is deposited in the boring vault contract and the contract receives aleoUSD token which is bridged to the
    /// Aleo chain.
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
        bytes calldata data,
        address depositAsset,
        uint256 minimumShares
    ) external virtual whenNotPaused nonReentrant {
        //Pull funds from user and deposit into teller
        // FIX #01: CRITICAL - Enforce that tokenAddress must be aleoUSD
        require(tokenAddress == aleoUSD, "TokenService: tokenAddress must be aleoUSD");
        require(depositAsset != address(0) && teller.isSupported(depositAsset), "TokenService: invalidAsset");
        require(amount > 0, "TokenService: amountZero");

        IIERC20 depositToken = IIERC20(depositAsset);
        console.log("We're here ~~~~~~~~~~~~~~~~~~~~~~~~~~");
        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        depositToken.safeIncreaseAllowance(bridgeToken, amount);
        uint256 sharesMinted = teller.deposit(depositAsset, amount, minimumShares);
        depositToken.safeApprove(address(teller), 0);
        console.log("shared minted:", sharesMinted);
        console.log("Address thois", address(this));
        // Handle predicate message
        require(
            predicateservice.handleMessage(tokenAddress, amount, receiver, predicateMessage, msg.sender, 0),
            "TokenService: unauthorizedFromPredicate"
        );
        uint256 version = isRelayerOn
            ? PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_RELAYER
            : PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE;

        // Perform ERC20 token transfer
        _transfer(tokenAddress, sharesMinted, receiver, version, data);
    }

    /// @notice Transfers ERC20 tokens to the destination chain via the bridge
    /// @param packet incoming packet containing information to withdraw
    /// @param signatures arrays of signature of attestor
    function withdraw(
        PacketLibrary.InPacket memory packet,
        bytes memory signatures,
        address withdrawAsset,
        uint256 minimumAssets
    ) external virtual nonReentrant whenNotPaused {
        require(packet.destTokenService.addr == address(this), "TokenService: invalidToken");

        address receiver = packet.message.receiverAddress;
        address tokenAddress = packet.message.destTokenAddress;
        require(isEnabledToken(tokenAddress), "TokenService: invalidToken");

        uint256 amount = packet.message.amount;
        // uint256 version = packet.version;
        // uint256 feesDeductedAmount = amount;
        // uint256 relayerFeeAmount = 0;
        // bool isRelayerPacket = false;

        // if (version == PacketLibrary.VERSION_PUBLIC_TRANSFER_RELAYER ||
        //     version == PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_RELAYER) {
        //     isRelayerPacket = true;
        //     relayerFeeAmount = feeCollector.relayerFees(tokenAddress);
        // } else if (version == PacketLibrary.VERSION_PRIVATE_TRANSFER_RELAYER ||
        // version == PacketLibrary.VERSION_PRIVATE_TRANSFER_PREDICATE_RELAYER) {
        //     isRelayerPacket = true;
        //     relayerFeeAmount = feeCollector.privateRelayerFees(tokenAddress);
        // }

        // if (isRelayerPacket && relayerFeeAmount > 0) {
        //     require(amount > relayerFeeAmount, "TokenService: feesNotEnough");
        //     feesDeductedAmount = amount - relayerFeeAmount;
        // } else {
        //     feesDeductedAmount = amount;
        //     relayerFeeAmount = 0;
        // }

        PacketLibrary.Vote quorum = erc20Bridge.consume(packet, signatures);

        if (PacketLibrary.Vote.NAY == quorum || blackListService.isBlackListed(receiver)) {
            if (tokenAddress == ETH_TOKEN) {
                // eth lock
                // if(relayerFeeAmount > 0){
                //     (bool sent, ) = payable(msg.sender).call{value: relayerFeeAmount}("");
                //     require(sent, "TokenService: feesTransferFailed");
                //     emit FeePaid(ETH_TOKEN, relayerFeeAmount, true);
                // }
                holding.lock{value: amount}(receiver);
            } else {
                // if(relayerFeeAmount > 0){
                //     IIERC20(tokenAddress).safeTransfer(msg.sender, relayerFeeAmount);
                // }
                IIERC20(tokenAddress).safeTransfer(address(holding), amount);
                holding.lock(receiver, tokenAddress, amount);
            }
        } else if (quorum == PacketLibrary.Vote.YEA) {
            if (tokenAddress == ETH_TOKEN) {
                bool sent;
                // if(relayerFeeAmount > 0){
                //     (sent, ) = payable(msg.sender).call{value: relayerFeeAmount}("");
                //     require(sent, "TokenService: feesTransferFailed");
                //     emit FeePaid(ETH_TOKEN, relayerFeeAmount, true);
                // }
                (sent,) = payable(receiver).call{value: amount}("");
                require(sent, "TokenService: ethWithdrawFailed");
            } else {
                // if(relayerFeeAmount > 0){
                //     IIERC20(tokenAddress).safeTransfer(msg.sender, relayerFeeAmount);
                // }
                // Perform bulkWithdraw from teller
                teller.bulkWithdraw(withdrawAsset, amount, minimumAssets, receiver);
            }
        } else {
            revert("TokenService: insufficientQuorum");
        }
    }
}
