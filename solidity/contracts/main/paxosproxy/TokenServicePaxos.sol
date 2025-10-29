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

interface IAuthority {
    function canCall(address user, address target, bytes4 functionSig) external view returns (bool);
}

contract TokenServicePaxos is TokenServiceV2 {
    using SafeERC20 for IIERC20;

    FeeCollector public feeCollector;
    mapping(address => uint256) public collectedFees;

    ITellerWithMultiAssetSupport public teller;

    address public aleoUSD;

    event PlatformFeesPaid(address indexed tokenAddress, uint256 amount);

    function setTeller(address _teller) external virtual onlyOwner {
        teller = ITellerWithMultiAssetSupport(_teller);
    }

    function setBridgeToken(address _token) external virtual onlyOwner {
        aleoUSD = _token;
    }

    function setFeeCollector(FeeCollector _feeCollector) external virtual onlyOwner {
        feeCollector = _feeCollector;
    }

    /**
     *
     * @param tokenAddress The address of the token
     * @param amount The total amount to calculate fees from
     * @param version The version number to determine fee type
     */
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
    /// @param tokenAddress The address of the ERC20 token (shares minted)
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the tokens
    function _transfer(address tokenAddress, uint256 amount, string calldata receiver, uint256 version)
        internal
        virtual
    {
        require(erc20Bridge.validateAleoAddress(receiver), "TokenService: InvalidReceiverAddress");
        require(tokenAddress != ETH_TOKEN, "TokenService: ethNotAllowed");

        uint256 amountToTransfer = _handleFees(tokenAddress, amount, version);

        // FIX #06: Removed unnecessary self-transfer
        erc20Bridge.sendMessage(_packetify(version, tokenAddress, amountToTransfer, receiver), "");
    }

    // FIX #05: Low - Paxos-specific state variables are not initialized,leaving contract non-functional after deployment
    function TokenServicePaxos_init(
        address bridge,
        address _owner,
        uint256 _chainId,
        uint256 _destChainId,
        address _blackListService,
        address _teller,
        address _aleoUSD
    ) external virtual initializer {
        TokenService_init(bridge, _owner, _chainId, _destChainId, _blackListService);

        require(_teller != address(0), "TokenService: invalid teller address");
        require(_aleoUSD != address(0), "TokenService: invalid aleoUSD address");

        teller = ITellerWithMultiAssetSupport(_teller);
        aleoUSD = _aleoUSD;
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

    /**
     *
     * @param tokenAddress THis is Paxos Boring vault address [ALEO USD === BoringVault]
     * @param amount Amount of token to be transferred.
     * @param receiver The intended receiver of the transferred tokens.
     * @param predicateMessage Predicate authorization message
     * @param isRelayerOn Checks for Relayer
     * @param depositAsset This is Teller supported Asset [USDC, USDT].
     * @param minimumShares Shrares calculated by Teller after depositing to Boring Vault.
     */
    function transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        PredicateMessage calldata predicateMessage,
        bool isRelayerOn,
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
        depositToken.safeIncreaseAllowance(tokenAddress, amount);
        uint256 sharesMinted = teller.deposit(depositAsset, amount, minimumShares);
        // FIX #02: Reset approval to the correct address (aleoUSD, not teller)
        depositToken.safeApprove(aleoUSD, 0);
        // FIX #04: Note - predicate authorization uses deposit amount refactored to sharesMinted.
        require(
            predicateservice.handleMessage(tokenAddress, sharesMinted, receiver, predicateMessage, msg.sender, 0),
            "TokenService: unauthorizedFromPredicate"
        );
        uint256 version = isRelayerOn
            ? PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE_RELAYER
            : PacketLibrary.VERSION_PUBLIC_TRANSFER_PREDICATE;

        // Perform ERC20 token transfer
        _transfer(tokenAddress, sharesMinted, receiver, version);
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
        // #Fix: 07 Token address validation
        require(tokenAddress == aleoUSD, "TokenService: tokenAddress must be aleoUSD");
        require(isEnabledToken(tokenAddress), "TokenService: invalidToken");

        uint256 amount = packet.message.amount;

        PacketLibrary.Vote quorum = erc20Bridge.consume(packet, signatures);

        if (PacketLibrary.Vote.NAY == quorum || blackListService.isBlackListed(receiver)) {
            IIERC20(tokenAddress).safeTransfer(address(holding), amount);
            holding.lock(receiver, tokenAddress, amount);
        } else if (quorum == PacketLibrary.Vote.YEA) {
            teller.bulkWithdraw(withdrawAsset, amount, minimumAssets, receiver);
        } else {
            revert("TokenService: insufficientQuorum");
        }
    }
}
