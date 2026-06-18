// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken public token;
    address public owner = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;

    function setUp() public {
        token = new EuroToken(INITIAL_SUPPLY);
    }

    function test_Name() public view {
        assertEq(token.name(), "EuroToken");
    }

    function test_Symbol() public view {
        assertEq(token.symbol(), "EURT");
    }

    function test_Decimals() public view {
        assertEq(token.decimals(), 6);
    }

    function test_InitialSupplyMintedToOwner() public view {
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
    }

    function test_OwnerIsDeployer() public view {
        assertEq(token.owner(), owner);
    }

    function test_MintByOwner() public {
        uint256 amount = 500 ether;
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }

    function test_MintByOwnerEmitsEvent() public {
        uint256 amount = 500 ether;
        vm.expectEmit(true, true, true, true);
        emit EuroToken.TokensMinted(alice, amount, block.timestamp);
        token.mint(alice, amount);
    }

    function test_MintByNonOwnerReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        token.mint(bob, 100 ether);
    }

    function test_MintToZeroAddressReverts() public {
        vm.expectRevert("EuroToken: mint to zero address");
        token.mint(address(0), 100 ether);
    }

    function test_MintZeroAmountReverts() public {
        vm.expectRevert("EuroToken: zero amount");
        token.mint(alice, 0);
    }

    function test_TransferBetweenAccounts() public {
        uint256 amount = 100 ether;
        token.transfer(alice, amount);
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }

    function test_TransferFromAndApprove() public {
        uint256 amount = 200 ether;
        token.approve(alice, amount);
        assertEq(token.allowance(owner, alice), amount);

        vm.prank(alice);
        token.transferFrom(owner, bob, amount);
        assertEq(token.balanceOf(bob), amount);
    }

    function test_TransferMoreThanBalanceReverts() public {
        vm.expectRevert(); // ERC20InsufficientBalance
        token.transfer(alice, INITIAL_SUPPLY + 1);
    }

    function test_MultipleMintsAccumulate() public {
        token.mint(alice, 100 ether);
        token.mint(alice, 200 ether);
        assertEq(token.balanceOf(alice), 300 ether);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + 300 ether);
    }

    function test_MintDecrementedDecimals() public {
        // 1 EURT = 1 EUR with 6 decimals
        // 1.50 EUR = 1_500_000 units
        uint256 amount = 1_500_000;
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }
}
