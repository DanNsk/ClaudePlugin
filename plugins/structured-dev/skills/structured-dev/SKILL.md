---
name: structured-dev
description: Structured multi-agent development workflow with ACID planning. Use when
  implementing features, fixing complex bugs, or any multi-step work requiring requirements
  analysis, codebase research, planning, implementation, and validation. Triggers on
  "implement this", "build feature", "structured-dev", or when task-triage recommends
  structured approach.
allowed-tools: Read, Glob, Grep, Write, Edit, Task, LSP, Bash, TaskCreate, TaskUpdate,
  TaskList, TaskGet, AskUserQuestion, WebSearch, WebFetch, Skill
---

# Structured Development Workflow

A 5-phase multi-agent workflow that chains specialized agents through a structured lifecycle: **Requirements -> Research -> Plan -> Implement -> Validate**. You (the main session) act as orchestrator - spawning agents, collecting results, gating on user approval, and handling feedback loops.

**When to use:** Features, complex bug fixes, refactoring, any multi-step work where requirements clarity and validation matter. For plans with >10 implementation steps, consider delegating Phase 4 to the `project-orchestrator` agent.

---

## Document Structure

All artifacts are written to a feature-specific folder:

```
@documents/structured-dev-{feature}/
  requirements.md         <- Phase 1 output
  research.md             <- Phase 2 output
  plan.md                 <- Phase 3 output
  validation-report.md    <- Phase 5 output
```

Create this folder before Phase 1. Use a short kebab-case feature name (e.g., `user-auth`, `payment-flow`).

---

## Shared Output Contract

All agents return structured YAML for consistent parsing:

```yaml
specialist: [agent role name]
status: [completed|needs_input|blocked]
findings:
  - item: [name]
    detail: [description]
    evidence: [file paths, code references]
questions:               # optional
  - [question text]
```

---

## Phase 1: Requirements Building

**Goal:** Produce a clear, testable requirements document approved by the user.

**Loop:** Spawn -> present -> approve/revise (max 3 iterations).

### Pre-check

If the user's request is vague or exploratory ("I want something like...", "help me think through..."), suggest they run `/spec-writer` first to brainstorm and define scope. Return to structured-dev once they have a clear feature description. spec-writer output in `@documents/spec-{feature}/` can feed directly into Phase 1.

### Steps

1. Ask the user for a feature name and description (or infer from conversation context).
2. Create the document folder: `@documents/structured-dev-{feature}/`
3. Spawn the `requirements-builder` agent via Task:
   ```
   subagent_type: general-purpose
   name: requirements-builder
   prompt: |
     You are the Requirements Builder agent.
     [paste user's request and any existing context]
     Read @documents/structured-dev-{feature}/ for prior artifacts if any.
     Follow the requirements-builder agent instructions.
     Return structured YAML output.
   ```
4. Write agent output to `requirements.md`.
5. Present a summary to the user. Ask: **approve**, **request changes**, or **add details**.
6. If changes requested: re-spawn the agent with the feedback appended. Loop (max 3).
7. On approval: mark requirements as APPROVED in the document header, proceed to Phase 2.

### Requirements Document Format

```markdown
# Requirements: {Feature Name}

**Status:** DRAFT | APPROVED
**Version:** {iteration number}

## Functional Requirements
- **FR-1**: {title} - {description}
  - Acceptance: {testable criteria}

## Non-Functional Requirements
- **NFR-1**: {title} - {description}

## Assumptions
- {assumption}

## Open Questions
- {unresolved question}
```

---

## Phase 2: Due Diligence Research

**Goal:** Validate requirements against codebase reality, map touch points, surface risks.

### Steps

1. Spawn the `due-diligence-researcher` agent via Task:
   ```
   subagent_type: general-purpose
   name: due-diligence-researcher
   prompt: |
     You are the Due Diligence Researcher agent.
     Read the approved requirements at @documents/structured-dev-{feature}/requirements.md
     Explore the codebase to validate feasibility, map touch points, identify risks.
     Follow the due-diligence-researcher agent instructions.
     Return structured YAML output.
   ```
2. Write agent output to `research.md`.
3. If the agent surfaced questions: present them to the user. Incorporate answers into research.md (and optionally update requirements.md if answers change scope).
4. Proceed to Phase 3.

### Research Document Format

```markdown
# Research: {Feature Name}

## Touch Points
| File | Reason | Changes Needed |
|------|--------|----------------|

## Patterns to Follow
- **{pattern}**: See {file:line} for example

## Risks
| Risk | Severity | Mitigation |
|------|----------|------------|

## Feasibility
{feasible | feasible with caveats | infeasible}

## Notes
{additional context for the planner}
```

---

## Phase 3: ACID Planning

**Goal:** Create an implementation plan where each step is Atomic, Consistent, Isolated, and Durable.

**Loop:** Spawn -> present -> approve/revise (max 3 iterations).

### ACID Properties

- **Atomic**: Each step is self-contained and commit-ready.
- **Consistent**: Each step leaves the codebase in a valid state (builds, tests pass).
- **Isolated**: Steps have minimal interdependencies; parallelizable where possible.
- **Durable**: Each step is committed immediately - no progress loss.

### Steps

1. Spawn the `acid-planner` agent via Task:
   ```
   subagent_type: general-purpose
   name: acid-planner
   prompt: |
     You are the ACID Planner agent.
     Read requirements: @documents/structured-dev-{feature}/requirements.md
     Read research: @documents/structured-dev-{feature}/research.md
     Create an ACID implementation plan.
     Follow the acid-planner agent instructions.
     Return structured YAML output.
   ```
2. Write agent output to `plan.md`.
3. Present the plan to the user. Ask: **approve** or **request changes**.
4. If changes requested: re-spawn with feedback. Loop (max 3).
5. On approval: proceed to Phase 4.

### Plan Document Format

```markdown
# Plan: {Feature Name}

**Status:** DRAFT | APPROVED

## Steps

### Step 1: {title}
- **Files:** {list}
- **Depends on:** {none or step numbers}
- **Parallel group:** {group name or none}
- **Description:** {what to do}
- **Verification:** {build/test/manual check}

### Step 2: {title}
...

## Execution Summary
- **Parallel groups:** {count}
- **Critical path:** {step sequence that cannot be parallelized}
```

---

## Phase 4: Implementation

**Goal:** Execute the plan by spawning implementer agents for each task.

### Steps

1. Decompose the approved plan into tasks via TaskCreate:
   - One task per plan step
   - Set dependencies using `addBlockedBy` matching plan's `depends_on`
   - Include the step description, relevant research excerpts, and plan context in each task description
2. For each ready (unblocked) task, spawn an `implementer` agent via Task:
   ```
   subagent_type: general-purpose
   name: implementer
   prompt: |
     You are the Implementer agent.
     Your task: {task description from plan step}
     Context from research: {relevant excerpts}
     Patterns to follow: {from research.md}
     After implementation, run build to verify compilation.
     Follow the implementer agent instructions.
     Return structured YAML output.
   ```
3. Spawn independent tasks in parallel (up to 5 concurrent).
4. Track progress via TaskList/TaskUpdate. Mark tasks completed as agents return.
5. After each task completes, verify build still passes.
6. When all tasks complete, proceed to Phase 5.

### Large Plans (>10 steps)

Instead of managing implementer agents directly, spawn the `project-orchestrator` agent via Task. Pass it the pre-decomposed task list from the ACID plan and instruct it to skip its Understand and Plan phases - go directly to Execute. Include the approved plan and research document paths in the prompt so the orchestrator can build self-contained sub-agent prompts.

```
subagent_type: utility-skills:project-orchestrator
prompt: |
  Execute the approved implementation plan.
  Plan: @documents/structured-dev-{feature}/plan.md
  Research: @documents/structured-dev-{feature}/research.md
  Requirements: @documents/structured-dev-{feature}/requirements.md
  Skip Understand and Plan phases - the plan is already approved.
  Go directly to Execute phase using the steps defined in the plan.
  Each step has file lists, dependencies, and verification criteria.
```

### Error Handling

- If an implementer reports build failure: examine the failure, create a fix task, re-spawn.
- If multiple implementers conflict (parallel file edits): resolve sequentially, re-run the later task.

---

## Phase 5: Validation

**Goal:** Verify implementation satisfies every requirement. Fix findings. Produce clean report.

**Loop:** Validate -> fix -> re-validate (max 3 cycles).

### Steps

1. Spawn the `validator` agent via Task:
   ```
   subagent_type: general-purpose
   name: validator
   prompt: |
     You are the Validator agent.
     Read requirements: @documents/structured-dev-{feature}/requirements.md
     Read plan: @documents/structured-dev-{feature}/plan.md
     Review all changed files against requirements.
     Run build and tests.
     Follow the validator agent instructions.
     Return structured YAML output.
   ```
2. If the validator reports findings:
   - Create fix tasks from findings (one task per finding or group of related findings).
   - Spawn implementer agent(s) for fixes.
   - Re-spawn validator after fixes complete.
   - Loop (max 3 cycles).
3. If max cycles reached with remaining findings: present to user and ask how to proceed.
4. On clean validation: write `validation-report.md`, present summary.

### Validation Report Format

```markdown
# Validation Report: {Feature Name}

## Requirements Check
| ID | Status | Evidence | Notes |
|----|--------|----------|-------|

## Build & Tests
- **Build:** passed/failed
- **Tests:** passed/failed/not applicable

## Findings
| Severity | File | Line | Issue | Suggestion |
|----------|------|------|-------|------------|

## Verdict
{APPROVED | NEEDS FIXES}
```

---

## Feedback Loop Summary

```
Phase 1: user request -> requirements-builder -> present -> approved? -> Phase 2
                                                          -> revise (max 3)

Phase 3: requirements + research -> acid-planner -> present -> approved? -> Phase 4
                                                             -> revise (max 3)

Phase 5: implementation -> validator -> clean? -> Done
                                      -> fix tasks -> implementer(s) -> re-validate (max 3)
```

All loops cap at 3 iterations. If cap reached, present current state and ask user for direction.

---

## Quick Reference: Agent Spawning

| Phase | Agent | subagent_type | Key Inputs |
|-------|-------|---------------|------------|
| 1 | requirements-builder | general-purpose | User request, codebase context |
| 2 | due-diligence-researcher | general-purpose | Approved requirements |
| 3 | acid-planner | general-purpose | Requirements + research |
| 4 | implementer | general-purpose | Plan step + research excerpts |
| 5 | validator | general-purpose | Requirements + plan + changed files |
