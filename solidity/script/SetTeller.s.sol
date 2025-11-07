// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import "forge-std/Script.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";

contract SetAuthority is Script {
    address TELLER_CONTRACT_ADDRESS = 0x19dbB8Af66fFeBB5c7330B3B41c99F366D0c15A2;
    // address ACCOUNTANT_WITH_RATE_PROVIDERS = 0x9DD4E3D355f5aAc8927868FCe8d5FC46e279f2F5;
    // address MANAGER_WITH_MERKLE_VERIFICATION = 0xc4D141800C4cB688bC12868355179c6F3059aC5f;
    // address BORING_VAULT_ADDRESS = 0xf7A648Dda187a7124Dffa0aB34b1A250C1d0D3EA;
    // address ROLES_AUTHORITY_ADDRESS = 0x12d0e39799f9c3e20f4b7BA0a9B4fBDA1147461d;
    address TOKEN_SERVICE_PAXOS_ADDRESS = 0x60719Bfb63d36E09bdc8478f1378BF6e886FBde1;

    function run() public {
        vm.startBroadcast();
        // AccountantWithRateProviders accountant = AccountantWithRateProviders(ACCOUNTANT_WITH_RATE_PROVIDERS);
        // ManagerWithMerkleVerification accountant = ManagerWithMerkleVerification(MANAGER_WITH_MERKLE_VERIFICATION);
        TokenServicePaxos tokenService = TokenServicePaxos(payable(TOKEN_SERVICE_PAXOS_ADDRESS));
        tokenService.setTeller(TELLER_CONTRACT_ADDRESS);
        vm.stopBroadcast();
    }
}
