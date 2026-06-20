// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Types {
    struct Company {
        uint256 companyId;
        string name;
        address companyAddress;
        string taxId;
        bool isActive;
    }

    struct Product {
        uint256 productId;
        uint256 companyId;
        string name;
        string description;
        uint256 price;
        uint256 stock;
        string ipfsImageHash;
        bool isActive;
    }

    struct CartItem {
        uint256 productId;
        uint256 quantity;
    }

    struct Invoice {
        uint256 invoiceId;
        uint256 companyId;
        address customerAddress;
        uint256 totalAmount;
        uint256 timestamp;
        bool isPaid;
        bytes32 paymentTxHash;
    }
}
