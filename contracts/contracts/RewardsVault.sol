// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./MediPearsToken.sol";

contract RewardsVault is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public constant MIN_LOCK_PERIOD = 7 days;

    uint256 public constant BRONZE_THRESHOLD = 100 ether;
    uint256 public constant SILVER_THRESHOLD = 500 ether;
    uint256 public constant GOLD_THRESHOLD = 2000 ether;
    uint256 public constant DIAMOND_THRESHOLD = 5000 ether;

    uint256 public constant BRONZE_BOOST_BPS = 500;
    uint256 public constant SILVER_BOOST_BPS = 1500;
    uint256 public constant GOLD_BOOST_BPS = 3000;
    uint256 public constant DIAMOND_BOOST_BPS = 5000;

    enum Tier {
        None,
        Bronze,
        Silver,
        Gold,
        Diamond
    }

    MediPearsToken public immutable token;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public unlockTimestamp;
    mapping(address => Tier) public userTier;

    event Staked(address indexed user, uint256 amount, uint256 unlockTimestamp, Tier tier);
    event Unstaked(address indexed user, uint256 amount, Tier tier);

    constructor(address tokenAddress, address admin) {
        require(tokenAddress != address(0), "token is zero address");
        require(admin != address(0), "admin is zero address");

        token = MediPearsToken(tokenAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "amount is zero");

        stakedBalance[msg.sender] += amount;
        unlockTimestamp[msg.sender] = block.timestamp + MIN_LOCK_PERIOD;

        userTier[msg.sender] = _tierForAmount(stakedBalance[msg.sender]);

        IERC20(address(token)).safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount, unlockTimestamp[msg.sender], userTier[msg.sender]);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "amount is zero");
        require(block.timestamp >= unlockTimestamp[msg.sender], "stake is still locked");
        require(stakedBalance[msg.sender] >= amount, "insufficient staked balance");

        stakedBalance[msg.sender] -= amount;
        userTier[msg.sender] = _tierForAmount(stakedBalance[msg.sender]);

        IERC20(address(token)).safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, userTier[msg.sender]);
    }

    function getBoostBps(address user) external view returns (uint256) {
        Tier tier = userTier[user];
        if (tier == Tier.Diamond) return DIAMOND_BOOST_BPS;
        if (tier == Tier.Gold) return GOLD_BOOST_BPS;
        if (tier == Tier.Silver) return SILVER_BOOST_BPS;
        if (tier == Tier.Bronze) return BRONZE_BOOST_BPS;
        return 0;
    }

    function getUserStake(address user) external view returns (uint256 amount, uint256 unlockedAt) {
        return (stakedBalance[user], unlockTimestamp[user]);
    }

    function _tierForAmount(uint256 amount) internal pure returns (Tier) {
        if (amount >= DIAMOND_THRESHOLD) return Tier.Diamond;
        if (amount >= GOLD_THRESHOLD) return Tier.Gold;
        if (amount >= SILVER_THRESHOLD) return Tier.Silver;
        if (amount >= BRONZE_THRESHOLD) return Tier.Bronze;
        return Tier.None;
    }
}
