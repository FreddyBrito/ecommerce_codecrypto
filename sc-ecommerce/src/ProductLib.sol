// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Types.sol";

library ProductLib {
    event ProductAdded(uint256 indexed productId, uint256 companyId, string name, uint256 price, uint256 stock);
    event ProductUpdated(uint256 indexed productId, uint256 price, uint256 stock);
    event ProductToggled(uint256 indexed productId, bool isActive);

    struct ProductStorage {
        mapping(uint256 => Types.Product) products;
        uint256 nextId;
        mapping(uint256 => uint256[]) companyProducts;
    }

    function add(
        ProductStorage storage self,
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) internal returns (uint256) {
        require(bytes(name).length > 0, "ProductLib: name required");
        require(price > 0, "ProductLib: price required");

        uint256 productId = ++self.nextId;
        self.products[productId] = Types.Product({
            productId: productId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            ipfsImageHash: ipfsImageHash,
            isActive: true
        });
        self.companyProducts[companyId].push(productId);

        emit ProductAdded(productId, companyId, name, price, stock);
        return productId;
    }

    function get(ProductStorage storage self, uint256 productId) internal view returns (Types.Product memory) {
        require(productId > 0 && productId <= self.nextId, "ProductLib: not found");
        Types.Product storage p = self.products[productId];
        require(p.isActive, "ProductLib: inactive");
        return p;
    }

    function getAll(ProductStorage storage self) internal view returns (Types.Product[] memory products) {
        uint256 count = 0;
        for (uint256 i = 1; i <= self.nextId; i++) {
            if (self.products[i].isActive) count++;
        }

        products = new Types.Product[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= self.nextId; i++) {
            if (self.products[i].isActive) {
                products[idx++] = self.products[i];
            }
        }
    }

    function getByCompany(ProductStorage storage self, uint256 companyId)
        internal
        view
        returns (Types.Product[] memory products)
    {
        uint256[] storage ids = self.companyProducts[companyId];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (self.products[ids[i]].isActive) count++;
        }

        products = new Types.Product[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (self.products[ids[i]].isActive) {
                products[idx++] = self.products[ids[i]];
            }
        }
    }

    function update(ProductStorage storage self, uint256 productId, uint256 price, uint256 stock) internal {
        require(productId > 0 && productId <= self.nextId, "ProductLib: not found");
        Types.Product storage p = self.products[productId];
        require(p.isActive, "ProductLib: inactive");
        require(price > 0, "ProductLib: price required");

        p.price = price;
        p.stock = stock;
        emit ProductUpdated(productId, price, stock);
    }

    function decreaseStock(ProductStorage storage self, uint256 productId, uint256 quantity) internal {
        require(productId > 0 && productId <= self.nextId, "ProductLib: not found");
        Types.Product storage p = self.products[productId];
        require(p.isActive, "ProductLib: inactive");
        require(p.stock >= quantity, "ProductLib: insufficient stock");

        p.stock -= quantity;
        emit ProductUpdated(productId, p.price, p.stock);
    }

    function toggleActive(ProductStorage storage self, uint256 productId) internal {
        require(productId > 0 && productId <= self.nextId, "ProductLib: not found");
        Types.Product storage p = self.products[productId];
        p.isActive = !p.isActive;
        emit ProductToggled(productId, p.isActive);
    }
}
