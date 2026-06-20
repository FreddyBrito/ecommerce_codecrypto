// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Types.sol";

library InvoiceLib {
    event InvoiceCreated(uint256 indexed invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount);
    event InvoicePaid(uint256 indexed invoiceId, bytes32 paymentTxHash);

    struct InvoiceStorage {
        mapping(uint256 => Types.Invoice) invoices;
        uint256 nextId;
        mapping(address => uint256[]) customerInvoices;
        mapping(uint256 => uint256[]) companyInvoices;
    }

    function create(InvoiceStorage storage self, uint256 companyId, address customerAddress, uint256 totalAmount)
        internal
        returns (uint256)
    {
        require(customerAddress != address(0), "InvoiceLib: zero address");
        require(totalAmount > 0, "InvoiceLib: zero amount");

        uint256 invoiceId = ++self.nextId;
        self.invoices[invoiceId] = Types.Invoice({
            invoiceId: invoiceId,
            companyId: companyId,
            customerAddress: customerAddress,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            isPaid: false,
            paymentTxHash: bytes32(0)
        });
        self.customerInvoices[customerAddress].push(invoiceId);
        self.companyInvoices[companyId].push(invoiceId);

        emit InvoiceCreated(invoiceId, companyId, customerAddress, totalAmount);
        return invoiceId;
    }

    function get(InvoiceStorage storage self, uint256 invoiceId) internal view returns (Types.Invoice memory) {
        require(invoiceId > 0 && invoiceId <= self.nextId, "InvoiceLib: not found");
        return self.invoices[invoiceId];
    }

    function getCustomerInvoices(InvoiceStorage storage self, address customer)
        internal
        view
        returns (uint256[] memory)
    {
        return self.customerInvoices[customer];
    }

    function getCompanyInvoices(InvoiceStorage storage self, uint256 companyId)
        internal
        view
        returns (uint256[] memory)
    {
        return self.companyInvoices[companyId];
    }

    function markAsPaid(InvoiceStorage storage self, uint256 invoiceId, bytes32 paymentTxHash) internal {
        require(invoiceId > 0 && invoiceId <= self.nextId, "InvoiceLib: not found");
        Types.Invoice storage inv = self.invoices[invoiceId];
        require(!inv.isPaid, "InvoiceLib: already paid");

        inv.isPaid = true;
        inv.paymentTxHash = paymentTxHash;
        emit InvoicePaid(invoiceId, paymentTxHash);
    }
}
