import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MediPearsToken", function () {
  async function deployFixture() {
    const [admin, controller, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MediPearsToken");
    const token = await Token.deploy(admin.address);
    await token.waitForDeployment();

    return { token, admin, controller, user };
  }

  it("sets expected token metadata", async function () {
    const { token } = await loadFixture(deployFixture);

    expect(await token.name()).to.equal("MediPears");
    expect(await token.symbol()).to.equal("MPRS");
    expect(await token.decimals()).to.equal(18);
  });

  it("allows ADMIN_ROLE to mint", async function () {
    const { token, admin, user } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("250");

    await expect(token.connect(admin).adminMint(user.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, user.address, amount);

    expect(await token.balanceOf(user.address)).to.equal(amount);
  });

  it("rejects admin mint from non-admin", async function () {
    const { token, user } = await loadFixture(deployFixture);

    await expect(token.connect(user).adminMint(user.address, 1)).to.be.revertedWithCustomError(
      token,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("allows only configured controller to mint rewards", async function () {
    const { token, admin, controller, user } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("10");

    await expect(token.connect(controller).mintReward(user.address, amount)).to.be.revertedWithCustomError(
      token,
      "AccessControlUnauthorizedAccount"
    );

    await token.connect(admin).setRewardsController(controller.address);

    await expect(token.connect(controller).mintReward(user.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, user.address, amount);

    expect(await token.balanceOf(user.address)).to.equal(amount);
  });

  it("allows admin to revoke controller role", async function () {
    const { token, admin, controller, user } = await loadFixture(deployFixture);

    await token.connect(admin).setRewardsController(controller.address);
    await token.connect(controller).mintReward(user.address, 5);

    await token.connect(admin).revokeRewardsController(controller.address);

    await expect(token.connect(controller).mintReward(user.address, 5)).to.be.revertedWithCustomError(
      token,
      "AccessControlUnauthorizedAccount"
    );
  });
});
