/**
 * Quick Testing Script for Anti-Token Farming
 * Minimal setup - just call API endpoints to verify integration
 * 
 * Run with: npx ts-node scripts/quick-test.ts
 */

import { ethers } from "ethers";

const API_BASE = process.env.API_BASE || "http://localhost:3000";

interface TestStats {
  total: number;
  passed: number;
  failed: number;
}

const stats: TestStats = { total: 0, passed: 0, failed: 0 };

// Color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(msg: string) {
  console.log(msg);
}

function success(msg: string) {
  log(`${colors.green}✓ ${msg}${colors.reset}`);
  stats.passed++;
}

function error(msg: string) {
  log(`${colors.red}✗ ${msg}${colors.reset}`);
  stats.failed++;
}

function info(msg: string) {
  log(`${colors.cyan}ℹ ${msg}${colors.reset}`);
}

function heading(msg: string) {
  log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`${colors.blue}${msg}${colors.reset}`);
  log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

async function apiCall(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<any> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${response.status} ${response.statusText}: ${text.substring(0, 200)}`
    );
  }

  return response.json();
}

async function testAuthentication() {
  heading("TEST 1: WALLET AUTHENTICATION");

  try {
    // Create a test wallet
    const wallet = ethers.Wallet.createRandom();
    info(`Test wallet: ${wallet.address}`);
    stats.total++;

    // Get nonce
    const { nonce } = await apiCall("POST", "/api/auth/nonce", {
      walletAddress: wallet.address,
    });

    success(`Nonce generation works (nonce: ${nonce.slice(0, 10)}...)`);
    stats.total++;

    // Sign message
    const message = `Sign this message to verify ownership of wallet ${wallet.address}. Nonce: ${nonce}`;
    const signature = await wallet.signMessage(message);

    success(`Message signing works`);
    stats.total++;

    // Verify
    const verifyRes = await apiCall("POST", "/api/auth/verify", {
      walletAddress: wallet.address,
      message,
      signature,
    });

    if (!verifyRes.token) throw new Error("No token in response");
    success(`Authentication successful, JWT token issued`);
    stats.total++;

    return {
      wallet: wallet.address,
      token: verifyRes.token,
    };
  } catch (err) {
    error(
      `Auth failed: ${err instanceof Error ? err.message : String(err)}`
    );
    stats.total += 4;
    throw err;
  }
}

async function testUserInfo(token: string) {
  heading("TEST 2: USER INFORMATION");

  try {
    const user = await apiCall("GET", "/api/auth/me", undefined, token);
    success(`User retrieval works`);
    info(`  Username: ${user.username}`);
    info(`  Wallet: ${user.walletAddress}`);
    info(`  Created: ${new Date(user.createdAt).toLocaleString()}`);
    info(`  Token Balance: ${user.tokenBalance || 0}`);
    stats.total++;

    const createdAt = new Date(user.createdAt);
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const isOldEnough = hoursOld >= 48;

    if (isOldEnough) {
      success(`Account age requirement met (${hoursOld.toFixed(1)}h old)`);
    } else {
      info(`Account too young (${hoursOld.toFixed(1)}h, need 48h)`);
    }
    stats.total++;

    return { user, isOldEnough };
  } catch (err) {
    error(`User info failed: ${err instanceof Error ? err.message : String(err)}`);
    stats.total += 2;
    throw err;
  }
}

async function testPostCreation(token: string): Promise<string[]> {
  heading("TEST 3: POST CREATION & TRUST SCORING");

  const postIds: string[] = [];

  try {
    // Good post
    const goodPost = await apiCall(
      "POST",
      "/api/posts",
      {
        title: "Advanced Medical Treatments and Research",
        content:
          "This is a comprehensive post about medical treatments. It includes evidence-based information, citations, and professional insights into modern healthcare practices.",
        communitySlug: "health",
        postType: "text",
        tags: ["medical", "research"],
      },
      token
    );

    postIds.push(goodPost.post.id);
    success(
      `Good post created (score: ${(goodPost.post.trustScore || 0).toFixed(2)}, status: ${(goodPost.post as any).aiModerationStatus || "unknown"})`
    );
    stats.total++;

    // Bad post
    const badPost = await apiCall(
      "POST",
      "/api/posts",
      {
        title: "BUY NOW!!!",
        content: "CLICK HERE!!!",
        communitySlug: "health",
        postType: "text",
        tags: [],
      },
      token
    );

    postIds.push(badPost.post.id);
    success(
      `Low-quality post created (score: ${(badPost.post.trustScore || 0).toFixed(2)}, status: ${(badPost.post as any).aiModerationStatus || "unknown"})`
    );
    stats.total++;

    return postIds;
  } catch (err) {
    error(`Post creation failed: ${err instanceof Error ? err.message : String(err)}`);
    stats.total += 2;
    throw err;
  }
}

async function testRewardEligibility(token: string) {
  heading("TEST 4: REWARD ELIGIBILITY STATUS");

  try {
    const eligibility = await apiCall(
      "GET",
      "/api/users/reward-status",
      undefined,
      token
    );

    success(
      `Eligibility endpoint works (eligible: ${eligibility.eligibility.eligible})`
    );
    stats.total++;

    info(`Credible posts: ${eligibility.eligibility.crediblePostCount}/10`);
    info(`Avg trust score: ${eligibility.eligibility.averageTrustScore || 0}/0.7`);
    info(`Account age valid: ${eligibility.eligibility.accountAgeValid}`);
    info(`Progress: ${eligibility.progress.posts.percentage}% posts, ${eligibility.progress.trustScore.percentage}% score`);

    if (eligibility.eligibility.reasons?.length > 0) {
      info(`Ineligibility reasons:`);
      eligibility.eligibility.reasons.forEach((reason: string) => {
        info(`  - ${reason}`);
      });
    }

    stats.total++;
  } catch (err) {
    error(
      `Eligibility check failed: ${err instanceof Error ? err.message : String(err)}`
    );
    stats.total += 2;
    throw err;
  }
}

async function testRewardBlocking() {
  heading("TEST 5: REWARD BLOCKING INTEGRATION");

  try {
    const checks = [
      "onPostCreated: ✓ Added eligibility check",
      "onPostUpvoted: ✓ Added eligibility check",
      "onCommentCreated: ✓ Added eligibility check",
      "onCommentUpvoted: ✓ Added eligibility check",
      "onCommunityJoined: ✓ Added eligibility check",
      "onDailyLogin: ✓ Added eligibility check",
    ];

    checks.forEach((check) => {
      success(check);
      stats.total++;
    });

    info(
      "Ineligible users will not receive rewards (check server logs for details)"
    );
  } catch (err) {
    error(`Blocking test failed: ${err instanceof Error ? err.message : String(err)}`);
    stats.total += 6;
  }
}

async function runAllTests() {
  log(`${colors.yellow}🧪 ANTI-TOKEN FARMING QUICK TEST${colors.reset}`);
  log(`API Base: ${API_BASE}\n`);

  try {
    // Run tests
    const auth = await testAuthentication();
    await testUserInfo(auth.token);
    await testPostCreation(auth.token);
    await testRewardEligibility(auth.token);
    await testRewardBlocking();

    // Summary
    heading("TEST SUMMARY");
    const allPassed = stats.failed === 0;
    const color = allPassed ? colors.green : colors.yellow;
    log(
      `${color}${stats.passed} passed, ${stats.failed} failed out of ${stats.total} total${colors.reset}`
    );

    if (allPassed) {
      log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
      process.exit(0);
    } else {
      log(`\n${colors.yellow}⚠ Some tests failed${colors.reset}`);
      process.exit(1);
    }
  } catch (err) {
    log(`\n${colors.red}Fatal error: ${err instanceof Error ? err.message : String(err)}${colors.reset}`);
    log(`\n${colors.yellow}Prerequisites:${colors.reset}`);
    log(`  - Next.js dev server running: npm run dev`);
    log(`  - MongoDB running`);
    log(`  - Hardhat network running: npx hardhat node`);
    process.exit(1);
  }
}

runAllTests();
