// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library PaymentLib {
    event PaymentProcessed(
        address indexed customer, address indexed company, uint256 amount, uint256 fee, uint256 netAmount
    );

    uint256 public constant FEE_PERCENT = 5;
    uint256 public constant FEE_DENOMINATOR = 100;

    function processPayment(IERC20 euroToken, address customer, address company, uint256 amount)
        internal
        returns (uint256 fee, uint256 netAmount)
    {
        require(customer != address(0), "PaymentLib: zero customer");
        require(company != address(0), "PaymentLib: zero company");
        require(amount > 0, "PaymentLib: zero amount");

        fee = (amount * FEE_PERCENT) / FEE_DENOMINATOR;
        netAmount = amount - fee;

        require(euroToken.transferFrom(customer, company, netAmount), "PaymentLib: transfer failed");

        if (fee > 0) {
            require(euroToken.transferFrom(customer, msg.sender, fee), "PaymentLib: fee transfer failed");
        }

        emit PaymentProcessed(customer, company, amount, fee, netAmount);
    }
}
