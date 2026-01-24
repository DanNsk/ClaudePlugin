# NuGet Version Check

Methods for checking the latest NuGet package versions before adding dependencies.

## Method 1: NuGet API (Recommended)

Use WebFetch to query the NuGet API directly:

```
URL: https://api.nuget.org/v3-flatcontainer/{package-id-lowercase}/index.json
```

Example for Newtonsoft.Json:
```
WebFetch: https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json
Prompt: "What is the latest version?"
```

The response contains a `versions` array with all available versions in chronological order. The last entry is typically the latest.

### Common Package API URLs

| Package | URL |
|---------|-----|
| Newtonsoft.Json | `https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json` |
| Microsoft.Extensions.DependencyInjection | `https://api.nuget.org/v3-flatcontainer/microsoft.extensions.dependencyinjection/index.json` |
| Serilog | `https://api.nuget.org/v3-flatcontainer/serilog/index.json` |
| Dapper | `https://api.nuget.org/v3-flatcontainer/dapper/index.json` |
| NSubstitute | `https://api.nuget.org/v3-flatcontainer/nsubstitute/index.json` |
| xunit | `https://api.nuget.org/v3-flatcontainer/xunit/index.json` |
| FluentAssertions | `https://api.nuget.org/v3-flatcontainer/fluentassertions/index.json` |

## Method 2: dotnet CLI

Use the `dotnet package search` command:

```bash
dotnet package search {package-name} --take 1
```

Example:
```bash
dotnet package search Newtonsoft.Json --take 1
```

This shows the latest version available on nuget.org.

## Method 3: WebFetch nuget.org Website

Fetch the package page directly:

```
WebFetch: https://www.nuget.org/packages/{PackageName}
Prompt: "What is the latest stable version of this package?"
```

## Version Selection Guidelines

1. **Prefer stable versions** - Avoid `-preview`, `-beta`, `-alpha`, `-rc` suffixes unless specifically needed
2. **Check .NET compatibility** - Ensure the package version supports your target framework
3. **Consider major version changes** - Major version bumps may have breaking changes
4. **Check dependencies** - Some packages have specific version requirements for their dependencies

## Example Workflow

When adding a NuGet package:

1. Check latest version:
   ```
   WebFetch: https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json
   ```

2. Filter for stable (no prerelease suffix)

3. Add to project:
   ```bash
   dotnet add package Newtonsoft.Json --version 13.0.3
   ```

4. Or update .csproj directly:
   ```xml
   <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
   ```

## Prerelease Versions

If you need a prerelease version:

```bash
dotnet package search {package-name} --prerelease --take 5
```

Or check the API response for versions containing `-` (e.g., `8.0.0-preview.7`).
