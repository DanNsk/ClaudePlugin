# LSP Usage Guide

## When to Use LSP vs Text Search

| Scenario | Use LSP | Use Grep/Glob |
|----------|---------|---------------|
| Find where a function/class is defined | `goToDefinition` | - |
| Find all usages of a symbol | `findReferences` | - |
| Get type info or documentation | `hover` | - |
| List all symbols in a file | `documentSymbol` | - |
| Search symbols across codebase | `workspaceSymbol` | - |
| Find implementations of interface | `goToImplementation` | - |
| Find what calls a function | `incomingCalls` | - |
| Find what a function calls | `outgoingCalls` | - |
| Search for text patterns/strings | - | `Grep` |
| Find files by name pattern | - | `Glob` |
| Search comments or documentation | - | `Grep` |
| LSP not available for language | - | `Grep/Glob` |

## LSP Operations Reference

### goToDefinition
Find where a symbol is defined.
```
LSP operation: goToDefinition
filePath: /path/to/file.ts
line: 15
character: 10
```

### findReferences
Find all references to a symbol throughout the codebase.
```
LSP operation: findReferences
filePath: /path/to/file.ts
line: 15
character: 10
```

### hover
Get type information and documentation for a symbol.
```
LSP operation: hover
filePath: /path/to/file.ts
line: 15
character: 10
```

### documentSymbol
Get all symbols (functions, classes, variables) in a document.
```
LSP operation: documentSymbol
filePath: /path/to/file.ts
line: 1
character: 1
```

### workspaceSymbol
Search for symbols across the entire workspace. Useful for finding classes or functions by name.
```
LSP operation: workspaceSymbol
filePath: /path/to/any/file.ts
line: 1
character: 1
```
Note: The query is typically passed separately; check tool documentation.

### goToImplementation
Find implementations of an interface or abstract method.
```
LSP operation: goToImplementation
filePath: /path/to/interface.ts
line: 5
character: 15
```

### prepareCallHierarchy + incomingCalls
Find all functions/methods that call a specific function.
```
LSP operation: incomingCalls
filePath: /path/to/file.ts
line: 20
character: 10
```

### prepareCallHierarchy + outgoingCalls
Find all functions/methods called by a specific function.
```
LSP operation: outgoingCalls
filePath: /path/to/file.ts
line: 20
character: 10
```

## Error Handling

**LSP errors are real errors** - they indicate actual problems, not indexing lag:
- File not saved to disk
- Symbol does not exist
- Compilation errors in the file
- LSP server not running for this language

When you get an LSP error:
1. Re-read the file to confirm its current state
2. Check if the file has unsaved changes
3. Verify the symbol exists at the specified location
4. Fall back to Grep/Glob if LSP is unavailable

## Fallback Strategy

If LSP is unavailable or returns errors:
1. Use `Grep` with appropriate patterns for code search
2. Use `Glob` to find files by extension
3. Use `Read` to examine file contents directly

## Best Practices

1. **Check LSP availability first** - Use a quick `hover` or `documentSymbol` operation at session start
2. **Prefer LSP for semantic queries** - Definitions, references, and type info are more accurate via LSP
3. **Use Grep for text patterns** - String literals, comments, regex patterns
4. **Combine operations** - Use `documentSymbol` to get an overview, then `goToDefinition` for specifics
5. **Position accuracy matters** - Line and character must point exactly to the symbol
6. **Line numbers are 1-based** - Match what you see in editors, not 0-indexed arrays
