pragma solidity 0.7.6;

import "../lending/ISmartWalletLending.sol";
import "../interfaces/IPancakeRouter02.sol";
import "@kyber.network/utils-sc/contracts/IBEP20.sol";

interface ISmartWalletSwapImplementation {
    event PancakeTrade(
        address indexed trader,
        address indexed router,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        address recipient,
        uint256 platformFeeBps,
        address platformWallet,
        bool feeInSrc
    );

    event PancakeTradeAndDeposit(
        address indexed trader,
        ISmartWalletLending.LendingPlatform indexed platform,
        IPancakeRouter02 indexed router,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        uint256 platformFeeBps,
        address platformWallet
    );

    event BorrowFromLending(
        ISmartWalletLending.LendingPlatform indexed platform,
        IBEP20 token,
        uint256 amountBorrowed,
        uint256 interestRateMode
    );

    event WithdrawFromLending(
        ISmartWalletLending.LendingPlatform indexed platform,
        IBEP20 token,
        uint256 amount,
        uint256 minReturn,
        uint256 actualReturnAmount
    );

    event PancakeTradeAndRepay(
        address indexed trader,
        ISmartWalletLending.LendingPlatform indexed platform,
        IPancakeRouter02 indexed router,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        uint256 payAmount,
        uint256 feeAndRateMode,
        address platformWallet
    );

    function getExpectedReturnPancake(
        IPancakeRouter02 router,
        uint256 srcAmount,
        address[] calldata tradePath,
        uint256 platformFeeBps
    ) external view returns (uint256 destAmount, uint256 expectedRate);

    function swapPancake(
        IPancakeRouter02 router,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        address payable recipient,
        uint256 platformFeeBps,
        address payable platformWallet,
        bool feeInSrc
    ) external payable returns (uint256 destAmount);

    function swapPancakeAndDeposit(
        ISmartWalletLending.LendingPlatform platform,
        IPancakeRouter02 router,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        uint256 platformFeeBps,
        address payable platformWallet
    ) external payable returns (uint256 destAmount);

    function withdrawFromLendingPlatform(
        ISmartWalletLending.LendingPlatform platform,
        IBEP20 token,
        uint256 amount,
        uint256 minReturn
    ) external returns (uint256 returnedAmount);

    function swapPancakeAndRepay(
        ISmartWalletLending.LendingPlatform platform,
        IPancakeRouter02 router,
        uint256 srcAmount,
        uint256 payAmount,
        address[] calldata tradePath,
        uint256 feeAndRateMode, // fee: feeAndRateMode % BPS, rateMode: feeAndRateMode / BPS
        address payable platformWallet
    ) external payable returns (uint256 destAmount);

    function claimPlatformFees(address[] calldata platformWallets, IBEP20[] calldata tokens)
        external;
}
