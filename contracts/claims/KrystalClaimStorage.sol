// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract KrystalClaimStorage is AccessControlUpgradeable, PausableUpgradeable {
    address internal constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    uint256 public chainId;

    // Backend signer for verifying the claim
    address public verifier;

    // Additional protection: Max amount token per claim
    mapping(address => uint256) public claimCap;

    mapping(uint256 => bool) public claimed;
}
