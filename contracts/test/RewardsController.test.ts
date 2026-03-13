import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("RewardsController", function () {
  async function deployFixture() {
    const [admin, oracle, user, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MediPearsToken");
    const token = await Token.deploy(admin.address);
    await token.waitForDeployment();

    const Controller = await ethers.getContractFactory("RewardsController");
    const controller = await Controller.deploy(
      await token.getAddress(),
      admin.address,
      oracle.address,
      ethers.parseEther("100"),
      ethers.parseEther("150")
    );
    await controller.waitForDeployment();

    await token.connect(admin).setRewardsController(await controller.getAddress());

    return { token, controller, admin, oracle, user, other };
  }

  it("issues rewards once per eventId via ORACLE_ROLE", async function () {
    const { token, controller, oracle, user } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("25");
    const eventId = ethers.id("medipears:reward:1");

    await expect(controller.connect(oracle).issueReward(user.address, amount, eventId))
      .to.emit(controller, "RewardIssued")
      .withArgs(user.address, amount, eventId);

    expect(await token.balanceOf(user.address)).to.equal(amount);
    expect(await controller.eventIdUsed(eventId)).to.equal(true);

    await expect(
      controller.connect(oracle).issueReward(user.address, amount, eventId)
    ).to.be.revertedWith("event already rewarded");
  });

  it("rejects issueReward from non-oracle", async function () {
    const { controller, other, user } = await loadFixture(deployFixture);

    await expect(
      controller.connect(other).issueReward(user.address, 1, ethers.id("evt-no-oracle"))
    ).to.be.revertedWithCustomError(controller, "AccessControlUnauthorizedAccount");
  });

  it("enforces caps and allows ADMIN_ROLE to update caps", async function () {
    const { controller, admin, oracle, user } = await loadFixture(deployFixture);

    await expect(
      controller.connect(oracle).issueReward(user.address, ethers.parseEther("101"), ethers.id("evt-cap-1"))
    ).to.be.revertedWith("amount above event cap");

    await controller.connect(admin).setRewardCaps(ethers.parseEther("120"), ethers.parseEther("130"));

    await controller
      .connect(oracle)
      .issueReward(user.address, ethers.parseEther("120"), ethers.id("evt-cap-2"));

    await expect(
      controller.connect(oracle).issueReward(user.address, ethers.parseEther("11"), ethers.id("evt-cap-3"))
    ).to.be.revertedWith("amount above user cap");
  });

  it("supports pause and unpause", async function () {
    const { controller, admin, oracle, user } = await loadFixture(deployFixture);

    await controller.connect(admin).pause();

    await expect(
      controller.connect(oracle).issueReward(user.address, 1, ethers.id("evt-paused"))
    ).to.be.revertedWithCustomError(controller, "EnforcedPause");

    await controller.connect(admin).unpause();

    await expect(
      controller.connect(oracle).issueReward(user.address, 1, ethers.id("evt-unpaused"))
    ).to.emit(controller, "RewardIssued");
  });
});
