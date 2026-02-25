---
name: task-triage
description: Decision framework for analyzing task complexity and choosing execution approach (direct execution, plan mode, or structured-dev). Use when uncertain about which approach a task requires.
---

# Task Triage Guide

## Three-Tier Execution Model

| Tier | When | How |
|------|------|-----|
| **Direct execution** | Single file, <50 lines, clear scope | Just do it |
| **Plan mode** | Multi-file, clear requirements, established patterns | Claude built-in plan mode |
| **structured-dev** | Unclear requirements, architectural decisions, cross-cutting | `/structured-dev` (5-phase workflow) |

## Quick Decision Checklist

Before executing any task, run through this checklist:

```
[ ] Single file affected?
[ ] Change scope < 50 lines?
[ ] Requirements clearly stated?
[ ] No architectural decisions needed?
[ ] Existing patterns to follow?
```

**All checked = Direct execution**
**Any unchecked = Continue to decision flow**

## Direct Execution Criteria

Execute directly when ALL apply:

| Criterion | Examples |
|-----------|----------|
| **Single file** | Fix typo, add method, update config |
| **Well-defined scope** | "Add validation to email field" |
| **Small change** | < 50 lines modified |
| **Clear pattern exists** | Similar code already in codebase |
| **No design choices** | Implementation is obvious |

### Direct Execution Examples

- Fix null reference exception in `UserService.cs`
- Add missing null check to parameter
- Update connection string in config
- Add new property to existing DTO
- Fix off-by-one error in loop
- Add logging statement
- Rename variable for clarity
- Add XML documentation to method

## Plan Mode Criteria

Enter plan mode when requirements are clear AND patterns are established, but:

| Criterion | Examples |
|-----------|----------|
| **Multi-file changes** | New feature touching 3+ files |
| **Coordination needed** | Changes must be applied in order |
| **Breaking changes** | API modifications, schema changes |
| **Multiple valid approaches** | Need to present options to user |

### Plan Mode Examples

- Add new API endpoint with validation, service, repository
- Database schema changes with migrations
- Performance optimization (profiling needed first)
- Updating multiple config files with coordination
- Refactoring within an established architecture

## Structured-Dev Criteria

Use `/structured-dev` when ANY apply:

| Criterion | Examples |
|-----------|----------|
| **Vague requirements** | "I want something like...", "help me build..." |
| **Requirements need elicitation** | User describes outcome, not specifics |
| **Architectural decisions** | Choice of pattern, library, approach |
| **Cross-cutting concerns** | Auth, logging, caching across modules |
| **Multiple subsystems affected** | Changes span service boundaries |
| **Unknown territory** | Unfamiliar codebase area with no established patterns |

### Structured-Dev Examples

- "Implement user authentication" (what kind? OAuth? JWT? Sessions?)
- "Build a notification system" (channels? priorities? templates?)
- Refactor authentication system (architectural decisions needed)
- "Add caching" (where? what strategy? invalidation?)
- Integration with external service (API design, error handling, retry strategy)
- User explicitly says "implement feature", "build this", or "structured-dev"

## Edge Cases

### Looks Simple But Needs Planning

- "Add a button" - Where? What does it do? API calls? State changes?
- "Fix the bug" - Root cause unknown, may span multiple files
- "Update the form" - Validation rules? Backend changes? Existing patterns?

### Looks Complex But Can Execute Directly

- Large but mechanical change (find/replace across files)
- Adding tests for existing code (pattern established)
- Updating multiple config files (same change, different environments)

## Decision Flow

```
Task received
    |
    v
Single file, <50 lines, clear scope?
    |
    +--YES--> Direct execution
    |
    NO
    |
    v
Requirements clear AND patterns established?
    |
    +--YES--> Plan mode
    |
    NO (vague requirements, architectural decisions,
        cross-cutting concerns, user says "implement feature")
    |
    v
    structured-dev (/structured-dev)
```

## When Uncertain

If after this analysis you are still uncertain:

1. **Lean toward more structure** - Wasted planning is cheaper than wasted implementation
2. **Start with exploration** - Read relevant files, understand scope
3. **Ask clarifying question** - If requirements are genuinely ambiguous
4. **Check for similar work** - Search git history, existing patterns

## Integration with Work Approach

This skill complements AGENTS.md Section 2.2:
- Direct execution aligns with "Continue until blocked or finished"
- Plan mode aligns with "Analyze trade-offs" and "Present options"
- structured-dev aligns with complex multi-phase work requiring requirements clarity
- All tiers require "Search before asking"
