---
name: read-working-memory
description: Read the user's daily Working Memory briefing at session start or when recent priorities matter. This gives Gemini CLI cross-tool continuity without bloating the main prompt.
---

# Read Working Memory

Use MCP `read_context_bundle` when startup identity, agent lane, space scope, or guidance could matter. It includes Working Memory plus the full owner/agent/scope contract.

If Context Bundle is unavailable or you only need current priorities, use MCP `read_working_memory` or:

```bash
nmem --json wm read
```

CLI Context Bundle fallback:

```bash
nmem --json context --source-app gemini-cli
```

If the runtime already knows the current project or agent lane, add `--space "<space name>"`. Multi-agent orchestrators can set `NMEM_AGENT_ID="<agent-slug>"` before launching Gemini CLI. Add `NMEM_SPACE` only when that whole run should override the identity's default space. Use `NMEM_HOST_AGENT_ID` only for advanced host-id aliases.

## When to Use

- At session start
- When resuming work after a break
- When the user asks what they are focused on now
- When the current task clearly depends on recent priorities or active initiatives

## Usage Pattern

- Read Context Bundle or Working Memory once near the start of a session.
- If Context Bundle was already loaded and includes Working Memory, do not read Working Memory again.
- Reuse that context mentally instead of re-reading on every turn.
- Refresh only if the user asks, the session context changed materially, or a long-running session clearly needs it.
