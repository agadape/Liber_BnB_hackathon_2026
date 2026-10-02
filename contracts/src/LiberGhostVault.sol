// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice Testnet-only, prefunded, single-merchant paper payment authorizations.
/// @dev Reserve never publishes the owner signature. Handing it over authorizes redemption.
contract LiberGhostVault is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    uint256 public constant MIN_VALIDITY = 300;
    uint256 public constant MAX_VALIDITY = 7 days;
    uint256 public constant MAX_AMOUNT = 1_000 ether;
    bytes32 public constant VOUCHER_TYPEHASH = keccak256(
        "GhostVoucher(address owner,address merchant,uint256 amount,uint64 validBefore,bytes32 salt)"
    );

    struct GhostVoucher { address owner; address merchant; uint256 amount; uint64 validBefore; bytes32 salt; }
    enum ReservationStatus { Unknown, Reserved, Redeemed, Reclaimed }
    struct Reservation { address owner; address merchant; uint256 amount; uint64 validBefore; ReservationStatus status; }
    mapping(bytes32 => Reservation) public reservations;
    mapping(bytes32 => bool) public usedOwnerSalts;
    uint256 public totalReserved;

    event VoucherReserved(bytes32 indexed voucherId, address indexed owner, address indexed merchant, uint256 amount, uint64 validBefore, bytes32 salt);
    event VoucherRedeemed(bytes32 indexed voucherId, address indexed owner, address indexed merchant, uint256 amount);
    event VoucherReclaimed(bytes32 indexed voucherId, address indexed owner, uint256 amount);

    error WrongChain(); error InvalidToken(); error InvalidDecimals();
    error InvalidOwner(); error InvalidMerchant(); error InvalidAmount(); error InvalidExpiry();
    error SaltAlreadyUsed(); error VoucherAlreadyExists(); error UnknownVoucher();
    error VoucherNotReserved(); error NotOwner(); error NotMerchant();
    error VoucherExpired(); error VoucherNotExpired(); error InvalidVoucherSignature();
    error ReservationMismatch(); error UnsupportedToken();

    constructor(address token_) EIP712("LiberGhost", "1") {
        if (block.chainid != 97) revert WrongChain();
        if (token_ == address(0) || token_.code.length == 0) revert InvalidToken();
        if (IERC20Metadata(token_).decimals() != 18) revert InvalidDecimals();
        token = IERC20(token_);
    }

    function hashVoucher(GhostVoucher calldata v) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(VOUCHER_TYPEHASH, v.owner, v.merchant, v.amount, v.validBefore, v.salt)));
    }

    function reserve(GhostVoucher calldata v) external nonReentrant {
        if (v.owner == address(0) || msg.sender != v.owner) revert InvalidOwner();
        if (v.merchant == address(0) || v.merchant == v.owner || v.merchant == address(this) || v.merchant == address(token)) revert InvalidMerchant();
        if (v.amount == 0 || v.amount > MAX_AMOUNT) revert InvalidAmount();
        if (uint256(v.validBefore) < block.timestamp + MIN_VALIDITY || uint256(v.validBefore) > block.timestamp + MAX_VALIDITY) revert InvalidExpiry();
        bytes32 id = hashVoucher(v);
        if (reservations[id].status != ReservationStatus.Unknown) revert VoucherAlreadyExists();
        bytes32 key = keccak256(abi.encode(v.owner, v.salt));
        if (usedOwnerSalts[key]) revert SaltAlreadyUsed();
        usedOwnerSalts[key] = true;
        reservations[id] = Reservation(v.owner, v.merchant, v.amount, v.validBefore, ReservationStatus.Reserved);
        totalReserved += v.amount;
        uint256 beforeBalance = token.balanceOf(address(this));
        token.safeTransferFrom(v.owner, address(this), v.amount);
        uint256 afterBalance = token.balanceOf(address(this));
        if (afterBalance < beforeBalance || afterBalance - beforeBalance != v.amount) revert UnsupportedToken();
        emit VoucherReserved(id, v.owner, v.merchant, v.amount, v.validBefore, v.salt);
    }

    function redeem(GhostVoucher calldata v, bytes calldata signature) external nonReentrant {
        bytes32 id = hashVoucher(v);
        Reservation storage r = _reserved(id);
        if (v.owner != r.owner || v.merchant != r.merchant || v.amount != r.amount || v.validBefore != r.validBefore) revert ReservationMismatch();
        if (msg.sender != r.merchant) revert NotMerchant();
        if (block.timestamp >= r.validBefore) revert VoucherExpired();
        if (signature.length != 65 || ECDSA.recover(id, signature) != r.owner) revert InvalidVoucherSignature();
        r.status = ReservationStatus.Redeemed;
        totalReserved -= r.amount;
        _transferExact(r.merchant, r.amount);
        emit VoucherRedeemed(id, r.owner, r.merchant, r.amount);
    }

    function reclaim(bytes32 id) external nonReentrant {
        Reservation storage r = _reserved(id);
        if (msg.sender != r.owner) revert NotOwner();
        if (block.timestamp < r.validBefore) revert VoucherNotExpired();
        r.status = ReservationStatus.Reclaimed;
        totalReserved -= r.amount;
        _transferExact(r.owner, r.amount);
        emit VoucherReclaimed(id, r.owner, r.amount);
    }

    function _reserved(bytes32 id) private view returns (Reservation storage r) {
        r = reservations[id];
        if (r.status == ReservationStatus.Unknown) revert UnknownVoucher();
        if (r.status != ReservationStatus.Reserved) revert VoucherNotReserved();
    }

    function _transferExact(address recipient, uint256 amount) private {
        uint256 vaultBefore = token.balanceOf(address(this));
        uint256 recipientBefore = token.balanceOf(recipient);
        token.safeTransfer(recipient, amount);
        uint256 vaultAfter = token.balanceOf(address(this));
        uint256 recipientAfter = token.balanceOf(recipient);
        if (vaultAfter > vaultBefore || vaultBefore - vaultAfter != amount || recipientAfter < recipientBefore || recipientAfter - recipientBefore != amount) revert UnsupportedToken();
    }
}
