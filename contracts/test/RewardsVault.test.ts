import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("RewardsVault", function () {
  async function deployFixture() {
    const [admin, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MediPearsToken");
    const token = await Token.deploy(admin.address);
    await token.waitForDeployment();

    const Vault = await ethers.getContractFactory("RewardsVault");
    const vault = await Vault.deploy(await token.getAddress(), admin.address);
    await vault.waitForDeployment();

    const largeMint = ethers.parseEther("10000");
    await token.connect(admin).adminMint(user.address, largeMint);

    return { token, vault, admin, user };
  }

  it("stakes and assigns tiers correctly", async function () {
    const { token, vault, user } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("500"); // Silver

    await token.connect(user).approve(await vault.getAddress(), amount);

    await expect(vault.connect(user).stake(amount))
      .to.emit(vault, "Staked")
      .withArgs(user.address, amount, anyValue, 2n);

    expect(await vault.stakedBalance(user.address)).to.equal(amount);
    expect(await vault.userTier(user.address)).to.equal(2n);
    expect(await vault.getBoostBps(user.address)).to.equal(1500n);
  });

  it("prevents unstake before 7-day lock", async function () {
    const { token, vault, user } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("100");

    await token.connect(user).approve(await vault.getAddress(), amount);
    await vault.connect(user).stake(amount);

    await expect(vault.connect(user).unstake(amount)).to.be.revertedWith("stake is still locked");
  });

  it("allows unstake after lock period and updates tier", async function () {
    const { token, vault, user } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("2000");

    await token.connect(user).approve(await vault.getAddress(), amount);
    await vault.connect(user).stake(amount);

    expect(await vault.userTier(user.address)).to.equal(3n); // Gold

    await time.increase(7 * 24 * 60 * 60 + 1);

    await expect(vault.connect(user).unstake(ethers.parseEther("1900")))
      .to.emit(vault, "Unstaked")
      .withArgs(user.address, ethers.parseEther("1900"), 1n);

    expect(await vault.stakedBalance(user.address)).to.equal(ethers.parseEther("100"));
    expect(await vault.userTier(user.address)).to.equal(1n); // Bronze
    expect(await vault.getBoostBps(user.address)).to.equal(500n);
  });

  it("returns expected boosts for all tiers", async function () {
    const { token, vault, user } = await loadFixture(deployFixture);

    await token.connect(user).approve(await vault.getAddress(), ethers.parseEther("5000"));

    await vault.connect(user).stake(ethers.parseEther("100"));
    expect(await vault.getBoostBps(user.address)).to.equal(500n);

    await vault.connect(user).stake(ethers.parseEther("400"));
    expect(await vault.getBoostBps(user.address)).to.equal(1500n);

    await vault.connect(user).stake(ethers.parseEther("1500"));
    expect(await vault.getBoostBps(user.address)).to.equal(3000n);

    await vault.connect(user).stake(ethers.parseEther("3000"));
    expect(await vault.getBoostBps(user.address)).to.equal(5000n);
  });
});
