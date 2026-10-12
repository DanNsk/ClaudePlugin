---
name: nuget-version-check
description: Check the latest stable NuGet package version and its license before adding or updating a dependency in a .NET project. Use before running `dotnet add package`, before editing PackageReference or PackageVersion entries, or when the user asks to verify package versions.
---

# NuGet Version Check

Look up versions from the feed. Never pick a version from memory.

## 1. Latest stable version (nuget.org)

Query the flat-container API and filter prerelease versions locally. The result is exact, unlike a summarized web page.

```bash
curl -s https://api.nuget.org/v3-flatcontainer/<id-lowercase>/index.json \
  | python -c "import sys,json; v=[x for x in json.load(sys.stdin)['versions'] if '-' not in x]; print(v[-1])"
```

- The package ID must be lowercase in the URL: `Microsoft.Extensions.Logging` becomes `microsoft.extensions.logging`.
- The `versions` array is ordered oldest to newest. Any version containing `-` is a prerelease (`-preview`, `-rc`, `-beta`).
- Drop the filter to see prereleases. Use a prerelease only when the user asks for one.

## 2. License check

Several popular packages moved to commercial licenses in a new major version, for example FluentAssertions 8, AutoMapper 15, and MediatR 13. Check the license of the exact version before adding it:

```bash
curl -s https://api.nuget.org/v3-flatcontainer/<id-lowercase>/<version>/<id-lowercase>.nuspec | grep -i "<license"
```

- `<license type="expression">MIT</license>` names the license directly.
- `<license type="file">` means the terms live in a file inside the package. Open the project page or repository to read them before adding the package.
- Stop and tell the user when the license is commercial, GPL, or AGPL.

## 3. Private feeds

The flat-container API covers nuget.org only. For Azure Artifacts or other feeds in `NuGet.Config`, search the feed by name:

```bash
dotnet package search <PackageId> --exact-match --source <feed-name-or-url> --format json
```

`--exact-match` returns every version of the package and ignores `--take`. Pick the newest stable entry from the JSON. Add `--interactive` when the feed needs authentication.

## 4. Writing the version

Check for Central Package Management first: look for `Directory.Packages.props` in the repo root or a parent folder.

- **With CPM**: the version goes in `<PackageVersion Include="X" Version="1.2.3" />` in `Directory.Packages.props`. The project file gets `<PackageReference Include="X" />` with no `Version` attribute, otherwise the build fails with NU1008. `dotnet add package X --version 1.2.3` writes both places correctly.
- **Without CPM**: `dotnet add package X --version 1.2.3`, or `<PackageReference Include="X" Version="1.2.3" />` in the project file.

## 5. Version selection

- `Microsoft.Extensions.*`, `Microsoft.AspNetCore.*`, and `Microsoft.EntityFrameworkCore.*` packages follow the .NET release train. Match their major version to the project's target framework: `net8.0` takes 8.x, `net10.0` takes 10.x.
- A major version bump usually carries breaking changes. Read the release notes or migration guide before crossing one.
- To find outdated packages in an existing project, run `dotnet list package --outdated`, then verify each candidate with step 1 and step 2.
