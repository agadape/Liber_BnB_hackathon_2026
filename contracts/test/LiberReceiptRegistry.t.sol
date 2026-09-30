// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {LiberReceiptRegistry} from "../src/LiberReceiptRegistry.sol";
contract LiberReceiptRegistryTest is Test {
    LiberReceiptRegistry registry;
    function setUp() public { vm.chainId(97); registry = new LiberReceiptRegistry(); }
    function testRecordsHashWithoutTakingFunds() public {
        bytes32 hash = keccak256("opaque receipt");
        vm.prank(address(0x123)); registry.record(hash, true);
        (address recorder, uint64 time, bool sandbox) = registry.records(hash);
        assertEq(recorder, address(0x123)); assertEq(time, block.timestamp); assertTrue(sandbox); assertEq(address(registry).balance, 0);
        vm.expectRevert(LiberReceiptRegistry.AlreadyRecorded.selector); registry.record(hash, true);
        vm.expectRevert(LiberReceiptRegistry.AlreadyRecorded.selector); registry.record(hash, false);
    }
    function testRejectsEmptyHashAndOtherChains() public {
        vm.expectRevert(LiberReceiptRegistry.InvalidCommitment.selector); registry.record(bytes32(0), true);
        vm.chainId(56); vm.expectRevert("BSC testnet only"); new LiberReceiptRegistry();
    }
}
