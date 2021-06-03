// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@kyber.network/utils-sc/contracts/Withdrawable.sol";
import "@kyber.network/utils-sc/contracts/Utils.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./ISwap.sol";

abstract contract BaseSwap is ISwap, Withdrawable, Utils, ReentrancyGuard {
    using SafeERC20 for IERC20Ext;
    using SafeMath for uint256;

    uint256 internal constant MAX_AMOUNT = type(uint256).max;
    address public proxyContract;

    event UpdatedproxyContract(address indexed _oldProxyImpl, address indexed _newProxyImpl);

    modifier onlyProxyContract() {
        require(msg.sender == proxyContract, "only swap impl");
        _;
    }

    struct TradeInput {
        uint256 srcAmount;
        uint256 minData; // min return for Uniswap / min rate for Kyber, etc.
        address recipient;
    }

    constructor(address _admin) Withdrawable(_admin) {}

    receive() external payable {}

    function updateproxyContract(address _proxyContract) external onlyAdmin {
        require(_proxyContract != address(0), "invalid swap impl");
        emit UpdatedproxyContract(proxyContract, _proxyContract);
        proxyContract = _proxyContract;
    }

    function validateAndPrepareTradeInput(
        address protocol,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] memory tradePath,
        address recipient
    ) internal returns (TradeInput memory input) {
        input = TradeInput({
            srcAmount: srcAmount,
            minData: minDestAmount,
            recipient: recipient
        });
    }

    function safeApproveAllowance(address spender, IERC20Ext token) internal {
        if (token != ETH_TOKEN_ADDRESS && token.allowance(address(this), spender) == 0) {
            token.safeApprove(spender, MAX_ALLOWANCE);
        }
    }

    function transferToken(
        address payable recipient,
        IERC20Ext token,
        uint256 amount
    ) internal {
        if (token == ETH_TOKEN_ADDRESS) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "failed to transfer eth");
        } else {
            token.safeTransfer(recipient, amount);
        }
    }
}
