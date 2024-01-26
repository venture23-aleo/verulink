// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@thirdweb-dev/contracts/extension/Upgradeable.sol";

abstract contract Ownable is Upgradeable {
    event OwnershipTransferred(address oldOwner, address newOwner);

    address _owner_;

    modifier onlyOwner {
        require(msg.sender == _owner_, "Not owner");
        _;
    }

    function _initialize(
        address __owner
    ) internal {
        _owner_ = __owner;
    }

    function owner() public view onlyProxy returns (address) {
        return _owner_;
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == _owner_);
    }

    function transferOwnership(address newOwner) external onlyOwner onlyProxy {
        require(newOwner != address(0), "Zero Address");
        emit OwnershipTransferred(_owner_, newOwner);
        _owner_ = newOwner;
    }
}