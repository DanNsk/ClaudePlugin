---
name: nuget-version-check
description: Methods for checking latest NuGet package versions before adding dependencies to .NET projects. Use when adding new NuGet packages, updating existing packages, or verifying package versions are current. Covers NuGet API queries, dotnet CLI commands, and version selection best practices. Use this skill before running `dotnet add package` or manually editing PackageReference entries in .csproj files or when user asks to verify package versions
---

# NuGet Version Check

## Overview

Always verify the latest package version before adding NuGet dependencies. Outdated versions miss security patches, bug fixes, and features. This guide covers three methods for checking versions, ordered by reliability.

## Method 1: NuGet API (Recommended)

Query the NuGet v3 API directly using WebFetch. This is the most reliable method.

### API Endpoint

```
https://api.nuget.org/v3-flatcontainer/{package-id-lowercase}/index.json
```

**Important:** Package ID must be lowercase in the URL.

### Example

Check Newtonsoft.Json version:

```
WebFetch URL: https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json
Prompt: "What is the latest stable version (no prerelease suffixes)?"
```

Response contains a `versions` array in chronological order. The last entry without a prerelease suffix (like `-preview`, `-beta`, `-rc`) is the latest stable version.

### Common Package URLs

| Package | API URL |
|---------|---------|
| Newtonsoft.Json | `https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json` |
| Serilog | `https://api.nuget.org/v3-flatcontainer/serilog/index.json` |
| Dapper | `https://api.nuget.org/v3-flatcontainer/dapper/index.json` |
| AutoMapper | `https://api.nuget.org/v3-flatcontainer/automapper/index.json` |
| FluentValidation | `https://api.nuget.org/v3-flatcontainer/fluentvalidation/index.json` |
| MediatR | `https://api.nuget.org/v3-flatcontainer/mediatr/index.json` |
| Polly | `https://api.nuget.org/v3-flatcontainer/polly/index.json` |
| NSubstitute | `https://api.nuget.org/v3-flatcontainer/nsubstitute/index.json` |
| xunit | `https://api.nuget.org/v3-flatcontainer/xunit/index.json` |
| FluentAssertions | `https://api.nuget.org/v3-flatcontainer/fluentassertions/index.json` |
| Microsoft.Extensions.DependencyInjection | `https://api.nuget.org/v3-flatcontainer/microsoft.extensions.dependencyinjection/index.json` |
| Microsoft.EntityFrameworkCore | `https://api.nuget.org/v3-flatcontainer/microsoft.entityframeworkcore/index.json` |
| Microsoft.AspNetCore.Authentication.JwtBearer | `https://api.nuget.org/v3-flatcontainer/microsoft.aspnetcore.authentication.jwtbearer/index.json` |

### Constructing URLs

For any package, construct the URL:
1. Take the package ID (e.g., `Microsoft.Extensions.Logging`)
2. Convert to lowercase (e.g., `microsoft.extensions.logging`)
3. Insert into template: `https://api.nuget.org/v3-flatcontainer/microsoft.extensions.logging/index.json`

## Method 2: dotnet CLI

Use the `dotnet package search` command for quick lookups.

### Basic Search

```bash
dotnet package search Newtonsoft.Json --take 1
```

Shows the latest version on nuget.org.

### Include Prerelease

```bash
dotnet package search Microsoft.Extensions.Hosting --prerelease --take 5
```

Shows prerelease versions alongside stable releases.

### Search with Source

```bash
dotnet package search Serilog --source https://api.nuget.org/v3/index.json --take 1
```

Explicitly targets nuget.org (useful if custom feeds are configured).

## Method 3: WebFetch nuget.org Website

Fetch the package page directly as a fallback.

```
WebFetch URL: https://www.nuget.org/packages/Newtonsoft.Json
Prompt: "What is the latest stable version of this package?"
```

Less reliable than the API due to HTML parsing, but works when the API has issues.

## Version Selection Guidelines

### Prefer Stable Versions

Avoid prerelease suffixes unless specifically needed:
- `-preview` - Early development, API may change
- `-beta` - Feature complete but not production-tested
- `-alpha` - Experimental, unstable
- `-rc` - Release candidate, nearly stable

### Check Framework Compatibility

Before adding a package, verify it supports your target framework:

```bash
dotnet package search PackageName --take 1 --format detailed
```

Or check the package page for supported frameworks.

### Consider Major Version Changes

Major version bumps (e.g., 2.x to 3.x) often have breaking changes. Review:
- Release notes/changelog
- Migration guides
- API compatibility

### Microsoft Package Versioning

Microsoft.Extensions.* and Microsoft.AspNetCore.* packages follow .NET versioning:
- .NET 6 projects: Use 6.x.x versions
- .NET 7 projects: Use 7.x.x versions
- .NET 8 projects: Use 8.x.x versions

Match the major version to your target framework.

## Workflow Example

### Adding a New Package

1. **Check latest version:**
   ```
   WebFetch: https://api.nuget.org/v3-flatcontainer/mediatr/index.json
   ```

2. **Identify latest stable** (last version without prerelease suffix)

3. **Add to project:**
   ```bash
   dotnet add package MediatR --version 12.2.0
   ```

4. **Or edit .csproj directly:**
   ```xml
   <PackageReference Include="MediatR" Version="12.2.0" />
   ```

### Updating Existing Packages

1. **List outdated packages:**
   ```bash
   dotnet list package --outdated
   ```

2. **Check latest version** for each outdated package using Method 1 or 2

3. **Update specific package:**
   ```bash
   dotnet add package PackageName --version X.Y.Z
   ```

## Package Metadata API

For detailed package information (dependencies, description, license):

```
https://api.nuget.org/v3/registration5-gz-semver2/{package-id-lowercase}/index.json
```

This returns comprehensive metadata including all versions and their dependencies.
