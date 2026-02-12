# task-1: Set up secondary-main branch

## Status: ✅ Verified

The `secondary-main` branch in `sima-claw-bot/msbuild` exists and points to the expected SHA.

- **Branch:** `secondary-main`
- **Expected SHA:** `dce7f33d`
- **Actual SHA:** `dce7f33d3e54a7626be7b1e50132e9fa0ab8f52b` ✅
- **Matches `main` HEAD:** Yes ✅

The branch is ready to serve as the base for all feature work, keeping `main` untouched.

## Task 2: Feature Branch Created

Branch `fix/issue-13217-roslyn-codetaskfactory-references` has been created from `secondary-main` in `sima-claw-bot/msbuild`.

- **Branch**: `fix/issue-13217-roslyn-codetaskfactory-references`
- **Base**: `secondary-main` (SHA: `dce7f33d3e54a7626be7b1e50132e9fa0ab8f52b`)
- **Repository**: `sima-claw-bot/msbuild`
- **Purpose**: All code changes for fixing MSBuild issue #13217 (RoslynCodeTaskFactory missing transitive references) will be made on this branch.

## Task 3: Transitive Reference Resolution Fix

Modified `TryResolveAssemblyReferences` in `src/Tasks/RoslynCodeTaskFactory/RoslynCodeTaskFactory.cs` to add peer-assembly enumeration when user-specified references resolve from the `ref/` directory.

- **Commit**: `3e0cb76` on `fix/issue-13217-roslyn-codetaskfactory-references`
- **Change**: When a user-specified reference resolves from the ref/ directory, all peer DLLs in that directory are now added to the resolved assembly set, covering transitive dependencies.
- **Build**: `Microsoft.Build.Tasks.csproj` compiles successfully with 0 errors and 0 warnings.
