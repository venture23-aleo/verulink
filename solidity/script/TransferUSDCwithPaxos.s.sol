// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";
import {IIERC20} from "../contracts/common/interface/tokenservice/IIERC20.sol";

contract TransferUSDCPaxos is Script {
    address constant TOKEN_SERVICE_PAXOS = 0x35c540E8081d2dBa0229Eaf8c8D5CC9Cc11B003D;
    address constant USDC = 0x532842De9470816Cf7cc7Cee2d15f19593fBaf64;
    address constant ALEO_USD = 0x9fa87E2a02D6E187658ae232D3a3cAB38Fd638Ca;
    address constant PREDICATE_SERVICE = 0xf3235882bA91086C2E2d05953b91df23Efe68d6e;

    uint256 constant TRANSFER_AMOUNT = 100 * 1e6; // 100 USDC (6 decimals)
    string constant ALEO_RECEIVER = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";

    function run() external {
        address sender = msg.sender;

        vm.startBroadcast();

        // Step 1: Approve TokenServicePaxos to spend USDC
        console.log("Approving TokenServicePaxos...");
        IIERC20(USDC).approve(TOKEN_SERVICE_PAXOS, TRANSFER_AMOUNT);

        // Step 2: Get Predicate message
        console.log("Getting Predicate message...");
        (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        ) = _callPredicateApi(sender, PREDICATE_SERVICE);

        require(isCompliant, "Not compliant");

        PredicateMessage memory predicateMessage = PredicateMessage({
            taskId: taskId, expireByBlockNumber: expiryBlock, signerAddresses: signers, signatures: signatures
        });

        // Step 3: Transfer via TokenServicePaxos
        console.log("Transferring USDC via Paxos...");
        TokenServicePaxos tokenService = TokenServicePaxos(payable(TOKEN_SERVICE_PAXOS));

        tokenService.transfer(
            ALEO_USD, // tokenAddress (aleoUSD)
            TRANSFER_AMOUNT, // amount
            ALEO_RECEIVER, // receiver on Aleo
            predicateMessage, // predicate authorization
            false, // isRelayerOn
            USDC, // depositAsset
            0 // minimumShares
        );

        vm.stopBroadcast();

        console.log("Transfer complete");
    }

    function _callPredicateApi(address walletAddress, address deployedContract)
        internal
        returns (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        )
    {
        bytes memory encodedTransferData = abi.encodeWithSignature(
            "_transfer(address,uint256,string)", ALEO_USD, TRANSFER_AMOUNT, ALEO_RECEIVER
        );

        string[] memory cmd = new string[](7);
        cmd[0] = "bun";
        cmd[1] = "run";
        cmd[2] = "./external-scripts/getPredicateMessage.ts";
        cmd[3] = vm.toString(walletAddress);
        cmd[4] = vm.toString(deployedContract);
        cmd[5] = vm.toString(TRANSFER_AMOUNT);
        cmd[6] = vm.toString(encodedTransferData);

        bytes memory result = vm.ffi(cmd);
        (isCompliant, taskId, expiryBlock, signers, signatures) =
            abi.decode(result, (bool, string, uint256, address[], bytes[]));
    }
}
