// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Pausable} from "../common/Pausable.sol";
import {IERC20} from "../common/interface/tokenservice/IERC20.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";

contract Holding is Pausable, Initializable {

    event Locked(address account, address token, uint256 amount);
    event Unlocked(address account, address token, uint256 amount);
    event Released(address account, address token, uint256 amount);

    // user address => token address => amount
    mapping(address => mapping(address => uint256)) public locked;

    mapping(address => mapping(address => uint256)) public unlocked;

    address public tokenService;

    function initialize(address _owner, address _tokenService) public initializer {
        super._initialize(_owner);
        tokenService = _tokenService;
    }

    function updateTokenService(address _tokenService) public onlyOwner {
        tokenService = _tokenService;
    }

    function lock(address user, address token, uint256 amount) public whenNotPaused {
        require(
            msg.sender == tokenService,
            "Caller is not registered Token Service"
        );
        locked[user][token] += amount;
        emit Locked(user, token, amount);
    }

    function lockETH(address user, address token, uint256 amount) public whenNotPaused payable {
        require(msg.value > 0, "Requires ETH Transfer");
        require(
            msg.sender == tokenService,
            "Caller is not registered Token Service"
        );
        locked[user][token] += amount;
        emit Locked(user, token, amount);
    }

    function unlock(
        address user,
        address token,
        uint256 amount
    ) public onlyOwner {
        require(locked[user][token] >= amount, "Insufficient amount");
        locked[user][token] -= amount;
        unlocked[user][token] += amount;
        emit Unlocked(user, token, amount);
    }

    function release(address user, address token, uint256 amount) public whenNotPaused {
        require(unlocked[user][token] >= amount, "Insufficient amount");
        unlocked[user][token] -= amount;
        emit Released(user, token, amount);
        if(token == address(0)) {
            // eth transfer
            (bool sent,) = user.call{value: amount}("");
            require(sent, "ETH Released Failed");
        }else {
            require(IERC20(token).transfer(user, amount), "ERC20 Release Failed");
        }
    }
}
