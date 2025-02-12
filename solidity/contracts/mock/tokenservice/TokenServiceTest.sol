// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.19;

// import {IBridge} from "../../common/interface/bridge/IBridge.sol";
// import {IBlackListService} from "../../common/interface/tokenservice/IBlackListService.sol";
// import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
// import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";
// import {Pausable} from "../../common/Pausable.sol";
// import {TokenSupport} from "../../base/tokenservice/TokenSupport.sol";
// import {Holding} from "../Holding.sol";
// import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
// import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";
// import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import {PredicateClient} from "@predicate/contracts/src/mixins/PredicateClient.sol";
// import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
// import {TokenService} from "./TokenService.sol";
// import {IPredicateManager} from "@predicate/contracts/src/interfaces/IPredicateManager.sol";

// /// @title TokenService Contract
// /// @dev This contract implements OwnableUpgradeable, Pausable, TokenSupport, ReentrancyGuardUpgradeable, and Upgradeable contracts.
// contract TokenServiceTest is TokenService, PredicateClient {
//     using SafeERC20 for IIERC20;

//     /// @notice Transfers ETH to the destination chain via the bridge
//     /// @param receiver The intended receiver of the transferred ETH
//     function transfer(
//         string calldata receiver,
//         PredicateMessage calldata predicateMessage
//     ) public payable whenNotPaused nonReentrant {
//         bytes memory encodedSigAndArgs = abi.encodeWithSignature(
//             "_transfer(string)",
//             receiver
//         );
//         require(
//             _authorizeTransaction(predicateMessage, encodedSigAndArgs),
//             "Predicate: unauthorized transaction"
//         );
//         _transfer(receiver);
//     }

//     function _transfer(string calldata receiver) internal virtual {
//         require(erc20Bridge.validateAleoAddress(receiver));
//         erc20Bridge.sendMessage(_packetify(ETH_TOKEN, msg.value, receiver));
//     }

//     function transfer(
//         address tokenAddress,
//         uint256 amount,
//         string calldata receiver,
//         PredicateMessage calldata predicateMessage
//     ) external virtual whenNotPaused nonReentrant {
//         bytes memory encodedSigAndArgs = abi.encodeWithSignature(
//             "_transfer(address,uint256,string)",
//             tokenAddress,
//             amount,
//             receiver
//         );
//         require(
//             _authorizeTransaction(predicateMessage, encodedSigAndArgs),
//             "GuardedERC20Transfer: unauthorized transaction"
//         );
//         _transfer(tokenAddress, amount, receiver);
//     }

//     function _transfer(
//         address tokenAddress,
//         uint256 amount,
//         string calldata receiver
//     ) internal virtual {
//         require(erc20Bridge.validateAleoAddress(receiver));
//         require(tokenAddress != ETH_TOKEN, "TokenService: only erc20 tokens");
//         IIERC20(tokenAddress).safeTransferFrom(
//             msg.sender,
//             address(this),
//             amount
//         );
//         erc20Bridge.sendMessage(_packetify(tokenAddress, amount, receiver));
//     }

//     /**
//      * @notice Updates the policy ID
//      * @param _policyID policy ID from onchain
//      */
//     function setPolicy(string memory _policyID) external virtual {
//         policyID = _policyID;
//         serviceManager.setPolicy(_policyID);
//     }

//     /**
//      * @notice Function for setting the ServiceManager
//      * @param _serviceManager address of the service manager
//      */
//     function setPredicateManager(address _serviceManager) public virtual {
//         serviceManager = IPredicateManager(_serviceManager);
//     }

//     /**
//      * @dev This empty reserved space is put in place to allow future versions to add new
//      * variables without shifting down storage in the inheritance chain.
//      * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
//      */
//     uint256[49] private __gap;
// }
