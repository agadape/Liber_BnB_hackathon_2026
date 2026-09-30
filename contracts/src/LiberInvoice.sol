// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Testnet invoices. Tokens go directly from payer to merchant; no custody or QRIS settlement.
contract LiberInvoice is ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    struct Invoice { address merchant; uint256 amount; uint64 expiresAt; bool paid; bool cancelled; address payer; }
    mapping(bytes32 => Invoice) public invoices;
    event InvoiceCreated(bytes32 indexed id, address indexed merchant, uint256 amount, uint64 expiresAt);
    event InvoicePaid(bytes32 indexed id, address indexed merchant, address indexed payer, uint256 amount);
    event InvoiceCancelled(bytes32 indexed id);
    error InvalidInvoice();
    error NotPayable();
    error NotMerchant();
    error UnsupportedToken();

    constructor(address token_) {
        require(block.chainid == 97, "BSC testnet only");
        require(token_ != address(0) && token_.code.length > 0, "Invalid token");
        token = IERC20(token_);
    }

    function createInvoice(bytes32 nonce, uint256 amount, uint64 expiresAt) external returns (bytes32 id) {
        if (amount == 0 || expiresAt <= block.timestamp || expiresAt > block.timestamp + 7 days) revert InvalidInvoice();
        id = keccak256(abi.encode(block.chainid, address(this), msg.sender, nonce));
        if (invoices[id].merchant != address(0)) revert InvalidInvoice();
        invoices[id] = Invoice(msg.sender, amount, expiresAt, false, false, address(0));
        emit InvoiceCreated(id, msg.sender, amount, expiresAt);
    }

    function payInvoice(bytes32 id) external nonReentrant {
        Invoice storage invoice = invoices[id];
        if (invoice.merchant == address(0) || invoice.paid || invoice.cancelled || block.timestamp >= invoice.expiresAt || msg.sender == invoice.merchant) revert NotPayable();
        invoice.paid = true;
        invoice.payer = msg.sender;
        uint256 beforeBalance = token.balanceOf(invoice.merchant);
        token.safeTransferFrom(msg.sender, invoice.merchant, invoice.amount);
        if (token.balanceOf(invoice.merchant) - beforeBalance != invoice.amount) revert UnsupportedToken();
        emit InvoicePaid(id, invoice.merchant, msg.sender, invoice.amount);
    }

    function cancelInvoice(bytes32 id) external {
        Invoice storage invoice = invoices[id];
        if (invoice.merchant != msg.sender) revert NotMerchant();
        if (invoice.paid || invoice.cancelled) revert NotPayable();
        invoice.cancelled = true;
        emit InvoiceCancelled(id);
    }
}
