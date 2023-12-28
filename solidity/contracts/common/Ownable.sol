// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import "@thirdweb-dev/contracts/extension/Initializable.sol";

contract Ownable is Initializable {
    address public owner;
    modifier onlyOwner {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function initialize(
        address _owner
    ) public virtual {
        owner = _owner;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero Address");
        owner = newOwner;
    }
}