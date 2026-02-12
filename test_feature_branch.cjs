/**
 * Tests for task-2: Verify feature branch creation artifacts
 *
 * Task-2 created the feature branch fix/issue-13217-roslyn-codetaskfactory-references
 * from secondary-main in sima-claw-bot/msbuild, added .gitignore, and updated readme.md.
 *
 * These tests verify:
 *   1. The .gitignore correctly excludes msbuild-repo/
 *   2. The readme.md documents the feature branch, base, SHA, and issue
 *   3. The secondary-main base branch still exists at the expected SHA
 *   4. The feature branch name and documentation follow conventions
 */

const https = require("https");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const OWNER = "sima-claw-bot";
const REPO = "msbuild";
const FEATURE_BRANCH = "fix/issue-13217-roslyn-codetaskfactory-references";
const BASE_BRANCH = "secondary-main";
const EXPECTED_BASE_SHA = "dce7f33d3e54a7626be7b1e50132e9fa0ab8f52b";

function githubGet(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: urlPath,
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
        resolve({ status: res.statusCode, body: res.statusCode < 300 ? JSON.parse(data) : null });
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
    console.log(`  \u2713 ${name}`);
    passed++;
  } catch (err) {
    console.log(`  \u2717 ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log("Testing: task-2 feature branch creation artifacts\n");

  // --- Local file tests (.gitignore) ---

  await test(".gitignore file exists", async () => {
    const gitignorePath = path.join(__dirname, ".gitignore");
    assert.ok(fs.existsSync(gitignorePath), ".gitignore file must exist");
  });

  await test(".gitignore contains msbuild-repo/ entry", async () => {
    const gitignorePath = path.join(__dirname, ".gitignore");
    const content = fs.readFileSync(gitignorePath, "utf8");
    assert.ok(
      content.includes("msbuild-repo/"),
      `.gitignore should contain 'msbuild-repo/', got: '${content.trim()}'`
    );
  });

  await test(".gitignore prevents msbuild-repo submodule from being committed", async () => {
    const gitignorePath = path.join(__dirname, ".gitignore");
    const content = fs.readFileSync(gitignorePath, "utf8");
    const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
    assert.ok(
      lines.some((l) => l.trim() === "msbuild-repo/"),
      "msbuild-repo/ should be a standalone gitignore pattern"
    );
  });

  // --- Local file tests (readme.md) ---

  await test("readme.md file exists", async () => {
    const readmePath = path.join(__dirname, "readme.md");
    assert.ok(fs.existsSync(readmePath), "readme.md file must exist");
  });

  await test("readme.md contains Task 2 section", async () => {
    const readmePath = path.join(__dirname, "readme.md");
    const content = fs.readFileSync(readmePath, "utf8");
    assert.ok(
      content.includes("Task 2"),
      "readme.md should contain a 'Task 2' section"
    );
  });

  await test("readme.md documents feature branch name", async () => {
    const readmePath = path.join(__dirname, "readme.md");
    const content = fs.readFileSync(readmePath, "utf8");
    assert.ok(
      content.includes(FEATURE_BRANCH),
      `readme.md should reference '${FEATURE_BRANCH}'`
    );
  });

  await test("readme.md documents the base branch (secondary-main)", async () => {
    const readmePath = path.join(__dirname, "readme.md");
    const content = fs.readFileSync(readmePath, "utf8");
    assert.ok(
      content.includes(BASE_BRANCH),
      `readme.md should reference base branch '${BASE_BRANCH}'`
    );
  });

  await test("readme.md documents the base SHA", async () => {
    const readmePath = path.join(__dirname, "readme.md");
    const content = fs.readFileSync(readmePath, "utf8");
    assert.ok(
      content.includes(EXPECTED_BASE_SHA),
      `readme.md should contain base SHA '${EXPECTED_BASE_SHA}'`
    );
  });

  await test("readme.md references issue #13217", async () => {
    const readmePath = path.join(__dirname, "readme.md");
    const content = fs.readFileSync(readmePath, "utf8");
    assert.ok(
      content.includes("13217"),
      "readme.md should reference issue #13217"
    );
  });

  await test("readme.md documents the target repository", async () => {
    const readmePath = path.join(__dirname, "readme.md");
    const content = fs.readFileSync(readmePath, "utf8");
    assert.ok(
      content.includes(`${OWNER}/${REPO}`),
      `readme.md should reference repository '${OWNER}/${REPO}'`
    );
  });

  await test("feature branch name follows fix/ naming convention", async () => {
    assert.ok(
      FEATURE_BRANCH.startsWith("fix/"),
      `Branch name should start with 'fix/', got '${FEATURE_BRANCH}'`
    );
    assert.ok(
      FEATURE_BRANCH.includes("issue-13217"),
      `Branch name should reference issue 13217`
    );
    assert.ok(
      /^fix\/[a-z0-9-]+$/.test(FEATURE_BRANCH),
      `Branch name should be lowercase kebab-case: '${FEATURE_BRANCH}'`
    );
  });

  // --- Remote verification: secondary-main base branch ---

  await test("secondary-main base branch exists at expected SHA", async () => {
    const res = await githubGet(
      `/repos/${OWNER}/${REPO}/branches/${BASE_BRANCH}`
    );
    assert.strictEqual(res.status, 200, "Expected 200 OK for secondary-main");
    assert.ok(res.body, "Response body must exist");
    assert.strictEqual(res.body.name, BASE_BRANCH);
    assert.strictEqual(
      res.body.commit.sha,
      EXPECTED_BASE_SHA,
      `secondary-main should point to ${EXPECTED_BASE_SHA}, got ${res.body.commit.sha}`
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
