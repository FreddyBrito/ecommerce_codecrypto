// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/Types.sol";
import "./MockEuroToken.sol";

contract EcommerceTest is Test {
    Ecommerce public ecommerce;
    MockEuroToken public token;

    address public owner = address(this);
    address public companyOwner = makeAddr("companyOwner");
    address public customer = makeAddr("customer");
    address public feeCollector = makeAddr("feeCollector");

    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;
    uint256 public constant TOKEN_AMOUNT = 10_000 ether;

    function setUp() public {
        token = new MockEuroToken(INITIAL_SUPPLY);
        ecommerce = new Ecommerce(address(token));

        token.mint(customer, TOKEN_AMOUNT);
        token.mint(companyOwner, TOKEN_AMOUNT);
    }

    // ============ Company Tests ============

    function test_RegisterCompany() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        assertEq(companyId, 1);

        Types.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.name, "Mi Tienda");
        assertEq(company.companyAddress, companyOwner);
        assertEq(company.taxId, "ES12345678A");
        assertEq(company.isActive, true);
    }

    function test_RegisterCompanyRevertsForDuplicate() public {
        vm.prank(companyOwner);
        ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        vm.prank(companyOwner);
        vm.expectRevert("CompanyLib: already registered");
        ecommerce.registerCompany("Otra Tienda", "ES99999999B");
    }

    function test_RegisterCompanyRevertsForZeroAddress() public {
        vm.expectRevert("CompanyLib: zero address");
        vm.prank(address(0));
        ecommerce.registerCompany("Mi Tienda", "ES12345678A");
    }

    function test_RegisterCompanyRevertsForEmptyName() public {
        vm.prank(companyOwner);
        vm.expectRevert("CompanyLib: name required");
        ecommerce.registerCompany("", "ES12345678A");
    }

    function test_UpdateCompany() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        vm.prank(companyOwner);
        ecommerce.updateCompany(companyId, "Nueva Tienda", "ES99999999B");

        Types.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.name, "Nueva Tienda");
        assertEq(company.taxId, "ES99999999B");
    }

    function test_UpdateCompanyRevertsForNonOwner() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        vm.prank(customer);
        vm.expectRevert("Ecommerce: not company owner");
        ecommerce.updateCompany(companyId, "Hacker Tienda", "ES00000000X");
    }

    function test_GetCompanyByOwner() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        uint256 found = ecommerce.getCompanyByOwner(companyOwner);
        assertEq(found, companyId);
    }

    // ============ Product Tests ============

    function test_AddProduct() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");
        assertEq(productId, 1);

        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.name, "Laptop");
        assertEq(product.price, 1000 ether);
        assertEq(product.stock, 10);
        assertEq(product.companyId, companyId);
    }

    function test_AddProductRevertsForNonOwner() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        vm.prank(customer);
        vm.expectRevert("Ecommerce: not company owner");
        ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");
    }

    function test_GetAllProducts() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        vm.prank(companyOwner);
        ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");
        vm.prank(companyOwner);
        ecommerce.addProduct(companyId, "Mouse", "Mouse gaming", 50 ether, 100, "QmHash456");

        Types.Product[] memory products = ecommerce.getAllProducts();
        assertEq(products.length, 2);
        assertEq(products[0].name, "Laptop");
        assertEq(products[1].name, "Mouse");
    }

    function test_UpdateProduct() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(companyOwner);
        ecommerce.updateProduct(productId, 1200 ether, 5);

        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.price, 1200 ether);
        assertEq(product.stock, 5);
    }

    // ============ Cart Tests ============

    function test_AddToCart() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 2);

        Types.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, productId);
        assertEq(cart[0].quantity, 2);
    }

    function test_AddToCartMultipleItems() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 laptopId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");
        vm.prank(companyOwner);
        uint256 mouseId = ecommerce.addProduct(companyId, "Mouse", "Mouse gaming", 50 ether, 100, "QmHash456");

        vm.prank(customer);
        ecommerce.addToCart(laptopId, 1);
        vm.prank(customer);
        ecommerce.addToCart(mouseId, 2);

        Types.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 2);
    }

    function test_RemoveFromCart() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        ecommerce.removeCartItem(productId);

        Types.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 0);
    }

    function test_ClearMyCart() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        ecommerce.clearMyCart();

        Types.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 0);
    }

    // ============ Invoice Tests ============

    function test_CreateInvoice() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 2);

        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer);
        assertEq(invoiceId, 1);

        Types.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertEq(invoice.companyId, companyId);
        assertEq(invoice.customerAddress, customer);
        assertEq(invoice.totalAmount, 2000 ether);
        assertEq(invoice.isPaid, false);
    }

    function test_CreateInvoiceClearsCart() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        ecommerce.createInvoice(customer);

        Types.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 0);
    }

    function test_CreateInvoiceDecreasesStock() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 3);
        vm.prank(customer);
        ecommerce.createInvoice(customer);

        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.stock, 7);
    }

    function test_CreateInvoiceRevertsForEmptyCart() public {
        vm.prank(customer);
        vm.expectRevert("Ecommerce: cart is empty");
        ecommerce.createInvoice(customer);
    }

    function test_GetCustomerInvoices() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        ecommerce.createInvoice(customer);

        uint256[] memory invoices = ecommerce.getCustomerInvoices(customer);
        assertEq(invoices.length, 1);
    }

    // ============ Payment Tests ============

    function test_ProcessPayment() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer);

        vm.prank(customer);
        token.approve(address(ecommerce), 1000 ether);

        uint256 companyBalanceBefore = token.balanceOf(companyOwner);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        Types.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertEq(invoice.isPaid, true);

        uint256 companyBalanceAfter = token.balanceOf(companyOwner);
        assertEq(companyBalanceAfter - companyBalanceBefore, 950 ether); // 1000 - 5% fee
    }

    function test_ProcessPaymentRevertsForWrongCustomer() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer);

        vm.prank(customer);
        token.approve(address(ecommerce), 1000 ether);

        vm.prank(companyOwner);
        vm.expectRevert("Ecommerce: not invoice customer");
        ecommerce.processPayment(invoiceId);
    }

    function test_ProcessPaymentRevertsForAlreadyPaid() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");

        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer);

        vm.prank(customer);
        token.approve(address(ecommerce), 2000 ether);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        vm.prank(customer);
        vm.expectRevert("Ecommerce: already paid");
        ecommerce.processPayment(invoiceId);
    }

    // ============ Full Flow Test ============

    function test_FullEcommerceFlow() public {
        // 1. Register company
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "ES12345678A");

        // 2. Add products
        vm.prank(companyOwner);
        uint256 laptopId = ecommerce.addProduct(companyId, "Laptop", "Laptop gaming", 1000 ether, 10, "QmHash123");
        vm.prank(companyOwner);
        uint256 mouseId = ecommerce.addProduct(companyId, "Mouse", "Mouse gaming", 50 ether, 100, "QmHash456");

        // 3. Customer adds to cart
        vm.prank(customer);
        ecommerce.addToCart(laptopId, 1);
        vm.prank(customer);
        ecommerce.addToCart(mouseId, 2);

        // 4. Verify cart
        Types.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 2);

        // 5. Create invoice
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer);

        // 6. Verify invoice
        Types.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertEq(invoice.totalAmount, 1100 ether); // 1000 + 50*2
        assertEq(invoice.isPaid, false);

        // 7. Process payment
        vm.prank(customer);
        token.approve(address(ecommerce), invoice.totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // 8. Verify payment
        invoice = ecommerce.getInvoice(invoiceId);
        assertEq(invoice.isPaid, true);

        // 9. Verify company received payment (minus 5% fee)
        uint256 companyBalance = token.balanceOf(companyOwner);
        assertEq(companyBalance, TOKEN_AMOUNT + 1045 ether); // 1000*0.95 + 50*2*0.95 = 950 + 95 = 1045

        // 10. Verify stock updated
        Types.Product memory laptop = ecommerce.getProduct(laptopId);
        Types.Product memory mouse = ecommerce.getProduct(mouseId);
        assertEq(laptop.stock, 9);
        assertEq(mouse.stock, 98);
    }
}
