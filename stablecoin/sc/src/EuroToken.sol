// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EuroToken is ERC20, Ownable {
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event EuroTokenDeployed(address indexed owner, uint256 initialSupply);

    constructor(uint256 initialSupply) ERC20("EuroToken", "EURT") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
        emit EuroTokenDeployed(msg.sender, initialSupply);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "EuroToken: mint to zero address");
        require(amount > 0, "EuroToken: zero amount");
        _mint(to, amount);
        emit TokensMinted(to, amount, block.timestamp);
    }
}
