import { ethers } from "ethers";
import type { RewardsController } from "../../contracts/typechain-types";
import { RewardsController__factory } from "../../contracts/typechain-types";

interface OracleConfig {
  rpcUrl: string;
  privateKey: string;
  rewardsControllerAddress: string;
}

// Reward amounts for different events (in wei or token decimals)
const REWARD_AMOUNTS = {
  POST_CREATED: ethers.parseEther("10"),
  POST_UPVOTED: ethers.parseEther("2"),
  COMMENT_CREATED: ethers.parseEther("5"),
  COMMENT_UPVOTED: ethers.parseEther("1"),
  COMMUNITY_JOINED: ethers.parseEther("15"),
  DAILY_LOGIN: ethers.parseEther("3"),
};

class RewardsOracleService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: RewardsController | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const config = this.validateConfig();
    
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      
      // Initialize wallet
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);
      
      // Initialize contract
      this.contract = await this.getContractInstance(
        config.rewardsControllerAddress
      );

      this.initialized = true;
      console.log("[RewardsOracle] Service initialized successfully");
    } catch (error) {
      console.error("[RewardsOracle] Initialization failed:", error);
      throw error;
    }
  }

  private validateConfig(): OracleConfig {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const privateKey = process.env.ORACLE_PRIVATE_KEY;
    const rewardsControllerAddress = process.env.REWARDS_CONTROLLER_ADDRESS;

    if (!rpcUrl) {
      throw new Error("BLOCKCHAIN_RPC_URL environment variable is not set");
    }
    if (!privateKey) {
      throw new Error("ORACLE_PRIVATE_KEY environment variable is not set");
    }
    if (!rewardsControllerAddress) {
      throw new Error(
        "REWARDS_CONTROLLER_ADDRESS environment variable is not set"
      );
    }

    return {
      rpcUrl,
      privateKey,
      rewardsControllerAddress,
    };
  }

  private async getContractInstance(
    contractAddress: string
  ): Promise<RewardsController> {
    if (!this.wallet) {
      throw new Error("Wallet not initialized");
    }

    // Use the typechain-generated factory for proper typing
    const contract = RewardsController__factory.connect(
      contractAddress,
      this.wallet
    );

    return contract;
  }

  private generateEventId(...parts: string[]): string {
    const combined = parts.join(":");
    return ethers.keccak256(ethers.toUtf8Bytes(combined));
  }

  private async executeReward(
    walletAddress: string,
    rewardAmount: bigint,
    eventId: string,
    eventType: string
  ): Promise<void> {
    try {
      await this.initialize();

      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      // Validate wallet address
      if (!ethers.isAddress(walletAddress)) {
        throw new Error(`Invalid wallet address: ${walletAddress}`);
      }

      // Check if event already rewarded
      const alreadyUsed = await this.contract.eventIdUsed(eventId);
      if (alreadyUsed) {
        console.warn(
          `[RewardsOracle] Event ${eventType} already rewarded:`,
          eventId
        );
        return;
      }

      // Call issueReward on contract
      const tx = await this.contract.issueReward(
        walletAddress,
        rewardAmount,
        eventId
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      console.log(
        `[RewardsOracle] ${eventType} reward issued. Tx Hash:`,
        receipt?.hash || tx.hash
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[RewardsOracle] Failed to issue ${eventType} reward:`,
        errorMessage
      );
      // Retry logic can be added here if needed
    }
  }

  /**
   * Award tokens when a user creates a post
   * Fires asynchronously - does not block API response
   */
  onPostCreated(walletAddress: string, postId: string): void {
    const eventId = this.generateEventId("postCreated", postId);
    this.executeReward(
      walletAddress,
      REWARD_AMOUNTS.POST_CREATED,
      eventId,
      "postCreated"
    ).catch(console.error);
  }

  /**
   * Award tokens when a user upvotes a post
   * Fires asynchronously - does not block API response
   */
  onPostUpvoted(
    walletAddress: string,
    postId: string,
    voterId: string
  ): void {
    const eventId = this.generateEventId("postUpvote", postId, voterId);
    this.executeReward(
      walletAddress,
      REWARD_AMOUNTS.POST_UPVOTED,
      eventId,
      "postUpvote"
    ).catch(console.error);
  }

  /**
   * Award tokens when a user creates a comment
   * Fires asynchronously - does not block API response
   */
  onCommentCreated(walletAddress: string, commentId: string): void {
    const eventId = this.generateEventId("commentCreated", commentId);
    this.executeReward(
      walletAddress,
      REWARD_AMOUNTS.COMMENT_CREATED,
      eventId,
      "commentCreated"
    ).catch(console.error);
  }

  /**
   * Award tokens when a user upvotes a comment
   * Fires asynchronously - does not block API response
   */
  onCommentUpvoted(
    walletAddress: string,
    commentId: string,
    voterId: string
  ): void {
    const eventId = this.generateEventId("commentUpvote", commentId, voterId);
    this.executeReward(
      walletAddress,
      REWARD_AMOUNTS.COMMENT_UPVOTED,
      eventId,
      "commentUpvote"
    ).catch(console.error);
  }

  /**
   * Award tokens when a user joins a community
   * Fires asynchronously - does not block API response
   */
  onCommunityJoined(walletAddress: string, communitySlug: string): void {
    const eventId = this.generateEventId("communityJoined", communitySlug);
    this.executeReward(
      walletAddress,
      REWARD_AMOUNTS.COMMUNITY_JOINED,
      eventId,
      "communityJoined"
    ).catch(console.error);
  }

  /**
   * Award tokens for daily login
   * Fires asynchronously - does not block API response
   */
  onDailyLogin(walletAddress: string): void {
    const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const eventId = this.generateEventId("dailyLogin", walletAddress, dateKey);
    this.executeReward(
      walletAddress,
      REWARD_AMOUNTS.DAILY_LOGIN,
      eventId,
      "dailyLogin"
    ).catch(console.error);
  }
}

// Export singleton instance
export const rewardsOracle = new RewardsOracleService();
