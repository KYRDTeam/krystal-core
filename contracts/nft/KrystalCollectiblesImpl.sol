// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "./KrystalCollectiblesStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract KrystalCollectiblesImpl is KrystalCollectiblesStorage {
    using Strings for uint256;

    // Set to empty as this is just the implementation contract
    constructor() KrystalCollectiblesStorage("", "", "") {}

    // Overriding original ERC-1155 format
    function uri(uint256 tokenId) external view override returns (string memory) {
        return string(abi.encodePacked(tokenUriPrefix, tokenId.toString()));
    }

    // ERC-721 Compatible
    function tokenUri(uint256 tokenId) external view returns (string memory) {
        return string(abi.encodePacked(tokenUriPrefix, tokenId.toString()));
    }
}
