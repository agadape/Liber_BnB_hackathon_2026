// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Test-only USDC stand-in for BSC testnet (chainId 97). 18 decimals, matching
///         Binance-Peg USDC on BSC mainnet. Anyone can mint via `faucet` — never deploy to mainnet.
contract MockUSDC is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1_000 ether;

    constructor() ERC20("Mock USD Coin", "USDC") {}

    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
