// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "./KrystalCollectiblesStorage.sol";
import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";

contract KrystalCollectibles is TransparentUpgradeableProxy, KrystalCollectiblesStorage {
    constructor(
        address _logic,
        address _admin,
        bytes memory _data,
        string memory _uri,
        string memory _name,
        string memory _symbol
    )
        TransparentUpgradeableProxy(_logic, _admin, _data)
        KrystalCollectiblesStorage(_uri, _name, _symbol)
    {}
}
