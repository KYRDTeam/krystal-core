// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.5.0;

interface IThrusterPoolDeployer {
    /// @return Returns the address of the Uniswap V3 factory
    function factory() external view returns (address);
}
