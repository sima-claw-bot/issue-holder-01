# Test: task-2 Create feature branch for the fix
# Validates that the feature branch was created correctly.

$ErrorActionPreference = 'Stop'
$passed = 0
$failed = 0
$repoDir = Join-Path $PSScriptRoot 'msbuild-repo'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if ($Condition) {
        Write-Host "  PASS: $Message" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  FAIL: $Message" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "`n=== Test: task-2 Create feature branch for the fix ===" -ForegroundColor Cyan

# Test 1: Feature branch exists on remote
Write-Host "`nTest 1: Feature branch exists on remote"
$branches = git -C $repoDir --no-pager branch -r 2>&1
$featureBranchExists = $branches -match 'origin/fix/issue-13217-roslyn-codetaskfactory-references'
Assert-True ($featureBranchExists -ne $null -and $featureBranchExists -ne $false) `
    "Remote branch 'origin/fix/issue-13217-roslyn-codetaskfactory-references' exists"

# Test 2: Feature branch exists locally
Write-Host "`nTest 2: Feature branch exists locally"
$localBranches = git -C $repoDir --no-pager branch 2>&1
$localBranchExists = $localBranches -match 'fix/issue-13217-roslyn-codetaskfactory-references'
Assert-True ($localBranchExists -ne $null -and $localBranchExists -ne $false) `
    "Local branch 'fix/issue-13217-roslyn-codetaskfactory-references' exists"

# Test 3: Feature branch follows naming convention (fix/issue-<number>-<description>)
Write-Host "`nTest 3: Branch naming convention"
$branchName = 'fix/issue-13217-roslyn-codetaskfactory-references'
$matchesConvention = $branchName -match '^fix/issue-\d+-[a-z0-9-]+$'
Assert-True $matchesConvention `
    "Branch name '$branchName' follows 'fix/issue-<number>-<description>' convention"

# Test 4: Feature branch is based on secondary-main
Write-Host "`nTest 4: Feature branch is based on secondary-main"
$featureSha = git -C $repoDir --no-pager rev-parse origin/fix/issue-13217-roslyn-codetaskfactory-references 2>&1
$secondaryMainSha = git -C $repoDir --no-pager rev-parse origin/secondary-main 2>&1
$mergeBase = git -C $repoDir --no-pager merge-base origin/fix/issue-13217-roslyn-codetaskfactory-references origin/secondary-main 2>&1
Assert-True ($mergeBase -eq $secondaryMainSha) `
    "Feature branch merge-base with secondary-main equals secondary-main HEAD ($($secondaryMainSha.Substring(0,10)))"

# Test 5: Feature branch SHA matches secondary-main (no divergence yet)
Write-Host "`nTest 5: Feature branch currently at secondary-main"
Assert-True ($featureSha -eq $secondaryMainSha) `
    "Feature branch SHA ($($featureSha.Substring(0,10))) matches secondary-main SHA ($($secondaryMainSha.Substring(0,10)))"

# Test 6: Feature branch references correct issue number (13217)
Write-Host "`nTest 6: Branch references issue 13217"
$hasIssueNumber = $branchName -match '13217'
Assert-True $hasIssueNumber `
    "Branch name contains issue number 13217"

# Test 7: HEAD is on the feature branch
Write-Host "`nTest 7: HEAD is on the feature branch"
$currentBranch = git -C $repoDir --no-pager rev-parse --abbrev-ref HEAD 2>&1
Assert-True ($currentBranch -eq 'fix/issue-13217-roslyn-codetaskfactory-references') `
    "HEAD is on feature branch (current: $currentBranch)"

# Summary
Write-Host "`n=== Results ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Green' })
Write-Host ""

if ($failed -gt 0) {
    Write-Error "$failed test(s) failed"
    exit 1
}

Write-Host "All tests passed!" -ForegroundColor Green
exit 0
