---
name: lsp-usage
description: Mandatory LSP-first navigation rules for Claude Code. MUST be followed whenever navigating code symbols - finding definitions, references, implementations, call hierarchies, type info, or file structure. LSP is the primary tool for all semantic code tasks; Grep is the fallback only when LSP is confirmed unavailable. Use this skill on every code navigation task, when LSP errors occur, or when deciding between LSP and text search. Enforces LSP before Grep for definitions, usages, refactoring impact analysis, and call tracing.
---

# LSP-First Navigation - Mandatory Rules

## Core Rule

**LSP is the primary tool for all semantic code tasks. Grep is the fallback, not the default.**

Every time you need to find a definition, locate usages, check types, trace call chains, or understand symbol relationships - use LSP first. Only reach for Grep when LSP is confirmed unavailable for that language or has failed on the current query.

This is not optional. Text search gives you string matches. LSP gives you semantic understanding - the difference between finding every occurrence of `User` as a string vs finding every actual reference to the `User` class.

## When to Use What

### LSP (mandatory for these tasks)

| Task | Operation |
|------|-----------|
| Where is X defined? | `goToDefinition` |
| Who calls X? | `incomingCalls` |
| What does X call? | `outgoingCalls` |
| All usages of X | `findReferences` |
| What implements interface X? | `goToImplementation` |
| Type/signature of X | `hover` |
| File structure overview | `documentSymbol` |
| Find symbol by name | `workspaceSymbol` |

### Grep (only for these tasks)

- String literals, log messages, config keys, comments
- Regex/pattern search across files
- Non-code files (markdown, yaml, json, xml, config)
- Languages where LSP is confirmed unavailable

**If you catch yourself using Grep to find a function definition, class usage, or call site - stop and use LSP instead.**

## LSP Availability

LSP availability is per language, not per project. A repo can have C# with LSP and Python without.

**On first LSP call for a given file type:**
1. Try the operation
2. If it errors, mark that language as LSP-unavailable for the session
3. Switch to Grep for that language only

Do not retry LSP for a language that already failed. Do try LSP when encountering a new file type.

## Operations Reference

### goToDefinition

Jump to where a symbol is declared. Position cursor exactly on the symbol name.

**Use cases:** Navigate from usage to source, find function/class/variable declaration, resolve imports.

### findReferences

Find every location where a symbol is used across the codebase.

**Use cases:** Impact analysis before refactoring, understanding how widely something is used, finding all callers.

**Mandatory before:** Renaming, moving, or deleting any symbol. Never skip this step.

### hover

Get type information, documentation, and signatures for a symbol at a position.

**Use cases:** Check function signature, verify return type, read inline docs, confirm current file state (hover reads live disk state).

### documentSymbol

List all symbols (functions, classes, variables, interfaces) in a file as a hierarchy.

**Use cases:** Get file structure overview, find specific function in large file, understand class composition.

**Note:** May lag after recent edits. Use `hover` on specific symbols to verify current state.

### workspaceSymbol

Search for symbols by name across the entire workspace.

**Use cases:** Find class/function by name without knowing which file, locate all classes matching a pattern.

### goToImplementation

Find concrete implementations of an interface or abstract class.

**Use cases:** Find all classes implementing an interface, navigate from abstract to concrete.

### incomingCalls

Find all functions that call a specific function - the callers.

**Use cases:** Trace how a function is invoked, impact analysis for function changes.

### outgoingCalls

Find all functions called by a specific function - the callees.

**Use cases:** Understand function dependencies, trace execution flow from entry point.

## Required Workflow

### Before any code exploration

1. Read the file to get exact `line:character` positions - never guess
2. Use `documentSymbol` for file overview
3. Use `hover` on unknowns to understand types
4. Use `goToDefinition` to navigate to source
5. Use `incomingCalls`/`outgoingCalls` to trace call chains

### Before any refactoring

1. `findReferences` on every symbol you plan to change - mandatory
2. Chain results: use output positions as input to the next LSP call
3. Verify all call sites are accounted for before making changes

## Position Accuracy

- Line numbers are 1-based (match file display)
- Character positions must point exactly to the symbol
- Always read the file first to confirm current state before making LSP calls

## Error Handling

LSP errors are real problems, not indexing lag:

1. **File not saved** - LSP works on disk state, not editor buffers
2. **Symbol doesn't exist** - Typo, deleted, or wrong position
3. **Compilation errors** - Syntax errors prevent analysis
4. **Server not running** - LSP not configured for this language

**Recovery:** Re-read the file, verify the symbol exists at the specified position, check for compilation errors. If persistent after 2 attempts, fall back to Grep for that language.

## Grep Fallback Patterns

When LSP is genuinely unavailable:

- **Definitions:** `Grep` with pattern `(class|function|def|const|let|var)\s+SymbolName`
- **References:** `Grep` with exact symbol name, review context
- **File structure:** `Grep` with `(class|function|interface)` in specific file
- **Type info:** Read the source file directly
