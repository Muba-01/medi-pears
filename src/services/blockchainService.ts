import { ethers, Contract, BrowserProvider } from "ethers";

// MediPearsToken ABI (minimal interface needed for frontend)
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// Staking Contract ABI
const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function getUserStake(address user) external view returns (uint256 amount, uint256 unlockedAt)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
];

export interface StakeInfo {
  amount: bigint;
  unlockedAt: number;
}

export interface TransactionState {
  status: "idle" | "pending" | "success" | "error";
  hash?: string;
  error?: string;
}

class BlockchainService {
  private provider: BrowserProvider | null = null;
  private tokenContract: Contract | null = null;
  private stakingContract: Contract | null = null;

  private tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
  private stakingAddress = process.env.NEXT_PUBLIC_STAKING_ADDRESS;

  async initializeProvider(): Promise<BrowserProvider> {
    if (!window.ethereum) {
      throw new Error("MetaMask or Web3 wallet not found");
    }

    if (!this.provider) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    return this.provider;
  }

  async getTokenBalance(walletAddress: string): Promise<string> {
    try {
      // Validate token address is configured and valid
      if (!this.tokenAddress || this.tokenAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(
          "Token contract not deployed. Steps: (1) Open Terminal 1: cd contracts && npx hardhat node (KEEP RUNNING), (2) Open Terminal 2: cd contracts && npx hardhat run scripts/deploy.ts --network localhost, (3) Copy the output addresses (MediPearsToken and RewardsVault) to NEXT_PUBLIC_TOKEN_ADDRESS and NEXT_PUBLIC_STAKING_ADDRESS in .env.local, (4) Restart: npm run dev"
        );
      }

      const provider = await this.initializeProvider();

      if (!this.tokenContract && this.tokenAddress) {
        this.tokenContract = new ethers.Contract(
          this.tokenAddress,
          TOKEN_ABI,
          provider
        );
      }

      if (!this.tokenContract) {
        throw new Error(
          "Failed to initialize token contract. Please check NEXT_PUBLIC_TOKEN_ADDRESS in .env.local"
        );
      }

      const balance = await this.tokenContract.balanceOf(walletAddress);
      const decimals = await this.tokenContract.decimals();

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("[BlockchainService] Failed to fetch token balance:", error);
      throw error;
    }
  }

  async getStakingInfo(walletAddress: string): Promise<StakeInfo> {
    try {
      // Validate staking address is configured and valid
      if (!this.stakingAddress || this.stakingAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(
          "Staking contract not deployed. Run: cd contracts && npx hardhat run scripts/deploy.ts --network sepolia, then copy the NEXT_PUBLIC_STAKING_ADDRESS to .env.local"
        );
      }

      const provider = await this.initializeProvider();

      if (!this.stakingContract && this.stakingAddress) {
        this.stakingContract = new ethers.Contract(
          this.stakingAddress,
          STAKING_ABI,
          provider
        );
      }

      if (!this.stakingContract) {
        throw new Error(
          "Failed to initialize staking contract. Please check NEXT_PUBLIC_STAKING_ADDRESS in .env.local"
        );
      }

      const stakeData = await this.stakingContract.getUserStake(walletAddress);

      return {
        amount: stakeData.amount,
        unlockedAt: Number(stakeData.unlockedAt),
      };
    } catch (error) {
      console.error("[BlockchainService] Failed to fetch staking info:", error);
      throw error;
    }
  }

  async stake(amount: string): Promise<TransactionState> {
    try {
      const provider = await this.initializeProvider();
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (!this.tokenAddress || !this.stakingAddress) {
        throw new Error("Contract addresses not configured");
      }

      // Step 1: Approve token spending
      const tokenContract = new ethers.Contract(
        this.tokenAddress,
        TOKEN_ABI,
        signer
      );

      const amountWei = ethers.parseEther(amount);
      const approveTx = await tokenContract.approve(this.stakingAddress, amountWei);
      await approveTx.wait();

      // Step 2: Stake tokens
      const stakingContract = new ethers.Contract(
        this.stakingAddress,
        STAKING_ABI,
        signer
      );

      const stakeTx = await stakingContract.stake(amountWei);
      const receipt = await stakeTx.wait();

      if (!receipt) {
        throw new Error("Transaction failed");
      }

      console.log("[BlockchainService] Stake successful:", receipt.hash);

      return {
        status: "success",
        hash: receipt.hash,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[BlockchainService] Stake failed:", errorMessage);

      return {
        status: "error",
        error: errorMessage,
      };
    }
  }

  async unstake(amount: string): Promise<TransactionState> {
    try {
      const provider = await this.initializeProvider();
      const signer = await provider.getSigner();

      if (!this.stakingAddress) {
        throw new Error("Staking contract address not configured");
      }

      const stakingContract = new ethers.Contract(
        this.stakingAddress,
        STAKING_ABI,
        signer
      );

      const amountWei = ethers.parseEther(amount);
      const tx = await stakingContract.unstake(amountWei);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed");
      }

      console.log("[BlockchainService] Unstake successful:", receipt.hash);

      return {
        status: "success",
        hash: receipt.hash,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[BlockchainService] Unstake failed:", errorMessage);

      return {
        status: "error",
        error: errorMessage,
      };
    }
  }



  formatTokenAmount(amount: bigint, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
  }

  parseTokenAmount(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
  }

  async requestWalletConnect(): Promise<string[]> {
    if (!window.ethereum) {
      throw new Error("MetaMask or Web3 wallet not found");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      return accounts;
    } catch (error) {
      console.error("[BlockchainService] Wallet connection failed:", error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();
