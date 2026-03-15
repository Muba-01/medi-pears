# Blockchain Setup Guide

This guide walks you through deploying the smart contracts and configuring your frontend to use them.

## Prerequisites

- Node.js 18+ installed
- A Sepolia testnet RPC URL (from Alchemy, Infura, or similar)
- A wallet private key with testnet ETH for gas fees
- MetaMask or another Web3 wallet browser extension

## Step 1: Deploy Smart Contracts

### 1a. Configure Hardhat Environment

In the `contracts` directory, create a `.env` file with your deployment credentials:

```bash
cd contracts
```

Create `.env`:
```
DEPLOYER_PRIVATE_KEY=your_wallet_private_key_here
ORACLE_WALLET_ADDRESS=your_oracle_wallet_address_here
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/your-api-key
```

**Important:** Never commit `.env` files. They're automatically in `.gitignore`.

### 1b. Run Deployment Script

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

This will output something like:

```
Deploying contracts with: 0x1234...
MediPearsToken deployed at: 0xabcd...
RewardsController deployed at: 0xefgh...
RewardsVault deployed at: 0xijkl...

=== Add this to your frontend .env.local ===
NEXT_PUBLIC_TOKEN_ADDRESS=0xabcd...
NEXT_PUBLIC_STAKING_ADDRESS=0xijkl...
=============================================
```

## Step 2: Configure Frontend Environment

### 2a. Create Frontend .env.local

In the root directory (same level as `package.json`), create `.env.local`:

```bash
# Blockchain Configuration
NEXT_PUBLIC_TOKEN_ADDRESS=0xabcd...
NEXT_PUBLIC_STAKING_ADDRESS=0xijkl...
```

Replace the addresses with the ones output by the deployment script above.

### 2b. Restart Development Server

If your dev server is running, stop it and restart:

```bash
npm run dev
```

## Step 3: Test the Integration

### 3a. Connect Your Wallet

1. Visit http://localhost:3000
2. Click "Sign In"
3. Select "Connect Wallet" (MetaMask)
4. Make sure MetaMask is on **Sepolia test network**
5. Approve the connection

### 3b. Check Token Balance

1. Navigate to your profile page
2. You should see the "MPR Balance" card showing your token balance
3. If you see "0.00", you don't have tokens yet

### 3c. Test Token Transfers

To give yourself test tokens, use Hardhat console:

```bash
cd contracts
npx hardhat console --network sepolia

# In the console:
const token = await ethers.getContractAt("MediPearsToken", "0xabcd...");
const [deployer] = await ethers.getSigners();
await token.transfer("your_wallet_address", ethers.parseEther("100"));
```

## Troubleshooting

### Error: "Contracts not deployed yet"

**Cause:** Contract addresses in `.env.local` are still the placeholder `0x0000...` or missing.

**Solution:** 
1. Deploy contracts: `cd contracts && npx hardhat run scripts/deploy.ts --network sepolia`
2. Copy the output addresses to `.env.local`
3. Restart the dev server

### Error: "could not decode result data"

**Cause:** Contract address is not a valid ERC20 contract on the network.

**Solution:**
1. Verify the address is correct in `.env.local`
2. Verify you're on the correct network (Sepolia) in MetaMask
3. Verify the contract was deployed successfully

### Error: "MetaMask or Web3 wallet not found"

**Cause:** MetaMask is not installed or not connected.

**Solution:**
1. Install MetaMask: https://metamask.io
2. Make sure it's enabled in your browser
3. Refresh the page

### Token Balance Shows "0.00" but No Error

**Cause:** You haven't transferred tokens to your wallet yet.

**Solution:**
1. Use the Hardhat console to transfer test tokens (see "Test Token Transfers" above)
2. Or mint tokens if you have admin privileges

## Contract Addresses

Keep track of your deployed contract addresses:

- **Token Contract (MediPearsToken):** `NEXT_PUBLIC_TOKEN_ADDRESS=0x...`
- **Staking Contract (RewardsVault):** `NEXT_PUBLIC_STAKING_ADDRESS=0x...`
- **Rewards Controller:** (Used by backend oracle, not needed in frontend)

## Next Steps

After successful setup:

1. **Test Staking:** Visit `/stake` page and try staking tokens
2. **Test Rewards:** Make posts/comments to earn rewards
3. **View Rewards:** Check `/api/rewards/activity` endpoint for reward history
4. **Monitor Balance:** Watch token balance update as you earn rewards

## Resetting for Development

To start fresh:

1. **Redeploy contracts:**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

2. **Update addresses in `.env.local`**

3. **Clear wallet metadata (optional):**
   - In MetaMask: Settings → Advanced → Clear activity tab data

4. **Restart dev server** (`npm run dev`)

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Check the terminal logs where you ran `npm run dev`
3. Verify all environment variables are set correctly
4. Ensure you're on the Sepolia test network in MetaMask
