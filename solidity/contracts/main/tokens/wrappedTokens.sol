// // SPDX-License-Identifier: MIT
// // Compatible with OpenZeppelin Contracts ^5.0.0
// pragma solidity ^0.8.19;

// import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
// import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
// import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
// import {ERC20PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
// import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
// import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// contract WrappedTokens is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, ERC20PausableUpgradeable, AccessControlUpgradeable, ERC20PermitUpgradeable {
//     bytes32 public constant PAUSER_ROLE = 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a;  // keccak256("PAUSER_ROLE");
//     bytes32 public constant MINTER_ROLE = 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6;  // keccak256("MINTER_ROLE");


//     /// @custom:oz-upgrades-unsafe-allow constructor
//     constructor() {
//         _disableInitializers();
//     }

//     function initialize(string memory name, string memory symbol, address defaultAdmin, address pauser, address minter)
//         public initializer
//     {
//         __ERC20_init(name, symbol);
//         __ERC20Burnable_init();
//         __ERC20Pausable_init();
//         __AccessControl_init();
//         __ERC20Permit_init(name);

//         _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
//         _grantRole(PAUSER_ROLE, pauser);
//         _grantRole(MINTER_ROLE, minter);
//     }

//     function decimals() public view virtual override returns (uint8) {
//         return 6;
//     }

//     function pause() public onlyRole(PAUSER_ROLE) {
//         _pause();
//     }

//     function unpause() public onlyRole(PAUSER_ROLE) {
//         _unpause();
//     }

//     function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
//         _mint(to, amount);
//     }

//     function _update(address from, address to, uint256 value)
//         internal
//         override(ERC20Upgradeable, ERC20PausableUpgradeable)
//     {
//         super._update(from, to, value);
//     }
// }