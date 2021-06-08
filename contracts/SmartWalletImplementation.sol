// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";
import "./interfaces/ISmartWalletImplementation.sol";
import "./SmartWalletStorage.sol";
import "./swap/ISwap.sol";
import "./lending/ILending.sol";

contract SmartWalletImplementation is SmartWalletStorage, ISmartWalletImplementation {
    using SafeERC20 for IERC20Ext;
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    event ApprovedAllowances(IERC20Ext[] tokens, address[] spenders, bool isReset);
    event ClaimedPlatformFees(address[] wallets, IERC20Ext[] tokens, address claimer);

    constructor(address _admin) SmartWalletStorage(_admin) {}

    receive() external payable {}

    /// Claim fee to platform wallets
    function claimPlatformFees(address[] calldata platformWallets, IERC20Ext[] calldata tokens)
        external
        override
        nonReentrant
    {
        for (uint256 i = 0; i < platformWallets.length; i++) {
            for (uint256 j = 0; j < tokens.length; j++) {
                uint256 fee = platformWalletFees[platformWallets[i]][tokens[j]];
                if (fee > 1) {
                    // fee set to 1 to avoid the SSTORE initial gas cost
                    platformWalletFees[platformWallets[i]][tokens[j]] = 1;
                    transferToken(payable(platformWallets[i]), tokens[j], fee - 1);
                }
            }
        }
        emit ClaimedPlatformFees(platformWallets, tokens, msg.sender);
    }

    /// @dev approve/unapprove LPs usage on the particular tokens
    function approveAllowances(
        IERC20Ext[] calldata tokens,
        address[] calldata spenders,
        bool isReset
    ) external onlyAdmin {
        uint256 allowance = isReset ? 0 : MAX_ALLOWANCE;
        for (uint256 i = 0; i < tokens.length; i++) {
            for (uint256 j = 0; j < spenders.length; j++) {
                tokens[i].safeApprove(spenders[j], allowance);
            }
            getSetDecimals(tokens[i]);
        }

        emit ApprovedAllowances(tokens, spenders, isReset);
    }

    /// @dev get expected return including the fee
    /// @param swapContract swap contract
    /// @param srcAmount amount of src token
    /// @param tradePath path of the trade on Uniswap
    /// @param platformFee fee if swapping feeMode = platformFee / BPS, feeBps = platformFee % BPS
    /// @param extraArgs extra data needed for swap on particular platforms
    /// @return destAmount expected dest amount
    /// @return expectedRate expected swap rate
    function getExpectedReturn(
        address payable swapContract,
        uint256 srcAmount,
        address[] calldata tradePath,
        uint256 platformFee,
        bytes calldata extraArgs
    ) external view override returns (uint256 destAmount, uint256 expectedRate) {
        FeeMode feeMode = FeeMode(platformFee / BPS);
        platformFee = platformFee % BPS;

        if (platformFee >= BPS) return (0, 0); // platform fee is too high
        
        if (feeMode == FeeMode.FROM_SOURCE) {
            srcAmount = srcAmount * (BPS - platformFee) / BPS;
        }

        destAmount = ISwap(swapContract).getExpectedReturn(srcAmount, tradePath, extraArgs);

        if (feeMode == FeeMode.FROM_DEST) {
            destAmount = destAmount * (BPS - platformFee) / BPS;
        }

        expectedRate = calcRateFromQty(
            srcAmount,
            destAmount,
            getDecimals(IERC20Ext(tradePath[0])),
            getDecimals(IERC20Ext(tradePath[tradePath.length - 1]))
        );
    }

    /// @dev swap using particular swap contract
    /// @param swapContract swap contract
    /// @param srcAmount amount of src token
    /// @param minDestAmount minimal accepted dest amount
    /// @param tradePath path of the trade on Uniswap
    /// @param platformFee fee if swapping feeMode = platformFee / BPS, feeBps = platformFee % BPS
    /// @param platformWallet wallet to receive fee
    /// @param extraArgs extra data needed for swap on particular platforms
    /// @return destAmount actual dest amount
    function swap(
        address payable swapContract,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        uint256 platformFee,
        address payable platformWallet,
        bytes calldata extraArgs
    ) external payable override nonReentrant returns (uint256 destAmount) {
        {   
            // prevent stack too deep
            destAmount = swapInternal(
                swapContract,
                srcAmount,
                minDestAmount,
                tradePath,
                msg.sender,
                platformFee,
                platformWallet,
                extraArgs
            );
        }

        emit Swap(
            msg.sender,
            swapContract,
            tradePath,
            srcAmount,
            destAmount,
            platformFee,
            platformWallet
        );
    }

    /// @dev swap then deposit to platform
    ///     if tradePath has only 1 token, don't need to do swap
    /// @param swapContract swap contract
    /// @param lendingContract lending contract
    /// @param srcAmount amount of src token
    /// @param minDestAmount minimal accepted dest amount
    /// @param tradePath path of the trade on Uniswap
    /// @param platformFee fee if swapping feeMode = platformFee / BPS, feeBps = platformFee % BPS
    /// @param platformWallet wallet to receive fee
    /// @param extraArgs extra data needed for swap on particular platforms
    /// @return destAmount actual dest amount
    function swapAndDeposit(
        address payable swapContract,
        address payable lendingContract,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        uint256 platformFee,
        address payable platformWallet,
        bytes calldata extraArgs
    ) external payable override nonReentrant returns (uint256 destAmount) {
        require(tradePath.length >= 1, "invalid tradePath");
        require(supportedLendings.contains(lendingContract), "unsupported lending");

        {
            if (tradePath.length == 1) {
                // just collect src token, no need to swap
                validateSourceAmount(tradePath[tradePath.length - 1], srcAmount);
                destAmount = safeTransferWithFee(
                    msg.sender, 
                    lendingContract, 
                    tradePath[tradePath.length - 1], 
                    srcAmount,
                    // Not taking lending fee
                    0, 
                    platformWallet
                );
            } else {
                swapInternal(
                    swapContract,
                    srcAmount,
                    minDestAmount,
                    tradePath,
                    lendingContract,
                    platformFee,
                    platformWallet,                    
                    extraArgs
                );
            }

            // eth or token already transferred to the address
            ILending(lendingContract).depositTo(msg.sender, IERC20Ext(tradePath[tradePath.length - 1]), destAmount);
        }
    
        emit SwapAndDeposit(
            msg.sender,
            swapContract,
            lendingContract,
            tradePath,
            srcAmount,
            destAmount,
            platformFee,
            platformWallet
        );
    }

    /// @dev withdraw token from Lending platforms (AAVE, COMPOUND)
    /// @param lendingContract lending contract to withdraw token
    /// @param token underlying token to withdraw, e.g ETH, USDT, DAI
    /// @param amount amount of cToken (COMPOUND) or aToken (AAVE) to withdraw
    /// @param minReturn minimum amount of USDT tokens to return
    /// @return returnedAmount returns the amount withdrawn to the user
    function withdrawFromLendingPlatform(
        address payable lendingContract,
        IERC20Ext token,
        uint256 amount,
        uint256 minReturn
    ) external override nonReentrant returns (uint256 returnedAmount) {
        require(supportedLendings.contains(lendingContract), "unsupported lending");
        
        IERC20Ext lendingToken = IERC20Ext(ILending(lendingContract).getLendingToken(token));
        require(lendingToken != IERC20Ext(0), "unsupported token");

        // AAVE aToken's transfer logic could have rounding errors
        uint256 tokenBalanceBefore = lendingToken.balanceOf(lendingContract);
        lendingToken.safeTransferFrom(msg.sender, lendingContract, amount);
        uint256 tokenBalanceAfter = lendingToken.balanceOf(lendingContract);

        returnedAmount = ILending(lendingContract).withdrawFrom(
            msg.sender,
            token,
            tokenBalanceAfter.sub(tokenBalanceBefore),
            minReturn
        );

        emit WithdrawFromLending(
            msg.sender,
            lendingContract,
            token,
            amount,
            minReturn,
            returnedAmount
        );
    }

    /// @dev swap and repay borrow for sender
    /// @param payAmount: amount that user wants to pay, if the dest amount (after swap) is higher,
    ///     the remain amount will be sent back to user's wallet
    /// @param feeAndRateMode: in case of aave v2, user needs to specify the rateMode to repay
    ///     to prevent stack too deep, combine fee and rateMode into a single value
    ///     rateMode: feeAndRateMode / BPS feeMode = feeAndRateMode / BPS / BPS, feeTplatformFee: feeAndRateMode % BPS
    function swapAndRepay(
        address payable swapContract,
        address payable lendingContract,
        uint256 srcAmount,
        uint256 payAmount,
        address[] calldata tradePath,
        uint256 feeAndRateMode,
        address payable platformWallet,
        bytes calldata extraArgs
    ) external payable override nonReentrant returns (uint256 destAmount) {
        require(tradePath.length >= 1, "invalid tradePath");
        require(supportedLendings.contains(lendingContract), "unsupported lending");
        {    
            // use user debt value if debt is <= payAmount
            // user can pay all debt by putting really high payAmount as param
            payAmount = checkUserDebt(lendingContract, tradePath[tradePath.length - 1], payAmount);
            
            if (tradePath.length == 1) {
                // just collect src token, no need to swap
                validateSourceAmount(tradePath[tradePath.length - 1], srcAmount);
                destAmount = safeTransferWithFee(
                    msg.sender, 
                    lendingContract, 
                    tradePath[tradePath.length - 1],
                    srcAmount,
                    // Not taking repay fee
                    0, 
                    platformWallet
                );
            } else {
                destAmount = swapInternal(
                    swapContract,
                    srcAmount,
                    payAmount,
                    tradePath,
                    lendingContract,
                    feeAndRateMode % (BPS * BPS),
                    platformWallet,                    
                    extraArgs
                );
            }
            {
                bytes memory lendingExtraArgs = new bytes(32);
                assembly { 
                    mstore(lendingExtraArgs, div(feeAndRateMode, BPS))
                }
                ILending(lendingContract).repayBorrowTo(
                    msg.sender,
                    IERC20Ext(tradePath[tradePath.length - 1]),
                    destAmount,
                    payAmount,
                    lendingExtraArgs
                );
            }
        }

        emit SwapAndRepay(
            msg.sender,
            swapContract,
            lendingContract,
            tradePath,
            srcAmount,
            destAmount,
            payAmount,
            feeAndRateMode,
            platformWallet
        );
    }

    function swapInternal(
        address payable swapContract,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        address payable recipient,
        uint256 platformFee,
        address payable platformWallet,
        bytes calldata extraArgs
    ) internal returns (uint256 destAmount) {
        require(supportedSwaps.contains(swapContract), "unsupported swap");
        require(tradePath.length >= 2, "invalid tradePath");

        FeeMode feeMode = FeeMode(platformFee / BPS);
        platformFee = platformFee % BPS;
        require(platformFee < BPS, "high platform fee");

        validateSourceAmount(tradePath[0], srcAmount);

        uint256 actualSrcAmount = safeTransferWithFee(
            msg.sender, 
            swapContract, 
            tradePath[0], 
            srcAmount,
            feeMode == FeeMode.FROM_SOURCE ? platformFee : 0, 
            platformWallet
        );

        {
            // to avoid stack too deep
            // who will receive the swapped token
            address _recipient = feeMode == FeeMode.FROM_DEST ? address(this) : recipient;
            destAmount = ISwap(swapContract).swap(actualSrcAmount, minDestAmount, tradePath, _recipient, extraArgs);
        }

        if (feeMode == FeeMode.FROM_DEST) {
            destAmount = safeTransferWithFee(
                address(this), 
                msg.sender,
                tradePath[tradePath.length - 1], 
                destAmount, 
                platformFee, 
                platformWallet
            );         
        }
    }

    function validateSourceAmount(
        address srcToken,
        uint256 srcAmount
    ) internal {
        if (IERC20Ext(srcToken) == ETH_TOKEN_ADDRESS) {
            require(msg.value == srcAmount, "wrong msg value");
        } else {
            require(msg.value == 0, "bad msg value");
        }
    }

    function transferToken(
        address payable to,
        IERC20Ext token,
        uint256 amount
    ) internal {
        if (amount == 0) return;
        if (token == ETH_TOKEN_ADDRESS) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "transfer failed");
        } else {
            token.safeTransfer(to, amount);
        }
    }

    function safeTransferWithFee(
        address payable from,
        address payable to,
        address token,
        uint256 amount,
        uint256 platformFeeBps,
        address payable platformWallet
    ) internal returns (uint256 amountTransferred) {
        uint256 fee = amount.mul(platformFeeBps).div(BPS);
        uint256 amountAfterFee = amount.sub(fee);
        IERC20Ext tokenErc = IERC20Ext(token);

        if (tokenErc == ETH_TOKEN_ADDRESS) {
            (bool success, ) = to.call{value: amountAfterFee}("");
            require(success, "transfer failed");
            amountTransferred = amountAfterFee;
        } else {
            uint256 balanceBefore = tokenErc.balanceOf(to);
            if (from != address(this)) {
                // case transfer from another address, need to transfer fee to this proxy contract
                tokenErc.safeTransferFrom(from, to, amountAfterFee);
                tokenErc.safeTransferFrom(from, address(this), fee);
            } else {
                tokenErc.safeTransfer(to, amountAfterFee);
            }
            amountTransferred = tokenErc.balanceOf(to).sub(balanceBefore);
        }

        addFeeToPlatform(platformWallet, tokenErc, fee);
    }

    function addFeeToPlatform(
        address payable platformWallet,
        IERC20Ext token,
        uint256 amount
    ) internal {
        if (amount > 0) {
            require(supportedPlatformWallets.contains(platformWallet), "unsupported platform");
            platformWalletFees[platformWallet][token] = platformWalletFees[platformWallet][token].add(amount);
        }
    }

    function checkUserDebt(
        address payable lendingContract,
        address token,
        uint256 amount
    ) internal returns (uint256) {
        uint256 debt = ILending(lendingContract).storeAndRetrieveUserDebtCurrent(token, msg.sender);
        return debt >= amount ? amount : debt;
    }
}
