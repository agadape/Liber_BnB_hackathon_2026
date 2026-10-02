// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {LiberGhostVault} from "../src/LiberGhostVault.sol";
contract DeployLiberGhostVault is Script {
    function run() external returns (LiberGhostVault vault) {
        require(block.chainid == 97, "BSC Testnet only");
        address token = vm.envAddress("GHOST_TOKEN_ADDRESS");
        vm.startBroadcast();
        vault = new LiberGhostVault(token);
        vm.stopBroadcast();
    }
}
