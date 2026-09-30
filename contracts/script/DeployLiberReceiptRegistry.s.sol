// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {LiberReceiptRegistry} from "../src/LiberReceiptRegistry.sol";
contract DeployLiberReceiptRegistry is Script {
    function run() external returns (LiberReceiptRegistry deployed) {
        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));
        deployed = new LiberReceiptRegistry();
        vm.stopBroadcast();
    }
}
