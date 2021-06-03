pragma solidity 0.7.6;

import "../interfaces/IPancakeRouter02.sol";
import "../swap/ISwap.sol";
import "../lending/ILending.sol";
import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";

interface ISmartWalletImplementation {
    enum FeeMode { FROM_SOURCE, FROM_DEST, BY_PROTOCOL }

    event Swap(
        address indexed trader,
        address indexed swapContract,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        uint256 platformFeeBps,
        address platformWallet,
        FeeMode feeMode
    );

    function getExpectedReturn(
        ISwap swapContract,
        uint256 srcAmount,
        address[] calldata tradePath,
        uint256 platformFeeBps,
        FeeMode feeMode
    ) external view returns (uint256 destAmount, uint256 expectedRate);

    function swap(
        ISwap swapContract,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        uint256 platformFeeBps,
        address payable platformWallet,
        FeeMode feeMode,
        bytes calldata extraArgs
    ) external payable returns (uint256 destAmount);

    // function swapAndDeposit(
    //     ISwap swapContract,
    //     ILending lendingContract,
    //     uint256 srcAmount,
    //     uint256 minDestAmount,
    //     address[] calldata tradePath,
    //     uint256 platformFeeBps,
    //     address payable platformWallet,
    //     FeeMode feeMode,
    //     bytes calldata extraArgs
    // ) external payable returns (uint256 destAmount);

    // function withdrawFromLendingPlatform(
    //     ILending lendingContract,
    //     IERC20Ext token,
    //     uint256 amount,
    //     uint256 minReturn,
    //     bytes calldata extraArgs
    // ) external returns (uint256 returnedAmount);

    // function swapAndRepay(
    //     ISwap swapContract,
    //     ILending lendingContract,
    //     uint256 srcAmount,
    //     uint256 payAmount,
    //     address[] calldata tradePath,
    //     uint256 platformFeeBps,
    //     address payable platformWallet,
    //     FeeMode feeMode,
    //     bytes calldata extraArgs
    // ) external payable returns (uint256 destAmount);

    function claimPlatformFees(address[] calldata platformWallets, IERC20Ext[] calldata tokens)
        external;
}
