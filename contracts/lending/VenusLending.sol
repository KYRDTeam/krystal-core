// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "../interfaces/IComptroller.sol";
import "../interfaces/IVBep20.sol";
import "./BaseLending.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";


contract VenusLending is BaseLending {
    using SafeERC20 for IERC20Ext;
    using SafeMath for uint256;

    struct VenusData {
        address comptroller;
        mapping(IERC20Ext => address) vTokens;
    }

    VenusData public venusData;

    event UpdatedVenusData(
        address comptroller,
        address vBnb,
        address[] vTokens,
        IERC20Ext[] underlyingTokens
    );

    constructor(address _admin) BaseLending(_admin) {}

    function updateVenusData(
        address _comptroller,
        address _vBnb,
        address[] calldata _vTokens
    ) external onlyAdmin {
        require(_comptroller != address(0), "invalid _comptroller");
        require(_vBnb != address(0), "invalid vBnb");

        venusData.comptroller = _comptroller;
        venusData.vTokens[ETH_TOKEN_ADDRESS] = _vBnb;

        IERC20Ext[] memory tokens;
        if (_vTokens.length > 0) {
            // add specific markets
            tokens = new IERC20Ext[](_vTokens.length);
            for (uint256 i = 0; i < _vTokens.length; i++) {
                require(_vTokens[i] != address(0), "invalid vToken");
                tokens[i] = IERC20Ext(IVBep20(_vTokens[i]).underlying());

                require(tokens[i] != IERC20Ext(0), "invalid underlying token");
                venusData.vTokens[tokens[i]] = _vTokens[i];

                // do token approvals
                safeApproveAllowance(_vTokens[i], tokens[i]);
            }
            emit UpdatedVenusData(_comptroller, _vBnb, _vTokens, tokens);
        } else {
            // add all markets
            IVBep20[] memory markets = IComptroller(_comptroller).getAllMarkets();
            tokens = new IERC20Ext[](markets.length);
            address[] memory vTokens = new address[](markets.length);
            for (uint256 i = 0; i < markets.length; i++) {
                if (address(markets[i]) == _vBnb) {
                    tokens[i] = ETH_TOKEN_ADDRESS;
                    vTokens[i] = _vBnb;
                    continue;
                }
                require(markets[i] != IVBep20(0), "invalid vToken");
                tokens[i] = IERC20Ext(markets[i].underlying());
                require(tokens[i] != IERC20Ext(0), "invalid underlying token");
                vTokens[i] = address(markets[i]);
                venusData.vTokens[tokens[i]] = vTokens[i];

                // do token approvals
                safeApproveAllowance(_vTokens[i], tokens[i]);
            }
            emit UpdatedVenusData(_comptroller, _vBnb, vTokens, tokens);
        }
    }

    /// @dev deposit to lending platforms like VENUS
    ///     expect amount of token should already be in the contract
    function depositTo(
        address payable onBehalfOf,
        IERC20Ext token,
        uint256 amount
    ) external override onlyProxyContract {
        require(getBalance(token, address(this)) >= amount, "low balance");
        // Venus
        address vToken = venusData.vTokens[token];
        require(vToken != address(0), "token is not supported by Venus");
        uint256 vTokenBalanceBefore = IERC20Ext(vToken).balanceOf(address(this));
        if (token == ETH_TOKEN_ADDRESS) {
            IVBnb(vToken).mint{value: amount}();
        } else {
            require(IVBep20(vToken).mint(amount) == 0, "can not mint vToken");
        }
        uint256 vTokenBalanceAfter = IERC20Ext(vToken).balanceOf(address(this));
        IERC20Ext(vToken).safeTransfer(
            onBehalfOf,
            vTokenBalanceAfter.sub(vTokenBalanceBefore)
        );
    }

    /// @dev withdraw from lending platforms like VENUS
    ///     expect amount of aToken or vToken should already be in the contract
    function withdrawFrom(
        address payable onBehalfOf,
        IERC20Ext token,
        uint256 amount,
        uint256 minReturn
    ) external override onlyProxyContract returns (uint256 returnedAmount) {
        address lendingToken = getLendingToken(token);
        uint256 tokenBalanceBefore = getBalance(token, address(this));

        // burn vToken to withdraw underlying token
        require(IVBep20(lendingToken).redeem(amount) == 0, "unable to redeem");
        
        returnedAmount = getBalance(token, address(this)).sub(tokenBalanceBefore);
        require(returnedAmount >= minReturn, "low returned amount");

        // transfer underlying token to user
        transferToken(onBehalfOf, token, returnedAmount);
    }

    // @dev borrowFrom is not supported on Venus
    function borrowFrom(
        address payable onBehalfOf,
        IERC20Ext token,
        uint256 borrowAmount,
        uint256 interestRateMode
    ) external view override onlyProxyContract {
        require(false, "not supported");
    }

    /// @dev repay borrows to lending platforms like VENUS
    ///     expect amount of token should already be in the contract
    ///     if amount > payAmount, (amount - payAmount) will be sent back to user
    function repayBorrowTo(
        address payable onBehalfOf,
        IERC20Ext token,
        uint256 amount,
        uint256 payAmount
    ) external override onlyProxyContract {
        require(amount >= payAmount, "invalid pay amount");
        require(getBalance(token, address(this)) >= amount, "bad token balance");

        if (amount > payAmount) {
            // transfer back token
            transferToken(payable(onBehalfOf), token, amount - payAmount);
        }

        address vToken = venusData.vTokens[token];
        require(vToken != address(0), "token is not supported by Venus");
        if (token == ETH_TOKEN_ADDRESS) {
            IVBnb(vToken).repayBorrowBehalf{value: payAmount}(onBehalfOf);
        } else {
            require(
                IVBep20(vToken).repayBorrowBehalf(onBehalfOf, payAmount) == 0,
                "venus repay error"
            );
        }
    }

    function getLendingToken(IERC20Ext token)
        public
        view
        override
        returns (address)
    {
        return venusData.vTokens[token];
    }

    /** @dev Calculate the current user debt and return
    */
    function storeAndRetrieveUserDebtCurrent(
        address _reserve,
        address _user
    ) external override returns (uint256 debt) {
        IVBep20 vToken = IVBep20(venusData.vTokens[IERC20Ext(_reserve)]);
        debt = vToken.borrowBalanceCurrent(_user);
    }

    /** @dev Return the stored user debt from given platform
    *   to get the latest data of user's debt for repaying, should call
    *   storeAndRetrieveUserDebtCurrent function, esp for Venus platform
    */
    function getUserDebtStored(
        address _reserve,
        address _user
    ) public view override returns (uint256 debt) {
        IVBep20 vToken = IVBep20(venusData.vTokens[IERC20Ext(_reserve)]);
        debt = vToken.borrowBalanceStored(_user);
    }

}
