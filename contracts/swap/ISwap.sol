// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

interface ISwap {
    function getExpectedReturn(
        uint256 srcAmount,
        address[] calldata tradePath,
        bytes calldata extraArgs
    ) external view returns (
        uint256 destAmount
    );

    function swap(
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        address recipient,
        bytes calldata extraArgs
    ) external payable returns (uint256 destAmount);
}
