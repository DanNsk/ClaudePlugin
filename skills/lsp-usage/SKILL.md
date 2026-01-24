---
name: lsp-usage
description: Guide for using Language Server Protocol (LSP) operations effectively in Claude Code. Use when performing code navigation tasks like finding definitions, references, implementations, or call hierarchies. Helps decide between LSP operations and text-based search (Grep/Glob) for optimal results. Use when working with codebases where LSP is available, when errors occur from LSP operations, or when needing to understand symbol relationships in code.
---

# LSP Usage Guide

## Overview

LSP (Language Server Protocol) provides semantic code intelligence - understanding code structure, types, and relationships. Use LSP for precise code navigation; use Grep/Glob for text pattern matching.

## Decision Matrix

| Task | Use LSP | Use Grep/Glob |
|------|---------|---------------|
| Find symbol definition | `goToDefinition` | - |
| Find all usages of symbol | `findReferences` | - |
| Get type info/documentation | `hover` | - |
| List symbols in file | `documentSymbol` | - |
| Search symbols across codebase | `workspaceSymbol` | - |
| Find interface implementations | `goToImplementation` | - |
| Find callers of function | `incomingCalls` | - |
| Find callees from function | `outgoingCalls` | - |
| Search for text patterns | - | `Grep` |
| Search string literals | - | `Grep` |
| Search comments | - | `Grep` |
| Find files by name/pattern | - | `Glob` |
| LSP unavailable for language | - | `Grep/Glob` |

## Session Startup

At conversation start, verify LSP availability:

```
LSP operation: hover
filePath: /path/to/any/file.py
line: 1
character: 1
```

If this returns type information, LSP is active. If it errors, fall back to Grep/Glob for the session.

## Operations Reference

### goToDefinition

Find where a symbol is defined. Position cursor on the symbol name.

```
LSP operation: goToDefinition
filePath: /src/services/UserService.ts
line: 45
character: 12
```

Returns: File path and line/column of the definition.

**Use cases:**
- Jump to function/class/variable declaration
- Find where an imported module defines something
- Navigate from usage to source

### findReferences

Find all locations where a symbol is used throughout the codebase.

```
LSP operation: findReferences
filePath: /src/models/User.ts
line: 5
character: 14
```

Returns: Array of file paths and positions where the symbol appears.

**Use cases:**
- Impact analysis before refactoring
- Understanding how widely a function is used
- Finding all callers of a method

### hover

Get type information, documentation, and signatures for a symbol.

```
LSP operation: hover
filePath: /src/utils/helpers.ts
line: 23
character: 8
```

Returns: Type signature, JSDoc/docstring, parameter info.

**Use cases:**
- Check function signature without navigating away
- Verify return type
- Read inline documentation
- Confirm current file state (hover is live, not cached)

### documentSymbol

List all symbols (functions, classes, variables, interfaces) in a file.

```
LSP operation: documentSymbol
filePath: /src/controllers/AuthController.ts
line: 1
character: 1
```

Returns: Hierarchical list of all symbols with their types and positions.

**Use cases:**
- Get file structure overview
- Find specific function in large file
- Understand class composition

**Note:** May lag after recent edits. Use `hover` on specific symbols to verify current state.

### workspaceSymbol

Search for symbols by name across the entire workspace.

```
LSP operation: workspaceSymbol
filePath: /src/any-file.ts
line: 1
character: 1
```

Returns: Matching symbols from all files in workspace.

**Use cases:**
- Find class/function by name without knowing which file
- Locate all classes matching a pattern
- Quick navigation to known symbol

### goToImplementation

Find concrete implementations of an interface, abstract class, or abstract method.

```
LSP operation: goToImplementation
filePath: /src/interfaces/IRepository.ts
line: 8
character: 5
```

Returns: File paths and positions of all implementations.

**Use cases:**
- Find all classes implementing an interface
- Navigate from abstract method to concrete implementations
- Understand polymorphic behavior

### incomingCalls

Find all functions/methods that call a specific function.

```
LSP operation: incomingCalls
filePath: /src/services/PaymentService.ts
line: 42
character: 10
```

Returns: Call hierarchy showing all callers.

**Use cases:**
- Trace how a function is invoked
- Impact analysis for function changes
- Understand call flow into critical code

### outgoingCalls

Find all functions/methods called by a specific function.

```
LSP operation: outgoingCalls
filePath: /src/handlers/OrderHandler.ts
line: 15
character: 8
```

Returns: Call hierarchy showing all callees.

**Use cases:**
- Understand function dependencies
- Trace execution flow from entry point
- Identify what a function relies on

## Error Handling

**LSP errors indicate real problems, not indexing lag:**

1. **File not saved** - LSP works on disk state, not editor buffers
2. **Symbol doesn't exist** - Typo, deleted, or wrong position
3. **Compilation errors** - Syntax errors prevent analysis
4. **Server not running** - LSP not configured for this language

**Recovery steps:**

1. Re-read the file to confirm current state
2. Verify the symbol exists at the specified line/character
3. Check for compilation errors in the file
4. If persistent, fall back to Grep/Glob

**Never assume** "indexing is still running" - LSP errors are actionable signals.

## Fallback Strategy

When LSP is unavailable or returns errors:

1. **For definitions:** `Grep` with pattern `"(class|function|def|const|let|var)\s+SymbolName"`
2. **For references:** `Grep` with exact symbol name, review context
3. **For file structure:** `Grep` with `"(class|function|interface)"` in specific file
4. **For type info:** Read the source file directly

## Best Practices

1. **Verify LSP at session start** - Quick hover test confirms availability
2. **Position accuracy matters** - Line/character must point exactly to the symbol
3. **Line numbers are 1-based** - Match editor display, not 0-indexed arrays
4. **Combine operations** - Use `documentSymbol` for overview, then `goToDefinition` for specifics
5. **Trust hover for current state** - More reliable than `documentSymbol` after recent edits
6. **Prefer LSP for semantic queries** - Definitions, references, types are more accurate than text search
7. **Use Grep for text patterns** - String literals, comments, regex patterns
