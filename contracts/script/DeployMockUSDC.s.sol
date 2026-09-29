// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// forge script script/DeployMockUSDC.s.sol --rpc-url bsc_testnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY
contract DeployMockUSDC is Script {
    function run() external {
        require(block.chainid == 97, "MockUSDC is for BSC testnet only");
        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        vm.stopBroadcast();
        console.log("MockUSDC deployed at", address(usdc));
    }
}
