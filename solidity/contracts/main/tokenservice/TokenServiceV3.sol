// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {TokenService} from "../../main/tokenservice/TokenService.sol";
import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";

import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {PredicateService} from "../../main/tokenservice/predicate/PredicateService.sol";

import "hardhat/console.sol";


/// @title TokenServiceV2 Contract
/// @dev Inherits TokenService and PredicateService for predicate-based authorization
contract TokenServiceV3 is TokenService {
    using SafeERC20 for IIERC20;

     /// @notice Sets the VerulinkPredicate contract for predicate-based authorization, callable by owner only
    /// @param _predicateservice Address of the VerulinkPredicate contract
    function setPredicateService(
        PredicateService _predicateservice
    ) external virtual onlyOwner {
        predicateservice = _predicateservice;
    }

    /// @dev Deprecarted Creates an OutPacket representation of the transaction details
    function _packetify(
        address,
        uint256,
        string memory
    ) internal view override virtual returns (PacketLibrary.OutPacket memory) {
        revert("TokenService: DeprecatedMethod");
    }


    function _packetify(
        uint256 version,
        address tokenAddress,
        uint256 amount,
        string memory receiver
    ) internal view virtual returns (PacketLibrary.OutPacket memory packet) {
        require(
            !blackListService.isBlackListed(msg.sender),
            "TokenService: senderBlacklisted"
        );
        require(
            isEnabledToken(tokenAddress),
            "TokenService: tokenNotSupported"
        );
        require(
            isAmountInRange(tokenAddress, amount),
            "TokenService: amountOutOfRange"
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
        packet.version = version;
        console.log("Versions: %s", version);
    }

    function privateTransfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver
    ) public virtual whenNotPaused nonReentrant {
        _transfer(tokenAddress, amount, receiver, VERSION_PRIVATE_TRANSFER);
    }

    function privateTransfer(
        string memory receiver
    ) public payable virtual whenNotPaused nonReentrant {
        _transfer(receiver, VERSION_PRIVATE_TRANSFER);
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

        _transfer(receiver, VERSION_PRIVATE_TRANSFER_PREDICATE);
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

        _transfer(tokenAddress, amount, receiver, VERSION_PRIVATE_TRANSFER_PREDICATE);
    }

    /// @notice Transfers ETH with predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    function transfer(
        string calldata receiver
    ) public payable virtual override whenNotPaused nonReentrant {
        uint256 version = (executerFees[ETH_TOKEN] > 0) ? VERSION_PUBLIC_TRANSFER_EXECUTER : VERSION_PUBLIC_TRANSFER;
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
    ) external virtual override whenNotPaused nonReentrant {
        // uint256 version = executerFees > 0 ? 101 : 100;
        uint256 version = (executerFees[tokenAddress] > 0) ? VERSION_PUBLIC_TRANSFER_EXECUTER : VERSION_PUBLIC_TRANSFER;
        // Perform ERC20 token transfer
        _transfer(tokenAddress, amount, receiver, version);
    }

    /// @notice Transfers ETH with predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    /// @param predicateMessage Predicate authorization message
    function transfer(
        string calldata receiver,
        PredicateMessage calldata predicateMessage
    ) public payable virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            receiver, 
            predicateMessage, 
            msg.sender, 
            msg.value),
            "TokenService: unauthorizedFromPredicate") ;
        
        uint256 version = (executerFees[ETH_TOKEN] > 0) ? VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTER : VERSION_PUBLIC_TRANSFER_PREDICATE;

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
    ) external virtual whenNotPaused nonReentrant {
        require(predicateservice.handleMessage(
            tokenAddress,
            amount,
            receiver,
            predicateMessage,
            msg.sender,
            0
        ), "TokenService: unauthorizedFromPredicate");

        uint256 version = (executerFees[tokenAddress] > 0) ? VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTER : VERSION_PUBLIC_TRANSFER_PREDICATE;

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
        uint256 amount = msg.value;
        uint256 fees = (platformFees[ETH_TOKEN] > 0) ? (amount * platformFees[ETH_TOKEN]) / 100 : 0;
        require(amount > fees, "TokenService: FeesExceedTransferAmount");
        collectedFees[ETH_TOKEN] += fees;
        uint256 feesDeductedAmount = amount - fees;
        erc20Bridge.sendMessage(_packetify(version, ETH_TOKEN, feesDeductedAmount, receiver));
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
        uint256 fees = (platformFees[tokenAddress] > 0) ? (amount * platformFees[tokenAddress]) / 100 : 0;
        require(amount > fees, "TokenService: FeesExceedTransferAmount");
        collectedFees[tokenAddress] += fees;
        uint256 feesDeductedAmount = amount - fees;
        IIERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        // Send message via bridge
        erc20Bridge.sendMessage(_packetify(version, tokenAddress, feesDeductedAmount, receiver));
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

        uint256 executerFeesAmount = executerFees[tokenAddress];

        if ((version == VERSION_PRIVATE_TRANSFER_EXECUTER || 
        version == VERSION_PUBLIC_TRANSFER_EXECUTER || 
        version == VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTER ) && executerFeesAmount > 0){
            require(amount > executerFeesAmount, "TokenService: FeesExceedTransferAmount");
            feesDeductedAmount = amount - executerFeesAmount;
        }else{
            feesDeductedAmount = amount;
        }

        PacketLibrary.Vote quorum = erc20Bridge.consume(packet, signatures);

        if (
            PacketLibrary.Vote.NAY == quorum ||
            blackListService.isBlackListed(receiver)
        ) {
            if (tokenAddress == ETH_TOKEN) {
                // eth lock
                if(executerFeesAmount > 0){
                    (bool sent, ) = payable(msg.sender).call{value: executerFeesAmount}("");
                    require(sent, "TokenService: ethFeesWithdrawFailed");
                }
                holding.lock{value: feesDeductedAmount}(receiver);
            } else {
                if(executerFeesAmount > 0){
                    IIERC20(tokenAddress).safeTransfer(address(holding), executerFeesAmount);
                }
                IIERC20(tokenAddress).safeTransfer(address(holding), feesDeductedAmount);
                holding.lock(receiver, tokenAddress, feesDeductedAmount);
            }
        } else if (quorum == PacketLibrary.Vote.YEA) {
            if (tokenAddress == ETH_TOKEN) {
                // eth transfer
                if(executerFeesAmount > 0){
                    (bool sent, ) = payable(msg.sender).call{value: executerFeesAmount}("");
                    require(sent, "TokenService: ethFeesWithdrawFailed");
                }
                (bool sent, ) = payable(receiver).call{value: feesDeductedAmount}("");
                require(sent, "TokenService: ethWithdrawFailed");
            } else {
                if(executerFeesAmount > 0){
                    IIERC20(tokenAddress).safeTransfer(msg.sender, executerFeesAmount);
                }
                IIERC20(tokenAddress).safeTransfer(receiver, feesDeductedAmount);
            }
        } else {
            revert("TokenService: insufficientQuorum");
        }
    }

    receive() external payable virtual override onlyWhitelistedSender {}
    
    function addWhitelistAddress(address _addr) external virtual onlyOwner {
        if (!isWhitelistedSender[_addr]){
            isWhitelistedSender[_addr] = true;
        }
    }

    function removeWhitelistAddress(address _addr) external virtual onlyOwner {
        if (isWhitelistedSender[_addr]){
            delete isWhitelistedSender[_addr];
        }
    }

    modifier onlyWhitelistedSender() {
        require(isWhitelistedSender[msg.sender] || msg.sender == owner(), "TokenService: SenderIsNotWhitelisted");
        _;
    }

     /// @notice Sets the fees for the platform
    /// @param _addr The address of the registered token
    /// @param _platformFees The fees for the platform
    function setPlatformFees(address _addr, uint256 _platformFees) external onlyOwner {
        require(0 < _platformFees && _platformFees < 100, "TokenService: invalidPlatformFees");
        require(isSupportedToken(_addr), "TokenService: tokenNotSupported");
        platformFees[_addr] = _platformFees;
    }

    /// @notice Sets the fees for the executer
    /// @param _addr The address of the registered token
    /// @param _executerFees The fees for the executer
    function setExecuterFees(address _addr, uint256 _executerFees) external onlyOwner {
        require(0 < _executerFees && _executerFees < 100, "TokenService: invalidExecuterFees");
        require(isSupportedToken(_addr), "TokenService: tokenNotSupported");
        executerFees[_addr] = _executerFees;
    }

    /// @notice Withdraws the protocol fees collected for a specific token
    /// @param _addr The address of the registered token
    /// @param _to The address to withdraw the fees to
    /// @dev Only callable by the owner of the contract
    function withdrawProtocolFees(address _addr, address _to) external onlyOwner {
        uint256 amount = collectedFees[_addr];
        require(amount> 0, "TokenService: noFeesToWithdraw");

        collectedFees[_addr] = 0;
        if (_addr == ETH_TOKEN) {
            (bool sent, ) = payable(_to).call{value: amount}("");
            require(sent, "TokenService: ethWithdrawFailed");
        } else {
            IIERC20(_addr).safeTransfer(_to, amount);
        }
    }
 
    uint256[49] private __gap;

    PredicateService public predicateservice;
    mapping (address => bool) public isWhitelistedSender;

    
    mapping(address => uint256) public executerFees;
    mapping(address => uint256) public platformFees;
    mapping (address => uint256) public collectedFees;

    /// @notice The version of the contract
    uint256 private constant VERSION_PUBLIC_TRANSFER = 100;
    uint256 private constant VERSION_PUBLIC_TRANSFER_EXECUTER = 101;
    uint256 private constant VERSION_PUBLIC_TRANSFER_PREDICATE = 110;
    uint256 private constant VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTER = 111;

    uint256 private constant VERSION_PRIVATE_TRANSFER = 200;
    uint256 private constant VERSION_PRIVATE_TRANSFER_EXECUTER = 201;
    uint256 private constant VERSION_PRIVATE_TRANSFER_PREDICATE = 210;
}