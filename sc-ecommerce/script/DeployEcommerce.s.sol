// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Ecommerce.sol";

contract DeployEcommerce is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address euroTokenAddress = vm.envAddress("EUROTOKEN_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        Ecommerce ecommerce = new Ecommerce(euroTokenAddress);
        vm.stopBroadcast();

        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("EuroToken:", euroTokenAddress);
        console.log("Owner:", ecommerce.owner());
    }
}
