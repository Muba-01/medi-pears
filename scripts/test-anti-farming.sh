#!/usr/bin/env bash
# Anti-Token Farming Manual Testing Guide
# Use these commands with curl to test the endpoints

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Anti-Token Farming Testing Guide ===${NC}\n"

# Configuration
API_BASE="http://localhost:3000"
WALLET_ADDRESS=""
JWT_TOKEN=""

# Step 1: Generate a test wallet (requires ethers.js installed)
echo -e "${YELLOW}STEP 1: Generate Test Wallet${NC}"
echo "Using a random wallet address for testing..."
WALLET_ADDRESS="0x$(openssl rand -hex 20)"
echo -e "${GREEN}✓ Test Wallet: $WALLET_ADDRESS${NC}\n"

# Step 2: Get Nonce
echo -e "${YELLOW}STEP 2: Get Nonce${NC}"
echo "Request:"
echo "curl -X POST $API_BASE/api/auth/nonce \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"walletAddress\": \"$WALLET_ADDRESS\"}'"
echo ""
echo "Or run this command:"
NONCE_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/nonce" \
  -H 'Content-Type: application/json' \
  -d "{\"walletAddress\": \"$WALLET_ADDRESS\"}")
echo "Response: $NONCE_RESPONSE"
NONCE=$(echo $NONCE_RESPONSE | grep -o '"nonce":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Got Nonce: $NONCE${NC}\n"

# Step 3: Get User Info (if authenticated)
echo -e "${YELLOW}STEP 3: Get Current User (Requires Authentication)${NC}"
echo "After authentication, get user info:"
echo "curl -X GET $API_BASE/api/auth/me \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN'"
echo ""
echo "This returns:"
echo "  - username: Your username"
echo "  - walletAddress: Connected wallet"
echo "  - createdAt: Account creation time (needed for 48h eligibility check)"
echo "  - tokenBalance: Current token balance"
echo -e ""

# Step 4: Create a Post
echo -e "${YELLOW}STEP 4: Create Post (Requires Authentication)${NC}"
echo "Create a high-quality post:"
echo "curl -X POST $API_BASE/api/posts \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '{
    \"title\": \"Understanding Medical Privacy in Healthcare Systems\",
    \"content\": \"Based on recent research and industry standards, medical privacy is critical. This post discusses HIPAA compliance, best practices for data protection, and how healthcare providers can implement secure systems.\",
    \"communitySlug\": \"health\",
    \"postType\": \"text\",
    \"tags\": [\"privacy\", \"healthcare\"]
  }'"
echo ""
echo "Response includes:"
echo "  - post.id: Post ID"
echo "  - post.trustScore: 0-1 score (0.7+ needed for eligibility)"
echo "  - post.aiModerationStatus: approved|rejected|pending"
echo -e ""

# Step 5: Get Reward Eligibility Status
echo -e "${YELLOW}STEP 5: Check Reward Eligibility Status${NC}"
echo "Get detailed eligibility breakdown:"
echo "curl -X GET $API_BASE/api/users/reward-status \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN'"
echo ""
echo "Response includes:"
echo "  - eligibility.eligible: true/false"
echo "  - eligibility.crediblePostCount: X/10"
echo "  - eligibility.averageTrustScore: avg score"
echo "  - eligibility.accountAgeValid: true/false (need 48h)"
echo "  - progress.posts.percentage: 0-100%"
echo "  - progress.trustScore.percentage: 0-100%"
echo -e ""

# Step 6: Vote on a Post (Triggers Reward)
echo -e "${YELLOW}STEP 6: Vote on Post (Triggers Reward Check)${NC}"
echo "Upvote a post to trigger reward logic:"
echo "curl -X POST $API_BASE/api/posts/POST_ID/vote \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '{\"voteType\": \"up\"}'"
echo ""
echo "If user is not eligible, reward is blocked (check server logs)"
echo -e ""

# Step 7: Create a Comment
echo -e "${YELLOW}STEP 7: Create Comment${NC}"
echo "Create a comment on a post:"
echo "curl -X POST $API_BASE/api/posts/POST_ID/comments \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '{
    \"content\": \"This is a thoughtful comment on the post.\",
    \"parentCommentId\": null
  }'"
echo ""
echo "Triggers comment creation reward (if user is eligible)"
echo -e ""

# Step 8: Join a Community
echo -e "${YELLOW}STEP 8: Join Community${NC}"
echo "Join a community to trigger reward:"
echo "curl -X POST $API_BASE/api/communities/COMMUNITY_SLUG/join \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN'"
echo ""
echo "Triggers community join reward (if user is eligible)"
echo -e ""

# Testing Checklist
echo -e "${BLUE}=== TESTING CHECKLIST ===${NC}"
echo -e "${GREEN}□${NC} Setup: Ensure local Hardhat node is running"
echo -e "${GREEN}□${NC} API running: npm run dev (port 3000)"
echo -e "${GREEN}□${NC} MongoDB running for user data"
echo -e "${GREEN}□${NC} Create new wallet for clean test"
echo -e "${GREEN}□${NC} Wait 48+ hours (or modify account creation time for testing)"
echo -e "${GREEN}□${NC} Create 10+ high-quality posts (trust score ≥ 0.7)"
echo -e "${GREEN}□${NC} Each post must be 24+ hours old"
echo -e "${GREEN}□${NC} Check eligibility endpoint shows 100% progress"
echo -e "${GREEN}□${NC} Perform actions (vote, comment, join) to trigger rewards"
echo -e "${GREEN}□${NC} Verify rewards show in blockchain"
echo ""

# Expected Results
echo -e "${BLUE}=== EXPECTED RESULTS ===${NC}"
echo -e "${YELLOW}New User (< 48h):${NC}"
echo -e "  - eligibility.eligible: false"
echo -e "  - eligibility.accountAgeValid: false"
echo -e "  - Rewards blocked: yes"
echo ""
echo -e "${YELLOW}Eligible User (48h+ old, 10 posts, 0.7+ avg score):${NC}"
echo -e "  - eligibility.eligible: true"
echo -e "  - eligibility.crediblePostCount: 10"
echo -e "  - progress.posts.percentage: 100%"
echo -e "  - Rewards issued: yes"
echo ""
echo -e "${YELLOW}Low Trust Posts:${NC}"
echo -e "  - aiModerationStatus: rejected|pending"
echo -e "  - trustScore: < 0.7"
echo -e "  - Not counted toward eligibility"
echo ""

echo -e "${GREEN}✓ Testing guide complete!${NC}"
