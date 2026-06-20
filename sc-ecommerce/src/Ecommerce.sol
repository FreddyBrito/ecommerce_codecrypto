// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Types.sol";
import "./CompanyLib.sol";
import "./ProductLib.sol";
import "./CartLib.sol";
import "./InvoiceLib.sol";
import "./PaymentLib.sol";

contract Ecommerce is Ownable {
    using CompanyLib for CompanyLib.CompanyStorage;
    using ProductLib for ProductLib.ProductStorage;
    using CartLib for CartLib.CartStorage;
    using InvoiceLib for InvoiceLib.InvoiceStorage;

    IERC20 public immutable euroToken;

    CompanyLib.CompanyStorage private _companies;
    ProductLib.ProductStorage private _products;
    CartLib.CartStorage private _cart;
    InvoiceLib.InvoiceStorage private _invoices;

    constructor(address _euroToken) Ownable(msg.sender) {
        require(_euroToken != address(0), "Ecommerce: zero token address");
        euroToken = IERC20(_euroToken);
    }

    function registerCompany(string memory name, string memory taxId) external returns (uint256) {
        return _companies.register(name, msg.sender, taxId);
    }

    function getCompany(uint256 companyId) external view returns (Types.Company memory) {
        return _companies.get(companyId);
    }

    function getCompanyByOwner(address owner) external view returns (uint256) {
        return _companies.getByOwner(owner);
    }

    function updateCompany(uint256 companyId, string memory name, string memory taxId) external {
        Types.Company memory company = _companies.get(companyId);
        require(company.companyAddress == msg.sender, "Ecommerce: not company owner");
        _companies.update(companyId, name, taxId);
    }

    function addProduct(
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) external returns (uint256) {
        Types.Company memory company = _companies.get(companyId);
        require(company.companyAddress == msg.sender, "Ecommerce: not company owner");
        return _products.add(companyId, name, description, price, stock, ipfsImageHash);
    }

    function getProduct(uint256 productId) external view returns (Types.Product memory) {
        return _products.get(productId);
    }

    function getAllProducts() external view returns (Types.Product[] memory) {
        return _products.getAll();
    }

    function getCompanyProducts(uint256 companyId) external view returns (Types.Product[] memory) {
        return _products.getByCompany(companyId);
    }

    function updateProduct(uint256 productId, uint256 price, uint256 stock) external {
        Types.Product memory product = _products.get(productId);
        Types.Company memory company = _companies.get(product.companyId);
        require(company.companyAddress == msg.sender, "Ecommerce: not company owner");
        _products.update(productId, price, stock);
    }

    function addToCart(uint256 productId, uint256 quantity) external {
        _cart.addItem(msg.sender, productId, quantity);
    }

    function getCart(address customer) external view returns (Types.CartItem[] memory) {
        return _cart.getCart(customer);
    }

    function removeCartItem(uint256 productId) external {
        _cart.removeItem(msg.sender, productId);
    }

    function clearCart(address customer) external {
        Types.Company memory company;
        for (uint256 i = 1; i <= _companies.nextId; i++) {
            company = _companies.get(i);
            if (company.companyAddress == msg.sender) {
                _cart.clearCart(customer);
                return;
            }
        }
        revert("Ecommerce: not authorized");
    }

    function clearMyCart() external {
        _cart.clearCart(msg.sender);
    }

    function createInvoice(address customer) external returns (uint256) {
        Types.CartItem[] memory items = _cart.getCart(customer);
        require(items.length > 0, "Ecommerce: cart is empty");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < items.length; i++) {
            Types.Product memory product = _products.get(items[i].productId);
            totalAmount += product.price * items[i].quantity;
        }

        Types.Product memory firstProduct = _products.get(items[0].productId);
        uint256 invoiceId = _invoices.create(firstProduct.companyId, customer, totalAmount);

        for (uint256 i = 0; i < items.length; i++) {
            Types.Product memory product = _products.get(items[i].productId);
            _products.decreaseStock(items[i].productId, items[i].quantity);
        }

        _cart.clearCart(customer);
        return invoiceId;
    }

    function processPayment(uint256 invoiceId) external {
        Types.Invoice memory invoice = _invoices.get(invoiceId);
        require(!invoice.isPaid, "Ecommerce: already paid");
        require(invoice.customerAddress == msg.sender, "Ecommerce: not invoice customer");

        (uint256 fee, uint256 netAmount) = PaymentLib.processPayment(
            euroToken, msg.sender, _companies.get(invoice.companyId).companyAddress, invoice.totalAmount
        );

        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, invoiceId, block.timestamp));
        _invoices.markAsPaid(invoiceId, txHash);
    }

    function getInvoice(uint256 invoiceId) external view returns (Types.Invoice memory) {
        return _invoices.get(invoiceId);
    }

    function getCustomerInvoices(address customer) external view returns (uint256[] memory) {
        return _invoices.getCustomerInvoices(customer);
    }

    function getCompanyInvoices(uint256 companyId) external view returns (uint256[] memory) {
        return _invoices.getCompanyInvoices(companyId);
    }
}
