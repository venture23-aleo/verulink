// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Pausable} from "../common/Pausable.sol";
import {IIERC20} from "../common/interface/tokenservice/IIERC20.sol";
import {Initializable} from "@thirdweb-dev/contracts/extension/Initializable.sol";

contract Holding is Pausable, Initializable {

    event Locked(address account, address token, uint256 amount);
    event Unlocked(address account, address token, uint256 amount);
    event Released(address account, address token, uint256 amount);

    // user address => token address => amount
    mapping(address => mapping(address => uint256)) public locked;

    mapping(address => mapping(address => uint256)) public unlocked;

    mapping(address => bool) public supportedTokenServices;

    function initialize(address _owner, address _tokenService) public initializer {
        super._initialize(_owner);
        supportedTokenServices[_tokenService] = true;
    }

    function addTokenService(address _tokenService) public onlyOwner {
        require(_tokenService != address(0), "Zero Address");
        require(!supportedTokenServices[_tokenService], "Known TokenService");
        supportedTokenServices[_tokenService] = true;
    }

    function removeTokenService(address _tokenService) public onlyOwner {
        require(_tokenService != address(0), "Zero Address");
        require(!supportedTokenServices[_tokenService], "UnKnown TokenService");
        delete supportedTokenServices[_tokenService];
    }

    function _lock(address user, address token, uint256 amount) internal whenNotPaused {
        require(
            supportedTokenServices[msg.sender],
            "Unknown TokenService"
        );
        locked[user][token] += amount;
        emit Locked(user, token, amount);
    }

    function lock(address user, address token, uint256 amount) public {
        require(token != address(0), "Zero Address");
        require(IIERC20(token).transferFrom(msg.sender, address(this), amount), "Token Transfer Failed");
        _lock(user,token,amount);
    }

    function lock(address user) public payable {
        require(msg.value > 0, "Requires ETH Transfer");
        _lock(user, address(0), msg.value);
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

    function _release(address user, address token, uint256 amount) internal whenNotPaused {
        require(user != address(0), "Zero Address");
        require(unlocked[user][token] >= amount, "Insufficient amount");
        unlocked[user][token] -= amount;
        emit Released(user, token, amount);
    }

    function release(address user, address token, uint256 amount) public {
        require(token != address(0), "Zero Token Address");
        _release(user, token, amount);
        require(IIERC20(token).transfer(user, amount), "ERC20 Release Failed");
    }

    function release(address user, uint256 amount) public {
        _release(user, address(0), amount);
        (bool sent,) = user.call{value: amount}("");
        require(sent, "ETH Release Failed");
    }
}
