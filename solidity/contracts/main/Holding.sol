// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../common/interface/tokenservice/IIERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Pausable} from "../common/Pausable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

/// @title A contract that implements OwnableUpgradeable, ReentrancyGuardUpgradeable, Pausable, Initializable and Upgradeable Contracts for Holding token 
contract Holding is OwnableUpgradeable, Pausable, ReentrancyGuardUpgradeable, Upgradeable {

    /// @notice Event triggered when tokens are locked
    /// @param account The address of the account whose tokens are locked
    /// @param token The address of token which is locked
    /// @param amount The number of tokens locked
    event Locked(address account, address token, uint256 amount);

    /// @notice Event triggered when tokens are unlocked
    /// @param account The address of the account whose tokens are unlocked
    /// @param token The address of token which is unlocked
    /// @param amount The number of tokens unlocked
    event Unlocked(address account, address token, uint256 amount);

    /// @notice Event triggered when tokens are released from holding
    /// @param account The address of the account whose tokens are released
    /// @param token The address of token which is released
    /// @param amount The number of tokens released
    event Released(address account, address token, uint256 amount);

    /// @notice immutable address of zero address
    address private immutable ZERO_ADDRESS = address(0);

    /// @notice immutable address of Eth
    address private immutable ETH_TOKEN = address(1);

    // user address => token address => amount
    /// @notice The balance of each account of different token which are locked
    mapping(address => mapping(address => uint256)) public locked;

    /// @notice The balance of each account for different tokens that are unlocked
    mapping(address => mapping(address => uint256)) public unlocked;

    /// @notice A mapping indicating whether a token service is supported or not
    mapping(address => bool) public supportedTokenServices;

    /// @dev Initializes the Holding contract
    /// @param _tokenService Address of the token service
    function Holding_init(address _tokenService) public initializer {
        __Ownable_init_unchained();
        __Pausable_init_unchained();
        supportedTokenServices[_tokenService] = true;
    }

    /// @dev Authorizes an upgrade only if the caller is the owner
    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner());
    }

    /// @dev Modifier to ensure that the provided address is not the zero address.
    /// @param addr The address to check.
    /// @dev Reverts with "Holding: zero address" if the provided address is the zero address.
    modifier checkZeroAddress(address addr) {
    require(addr != ZERO_ADDRESS, "Holding: zero address");
    _;
    }

    /// @dev Adds a new token service, callable only by the owner
    /// @param _tokenService Address of the new token service to be added
    function addTokenService(address _tokenService) external onlyOwner checkZeroAddress(_tokenService){
        require(!supportedTokenServices[_tokenService], "Holding: known tokenService");
        supportedTokenServices[_tokenService] = true;
    }

    /// @dev Removes an existing token service, callable only by the owner
    /// @param _tokenService Address of the token service to be removed
    function removeTokenService(address _tokenService) external onlyOwner checkZeroAddress(_tokenService){
        require(supportedTokenServices[_tokenService], "Holding: unKnown tokenService");
        delete supportedTokenServices[_tokenService];
    }

    /// @dev Internal function to lock tokens
    /// @param user Address of the user
    /// @param token Address of the token to be locked
    /// @param amount Number of tokens to be locked
    function _lock(address user, address token, uint256 amount) internal checkZeroAddress(token){
        require(
            supportedTokenServices[msg.sender],
            "Holding: unknown tokenService"
        );
        locked[user][token] += amount;
        emit Locked(user, token, amount);
    }

    /// @notice Locks tokens for a user
    /// @param user Address of the user
    /// @param token Address of the token to be locked
    /// @param amount Number of tokens to be locked
    function lock(address user, address token, uint256 amount) external virtual checkZeroAddress(user){
        require(token != ETH_TOKEN, "Holding: eth token address");
        _lock(user,token,amount);
    }

    /// @notice Locks ETH for a user
    /// @param user Address of the user
    function lock(address user) external virtual payable {
        require(msg.value > 0, "Holding: requires eth transfer");
        _lock(user, ETH_TOKEN, msg.value);
    }

    /// @dev Unlocks tokens for a user, callable only by the owner
    /// @param user Address of the user
    /// @param token Address of the token to be unlocked
    /// @param amount Number of tokens to be unlocked
    function unlock(
        address user,
        address token,
        uint256 amount
    ) external virtual onlyOwner {
        require(locked[user][token] >= amount, "Holding: insufficient amount");
        unchecked {
            locked[user][token] -= amount;
        }
        unlocked[user][token] += amount;
        emit Unlocked(user, token, amount);
    }

    /// @dev Internal function to release tokens
    /// @param user Address of the user
    /// @param token Address of the token to be released
    function _release(address user, address token) internal whenNotPaused nonReentrant checkZeroAddress(user) returns (uint256 amount) {
        // require(unlocked[user][token] >= amount, "Insufficient amount");
        amount = unlocked[user][token];
        unlocked[user][token] = 0;
        emit Released(user, token, amount);
    }

    /// @notice Releases tokens to a user
    /// @param user Address of the user
    /// @param token Address of the token to be released
    function release(address user, address token) external virtual checkZeroAddress(token){
        require(token != ETH_TOKEN, "Holding: eth token Address");
        uint256 amount = _release(user, token);
        require(IIERC20(token).transfer(user, amount), "Holding: erc20 release failed");
    }

    /// @notice Releases ETH to a user
    /// @param user Address of the user
    function release(address user) external virtual {
        uint256 amount = _release(user, ETH_TOKEN);
        (bool sent,) = user.call{value: amount}("");
        require(sent, "Holding: eth release failed");
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
