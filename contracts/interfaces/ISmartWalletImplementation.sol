pragma solidity 0.7.6;

import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";

interface ISmartWalletImplementation {
    enum FeeMode {FROM_SOURCE, FROM_DEST, BY_PROTOCOL}

    event Swap(
        address indexed trader,
        address indexed swapContract,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        uint256 platformFee,
        address platformWallet
    );

    event SwapAndDeposit(
        address indexed trader,
        address indexed swapContract,
        address indexed lendingContract,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        uint256 platformFee,
        address platformWallet
    );

    event WithdrawFromLending(
        address indexed trader,
        address indexed lendingContract,
        IERC20Ext token,
        uint256 amount,
        uint256 minReturn,
        uint256 actualReturnAmount
    );

    event SwapAndRepay(
        address indexed trader,
        address indexed swapContract,
        address indexed lendingContract,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        uint256 payAmount,
        uint256 feeAndRateMode,
        address platformWallet
    );

    function getExpectedReturn(
        address payable swapContract,
        uint256 srcAmount,
        address[] calldata tradePath,
        uint256 platformFee,
        bytes calldata extraArgs
    ) external view returns (uint256 destAmount, uint256 expectedRate);

    function swap(
        address payable swapContract,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        uint256 platformFee,
        address payable platformWallet,
        bytes calldata extraArgs
    ) external payable returns (uint256 destAmount);

    function swapAndDeposit(
        address payable swapContract,
        address payable lendingContract,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        uint256 platformFee,
        address payable platformWallet,
        bytes calldata extraArgs
    ) external payable returns (uint256 destAmount);

    function withdrawFromLendingPlatform(
        address payable lendingContract,
        IERC20Ext token,
        uint256 amount,
        uint256 minReturn
    ) external returns (uint256 returnedAmount);

    function swapAndRepay(
        address payable swapContract,
        address payable lendingContract,
        uint256 srcAmount,
        uint256 payAmount,
        address[] calldata tradePath,
        uint256 feeAndRateMode,
        address payable platformWallet,
        bytes calldata extraArgs
    ) external payable returns (uint256 destAmount);

    function claimPlatformFees(address[] calldata platformWallets, IERC20Ext[] calldata tokens)
        external;
}
