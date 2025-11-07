// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";
import {IIERC20} from "../contracts/common/interface/tokenservice/IIERC20.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";

contract TransferViaPaxos is Script {
    address constant TOKEN_SERVICE_PAXOS = 0x60719Bfb63d36E09bdc8478f1378BF6e886FBde1;
    address constant ALEO_USD = 0xC60a7e21A6753ED4305C93034607009fAeC2A5F3;
    address constant USDC = 0x82e349a83D954A5cA049d4256B8dF3a7c8d5AB9b;
    address constant PREDICATE_SERVICE = 0x57527C8Bd99A2D4236A1E61fA1864F47B944612A;
    address constant SENDER = 0xBbb91DD1337852056a870B4e81d8F582552EcA89;

    uint256 constant TRANSFER_AMOUNT = 10 * 1e6; // 100 USDC (6 decimals)
    string constant aleoReceiver = "aleo1jga9hrn0d5umq2tsqty2tcvtjkvd8n9r0g7cj7fq5vld4y6hesgsq23n3l";

    function run() external {
        vm.startBroadcast();
        // Approve TokenServicePaxos to spend USDC
        IIERC20(USDC).approve(TOKEN_SERVICE_PAXOS, TRANSFER_AMOUNT);

        TokenServicePaxos ts = TokenServicePaxos(payable(TOKEN_SERVICE_PAXOS));
        bytes memory encodedTransferData =
            abi.encodeWithSignature("_transfer(address,uint256,string)", ALEO_USD, TRANSFER_AMOUNT, aleoReceiver);
        // Configuration for the Predicate Message
        (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        ) = _callPredicateApi(msg.sender, PREDICATE_SERVICE, encodedTransferData);
        require(isCompliant, "Not compliant");

        // Create a predicate Message
        PredicateMessage memory predicateMessage = PredicateMessage({
            taskId: taskId, expireByBlockNumber: expiryBlock, signerAddresses: signers, signatures: signatures
        });

        console.log("Transferring USDC via Paxos...");
        ts.transfer(ALEO_USD, TRANSFER_AMOUNT, aleoReceiver, predicateMessage, true, USDC, 0);

        vm.stopBroadcast();

        console.log("Transfer completed");
    }

    function _callPredicateApi(address walletAddress, address deployedContract, bytes memory encodedTransferData)
        internal
        returns (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        )
    {
        string[] memory cmd = new string[](6);
        cmd[0] = "bun";
        cmd[1] = "run";
        cmd[2] = "./external-scripts/getPredicateMessage.ts";
        cmd[3] = vm.toString(walletAddress);
        cmd[4] = vm.toString(deployedContract);
        cmd[5] = vm.toString(encodedTransferData);

        bytes memory result = vm.ffi(cmd);
        (isCompliant, taskId, expiryBlock, signers, signatures) =
            abi.decode(result, (bool, string, uint256, address[], bytes[]));
    }
}
