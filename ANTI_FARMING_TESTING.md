# Anti-Token Farming Testing Guide

This guide explains how to test the complete anti-token farming implementation end-to-end.

## Prerequisites

Before running tests, ensure you have:

1. **Local Development Environment Running**
   ```bash
   # Terminal 1: Start Hardhat node
   cd contracts
   npx hardhat node
   
   # Terminal 2: Deploy contracts
   npx hardhat run scripts/deploy.ts --network localhost
   
   # Terminal 3: Start Next.js dev server
   npm run dev
   
   # MongoDB should be running (local or Atlas)
   ```

2. **Environment Variables Set** (`.env.local`)
   ```
   MONGODB_URI=mongodb://...
   BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
   ORACLE_PRIVATE_KEY=0x...
   REWARDS_CONTROLLER_ADDRESS=0x...
   REWARDS_VAULT_ADDRESS=0x...
   ```

## Testing Options

### Option 1: Quick Automated Test (Recommended)

Run the quick test script to verify all components:

```bash
npx ts-node scripts/quick-test.ts
```

**What it tests:**
- ✅ Wallet authentication & nonce generation
- ✅ User info retrieval
- ✅ Post creation with trust scoring
- ✅ Reward eligibility status endpoint
- ✅ Reward blocking integration

**Expected output:**
```
✓ Post creation works
✓ Good post created (score: 0.78, status: approved)
✓ Low-quality post created (score: 0.32, status: rejected)
✓ Eligibility endpoint works (eligible: false)
✓ Account age valid: false (need 48 hours)
```

### Option 2: Comprehensive Integration Test

For more detailed testing with multiple scenarios:

```bash
npx ts-node scripts/test-anti-farming.ts
```

**This script:**
- Creates a fresh test wallet
- Authenticates and gets JWT token
- Creates multiple posts with different quality levels
- Checks eligibility status in detail
- Verifies reward blocking logic
- Prints comprehensive test summary

**Expected output:**
```
✅ TEST_1: Wallet Auth & Nonce - PASSED (234ms)
✅ TEST_2: User Info & Account Age - PASSED (156ms)
✅ TEST_3: Post Creation with Trust Scoring - PASSED (892ms)
✅ TEST_4: Reward Eligibility Status - PASSED (134ms)
✅ TEST_5: Reward Blocking Logic (Simulated) - PASSED (45ms)

Total: 5 passed, 0 failed out of 5 tests
```

### Option 3: Manual curl Testing

For manual testing of individual endpoints:

```bash
# Make these requests with your JWT token

# 1. Get wallet nonce
curl -X POST http://localhost:3000/api/auth/nonce \
  -H 'Content-Type: application/json' \
  -d '{"walletAddress": "0x..."}'

# 2. Verify signature (after signing with wallet)
curl -X POST http://localhost:3000/api/auth/verify \
  -H 'Content-Type: application/json' \
  -d '{
    "walletAddress": "0x...",
    "message": "...",
    "signature": "0x..."
  }'

# 3. Create a post
curl -X POST http://localhost:3000/api/posts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "title": "Medical Research Post",
    "content": "Detailed content about healthcare...",
    "communitySlug": "health",
    "postType": "text",
    "tags": ["medical"]
  }'

# 4. Check eligibility status
curl -X GET http://localhost:3000/api/users/reward-status \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Testing Scenarios

### Scenario 1: New User (Not Eligible)

1. Create a new wallet
2. Authenticate to get JWT token
3. Call `/api/users/reward-status`

**Expected results:**
```json
{
  "eligibility": {
    "eligible": false,
    "accountAgeValid": false,
    "crediblePostCount": 0,
    "averageTrustScore": 0,
    "reasons": [
      "Account must be at least 48 hours old (currently X hours)",
      "Must have at least 10 credible posts (currently 0)"
    ]
  }
}
```

### Scenario 2: User with High-Quality Posts

1. Create 10+ high-quality posts (trust score ≥ 0.7)
2. Wait 24+ hours (or modify timestamps in testing)
3. Check eligibility status

**Expected results:**
```json
{
  "eligibility": {
    "eligible": true,
    "accountAgeValid": true,
    "crediblePostCount": 10,
    "averageTrustScore": 0.78,
    "reasons": []
  }
}
```

### Scenario 3: User with Low-Quality Posts

1. Create posts with spam/low-effort content
2. Check eligibility status

**Expected results:**
```json
{
  "eligibility": {
    "eligible": false,
    "crediblePostCount": 0,
    "reasons": [
      "Posts must have trust score ≥ 0.7 (avg: 0.32)",
      "Posts must be approved by content moderation (all: rejected)"
    ]
  }
}
```

## Verifying Reward Blocking

### Manual Verification

1. **Create an ineligible user** (new account with low-quality posts)
2. **Attempt a reward action** (create post, vote, comment)
3. **Check server logs** for:
   ```
   [RewardsOracle] User USERNAME is not eligible for rewards. Event TYPE not rewarded.
   ```

### Code Review

Verify reward blocking in these files:

1. **[src/services/rewardsOracleService.ts](../src/services/rewardsOracleService.ts)**
   - Line: `if (!user.eligibleForRewards) { return; }`
   - Checks `user.eligibleForRewards` before issuing reward

2. **All reward call sites** (updated to pass userId):
   - `src/app/api/auth/verify/route.ts` - daily login
   - `src/app/api/posts/route.ts` - post creation
   - `src/app/api/posts/[id]/vote/route.ts` - post upvote
   - `src/app/api/posts/[id]/comments/route.ts` - comment creation
   - `src/app/api/comments/[id]/vote/route.ts` - comment upvote
   - `src/app/api/communities/[slug]/join/route.ts` - community join

## Trust Score Breakdown

Posts are evaluated using local AI heuristics (5-layer evaluation):

| Score Range | Status | Meaning |
|---|---|---|
| 0.0 - 0.3 | Rejected | Spam, toxic, or severely low-effort |
| 0.3 - 0.7 | Pending | Flagged for manual review |
| 0.7 - 1.0 | Approved | High-quality, credible content |

### Scoring Factors

1. **Low-Effort Detection** (-50%)
   - Title < 5 words → -50%
   - Content < 20 words → -50%
   - High emoji/link ratio → -30%

2. **Spam Patterns** (-70%)
   - ALL CAPS text → -40%
   - Repeated characters → -40%
   - Promotional language → -50%

3. **Misinformation** (-60%)
   - "100% guaranteed" claims → -40%
   - Medical claims without evidence → -50%
   - Extreme/divisive statements → -40%

4. **Toxicity** (-50%)
   - Hateful language → -50%
   - Discriminatory content → -50%

5. **Credibility Markers** (+30%)
   - "Based on research" → +15%
   - "Evidence shows" → +15%
   - Structured information → +20%

## Troubleshooting

### Test Fails: "Cannot connect to API"
```
✗ Auth failed: Failed to fetch
```
**Fix:** Ensure `npm run dev` is running on port 3000

### Test Fails: "No JWT token"
```
✗ Auth failed: Unauthorized - invalid token
```
**Fix:** Check that JWT_SECRET is set in `.env.local`

### Test Fails: "User not found"
```
✗ User info failed: 404 User not found
```
**Fix:** Ensure MongoDB is running and MONGODB_URI is correct

### Posts Created but No Trust Score
```
post.trustScore: undefined
```
**Fix:** Verify `trustScoreService` is initialized correctly in postService.ts

### Rewards Not Blocking
```
[RewardsOracle] User is not eligible... (doesn't appear in logs)
```
**Fix:** 
1. Check that `user.eligibleForRewards` is false in database
2. Verify userId is passed to reward methods
3. Check server logs for eligibility check trace

## Test Results Documentation

After running tests, document your results:

```markdown
# Test Results - 2026-03-16

## Quick Test
- ✅ Authentication: PASSED
- ✅ User Info: PASSED
- ✅ Post Creation: PASSED
- ✅ Eligibility: PASSED
- ✅ Reward Blocking: PASSED

## Manual Testing
- ✅ Ineligible user blocked from rewards
- ✅ Eligible user receives rewards
- ✅ Trust scores calculated correctly
- ✅ Account age check working

## Notes
- All new accounts properly flagged as ineligible
- Post quality assessment working as expected
- Reward blocking integrated in all 6 event types
```

## Next Steps

After testing passes:

1. **Deploy to staging** with real Sepolia testnet contract addresses
2. **Monitor reward transactions** on-chain
3. **Track eligibility progression** as users create content
4. **Adjust trust score thresholds** based on real-world data
5. **Add frontend eligibility indicator** component (next feature)

## Support

If tests fail, check:

1. Server logs: `npm run dev` output
2. Database: Check User and Post documents in MongoDB
3. Blockchain: Verify contract is deployed
4. Environment: Confirm all `.env.local` variables are set

For detailed logs, add to `.env.local`:
```
DEBUG=*
LOG_LEVEL=debug
```

---

**Last Updated:** 2026-03-16
**Status:** Anti-Token Farming Implementation Complete ✅
