// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../common/interface/tokenservice/IIERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Pausable} from "../common/Pausable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract Holding is OwnableUpgradeable, Pausable, ReentrancyGuardUpgradeable, Upgradeable {

    event Locked(address account, address token, uint256 amount);
    event Unlocked(address account, address token, uint256 amount);
    event Released(address account, address token, uint256 amount);

    address private immutable ZERO_ADDRESS = address(0);
    address private immutable ETH_TOKEN = address(1);

    // user address => token address => amount
    mapping(address => mapping(address => uint256)) public locked;
    mapping(address => mapping(address => uint256)) public unlocked;
    mapping(address => bool) public supportedTokenServices;

    function Holding_init(address _tokenService) public initializer {
        __Ownable_init_unchained();
        __Pausable_init_unchained();
        supportedTokenServices[_tokenService] = true;
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner());
    }

    function addTokenService(address _tokenService) external onlyOwner {
        require(_tokenService != ZERO_ADDRESS, "Zero Address");
        require(!supportedTokenServices[_tokenService], "Known TokenService");
        supportedTokenServices[_tokenService] = true;
    }

    function removeTokenService(address _tokenService) external onlyOwner {
        require(_tokenService != ZERO_ADDRESS, "Zero Address");
        require(supportedTokenServices[_tokenService], "UnKnown TokenService");
        delete supportedTokenServices[_tokenService];
    }

    function _lock(address user, address token, uint256 amount) internal {
        require(user != ZERO_ADDRESS, "Zero Address");
        require(user != ETH_TOKEN, "ETH Token Address");
        require(
            supportedTokenServices[msg.sender],
            "Unknown TokenService"
        );
        locked[user][token] += amount;
        emit Locked(user, token, amount);
    }

    function lock(address user, address token, uint256 amount) external virtual {
        require(token != ZERO_ADDRESS, "Zero Address");
        _lock(user,token,amount);
    }

    function lock(address user) external virtual payable {
        require(msg.value > 0, "Requires ETH Transfer");
        _lock(user, ETH_TOKEN, msg.value);
    }

    function unlock(
        address user,
        address token,
        uint256 amount
    ) external virtual onlyOwner {
        require(locked[user][token] >= amount, "Insufficient amount");
        unchecked {
            locked[user][token] -= amount;
        }
        unlocked[user][token] += amount;
        emit Unlocked(user, token, amount);
    }

    function _release(address user, address token, uint256 amount) internal whenNotPaused nonReentrant {
        require(user != ZERO_ADDRESS, "Zero Address");
        require(unlocked[user][token] >= amount, "Insufficient amount");
        unchecked {
            unlocked[user][token] -= amount;
        }
        emit Released(user, token, amount);
    }

    function release(address user, address token, uint256 amount) external virtual {
        require(token != address(0), "Zero Address");
        _release(user, token, amount);
        require(IIERC20(token).transfer(user, amount), "ERC20 Release Failed");
    }

    function release(address user, uint256 amount) external virtual {
        _release(user, ETH_TOKEN, amount);
        (bool sent,) = user.call{value: amount}("");
        require(sent, "ETH Release Failed");
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
