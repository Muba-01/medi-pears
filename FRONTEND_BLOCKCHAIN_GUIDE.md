# MediPears Frontend - Blockchain Integration Guide

## Overview

The MediPears frontend now includes comprehensive blockchain features for token staking, balance display, and reward tracking.

---

## Features Implemented

### 1. Token Balance Display

**Location:** Profile page (`/profile/[wallet]`)

**Component:** `src/components/profile/TokenBalanceDisplay.tsx`

- Displays current MPR token balance (from blockchain)
- Shows current staking tier
- Displays reward boost percentage
- Shows progress to next tier
- Links to staking page

**How it works:**
```tsx
<TokenBalanceDisplay walletAddress={userWalletAddress} />
```

---

### 2. Staking Page

**Location:** `/stake`

**File:** `src/app/stake/page.tsx`

**Features:**
- View wallet balance and staked tokens
- Stake tokens (with approval flow)
- Unstake tokens (respects lock time)
- View current staking tier and reward boost
- See all tier requirements and thresholds
- Real-time transaction status

**Tier System:**
| Tier | Threshold | Emoji | Color |
|------|-----------|-------|-------|
| Bronze | 100 MPR | 🥉 | #8B4513 |
| Silver | 500 MPR | 🥈 | #C0C0C0 |
| Gold | 2000 MPR | 🥇 | #FFD700 |
| Diamond | 5000 MPR | 💎 | #00FFFF |

---

### 3. Rewards Activity Component

**Location:** `src/components/RewardsActivity.tsx`

**Features:**
- Shows recent reward activities
- Displays reward type (post, upvote, comment, daily login)
- Shows reward amount and timestamp
- Links to Etherscan transaction (if available)
- Auto-refreshes every 10 seconds

**Reward Types:**
- 🔥 Post Created → 10 MPR
- 📈 Upvote Received → 2 MPR
- 💬 Comment Created → 5 MPR
- 🔔 Daily Login → 3 MPR

---

## Environment Variables

Add to `.env.local`:

```env
# Token and Staking Contract Addresses
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_STAKING_ADDRESS=0x...
```

---

## Hooks API

### useTokenBalance

Fetch current MPR token balance for a wallet.

```tsx
const { balance, loading, error, refetch } = useTokenBalance(walletAddress);

// balance: string (formatted with decimals)
// loading: boolean
// error: string | null
// refetch: () => Promise<void>
```

### useStakingInfo

Fetch staking information (amount, unlock time, tier, boost).

```tsx
const { stakeInfo, loading, error, refetch } = useStakingInfo(walletAddress);

// stakeInfo.amount: bigint
// stakeInfo.unlockedAt: number (unix timestamp)
// stakeInfo.tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND"
// stakeInfo.rewardBoost: number (percentage)
```

### useStakeTransaction

Manage staking/unstaking transactions.

```tsx
const {
  transactionState,    // "idle" | "pending" | "success" | "error"
  transactionHash,     // string (tx hash when successful)
  error,              // string (error message)
  stake,              // (amount: string) => Promise<void>
  unstake,            // (amount: string) => Promise<void>
  reset,              // () => void
} = useStakeTransaction();

// Usage:
await stake("100");
// → transactionState becomes "pending"
// → "success" after confirmation
```

---

## Service API

### BlockchainService

Low-level blockchain interaction service.

```typescript
import { blockchainService } from "@/services/blockchainService";

// Get token balance
const balance = await blockchainService.getTokenBalance(walletAddress);
// Returns: "1234.5" (string, formatted)

// Get staking info
const info = await blockchainService.getStakingInfo(walletAddress);
// Returns: { amount: 100n, unlockedAt: 1704067200, tier: "GOLD", rewardBoost: 20 }

// Stake tokens
const result = await blockchainService.stake("100");
// Returns: { status: "success", hash: "0x..." } or { status: "error", error: "message" }

// Unstake tokens
const result = await blockchainService.unstake("50");

// Get current tier from balance
const tier = blockchainService.getCurrentTier(1234); // "GOLD"

// Request wallet connection
const accounts = await blockchainService.requestWalletConnect();
```

---

## Transaction Flow

### Staking Flow

1. **User enters amount** in input field
2. **User clicks "Confirm"**
3. **Approval Transaction** (user signs)
   - Approved token spend to staking contract
4. **Staking Transaction** (user signs)
   - Tokens transferred to staking contract
   - User's stake updated on blockchain
5. **UI Updates** → "Success" state
6. **Refresh hooks** → Balance/staking info updated

### Unstaking Flow

1. **User enters amount** to unstake
2. **Check unlock time**
   - If locked: show unlock countdown
   - If unlocked: allow unstake
3. **Unstake Transaction** (user signs)
   - Tokens returned to wallet
4. **UI Updates** → "Success" state

---

## UI States

All transaction forms include visual feedback:

### Pending State
```
⏳ Processing transaction...
```

### Success State
```
✓ Transaction successful!
View on Etherscan [link]
```

### Error State
```
✗ Error: [error message]
```

---

## Integration Examples

### Display Balance on Profile

```tsx
import TokenBalanceDisplay from "@/components/profile/TokenBalanceDisplay";

export default function ProfilePage() {
  return (
    <div>
      <ProfileHeader walletAddress={userWallet} />
      <TokenBalanceDisplay walletAddress={userWallet} />
    </div>
  );
}
```

### Show Rewards Activity

```tsx
import RewardsActivity from "@/components/RewardsActivity";

export default function DashboardPage() {
  return (
    <div>
      <RewardsActivity walletAddress={userWallet} limit={10} />
    </div>
  );
}
```

### Custom Staking Form

```tsx
import { useTokenBalance, useStakeTransaction } from "@/hooks/useBlockchain";

export default function CustomStaker() {
  const { balance } = useTokenBalance(walletAddress);
  const { transactionState, stake } = useStakeTransaction();

  return (
    <div>
      <input type="number" onChange={(e) => setAmount(e.target.value)} />
      <button onClick={() => stake(amount)}>
        {transactionState === "pending" ? "Staking..." : "Stake"}
      </button>
    </div>
  );
}
```

---

## Wallet Connection

The service automatically connects to `window.ethereum` (MetaMask, WalletConnect, etc.).

```tsx
try {
  // Initialize provider (auto-connects)
  await blockchainService.initializeProvider();
  
  // Or manually request accounts
  const accounts = await blockchainService.requestWalletConnect();
  console.log("Connected:", accounts[0]);
} catch (error) {
  console.error("No wallet found");
}
```

---

## Error Handling

All async operations return structured results:

```typescript
// useTokenBalance
{ balance: "1234.5", loading: false, error: null }
{ balance: null, loading: false, error: "Failed to fetch balance" }

// useStakeTransaction
{ transactionState: "success", transactionHash: "0x..." }
{ transactionState: "error", error: "Insufficient balance" }
```

---

## Refresh Staking Info After Transactions

```tsx
const { stakeInfo, refetch } = useStakingInfo(walletAddress);
const { transactionState } = useStakeTransaction();

useEffect(() => {
  if (transactionState === "success") {
    // Wait 2 seconds for blockchain to finalize
    setTimeout(() => refetch(), 2000);
  }
}, [transactionState, refetch]);
```

---

## Testing

### Test Token Balance Display

1. Go to any user's profile
2. If wallet address is connected, see "MPR Balance" box
3. Amount should update every 30 seconds
4. Click "Stake" button to go to staking page

### Test Staking Page

1. Visit `/stake`
2. Sign in with wallet
3. See current balance and staked amount
4. Try staking a small amount (with testnet tokens)
5. Watch "Processing..." state
6. See "Success" state with tx hash
7. Verify balance updated after 2 seconds

### Test Rewards Activity

1. Appear in the recent activity feed
2. Each reward shows:
   - Type (post, upvote, etc.)
   - Amount
   - Time ago
   - Link to Etherscan (if txHash available)

---

## Performance Notes

- **Balance refreshes:** Every 30 seconds
- **Staking info refreshes:** Every 30 seconds
- **Activity refreshes:** Every 10 seconds
- **Caching:** Uses React hooks (local state)
- **No external API calls:** Direct blockchain RPC calls

---

## Security Considerations

- ✅ All transaction signing is done by **user's wallet** (MetaMask)
- ✅ **No private keys stored** in frontend
- ✅ **No sensitive data** in environment variables
- ✅ Contract addresses are public (safe in NEXT_PUBLIC_*)
- ✅ Transactions are **verified on-chain**

---

## Dependencies

```json
{
  "ethers": "^6.16.0",
  "next": "16.1.6",
  "next-auth": "^4.24.13",
  "react": "19.2.3"
}
```

No additional blockchain libraries needed!

---

## Common Issues

### "MetaMask not found"
- User doesn't have a Web3 wallet extension
- Install MetaMask: https://metamask.io

### Balance showing as 0
- User wallet doesn't have tokens yet
- Complete tasks to earn MPR tokens
- Or receive tokens from another wallet

### "Insufficient balance for gas"
- Wallet needs ETH/native token for gas fees
- Add funds to wallet

### Unlock countdown stuck
- Refresh page
- Check blockchain explorer directly

### Staking transaction fails
- Check allowance (approval may be needed first)
- Ensure sufficient token balance
- Check gas price and network congestion

---

## Future Enhancements

- [ ] Liquidity pool integration
- [ ] DAO governance voting
- [ ] Advanced staking strategies
- [ ] Reward claiming interface
- [ ] Gas price optimization
- [ ] Multi-chain support

