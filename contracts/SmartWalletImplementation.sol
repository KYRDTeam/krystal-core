// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";
import "./interfaces/ISmartWalletImplementation.sol";
import "./SmartWalletStorage.sol";

contract SmartWalletImplementation is SmartWalletStorage, ISmartWalletImplementation {
    using SafeERC20 for IERC20Ext;
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    event ApprovedAllowances(IERC20Ext[] tokens, address[] spenders, bool isReset);
    event ClaimedPlatformFees(address[] wallets, IERC20Ext[] tokens, address claimer);

    constructor(address _admin) SmartWalletStorage(_admin) {}

    receive() external payable {}

    /// Claim fee to platform wallets
    /// @dev set fee to 1 to avoid the SSTORE initial gas cost
    function claimPlatformFees(address[] calldata platformWallets, IERC20Ext[] calldata tokens)
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

    /// ========== SWAP ========== ///

    /// get expected return, after deducting the fee
    function getExpectedReturn(
        ISwap swapContract,
        uint256 srcAmount,
        address[] calldata tradePath,
        uint256 platformFeeBps,
        FeeMode feeMode,
        bytes calldata extraArgs
    ) external view override returns (uint256 destAmount, uint256 expectedRate) {
        if (platformFeeBps >= BPS) return (0, 0); // platform fee is too high
        
        if (feeMode == FeeMode.FROM_SOURCE) {
            srcAmount = srcAmount * (BPS - platformFeeBps) / BPS;
        }

        destAmount = swapContract.getExpectedReturn(srcAmount, tradePath, extraArgs);

        if (feeMode == FeeMode.FROM_DEST) {
            destAmount = destAmount * (BPS - platformFeeBps) / BPS;
        }

        expectedRate = calcRateFromQty(
            srcAmount,
            destAmount,
            getDecimals(IERC20Ext(tradePath[0])),
            getDecimals(IERC20Ext(tradePath[tradePath.length - 1]))
        );
    }

    /// swap using the supported swapContract.
    /// fee can be taken either from source, dest or by the swap protocol
    function swap(
        ISwap swapContract,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        uint256 platformFeeBps,
        address payable platformWallet,
        FeeMode feeMode,
        bytes calldata extraArgs
    ) external payable override nonReentrant returns (uint256 destAmount) {
        require(supportedSwaps.contains(address(swapContract)), "unsupported swap");
        require(tradePath.length >= 2, "invalid tradePath");
        require(platformFeeBps < BPS, "high platform fee");
        validateSourceAmount(IERC20Ext(tradePath[0]), srcAmount);

        {   
            // prevent stack too deep
            uint256 actualSrcAmount = safeTransferWithFee(
                msg.sender, 
                payable(address(swapContract)), 
                IERC20Ext(tradePath[0]), 
                srcAmount,
                 
                feeMode == FeeMode.FROM_SOURCE ? platformFeeBps : 0, 
                platformWallet
            );

            // who will receive the swapped token
            address recipient = feeMode == FeeMode.FROM_DEST ? address(this) : msg.sender;
            destAmount = swapContract.swap(actualSrcAmount, minDestAmount, tradePath, recipient, extraArgs);

            if (feeMode == FeeMode.FROM_DEST) {
                destAmount = safeTransferWithFee(
                    address(this), 
                    msg.sender,
                    IERC20Ext(tradePath[tradePath.length - 1]), 
                    destAmount, 
                    platformFeeBps, 
                    platformWallet
                );         
            }
        }

        emit Swap(
            msg.sender,
            address(swapContract),
            tradePath,
            srcAmount,
            destAmount,
            platformFeeBps,
            platformWallet,
            feeMode
        );
    }

    // function swapAndDeposit(
    //     ISwap swapContract,
    //     ILending lendingContract,
    //     uint256 srcAmount,
    //     uint256 minDestAmount,
    //     address[] calldata tradePath,
    //     address payable recipient,
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

    // function claimPlatformFees(address[] calldata platformWallets, IERC20Ext[] calldata tokens)
    //     external;




    function validateSourceAmount(
        IERC20Ext srcToken,
        uint256 srcAmount
    ) internal {
        if (srcToken == ETH_TOKEN_ADDRESS) {
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
        IERC20Ext token,
        uint256 amount,
        uint256 platformFeeBps,
        address payable platformWallet
    ) internal returns (uint256 amountTransferred) {
        uint256 fee = amount.mul(platformFeeBps).div(BPS);
        uint256 amountAfterFee = amount.sub(fee);

        if (token == ETH_TOKEN_ADDRESS) {
            (bool success, ) = to.call{value: amountAfterFee}("");
            require(success, "transfer failed");
            amountTransferred = amountAfterFee;
        } else {
            uint256 balanceBefore = token.balanceOf(to);
            if (from != address(this)) {
                // case transfer from another address, need to transfer fee to this proxy contract
                token.safeTransferFrom(from, to, amountAfterFee);
                token.safeTransferFrom(from, address(this), fee);
            } else {
                token.safeTransfer(to, amountAfterFee);
            }
            amountTransferred = token.balanceOf(to).sub(balanceBefore);
        }

        addFeeToPlatform(platformWallet, token, fee);
    }

    function addFeeToPlatform(
        address payable platformWallet,
        IERC20Ext token,
        uint256 amount
    ) internal {
        if (amount > 0) {
            require(supportedPlatformWallets.contains(address(platformWallet)), "unsupported platform");
            platformWalletFees[platformWallet][token] = platformWalletFees[platformWallet][token].add(amount);
        }
    }
}
