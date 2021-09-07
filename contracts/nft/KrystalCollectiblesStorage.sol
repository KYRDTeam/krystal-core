// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/presets/ERC1155PresetMinterPauser.sol";

contract KrystalCollectiblesStorage is ERC1155PresetMinterPauser, ReentrancyGuard {
    string public name;
    string public symbol;
    string public tokenUriPrefix;

    constructor(
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC1155PresetMinterPauser(_uri) {
        name = _name;
        symbol = _symbol;
        tokenUriPrefix = _uri;
    }
}
