// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MediPearsToken.sol";

contract RewardsController is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    MediPearsToken public immutable token;

    mapping(bytes32 => bool) public eventIdUsed;
    mapping(address => uint256) public totalRewardsByUser;

    uint256 public maxRewardPerEvent;
    uint256 public maxRewardsPerUser;

    event RewardIssued(address indexed user, uint256 amount, bytes32 indexed eventId);
    event RewardCapsUpdated(uint256 maxRewardPerEvent, uint256 maxRewardsPerUser);

    constructor(
        address tokenAddress,
        address admin,
        address oracle,
        uint256 initialMaxRewardPerEvent,
        uint256 initialMaxRewardsPerUser
    ) {
        require(tokenAddress != address(0), "token is zero address");
        require(admin != address(0), "admin is zero address");
        require(oracle != address(0), "oracle is zero address");
        require(initialMaxRewardPerEvent > 0, "invalid event cap");
        require(initialMaxRewardsPerUser > 0, "invalid user cap");

        token = MediPearsToken(tokenAddress);
        maxRewardPerEvent = initialMaxRewardPerEvent;
        maxRewardsPerUser = initialMaxRewardsPerUser;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, oracle);
    }

    function issueReward(address user, uint256 amount, bytes32 eventId)
        external
        onlyRole(ORACLE_ROLE)
        whenNotPaused
    {
        require(user != address(0), "user is zero address");
        require(amount > 0, "amount is zero");
        require(!eventIdUsed[eventId], "event already rewarded");
        require(amount <= maxRewardPerEvent, "amount above event cap");

        uint256 nextTotal = totalRewardsByUser[user] + amount;
        require(nextTotal <= maxRewardsPerUser, "amount above user cap");

        eventIdUsed[eventId] = true;
        totalRewardsByUser[user] = nextTotal;

        token.mintReward(user, amount);

        emit RewardIssued(user, amount, eventId);
    }

    function setRewardCaps(uint256 newMaxRewardPerEvent, uint256 newMaxRewardsPerUser)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(newMaxRewardPerEvent > 0, "invalid event cap");
        require(newMaxRewardsPerUser > 0, "invalid user cap");

        maxRewardPerEvent = newMaxRewardPerEvent;
        maxRewardsPerUser = newMaxRewardsPerUser;

        emit RewardCapsUpdated(newMaxRewardPerEvent, newMaxRewardsPerUser);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
