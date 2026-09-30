// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {LiberInvoice} from "../src/LiberInvoice.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract LiberInvoiceTest is Test {
    MockUSDC token;
    LiberInvoice router;
    address merchant = address(0xA11CE);
    address buyer = address(0xB0B);
    bytes32 id;
    function setUp() public {
        vm.chainId(97);
        token = new MockUSDC();
        router = new LiberInvoice(address(token));
        token.mint(buyer, 100 ether);
        vm.prank(merchant);
        id = router.createInvoice(bytes32(uint256(1)), 5 ether, uint64(block.timestamp + 1 hours));
    }
    function testDirectPaymentAndReplayProtection() public {
        vm.startPrank(buyer);
        token.approve(address(router), 5 ether);
        router.payInvoice(id);
        vm.expectRevert(LiberInvoice.NotPayable.selector);
        router.payInvoice(id);
        vm.stopPrank();
        assertEq(token.balanceOf(merchant), 5 ether);
        assertEq(token.balanceOf(address(router)), 0);
        (,,,bool paid,,address payer) = router.invoices(id);
        assertTrue(paid); assertEq(payer, buyer);
    }
    function testExpiredCancelledAndUnknownInvoicesRejectPayment() public {
        vm.prank(buyer); vm.expectRevert(LiberInvoice.NotPayable.selector); router.payInvoice(bytes32(uint256(99)));
        vm.warp(block.timestamp + 1 hours);
        vm.prank(buyer); vm.expectRevert(LiberInvoice.NotPayable.selector); router.payInvoice(id);
        vm.prank(merchant); bytes32 other = router.createInvoice(bytes32(uint256(2)), 5 ether, uint64(block.timestamp + 1 hours));
        vm.prank(merchant); router.cancelInvoice(other);
        vm.prank(buyer); vm.expectRevert(LiberInvoice.NotPayable.selector); router.payInvoice(other);
    }
    function testFailedTransferRollsBackPaidFlag() public {
        vm.prank(buyer); vm.expectRevert(); router.payInvoice(id);
        (,,,bool paid,,address payer) = router.invoices(id);
        assertFalse(paid); assertEq(payer, address(0));
    }
    function testOnlyMerchantCanCancelAndCannotPaySelf() public {
        vm.prank(buyer); vm.expectRevert(LiberInvoice.NotMerchant.selector); router.cancelInvoice(id);
        vm.prank(merchant); vm.expectRevert(LiberInvoice.NotPayable.selector); router.payInvoice(id);
    }
    function testDuplicateAndInvalidInvoiceCreation() public {
        vm.startPrank(merchant);
        vm.expectRevert(LiberInvoice.InvalidInvoice.selector); router.createInvoice(bytes32(uint256(1)), 5 ether, uint64(block.timestamp + 1 hours));
        vm.expectRevert(LiberInvoice.InvalidInvoice.selector); router.createInvoice(bytes32(uint256(2)), 0, uint64(block.timestamp + 1 hours));
        vm.expectRevert(LiberInvoice.InvalidInvoice.selector); router.createInvoice(bytes32(uint256(2)), 5 ether, uint64(block.timestamp));
        vm.expectRevert(LiberInvoice.InvalidInvoice.selector); router.createInvoice(bytes32(uint256(2)), 5 ether, uint64(block.timestamp + 8 days));
        vm.stopPrank();
    }
    function testFuzzExactAmountReachesMerchant(uint128 amount) public {
        vm.assume(amount > 0);
        token.mint(buyer, amount);
        vm.prank(merchant); bytes32 other = router.createInvoice(bytes32(uint256(3)), amount, uint64(block.timestamp + 1 hours));
        vm.startPrank(buyer); token.approve(address(router), amount); router.payInvoice(other); vm.stopPrank();
        assertEq(token.balanceOf(merchant), amount);
    }
}
