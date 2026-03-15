# Blockchain Rewards Integration - Quick Start Guide

## Setup

### 1. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Blockchain RPC Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545

# Oracle Wallet Private Key (WITHOUT 0x prefix during setup, will be validated)
ORACLE_PRIVATE_KEY=your_private_key_here

# Deployed RewardsController Contract Address
REWARDS_CONTROLLER_ADDRESS=0x...
```

### 2. Verify Installation

```bash
# Check Node.js and npm are installed
node --version
npm --version

# Install dependencies (if not already done)
npm install

# TypeScript compilation check
npm run build

# Should show: "✓ All compilation complete"
```

---

## Testing the Integration

### Option A: View Console Logs

1. Start the development server:
```bash
npm run dev
```

2. Create a post/comment/vote, and watch the terminal for logs like:
```
[RewardsOracle] Service initialized successfully
[RewardsOracle] postCreated reward issued. Tx Hash: 0xabc123...
```

3. **API Response Time**: Should be < 100ms (blockchain tx happens in background)

---

### Option B: cURL Testing

#### Test Post Creation
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Post",
    "content": "Testing rewards integration",
    "communityId": "test-community",
    "postType": "text"
  }'

# Expected response time: < 100ms
# Check console for: [RewardsOracle] postCreated reward issued
```

#### Test Post Upvote
```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"voteType": "up"}'

# Check console for: [RewardsOracle] postUpvote reward issued
```

#### Test Community Join
```bash
curl -X POST http://localhost:3000/api/communities/test-slug/join \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check console for: [RewardsOracle] communityJoined reward issued
```

---

### Option C: Monitor Blockchain Events

Add this to your code temporarily to watch contract events in real-time:

```typescript
// In src/lib/initRewardsListener.ts
import { ethers } from "ethers";

export async function initRewardsListener() {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL!);
  
  const contract = new ethers.Contract(
    process.env.REWARDS_CONTROLLER_ADDRESS!,
    ["event RewardIssued(address indexed user, uint256 amount, bytes32 indexed eventId)"],
    provider
  );

  contract.on("RewardIssued", (user, amount, eventId) => {
    console.log(`✓ REWARD ISSUED`);
    console.log(`  User: ${user}`);
    console.log(`  Amount: ${ethers.formatEther(amount)} tokens`);
    console.log(`  Event ID: ${eventId}`);
  });

  console.log("[RewardsListener] Listening for contract events...");
}

// Call in your layout or app initialization
initRewardsListener().catch(console.error);
```

---

## Verification Checklist

### 1. Service Initialization
- [ ] No errors in console on app startup
- [ ] See log: `[RewardsOracle] Service initialized successfully`

### 2. Post Creation Reward
- [ ] Create a post
- [ ] API response time < 100ms
- [ ] Console shows: `[RewardsOracle] postCreated reward issued`
- [ ] Check block explorer for tx hash

### 3. Post Upvote Reward (Only Authors)
- [ ] User A creates a post
- [ ] User B upvotes the post
- [ ] Console shows: `[RewardsOracle] postUpvote reward issued`
- [ ] **Verify:** User A (author) gets reward, NOT User B (voter)

### 4. Comment Creation
- [ ] Create a comment on a post
- [ ] API response time < 100ms
- [ ] Console shows: `[RewardsOracle] commentCreated reward issued`

### 5. Comment Upvote
- [ ] User A creates a comment
- [ ] User B upvotes it
- [ ] Console shows: `[RewardsOracle] commentUpvote reward issued`
- [ ] **Verify:** User A gets reward, NOT User B

### 6. Community Join
- [ ] User joins a community
- [ ] API response time < 100ms
- [ ] Console shows: `[RewardsOracle] communityJoined reward issued`
- [ ] User leaves community (should NOT trigger reward)

### 7. Daily Login
- [ ] User authenticates with wallet
- [ ] Console shows: `[RewardsOracle] dailyLogin reward issued`
- [ ] **Note:** Can trigger multiple times a day (contract prevents duplicates)

### 8. No API Blocking
- [ ] All API responses return in < 100ms
- [ ] Blockchain txs happen asynchronously
- [ ] Errors don't crash the API

---

## Common Issues & Solutions

### Issue: `Cannot find module 'rewardsOracleService'`
**Solution:** 
```bash
npm install
npm run build
```

### Issue: Environment variables not loaded
**Solution:**
- Create `.env.local` (not `.env`)
- Restart the development server: `npm run dev`
- Check: `console.log(process.env.BLOCKCHAIN_RPC_URL)` in API route

### Issue: Contract calls failing
**Symptoms:**
```
[RewardsOracle] Failed to issue postCreated reward: 
Error: insufficient balance for intrinsic transaction cost
```

**Solution:**
- Ensure oracle wallet has ETH for gas
- Check REWARDS_CONTROLLER_ADDRESS is correct
- Verify ORACLE_PRIVATE_KEY has ORACLE_ROLE in contract

### Issue: Duplicate rewards
**Solution:**
- Contract prevents this with `eventIdUsed` mapping
- If you see: `Event X already rewarded`, that's expected (duplicate protection)

### Issue: No logs appearing
**Solution:**
- Check stdout is connected to terminal
- Add explicit logging in routes:
  ```typescript
  console.log("[DEBUG] About to trigger reward", { walletAddress, postId });
  ```

---

## Production Readiness

### Before Deploy:
1. ✅ All 6 routes tested locally
2. ✅ No TypeScript errors: `npm run build`
3. ✅ Environment variables set in production
4. ✅ Oracle wallet funded with ETH
5. ✅ Contract verified on block explorer
6. ✅ Monitoring/alerts configured

### Gas Cost Estimation:
Each reward call costs approximately:
- Ethereum mainnet: $0.50 - $2.00 USD
- Ethereum testnet (Sepolia): Free
- Local testnet (Hardhat): Instant

### Monitoring:
Set up alerts for:
- `[RewardsOracle] Failed to issue` errors
- Oracle wallet balance (critical if < 0.1 ETH)
- Contract pause events

---

## Next Steps

1. **Run tests:**
   ```bash
   npm test
   ```

2. **Deploy to staging:**
   ```bash
   npm run build
   pm2 start "npm start" --name "medi-pears"
   ```

3. **Monitor:**
   ```bash
   tail -f logs/rewards.log | grep "RewardsOracle"
   ```

---

## Support

For issues, check:
1. Console logs for error messages
2. Contract ABI matches deployed contract
3. Oracle wallet has correct role in contract
4. Environment variables are set correctly

