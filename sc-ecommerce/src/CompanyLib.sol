// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Types.sol";

library CompanyLib {
    event CompanyRegistered(uint256 indexed companyId, string name, address companyAddress, string taxId);
    event CompanyUpdated(uint256 indexed companyId, string name, string taxId);

    struct CompanyStorage {
        mapping(uint256 => Types.Company) companies;
        uint256 nextId;
        mapping(address => uint256) ownerCompany;
    }

    function register(CompanyStorage storage self, string memory name, address companyAddress, string memory taxId)
        internal
        returns (uint256)
    {
        require(bytes(name).length > 0, "CompanyLib: name required");
        require(companyAddress != address(0), "CompanyLib: zero address");
        require(bytes(taxId).length > 0, "CompanyLib: taxId required");
        require(self.ownerCompany[companyAddress] == 0, "CompanyLib: already registered");

        uint256 companyId = ++self.nextId;
        self.companies[companyId] = Types.Company({
            companyId: companyId, name: name, companyAddress: companyAddress, taxId: taxId, isActive: true
        });
        self.ownerCompany[companyAddress] = companyId;

        emit CompanyRegistered(companyId, name, companyAddress, taxId);
        return companyId;
    }

    function get(CompanyStorage storage self, uint256 companyId) internal view returns (Types.Company memory) {
        require(companyId > 0 && companyId <= self.nextId, "CompanyLib: not found");
        Types.Company storage c = self.companies[companyId];
        require(c.isActive, "CompanyLib: inactive");
        return c;
    }

    function getByOwner(CompanyStorage storage self, address owner) internal view returns (uint256) {
        return self.ownerCompany[owner];
    }

    function update(CompanyStorage storage self, uint256 companyId, string memory name, string memory taxId) internal {
        require(companyId > 0 && companyId <= self.nextId, "CompanyLib: not found");
        Types.Company storage c = self.companies[companyId];
        require(c.isActive, "CompanyLib: inactive");
        require(bytes(name).length > 0, "CompanyLib: name required");
        require(bytes(taxId).length > 0, "CompanyLib: taxId required");

        c.name = name;
        c.taxId = taxId;
        emit CompanyUpdated(companyId, name, taxId);
    }
}
