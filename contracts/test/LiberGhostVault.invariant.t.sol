// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {LiberGhostVault} from "../src/LiberGhostVault.sol";

contract GhostHandler is Test {
    MockUSDC public token;
    LiberGhostVault public vault;
    uint256 constant KEY=0xF00D;
    address public owner;
    address public merchant=address(0xCAFE);
    uint256 public expectedLiability;
    uint256 public expectedMerchantPaid;
    uint256 public expectedOwnerReturned;
    uint256 public serial;
    LiberGhostVault.GhostVoucher[] internal vouchers;
    mapping(bytes32=>bool) public closed;
    constructor(MockUSDC t, LiberGhostVault v) { token=t; vault=v; owner=vm.addr(KEY); token.mint(owner,1_000_000 ether); vm.prank(owner); token.approve(address(vault),type(uint256).max); }
    function reserve(uint96 raw) external {
        if(vouchers.length>=64) return;
        uint256 amount=bound(raw,1,10 ether);
        LiberGhostVault.GhostVoucher memory q=LiberGhostVault.GhostVoucher(owner,merchant,amount,uint64(block.timestamp+1 hours),bytes32(++serial));
        vm.prank(owner); vault.reserve(q); vouchers.push(q); expectedLiability+=amount;
    }
    function redeem(uint256 which) external {
        if(vouchers.length==0) return; LiberGhostVault.GhostVoucher memory q=vouchers[which%vouchers.length]; bytes32 id=vault.hashVoucher(q);
        if(closed[id] || block.timestamp>=q.validBefore) return;
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(KEY,id); vm.prank(merchant); vault.redeem(q,abi.encodePacked(r,s,v));
        closed[id]=true; expectedLiability-=q.amount; expectedMerchantPaid+=q.amount;
    }
    function reclaim(uint256 which) external {
        if(vouchers.length==0) return; LiberGhostVault.GhostVoucher memory q=vouchers[which%vouchers.length]; bytes32 id=vault.hashVoucher(q);
        if(closed[id] || block.timestamp<q.validBefore) return;
        vm.prank(owner); vault.reclaim(id); closed[id]=true; expectedLiability-=q.amount; expectedOwnerReturned+=q.amount;
    }
    function advance(uint16 seconds_) external { vm.warp(block.timestamp+seconds_); }
    function donate(uint64 amount) external { token.mint(address(vault),amount); }
    function checkClosed() external view {
        for(uint256 i;i<vouchers.length;i++) { bytes32 id=vault.hashVoucher(vouchers[i]); (,,,,LiberGhostVault.ReservationStatus s)=vault.reservations(id); if(closed[id]) assertTrue(s==LiberGhostVault.ReservationStatus.Redeemed || s==LiberGhostVault.ReservationStatus.Reclaimed); }
    }
}
contract LiberGhostInvariantTest is Test {
    MockUSDC token; LiberGhostVault vault; GhostHandler handler;
    function setUp() public {
        vm.chainId(97); token=new MockUSDC(); vault=new LiberGhostVault(address(token)); handler=new GhostHandler(token,vault);
        bytes4[] memory selectors=new bytes4[](5); selectors[0]=handler.reserve.selector; selectors[1]=handler.redeem.selector; selectors[2]=handler.reclaim.selector; selectors[3]=handler.advance.selector; selectors[4]=handler.donate.selector;
        targetSelector(FuzzSelector({addr:address(handler),selectors:selectors})); targetContract(address(handler));
    }
    function invariantLiabilitiesMatchIndependentHandler() public view { assertEq(vault.totalReserved(),handler.expectedLiability()); assertGe(token.balanceOf(address(vault)),vault.totalReserved()); }
    function invariantMerchantGetsOnlyRecordedPayments() public view { assertEq(token.balanceOf(handler.merchant()),handler.expectedMerchantPaid()); }
    function invariantTerminalStatesRemainClosed() public view { handler.checkClosed(); }
}
