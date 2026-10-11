# Enhancements

Open items per plugin. Remove an item when it ships.

## task-enforcer

### Stop the generic reminder firing on turns that changed nothing

`scripts/stop_check.py` falls back to `GENERIC_REMINDER` whenever `~/.claude/tasks/<session_id>` does not exist, which is every session that never calls TaskCreate. The `stop_hook_active` guard only suppresses a repeat within one stop cycle, and each user turn is a new cycle, so the reminder fires on every single turn - including answer-only turns where no file was touched.

Observed effect in a real session: roughly fifteen consecutive turns where the assistant had nothing to verify and said so anyway, once per turn.

Gate the fallback on whether the turn actually modified anything. Three options, in increasing precision:

Git state, one line and no second hook, but blind to a turn that commits and pushes before stopping:

```python
if not subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout.strip():
    return 0
```

Marker file, robust and the recommended one. A `PostToolUse` hook on `Write|Edit|NotebookEdit` touches `<temp>/claude-dirty-<session_id>`; the stop hook exits 0 when it is absent, otherwise deletes it and blocks. Key the filename on `session_id` or two concurrent sessions in one repo trip each other's markers.

Transcript scan, exact and needs no second hook, but couples to the transcript format. `transcript_path` arrives on stdin; walk the JSONL back to the last real user message and look for a `tool_use` block naming `Write`, `Edit`, `MultiEdit` or `NotebookEdit`.

### Ship the 1.7.1 reminder wording to installed sessions

`GENERIC_REMINDER` in the repo already says "silently verify ... Do not mention this verification or what was verified in the final response". The cache holds both versions:

```
~/.claude/plugins/cache/dabystrukhin-plugins/task-enforcer/1.7.0   <- old wording, what a live session used
~/.claude/plugins/cache/dabystrukhin-plugins/task-enforcer/1.7.1   <- fixed wording
```

A session loaded 1.7.0 and produced verbose per-turn verification reports, so the fix exists but is not reaching sessions. Work out whether that is a stale marketplace ref, a pinned version in `enabledPlugins`, or a cache that is only refreshed on restart, and make the newer version win.

### Consider a one-shot flag for the generic branch

Even with change detection, a long session with many edits blocks on every stop. If that proves noisy, persist a per-session flag next to the marker and emit the generic reminder at most once per session, keeping the task-based branch firing every time since stale tasks are a real finding.

### Include the response contract in every reminder text

Reminder text should say what to do with the result, not only what to check. Without an explicit "do not report this, end your turn normally", a blocking stop hook leaves the model no sanctioned way to finish, and it invents one - usually a checklist echoed back to the user. The 1.7.1 wording covers the first half; add the "end your turn normally" half so the model has a defined exit.
