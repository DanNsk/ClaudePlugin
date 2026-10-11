# windows-user-identity

A Claude Code plugin that resolves the current Windows user's full display name (not just the login username) and injects it into the session context at startup.

## What it does

On session start, a `SessionStart` hook runs a Python script (via `uv run`) that:

1. Checks if the OS is Windows — exits silently on other platforms
2. Calls `GetUserNameExW` from `secur32.dll` to get the full display name (e.g. "John Smith" instead of "jsmith")
3. Falls back to `%USERNAME%` if the display name is unavailable (common with local accounts that have no full name set)
4. Outputs the name as `additionalContext` so Claude can address the user personally

## Requirements

- **Windows** (the hook is a no-op on macOS/Linux)
- **uv** installed and on PATH ([install uv](https://docs.astral.sh/uv/getting-started/installation/))
- **Python 3.10+** (managed by uv automatically)

## Installation

### Local install

```
/plugin install /path/to/windows-user-identity
```

### Manual install

Copy this folder somewhere permanent and add it to your `~/.claude/settings.json`:

```json
{
  "plugins": [
    {
      "type": "local",
      "path": "C:/Users/you/.claude/plugins/windows-user-identity"
    }
  ]
}
```

## Known caveats

- `GetUserNameExW` with `NameDisplay` (3) may return empty on local accounts that never had a full name configured. The script falls back to `%USERNAME%` in that case.
- There have been reported issues with `SessionStart` hook context not being injected on brand new sessions in some Claude Code versions. If context doesn't appear, try `/clear` to re-trigger, or make sure you're on the latest Claude Code version.
