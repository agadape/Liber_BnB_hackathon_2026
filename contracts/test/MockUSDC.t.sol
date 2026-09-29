// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract MockUSDCTest is Test {
    MockUSDC usdc;
    address alice = address(0xA11CE);
    address kolo = address(0xC010);

    function setUp() public {
        usdc = new MockUSDC();
    }

    function test_Decimals18() public view {
        assertEq(usdc.decimals(), 18);
        assertEq(usdc.symbol(), "USDC");
    }

    function test_FaucetAndTransferToKolo() public {
        vm.prank(alice);
        usdc.faucet();
        assertEq(usdc.balanceOf(alice), 1_000 ether);
        vm.prank(alice);
        usdc.transfer(kolo, 12.5 ether);
        assertEq(usdc.balanceOf(kolo), 12.5 ether);
    }

    function test_Mint() public {
        usdc.mint(alice, 7 ether);
        assertEq(usdc.totalSupply(), 7 ether);
    }
}
