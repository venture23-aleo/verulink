// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
// import "@thirdweb-dev/contracts/extension/Initializable.sol";

contract Ownable{
    address public owner;
    modifier onlyOwner {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // function initialize(
    //     address _owner
    // ) internal initializer {
    //     owner = _owner;
    // }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}