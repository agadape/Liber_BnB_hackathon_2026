// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {LiberGhostVault} from "../src/LiberGhostVault.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract AdversarialToken is ERC20 {
    uint8 public mode;
    address public target;
    bytes public attack;
    bool public callbackSucceeded;
    constructor() ERC20("Test", "TEST") {}
    function mint(address to, uint256 value) external { _mint(to, value); }
    function setMode(uint8 m) external { mode = m; }
    function setAttack(address t, bytes calldata a) external { target=t; attack=a; }
    function transfer(address to, uint256 value) public override returns (bool) {
        if (mode==2) return false;
        if (mode==3) revert("transfer failed");
        if (mode==4) (callbackSucceeded,) = target.call(attack);
        return super.transfer(to,value);
    }
    function _update(address from, address to, uint256 value) internal override {
        if (mode==1 && from!=address(0) && to!=address(0) && value>1) {
            super._update(from,to,value-1); super._update(from,address(0),1);
        } else super._update(from,to,value);
    }
}
contract SixDecimalToken is ERC20 {
    constructor() ERC20("Six", "SIX") {}
    function decimals() public pure override returns(uint8) { return 6; }
}

contract LiberGhostVaultTest is Test {
    MockUSDC token;
    LiberGhostVault vault;
    uint256 ownerKey = 0xA11CE;
    address owner;
    address merchant = address(0xB0B);
    LiberGhostVault.GhostVoucher voucher;
    function setUp() public {
        vm.chainId(97); vm.warp(1_800_000_000);
        owner=vm.addr(ownerKey); token=new MockUSDC(); vault=new LiberGhostVault(address(token));
        token.mint(owner,10_000 ether);
        voucher=LiberGhostVault.GhostVoucher(owner,merchant,5 ether,uint64(block.timestamp+1 hours),bytes32(uint256(1)));
        vm.prank(owner); token.approve(address(vault),type(uint256).max);
    }
    function sig(LiberGhostVault v, LiberGhostVault.GhostVoucher memory q, uint256 key) internal view returns(bytes memory) {
        (uint8 vv,bytes32 r,bytes32 s)=vm.sign(key,v.hashVoucher(q)); return abi.encodePacked(r,s,vv);
    }
    function funded() internal returns(bytes32 id) { vm.prank(owner); vault.reserve(voucher); return vault.hashVoucher(voucher); }
    function status(bytes32 id) internal view returns(LiberGhostVault.ReservationStatus s) { (,,,,s)=vault.reservations(id); }

    function testConstructorGates() public {
        vm.chainId(56); vm.expectRevert(LiberGhostVault.WrongChain.selector); new LiberGhostVault(address(token));
        vm.chainId(97); vm.expectRevert(LiberGhostVault.InvalidToken.selector); new LiberGhostVault(address(0));
        vm.expectRevert(LiberGhostVault.InvalidToken.selector); new LiberGhostVault(address(123));
        SixDecimalToken six=new SixDecimalToken(); vm.expectRevert(LiberGhostVault.InvalidDecimals.selector); new LiberGhostVault(address(six));
    }
    function testReserveRedeemReplayAndExactBalances() public {
        bytes32 id=funded(); assertEq(token.balanceOf(address(vault)),5 ether); assertEq(vault.totalReserved(),5 ether);
        bytes memory signature=sig(vault,voucher,ownerKey);
        vm.prank(merchant); vault.redeem(voucher,signature);
        assertEq(token.balanceOf(merchant),5 ether); assertEq(token.balanceOf(address(vault)),0); assertEq(vault.totalReserved(),0);
        assertEq(uint256(status(id)),2);
        vm.prank(merchant); vm.expectRevert(LiberGhostVault.VoucherNotReserved.selector); vault.redeem(voucher,signature);
        vm.warp(voucher.validBefore); vm.prank(owner); vm.expectRevert(LiberGhostVault.VoucherNotReserved.selector); vault.reclaim(id);
    }
    function testExpiryExactPartitionAndOnlyOwnerReclaim() public {
        bytes32 id=funded(); bytes memory signature=sig(vault,voucher,ownerKey);
        vm.warp(voucher.validBefore-1); vm.prank(owner); vm.expectRevert(LiberGhostVault.VoucherNotExpired.selector); vault.reclaim(id);
        vm.warp(voucher.validBefore); vm.prank(merchant); vm.expectRevert(LiberGhostVault.VoucherExpired.selector); vault.redeem(voucher,signature);
        vm.prank(merchant); vm.expectRevert(LiberGhostVault.NotOwner.selector); vault.reclaim(id);
        vm.prank(owner); vault.reclaim(id); assertEq(token.balanceOf(owner),10_000 ether); assertEq(vault.totalReserved(),0);
        vm.prank(owner); vm.expectRevert(LiberGhostVault.VoucherNotReserved.selector); vault.reclaim(id);
    }
    function testClaimOneSecondBeforeExpiry() public {
        funded(); bytes memory signature=sig(vault,voucher,ownerKey); vm.warp(voucher.validBefore-1);
        vm.prank(merchant); vault.redeem(voucher,signature); assertEq(token.balanceOf(merchant),5 ether);
    }
    function testWrongMerchantAndUnfundedAndForgedSignature() public {
        bytes memory signature=sig(vault,voucher,ownerKey);
        vm.prank(merchant); vm.expectRevert(LiberGhostVault.UnknownVoucher.selector); vault.redeem(voucher,signature);
        funded(); vm.prank(owner); vm.expectRevert(LiberGhostVault.NotMerchant.selector); vault.redeem(voucher,signature);
        bytes memory wrong=sig(vault,voucher,42); vm.prank(merchant); vm.expectRevert(LiberGhostVault.InvalidVoucherSignature.selector); vault.redeem(voucher,wrong);
        vm.prank(merchant); vm.expectRevert(LiberGhostVault.InvalidVoucherSignature.selector); vault.redeem(voucher,hex"1234");
    }
    function testFieldMutationAndCrossVaultSignature() public {
        funded(); bytes memory signature=sig(vault,voucher,ownerKey);
        voucher.amount+=1; vm.prank(merchant); vm.expectRevert(LiberGhostVault.UnknownVoucher.selector); vault.redeem(voucher,signature); voucher.amount-=1;
        voucher.validBefore+=1; vm.prank(merchant); vm.expectRevert(LiberGhostVault.UnknownVoucher.selector); vault.redeem(voucher,signature); voucher.validBefore-=1;
        voucher.salt=bytes32(uint256(7)); vm.prank(merchant); vm.expectRevert(LiberGhostVault.UnknownVoucher.selector); vault.redeem(voucher,signature); voucher.salt=bytes32(uint256(1));
        LiberGhostVault other=new LiberGhostVault(address(token)); bytes memory cross=sig(other,voucher,ownerKey);
        vm.prank(merchant); vm.expectRevert(LiberGhostVault.InvalidVoucherSignature.selector); vault.redeem(voucher,cross);
    }
    function testCrossChainAndHighSAndBadVRejected() public {
        funded(); vm.chainId(56); bytes memory wrong=sig(vault,voucher,ownerKey); vm.chainId(97);
        vm.prank(merchant); vm.expectRevert(LiberGhostVault.InvalidVoucherSignature.selector); vault.redeem(voucher,wrong);
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(ownerKey,vault.hashVoucher(voucher));
        bytes32 highS=bytes32(uint256(0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141)-uint256(s));
        vm.prank(merchant); vm.expectRevert(); vault.redeem(voucher,abi.encodePacked(r,highS,uint8(v==27?28:27)));
        vm.prank(merchant); vm.expectRevert(); vault.redeem(voucher,abi.encodePacked(r,s,uint8(0)));
    }
    function testSaltReuseAfterTerminalAndDuplicateReservation() public {
        bytes32 id=funded(); vm.prank(owner); vm.expectRevert(LiberGhostVault.VoucherAlreadyExists.selector); vault.reserve(voucher);
        vm.warp(voucher.validBefore); vm.prank(owner); vault.reclaim(id);
        voucher.validBefore=uint64(block.timestamp+1 hours); voucher.amount=1 ether;
        vm.prank(owner); vm.expectRevert(LiberGhostVault.SaltAlreadyUsed.selector); vault.reserve(voucher);
    }
    function testReserveValidityAndAmountAndMerchant() public {
        vm.prank(merchant); vm.expectRevert(LiberGhostVault.InvalidOwner.selector); vault.reserve(voucher);
        voucher.merchant=owner; vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidMerchant.selector); vault.reserve(voucher);
        voucher.merchant=address(vault); vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidMerchant.selector); vault.reserve(voucher);
        voucher.merchant=address(token); vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidMerchant.selector); vault.reserve(voucher);
        voucher.merchant=address(0); vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidMerchant.selector); vault.reserve(voucher);
        voucher.merchant=merchant; voucher.amount=0; vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidAmount.selector); vault.reserve(voucher);
        voucher.amount=1_001 ether; vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidAmount.selector); vault.reserve(voucher);
        voucher.amount=5 ether; voucher.validBefore=uint64(block.timestamp+299); vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidExpiry.selector); vault.reserve(voucher);
        voucher.validBefore=uint64(block.timestamp+7 days+1); vm.prank(owner); vm.expectRevert(LiberGhostVault.InvalidExpiry.selector); vault.reserve(voucher);
        voucher.validBefore=uint64(block.timestamp+300); vm.prank(owner); vault.reserve(voucher);
        voucher.salt=bytes32(uint256(2)); voucher.validBefore=uint64(block.timestamp+7 days); vm.prank(owner); vault.reserve(voucher);
    }
    function testReserveFailureDoesNotConsumeSaltOrFunds() public {
        vm.prank(owner); token.approve(address(vault),0); vm.prank(owner); vm.expectRevert(); vault.reserve(voucher);
        assertEq(vault.totalReserved(),0); assertEq(uint256(status(vault.hashVoucher(voucher))),0);
        assertFalse(vault.usedOwnerSalts(keccak256(abi.encode(owner,voucher.salt))));
    }
    function testTokenFailureFeeAndReentrancyRollback() public {
        AdversarialToken bad=new AdversarialToken(); LiberGhostVault testVault=new LiberGhostVault(address(bad)); bad.mint(owner,100 ether);
        vm.prank(owner); bad.approve(address(testVault),100 ether);
        bad.setMode(1); vm.prank(owner); vm.expectRevert(LiberGhostVault.UnsupportedToken.selector); testVault.reserve(voucher); assertEq(testVault.totalReserved(),0);
        bad.setMode(0); vm.prank(owner); testVault.reserve(voucher); bytes memory signature=sig(testVault,voucher,ownerKey);
        for(uint8 mode=1;mode<=3;mode++) { bad.setMode(mode); vm.prank(merchant); vm.expectRevert(); testVault.redeem(voucher,signature); assertEq(testVault.totalReserved(),5 ether); }
        bad.setMode(4); bad.setAttack(address(testVault),abi.encodeCall(testVault.redeem,(voucher,signature)));
        vm.prank(merchant); testVault.redeem(voucher,signature); assertFalse(bad.callbackSucceeded()); assertEq(bad.balanceOf(merchant),5 ether);
    }
    function testUnknownReclaimAndDonationIsolation() public {
        vm.prank(owner); vm.expectRevert(LiberGhostVault.UnknownVoucher.selector); vault.reclaim(bytes32(uint256(2)));
        funded(); token.mint(address(vault),3 ether); assertEq(vault.totalReserved(),5 ether); assertEq(token.balanceOf(address(vault)),8 ether);
    }
    function testFuzzExactAmount(uint128 raw) public {
        voucher.amount=bound(raw,1,1_000 ether); funded(); bytes memory signature=sig(vault,voucher,ownerKey);
        vm.prank(merchant); vault.redeem(voucher,signature); assertEq(token.balanceOf(merchant),voucher.amount); assertEq(vault.totalReserved(),0);
    }
    function testGoldenViemDigestAndSignatureMatchSolidity() public {
        string memory json=vm.readFile("../protocol/fixtures/ghost-v1-golden.json");
        address fixtureVault=vm.parseJsonAddress(json,".vault");
        vm.etch(fixtureVault,address(vault).code);
        LiberGhostVault.GhostVoucher memory q=LiberGhostVault.GhostVoucher(
            vm.parseJsonAddress(json,".voucher.owner"),vm.parseJsonAddress(json,".voucher.merchant"),
            vm.parseUint(vm.parseJsonString(json,".voucher.amountRaw")),uint64(vm.parseUint(vm.parseJsonString(json,".voucher.validBefore"))),vm.parseJsonBytes32(json,".voucher.salt")
        );
        LiberGhostVault fixture=LiberGhostVault(fixtureVault);
        assertEq(fixture.hashVoucher(q),vm.parseJsonBytes32(json,".voucherId"));
        token.mint(q.owner,q.amount); vm.startPrank(q.owner); token.approve(fixtureVault,q.amount); fixture.reserve(q); vm.stopPrank();
        vm.prank(q.merchant); fixture.redeem(q,vm.parseJsonBytes(json,".signature")); assertEq(token.balanceOf(q.merchant),q.amount);
    }
}
