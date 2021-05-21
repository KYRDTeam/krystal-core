// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@kyber.network/utils-sc/contracts/IBEP20.sol";
import "./interfaces/ISmartWalletSwapImplementation.sol";
import "./interfaces/IPancakeRouter02.sol";
import "./SmartWalletSwapStorage.sol";

contract SmartWalletSwapImplementation is SmartWalletSwapStorage, ISmartWalletSwapImplementation {
    using SafeERC20 for IBEP20;
    using SafeMath for uint256;

    event UpdatedSupportedPlatformWallets(address[] wallets, bool isSupported);
    event ApprovedAllowances(IBEP20[] tokens, address[] spenders, bool isReset);
    event ClaimedPlatformFees(address[] wallets, IBEP20[] tokens, address claimer);

    struct TradeInput {
        uint256 srcAmount;
        uint256 minData; // min return for Pancake
        address payable recipient;
        uint256 platformFeeBps;
        address payable platformWallet;
    }

    constructor(address _admin) SmartWalletSwapStorage(_admin) {}

    receive() external payable {}

    /// @dev to prevent other integrations to call trade from this contract
    function updateSupportedPlatformWallets(address[] calldata wallets, bool isSupported)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < wallets.length; i++) {
            supportedPlatformWallets[wallets[i]] = isSupported;
        }
        emit UpdatedSupportedPlatformWallets(wallets, isSupported);
    }

    /// Claim fee to platform wallets
    /// @dev set fee to 1 to avoid the SSTORE initial gas cost
    function claimPlatformFees(address[] calldata platformWallets, IBEP20[] calldata tokens)
        external
        override
        nonReentrant
    {
        for (uint256 i = 0; i < platformWallets.length; i++) {
            for (uint256 j = 0; j < tokens.length; j++) {
                uint256 fee = platformWalletFees[platformWallets[i]][tokens[j]];
                if (fee > 1) {
                    platformWalletFees[platformWallets[i]][tokens[j]] = 1;
                    transferToken(payable(platformWallets[i]), tokens[j], fee - 1);
                }
            }
        }
        emit ClaimedPlatformFees(platformWallets, tokens, msg.sender);
    }

    /// Approve LPs usage on the particular tokens
    function approveAllowances(
        IBEP20[] calldata tokens,
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

    /// ========== SWAP ========== ///

    /// @dev swap token via a supported PancakeSwap router
    /// @notice for some tokens that are paying fee, for example: DGX
    /// contract will trade with received src token amount (after minus fee)
    /// for PancakeSwap, fee will be taken in src token
    function swapPancake(
        IPancakeRouter02 router,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        address payable recipient,
        uint256 platformFeeBps,
        address payable platformWallet,
        bool feeInSrc
    ) external payable override nonReentrant returns (uint256 destAmount) {
        {
            // prevent stack too deep
            destAmount = swapPancakeInternal(
                router,
                srcAmount,
                minDestAmount,
                tradePath,
                recipient,
                platformFeeBps,
                platformWallet,
                feeInSrc
            );
        }

        emit PancakeTrade(
            msg.sender,
            address(router),
            tradePath,
            srcAmount,
            destAmount,
            recipient,
            platformFeeBps,
            platformWallet,
            feeInSrc
        );
    }
    /// @dev get expected return and conversion rate if using a Pancake router
    function getExpectedReturnPancake(
        IPancakeRouter02 router,
        uint256 srcAmount,
        address[] calldata tradePath,
        uint256 platformFee,
        bool feeInSrc
    ) external view override returns (uint256 destAmount, uint256 expectedRate) {
        if (platformFee >= BPS) return (0, 0); // platform fee is too high
        if (!pancakeRouters[router]) return (0, 0); // router is not supported

        uint256 srcAmountAfterFee = feeInSrc ? srcAmount * (BPS - platformFee) / BPS : srcAmount;
        if (srcAmountAfterFee == 0) return (0, 0);

        // in case pair is not supported
        try router.getAmountsOut(srcAmountAfterFee, tradePath) returns (uint256[] memory amounts) {
            destAmount = amounts[tradePath.length - 1];
        } catch {
            destAmount = 0;
        }

        if (!feeInSrc) {
            destAmount = destAmount * (BPS - platformFee) / BPS;
        }

        expectedRate = calcRateFromQty(
            srcAmountAfterFee,
            destAmount,
            getDecimals(IBEP20(tradePath[0])),
            getDecimals(IBEP20(tradePath[tradePath.length - 1]))
        );
    }

    function swapPancakeInternal(
        IPancakeRouter02 router,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] memory tradePath,
        address payable recipient,
        uint256 platformFeeBps,
        address payable platformWallet,
        bool feeInSrc
    ) internal returns (uint256 destAmount) {
        TradeInput memory input =
            TradeInput({
                srcAmount: srcAmount,
                minData: minDestAmount,
                recipient: recipient,
                platformFeeBps: platformFeeBps,
                platformWallet: platformWallet
            });

        // extra validation when swapping on Pancake
        require(pancakeRouters[router], "unsupported router");
        require(platformFeeBps < BPS, "high platform fee");

        IBEP20 src = IBEP20(tradePath[0]);

        input.srcAmount = validateAndPrepareSourceAmount(
            address(router),
            src,
            srcAmount,
            platformWallet
        );

        destAmount = doPancakeTrade(router, src, tradePath, input, feeInSrc);
    }

    function doPancakeTrade(
        IPancakeRouter02 router,
        IBEP20 src,
        address[] memory tradePath,
        TradeInput memory input,
        bool feeInSrc
    ) internal virtual returns (uint256 destAmount) {
        uint256 tradeLen = tradePath.length;
        IBEP20 actualDest = IBEP20(tradePath[tradeLen - 1]);
        {
            // convert bnb -> wbnb address to trade on Pancake
            if (tradePath[0] == address(BNB_TOKEN_ADDRESS)) {
                tradePath[0] = router.WETH();
            }
            if (tradePath[tradeLen - 1] == address(BNB_TOKEN_ADDRESS)) {
                tradePath[tradeLen - 1] = router.WETH();
            }
        }

        uint256 srcAmountFee;
        uint256 srcAmountAfterFee;
        address recipient;

        if (feeInSrc) {
            srcAmountFee = input.srcAmount.mul(input.platformFeeBps).div(BPS);
            srcAmountAfterFee = input.srcAmount.sub(srcAmountFee);
            recipient = input.recipient;
        } else {
            srcAmountAfterFee = input.srcAmount;
            recipient = address(this);
        }

        uint256 destBalanceBefore = getBalance(actualDest, recipient);
        
        if (src == BNB_TOKEN_ADDRESS) {
            // swap bnb -> token
            router.swapExactETHForTokensSupportingFeeOnTransferTokens{value: srcAmountAfterFee}(
                input.minData,
                tradePath,
                recipient,
                MAX_AMOUNT
            );
        } else {
            if (actualDest == BNB_TOKEN_ADDRESS) {
                // swap token -> bnb
                router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    srcAmountAfterFee,
                    input.minData,
                    tradePath,
                    recipient,
                    MAX_AMOUNT
                );
            } else {
                // swap token -> token
                router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    srcAmountAfterFee,
                    input.minData,
                    tradePath,
                    recipient,
                    MAX_AMOUNT
                );
            }
        }

        uint256 destBalanceAfter = getBalance(actualDest, recipient);
        destAmount = destBalanceAfter.sub(destBalanceBefore);

        if (!feeInSrc) {
            // fee in dest token, calculated received dest amount
            uint256 destAmountFee = destAmount.mul(input.platformFeeBps).div(BPS);
            // charge fee in dest token
            addFeeToPlatform(input.platformWallet, actualDest, destAmountFee);
            // transfer back dest token to recipient
            destAmount = destAmount.sub(destAmountFee);
            transferToken(input.recipient, actualDest, destAmount);
        } else {
            // fee in src amount
            addFeeToPlatform(input.platformWallet, src, srcAmountFee);
        }
    }

    function validateAndPrepareSourceAmount(
        address protocol,
        IBEP20 src,
        uint256 srcAmount,
        address platformWallet
    ) internal virtual returns (uint256 actualSrcAmount) {
        require(supportedPlatformWallets[platformWallet], "unsupported platform wallet");
        if (src == BNB_TOKEN_ADDRESS) {
            require(msg.value == srcAmount, "wrong msg value");
            actualSrcAmount = srcAmount;
        } else {
            require(msg.value == 0, "bad msg value");
            uint256 balanceBefore = src.balanceOf(address(this));
            src.safeTransferFrom(msg.sender, address(this), srcAmount);
            actualSrcAmount = src.balanceOf(address(this)).sub(balanceBefore);
            require(actualSrcAmount > 0, "invalid src amount");

            safeApproveAllowance(protocol, src);
        }
    }

    function addFeeToPlatform(
        address platformWallet,
        IBEP20 token,
        uint256 amount
    ) internal {
        if (amount > 0) {
            platformWalletFees[platformWallet][token] = platformWalletFees[platformWallet][token].add(amount);
        }
    }

    function transferToken(
        address payable recipient,
        IBEP20 token,
        uint256 amount
    ) internal {
        if (amount == 0) return;
        if (token == BNB_TOKEN_ADDRESS) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "failed to transfer BNB");
        } else {
            token.safeTransfer(recipient, amount);
        }
    }

    function safeApproveAllowance(address spender, IBEP20 token) internal {
        if (token.allowance(address(this), spender) == 0) {
            getSetDecimals(token);
            token.safeApprove(spender, MAX_ALLOWANCE);
        }
    }
}
