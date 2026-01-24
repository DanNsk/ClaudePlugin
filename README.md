# Claude Plugin Marketplace

A collection of plugins and skills for Claude Code on Windows.

## Installation

Add this marketplace to Claude Code:

```
/plugin marketplace add C:\Development\ClaudePlugin
```

## Plugins

### Notifications

Windows toast notifications for Claude Code events.

**Install:**
```
/plugin install notifications
```

**Events:**
- Permission prompts - "Permission Required" notification
- Input dialogs - "Input Required" notification
- Task completion - "Task Complete" notification

**Prerequisites:**
- Windows 10/11
- Optional: BurntToast PowerShell module for enhanced notifications
  ```powershell
  Install-Module -Name BurntToast -Scope CurrentUser
  ```

### LSP Plugins

Language Server Protocol integrations for code intelligence features.

| Plugin | Languages | Install Command | Prerequisites |
|--------|-----------|-----------------|---------------|
| clangd-lsp | C, C++, Objective-C | `/plugin install clangd-lsp` | [LLVM/Clangd](https://clangd.llvm.org/) |
| gopls-lsp | Go | `/plugin install gopls-lsp` | `go install golang.org/x/tools/gopls@latest` |
| omnisharp-lsp | C# | `/plugin install omnisharp-lsp` | [OmniSharp](https://github.com/OmniSharp/omnisharp-roslyn) |
| powershell-lsp | PowerShell | `/plugin install powershell-lsp` | PowerShell 7+, PowerShellEditorServices |
| pyright-lsp | Python | `/plugin install pyright-lsp` | Node.js, `npm install -g pyright` |
| vscode-langservers-lsp | HTML, CSS, JSON, Markdown | `/plugin install vscode-langservers-lsp` | Node.js, `npm install -g vscode-langservers-extracted` |
| vtsls-lsp | TypeScript, JavaScript | `/plugin install vtsls-lsp` | Node.js, `npm install -g @vtsls/language-server` |

**Attribution:** LSP plugins based on [Piebald-AI/claude-code-lsps](https://github.com/Piebald-AI/claude-code-lsps).

## Skills

### LSP Usage Guide

Guidance on when to use LSP operations vs text search (Grep/Glob).

**Location:** `skills/lsp-usage/SKILL.md`

Covers:
- Decision table for LSP vs text search
- All LSP operations with examples
- Error handling
- Fallback strategies

### NuGet Version Check

Methods for checking latest NuGet package versions.

**Location:** `skills/nuget-version-check/SKILL.md`

Covers:
- NuGet API queries
- dotnet CLI commands
- Version selection guidelines

## Directory Structure

```
ClaudePlugin/
├── .claude-plugin/
│   └── marketplace.json
├── plugins/
│   ├── notifications/
│   ├── clangd-lsp/
│   ├── gopls-lsp/
│   ├── omnisharp-lsp/
│   ├── powershell-lsp/
│   ├── pyright-lsp/
│   ├── vscode-langservers-lsp/
│   └── vtsls-lsp/
├── skills/
│   ├── lsp-usage/
│   └── nuget-version-check/
└── README.md
```

## Windows Notes

Node.js-based LSP servers (pyright, vscode-langservers, vtsls) use `cmd /c` prefix for proper Windows execution.

PowerShell notification script uses:
1. BurntToast module (if available)
2. Windows.UI.Notifications API (fallback)
3. Console beep + message (final fallback)
