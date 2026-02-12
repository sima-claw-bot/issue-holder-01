/**
 * Tests for task-2: Verify feature branch created from secondary-main in sima-claw-bot/msbuild
 *
 * These tests confirm that the feature branch:
 *   1. Exists in sima-claw-bot/msbuild
 *   2. Has the correct name (fix/issue-13217-roslyn-codetaskfactory-references)
 *   3. Is based on secondary-main (parent commit matches secondary-main HEAD)
 *   4. Has at least one commit on top of secondary-main
 *   5. Is not protected
 */

const https = require("https");
const assert = require("assert");

const OWNER = "sima-claw-bot";
const REPO = "msbuild";
const FEATURE_BRANCH = "fix/issue-13217-roslyn-codetaskfactory-references";
const SECONDARY_MAIN_SHA = "dce7f33d3e54a7626be7b1e50132e9fa0ab8f52b";

function githubGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path,
      method: "GET",
      headers: {
        "User-Agent": "task-2-test",
        Accept: "application/vnd.github+json",
      },
    };

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
  console.log(
    "Testing: feature branch fix/issue-13217-roslyn-codetaskfactory-references\n"
  );

  let featureBranch;
  let secondaryMainBranch;

  await test("feature branch exists", async () => {
    const res = await githubGet(
      `/repos/${OWNER}/${REPO}/branches/${encodeURIComponent(FEATURE_BRANCH)}`
    );
    assert.strictEqual(res.status, 200, "Expected 200 OK");
    featureBranch = res.body;
    assert.ok(featureBranch.name, "Branch should have a name");
    assert.strictEqual(featureBranch.name, FEATURE_BRANCH);
  });

  await test("feature branch name follows expected convention", async () => {
    assert.ok(featureBranch, "feature branch data must be loaded");
    assert.ok(
      featureBranch.name.startsWith("fix/"),
      `Branch name should start with 'fix/', got '${featureBranch.name}'`
    );
    assert.ok(
      featureBranch.name.includes("issue-13217"),
      `Branch name should reference issue 13217, got '${featureBranch.name}'`
    );
  });

  await test("secondary-main branch exists as base", async () => {
    const res = await githubGet(
      `/repos/${OWNER}/${REPO}/branches/secondary-main`
    );
    assert.strictEqual(res.status, 200, "Expected 200 OK");
    secondaryMainBranch = res.body;
    assert.strictEqual(secondaryMainBranch.commit.sha, SECONDARY_MAIN_SHA);
  });

  await test(
    "feature branch is based on secondary-main (compare shows ahead)",
    async () => {
      assert.ok(featureBranch, "feature branch data must be loaded");
      const res = await githubGet(
        `/repos/${OWNER}/${REPO}/compare/secondary-main...${encodeURIComponent(FEATURE_BRANCH)}`
      );
      assert.strictEqual(res.status, 200, "Expected 200 OK");
      assert.ok(
        res.body.ahead_by >= 1,
        `Feature branch should be at least 1 commit ahead of secondary-main, got ${res.body.ahead_by}`
      );
      assert.strictEqual(
        res.body.behind_by,
        0,
        `Feature branch should not be behind secondary-main, got ${res.body.behind_by}`
      );
    }
  );

  await test(
    "feature branch merge base matches secondary-main SHA",
    async () => {
      const res = await githubGet(
        `/repos/${OWNER}/${REPO}/compare/secondary-main...${encodeURIComponent(FEATURE_BRANCH)}`
      );
      assert.strictEqual(res.status, 200, "Expected 200 OK");
      assert.strictEqual(
        res.body.merge_base_commit.sha,
        SECONDARY_MAIN_SHA,
        `Merge base should be ${SECONDARY_MAIN_SHA}, got ${res.body.merge_base_commit.sha}`
      );
    }
  );

  await test("feature branch HEAD differs from secondary-main", async () => {
    assert.ok(featureBranch, "feature branch data must be loaded");
    assert.notStrictEqual(
      featureBranch.commit.sha,
      SECONDARY_MAIN_SHA,
      "Feature branch HEAD should differ from secondary-main (has new commits)"
    );
  });

  await test("feature branch is not protected", async () => {
    assert.ok(featureBranch, "feature branch data must be loaded");
    assert.strictEqual(
      featureBranch.protected,
      false,
      "Feature branch should not be protected"
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
