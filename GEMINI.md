# Nowledge Mem for Gemini CLI

You have access to the user's Nowledge Mem through the bundled MCP server and the `nmem` CLI.

Use MCP tools for retrieval and memory writes when Gemini exposes them in this session. Use bundled commands and direct `nmem` for lifecycle capture, real thread save, status checks, remote client config, and any workflow where the CLI is clearer.

## Core Memory Lifecycle

Treat Nowledge Mem as five linked surfaces:

1. Context Bundle for startup identity, active space, guidance, and current priorities
2. Working Memory for a lightweight current-focus briefing
3. Distilled memories for durable knowledge
4. Threads for full searchable conversation history
5. Handoff summaries for compact resumability when the user wants a manual handoff

Prefer the smallest surface that answers the user's need, then move upward only when more context is necessary.

## Connection Model

`nmem` resolves remote access in this order:

1. `--api-url` flag
2. `NMEM_API_URL` / `NMEM_API_KEY`
3. `~/.nowledge-mem/config.json`
4. local defaults

Preferred persistent remote setup:

```bash
nmem config client set url https://mem.example.com
nmem config client set api-key nmem_your_key
```

If Gemini's MCP tools also need to target remote Mem, generate the host config with:

```bash
nmem config mcp show --host gemini-cli
```

Paste the generated JSON into Gemini `settings.json`. Direct MCP clients do not read `~/.nowledge-mem/config.json` automatically.

## Context Bundle And Working Memory

At the start of a session, or when recent priorities would help, read Context Bundle when identity, active space, guidance, or multi-agent behavior could matter:

Prefer the MCP `read_context_bundle` tool when it is available.

Otherwise use:

```bash
nmem --json context --source-app gemini-cli
```

Use Working Memory alone for the lighter daily briefing or compatibility fallback.

Prefer the MCP `read_working_memory` tool when it is available.

Otherwise use:

```bash
nmem --json wm read
```

If the command succeeds but returns `exists: false`, there is no Working Memory briefing yet. Say that clearly instead of pretending a briefing exists.

If the runtime already knows the current project or agent lane, add `--space "<space name>"` to either command. If Gemini exposes a stable long-running agent id, add `--host-agent-id "<agent-id>"` to `nmem context`. Multi-agent orchestrators can set `NMEM_AGENT_ID`, `NMEM_HOST_AGENT_ID`, and `NMEM_SPACE` before launching Gemini CLI.

Only fall back to the legacy file below for older local-only **Default-space** setups where the user still keeps Working Memory there:

```bash
test -f ~/ai-now/memory.md && cat ~/ai-now/memory.md
```

Read Context Bundle or Working Memory once near the start of a session, then reuse that context mentally. If Context Bundle already included Working Memory, do not read Working Memory again immediately. Do not re-read on every turn unless the user asks, the session context changed materially, or a long-running session clearly needs a refresh.

## Search Memory

Search past knowledge when:

- the user references previous work, a prior fix, or an earlier decision
- the task resumes a named feature, bug, refactor, incident, or subsystem
- a debugging pattern resembles something solved earlier
- the user asks for rationale, preferences, procedures, or recurring workflow details
- the current result is ambiguous and prior context would make the answer sharper

Start with durable recall:

Prefer MCP retrieval tools when they are available:

- `memory_search` for durable knowledge
- `thread_search` for prior conversation lookup
- `thread_fetch_messages` for progressive thread inspection

Otherwise use:

```bash
nmem --json m search "query"
```

If the runtime already knows the active project or agent lane, add `--space "<space name>"` to Context Bundle, Working Memory, memory search, thread search, and save commands.

If the recall need is conceptual or the first pass is weak, use deep search:

```bash
nmem --json m search "query" --mode deep
```

If the user is really asking about a previous conversation or session, search threads directly:

```bash
nmem --json t search "query" --limit 5
```

If a memory search result includes `source_thread`, or thread search finds the likely conversation, inspect it progressively instead of loading the whole thread at once:

```bash
nmem --json t show <thread_id> --limit 8 --offset 0 --content-limit 1200
```

Prefer the smallest retrieval surface that answers the question.

## Distill Memory

Distill only durable knowledge worth keeping after the current session ends.

Use MCP `memory_add` for genuinely new facts, preferences, decisions, plans, procedures, learnings, events, or context when available. Pass `unit_type` when the type is clear:

If MCP tools are not exposed, use:

```bash
nmem --json m add "Insight with enough context to stand on its own." -t "Searchable title" -i 0.8 --unit-type decision -l project-name -s gemini-cli
```

If an existing memory already captures the same decision, workflow, or preference and the new information refines it, update that memory instead of creating a duplicate. Prefer MCP `memory_update` when available; otherwise use:

```bash
nmem m update <id> -t "Updated title"
```

## Save Thread

Only save a thread when the user explicitly asks to persist the real Gemini session. The extension also performs a best-effort automatic thread import before context compression and at session end, so this command is mainly for explicit mid-session capture or immediate confirmation.

This is a real session import, not a summary fallback. Use:

```bash
nmem --json t save --from gemini-cli -p . -s "Brief summary of what was accomplished"
```

The summary is metadata only. The saved thread should come from Gemini's recorded session transcript.

If the user wants a specific older Gemini session, add `--session-id`.

## Save Handoff

Only save a handoff when the user explicitly asks for a resumable summary rather than a full session import. Think of this as a handoff summary, not a transcript save.

Structure the checkpoint around:

- Goal
- Major decisions
- Files or surfaces touched
- Open questions or risks
- Next steps

Then store it with:

```bash
nmem --json t create -t "Gemini CLI Session - topic" -c "Goal: ... Decisions: ... Files: ... Risks: ... Next: ..." -s gemini-cli
```

## Status

When setup seems broken, run:

```bash
nmem status
```

Be concise, use memory tools naturally, and avoid saving routine or low-value chatter.
