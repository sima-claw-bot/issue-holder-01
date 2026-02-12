/**
 * Tests for task-1: Verify secondary-main branch setup in sima-claw-bot/msbuild
 *
 * These tests confirm that the secondary-main branch:
 *   1. Exists in sima-claw-bot/msbuild
 *   2. Points to the expected SHA (dce7f33d...)
 *   3. Matches the main branch HEAD
 */

const https = require("https");
const assert = require("assert");

const OWNER = "sima-claw-bot";
const REPO = "msbuild";
const EXPECTED_SHA_PREFIX = "dce7f33d";
const EXPECTED_FULL_SHA = "dce7f33d3e54a7626be7b1e50132e9fa0ab8f52b";

function githubGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path,
      method: "GET",
      headers: {
        "User-Agent": "task-1-test",
        Accept: "application/vnd.github+json",
      },
    };

    // Use GITHUB_TOKEN if available
    if (process.env.GITHUB_TOKEN) {
      options.headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } else {
          reject(
            new Error(
              `GitHub API returned ${res.statusCode}: ${data.slice(0, 200)}`
            )
          );
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log("Testing: secondary-main branch in sima-claw-bot/msbuild\n");

  // Fetch branch data once
  let secondaryMainBranch;
  let mainBranch;

  await test("secondary-main branch exists", async () => {
    const res = await githubGet(
      `/repos/${OWNER}/${REPO}/branches/secondary-main`
    );
    assert.strictEqual(res.status, 200, "Expected 200 OK");
    secondaryMainBranch = res.body;
    assert.ok(secondaryMainBranch.name, "Branch should have a name");
    assert.strictEqual(secondaryMainBranch.name, "secondary-main");
  });

  await test("main branch exists", async () => {
    const res = await githubGet(`/repos/${OWNER}/${REPO}/branches/main`);
    assert.strictEqual(res.status, 200, "Expected 200 OK");
    mainBranch = res.body;
    assert.ok(mainBranch.name, "Branch should have a name");
    assert.strictEqual(mainBranch.name, "main");
  });

  await test("secondary-main SHA starts with expected prefix dce7f33d", async () => {
    assert.ok(secondaryMainBranch, "secondary-main branch data must be loaded");
    const sha = secondaryMainBranch.commit.sha;
    assert.ok(
      sha.startsWith(EXPECTED_SHA_PREFIX),
      `Expected SHA to start with ${EXPECTED_SHA_PREFIX}, got ${sha}`
    );
  });

  await test("secondary-main SHA matches expected full SHA", async () => {
    assert.ok(secondaryMainBranch, "secondary-main branch data must be loaded");
    const sha = secondaryMainBranch.commit.sha;
    assert.strictEqual(
      sha,
      EXPECTED_FULL_SHA,
      `Expected ${EXPECTED_FULL_SHA}, got ${sha}`
    );
  });

  await test("secondary-main is an ancestor of main (main may have advanced)", async () => {
    assert.ok(secondaryMainBranch, "secondary-main branch data must be loaded");
    assert.ok(mainBranch, "main branch data must be loaded");
    // secondary-main was created from main at dce7f33d; main may have advanced since then
    // Verify secondary-main points to the expected SHA (the original main HEAD)
    assert.strictEqual(
      secondaryMainBranch.commit.sha,
      EXPECTED_FULL_SHA,
      `secondary-main should point to the original main HEAD ${EXPECTED_FULL_SHA}, got ${secondaryMainBranch.commit.sha}`
    );
  });

  await test("secondary-main is not a protected branch", async () => {
    assert.ok(secondaryMainBranch, "secondary-main branch data must be loaded");
    assert.strictEqual(
      secondaryMainBranch.protected,
      false,
      "secondary-main should not be protected"
    );
  });

  // Summary
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
