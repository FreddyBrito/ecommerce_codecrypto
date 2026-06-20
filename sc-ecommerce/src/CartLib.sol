// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Types.sol";

library CartLib {
    event AddedToCart(address indexed customer, uint256 productId, uint256 quantity);
    event RemovedFromCart(address indexed customer, uint256 productId);
    event CartCleared(address indexed customer);

    struct CartStorage {
        mapping(address => Types.CartItem[]) carts;
    }

    function addItem(CartStorage storage self, address customer, uint256 productId, uint256 quantity) internal {
        require(customer != address(0), "CartLib: zero address");
        require(productId > 0, "CartLib: invalid product");
        require(quantity > 0, "CartLib: zero quantity");

        Types.CartItem[] storage items = self.carts[customer];
        for (uint256 i = 0; i < items.length; i++) {
            if (items[i].productId == productId) {
                items[i].quantity += quantity;
                emit AddedToCart(customer, productId, items[i].quantity);
                return;
            }
        }
        items.push(Types.CartItem({productId: productId, quantity: quantity}));
        emit AddedToCart(customer, productId, quantity);
    }

    function getCart(CartStorage storage self, address customer) internal view returns (Types.CartItem[] memory) {
        return self.carts[customer];
    }

    function getCartLength(CartStorage storage self, address customer) internal view returns (uint256) {
        return self.carts[customer].length;
    }

    function removeItem(CartStorage storage self, address customer, uint256 productId) internal {
        Types.CartItem[] storage items = self.carts[customer];
        for (uint256 i = 0; i < items.length; i++) {
            if (items[i].productId == productId) {
                items[i] = items[items.length - 1];
                items.pop();
                emit RemovedFromCart(customer, productId);
                return;
            }
        }
        revert("CartLib: not in cart");
    }

    function clearCart(CartStorage storage self, address customer) internal {
        delete self.carts[customer];
        emit CartCleared(customer);
    }
}
