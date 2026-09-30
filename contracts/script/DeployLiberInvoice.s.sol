// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {LiberInvoice} from "../src/LiberInvoice.sol";
contract DeployLiberInvoice is Script {
    function run() external returns (LiberInvoice deployed) {
        address token=vm.envAddress("USDC_ADDRESS");
        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));
        deployed=new LiberInvoice(token);
        vm.stopBroadcast();
    }
}
