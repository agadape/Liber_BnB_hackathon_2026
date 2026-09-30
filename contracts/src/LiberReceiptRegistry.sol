// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Timestamped receipt hashes. This registry does not verify fiat payment or move money.
contract LiberReceiptRegistry {
    struct Record { address recorder; uint64 recordedAt; bool sandbox; }
    mapping(bytes32 => Record) public records;
    event ReceiptRecorded(bytes32 indexed commitment, address indexed recorder, bool sandbox);
    error InvalidCommitment();
    error AlreadyRecorded();
    constructor() { require(block.chainid == 97, "BSC testnet only"); }
    function record(bytes32 commitment, bool sandbox) external {
        if (commitment == bytes32(0)) revert InvalidCommitment();
        if (records[commitment].recorder != address(0)) revert AlreadyRecorded();
        records[commitment] = Record(msg.sender, uint64(block.timestamp), sandbox);
        emit ReceiptRecorded(commitment, msg.sender, sandbox);
    }
}
