// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MediPearsToken is ERC20, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    constructor(address admin) ERC20("MediPears", "MPRS") {
        require(admin != address(0), "admin is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function setRewardsController(address controller) external onlyRole(ADMIN_ROLE) {
        require(controller != address(0), "controller is zero address");
        _grantRole(CONTROLLER_ROLE, controller);
    }

    function revokeRewardsController(address controller) external onlyRole(ADMIN_ROLE) {
        _revokeRole(CONTROLLER_ROLE, controller);
    }

    function adminMint(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        _mint(to, amount);
    }

    function mintReward(address to, uint256 amount) external onlyRole(CONTROLLER_ROLE) {
        _mint(to, amount);
    }
}
