# Quick Integration Guide - Frontend Blockchain Features

## Overview

Summary of all new files and how to use them.

---

## Files Checklist

### Services
- ✅ `src/services/blockchainService.ts` - Low-level blockchain operations

### Hooks
- ✅ `src/hooks/useBlockchain.ts` - React hooks for blockchain data

### Components
- ✅ `src/components/profile/TokenBalanceDisplay.tsx` - Profile balance display
- ✅ `src/components/RewardsActivity.tsx` - Reward activity feed

### Pages
- ✅ `src/app/stake/page.tsx` - Complete staking interface (NEW PAGE)

### APIs
- ✅ `src/app/api/rewards/activity/route.ts` - Reward activity endpoint

### Documentation
- ✅ `FRONTEND_BLOCKCHAIN_GUIDE.md` - Complete reference
- ✅ `BLOCKCHAIN_FRONTEND_SUMMARY.md` - Implementation summary

---

## Quick Usage Examples

### 1. Display Token Balance (Already Integrated)

```tsx
// Auto-integrated in ProfileHeader for wallet users
// Nothing to do! It shows automatically on profile pages
```

### 2. Add Rewards Activity to Dashboard

```tsx
import RewardsActivity from "@/components/RewardsActivity";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      
      {/* Add rewards feed */}
      <RewardsActivity 
        walletAddress={session?.user?.walletAddress}
        limit={10}
      />
    </div>
  );
}
```

### 3. Check Wallet Balance Programmatically

```tsx
import { useTokenBalance } from "@/hooks/useBlockchain";

export default function MyComponent() {
  const { balance, loading } = useTokenBalance(walletAddress);

  if (loading) return <p>Loading...</p>;
  
  return <p>You have {balance} MPR tokens</p>;
}
```

### 4. Check Staking Info

```tsx
import { useStakingInfo } from "@/hooks/useBlockchain";

export default function StakingStatus() {
  const { stakeInfo, loading } = useStakingInfo(walletAddress);

  if (!stakeInfo?.amount) return <p>Not staking</p>;

  return (
    <div>
      <p>Staked: {Number(stakeInfo.amount) / 1e18} MPR</p>
      <p>Tier: {stakeInfo.tier}</p>
      <p>Boost: +{stakeInfo.rewardBoost}%</p>
    </div>
  );
}
```

### 5. Build Custom Staking UI

```tsx
import { useStakeTransaction } from "@/hooks/useBlockchain";

export default function CustomStaker() {
  const [amount, setAmount] = useState("");
  const { transactionState, stake, error } = useStakeTransaction();

  const handleStake = async () => {
    await stake(amount);
  };

  return (
    <div>
      <input 
        type="number" 
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleStake}>
        {transactionState === "pending" ? "Staking..." : "Stake"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## Environment Variables Required

**`.env.local`** (create if doesn't exist):

```env
NEXT_PUBLIC_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_STAKING_ADDRESS=0x0987654321098765432109876543210987654321
```

Get these from your smart contract deployment.

---

## Pages/Routes

### Existing (Modified)
- `/profile/[wallet]` - Added token balance display

### New
- `/stake` - Complete staking interface

---

## What Uses What

| Component/Hook | Needs | Purpose |
|---|---|---|
| `TokenBalanceDisplay` | `walletAddress` | Show balance + tier on profile |
| `RewardsActivity` | `walletAddress` | Show recent rewards |
| `useTokenBalance` | `walletAddress` | Fetch balance hook |
| `useStakingInfo` | `walletAddress` | Fetch staking details hook |
| `useStakeTransaction` | None | Manage stake/unstake |

---

## Styling (Tailwind CSS)

All components use:
- ✅ Tailwind CSS classes
- ✅ CSS variables for theme colors
- ✅ Responsive design
- ✅ Light/dark mode support

Example colors used:
- Purple: `#a78bfa`
- Green: `#34d399`
- Orange: `#fb923c`
- Blue: `#60a5fa`

---

## Data Flow

### Fetching Balance
```
User visits profile
  ↓
TokenBalanceDisplay mounts
  ↓
useTokenBalance() hook initializes
  ↓
Calls blockchainService.getTokenBalance()
  ↓
Connects to window.ethereum
  ↓
Calls balanceOf() on smart contract
  ↓
Returns formatted string (e.g., "1234.56")
  ↓
Updates UI
  ↓
Auto-refreshes every 30 seconds
```

### Staking Tokens
```
User enters amount on /stake
  ↓
Clicks "Confirm"
  ↓
useStakeTransaction() hook runs
  ↓
blockchainService.stake() called
  ↓
blockchainService.getTokenBalance() called
  ↓
Approval transaction (approve)
  ↓
Staking transaction (stake)
  ↓
Both require user MetaMask signature
  ↓
Returns { status: "success", hash: "0x..." }
  ↓
UI shows success message
  ↓
After 2 seconds: refetch staking info
  ↓
Balance/tier updates
```

---

## Common Tasks

### Display balance in custom component
```tsx
import { useTokenBalance } from "@/hooks/useBlockchain";

const { balance, loading } = useTokenBalance(walletAddress);
```

### Add activity feed anywhere
```tsx
import RewardsActivity from "@/components/RewardsActivity";

<RewardsActivity walletAddress={walletAddress} />
```

### Create stake button
```tsx
const { transactionState, stake } = useStakeTransaction();
<button onClick={() => stake("100")}>Stake 100 MPR</button>
```

### Link to Etherscan
```tsx
const txHash = "0xabc123...";
<a href={`https://etherscan.io/tx/${txHash}`} target="_blank">
  View Transaction
</a>
```

---

## Testing Environment Setup

### 1. Get testnet tokens
Visit faucet and get testnet MPR/ETH

### 2. Set environment variables
```env
NEXT_PUBLIC_TOKEN_ADDRESS=0x... (testnet deployed contract)
NEXT_PUBLIC_STAKING_ADDRESS=0x... (testnet deployed contract)
```

### 3. Start dev server
```bash
npm run dev
```

### 4. Connect MetaMask
- Account → Settings
- Switch to testnet
- Add tokens to MetaMask (if needed)

### 5. Test staking
- Visit `/stake`
- Try to stake 100 tokens
- Approve in MetaMask (2 transactions)
- Wait for confirmation
- Check balance updated

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "MetaMask not found" | Install MetaMask extension |
| Balance shows 0 | Use faucet to get testnet tokens |
| Approval fails | Allowance might be insufficient, reset it |
| Stake feels slow | Normal, blockchain takes 12-30 seconds |
| Balance not updating | Try refreshing page or waiting 30s |
| "ringColor is not valid" | ~~Fixed~~ - use border-2 instead |

---

## Performance Tips

- Use `limit` prop on `RewardsActivity` to limit data fetched
- Don't call `refetch()` too frequently
- Balance/staking info auto-refresh every 30 seconds
- Activity refreshes every 10 seconds

---

## Security Reminders

✅ Never expose private keys  
✅ All signing done in MetaMask  
✅ Contract addresses are public  
✅ No database writes from frontend  
✅ Read-only blockchain operations  

---

## Support

📖 Full documentation: `FRONTEND_BLOCKCHAIN_GUIDE.md`

Most common questions answered there!

