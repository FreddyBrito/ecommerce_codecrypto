// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EuroToken.sol";

contract DeployEuroToken is Script {
    function run() public {
        uint256 initialSupply = 1_000_000 ether;
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        EuroToken token = new EuroToken(initialSupply);
        vm.stopBroadcast();

        console.log("EuroToken deployed at:", address(token));
        console.log("Owner:", token.owner());
        console.log("Total Supply:", token.totalSupply());
    }
}
