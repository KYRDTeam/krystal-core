// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "./KrystalCharacterStorage.sol";
import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";

contract KrystalCharacterProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address _admin,
        bytes memory _data
    ) TransparentUpgradeableProxy(_logic, _admin, _data) {}
}
