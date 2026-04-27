---
name: search-memory
description: Search the user's personal knowledge base when past insights would improve the response. Trigger proactively for continuity, recurring bugs, design rationale, and remembered workflows.
---

# Search Memory

Use Nowledge Mem proactively when prior knowledge would materially improve the answer.

## Strong Signals

Search when:

- the user references previous work, a prior fix, or an earlier decision
- the task resumes a named feature, bug, refactor, incident, or subsystem
- a debugging pattern resembles something solved earlier
- the user asks for rationale, preferences, procedures, or recurring workflow details
- the user uses implicit recall language: "that approach", "like before"

**Contextual signals — consider searching when:**

- complex debugging where prior context would narrow the search space
- architecture discussion that may intersect with past decisions
- domain-specific conventions the user has established before
- the current result is ambiguous and past context would make the answer sharper

## Retrieval Routing

If MCP tools are available, prefer:

1. `memory_search` for durable knowledge.
2. `thread_search` for prior discussions, previous sessions, or exact conversation history.
3. `thread_fetch_messages` for progressive inspection of a matching thread.

Otherwise:

1. Start with `nmem --json m search` for durable knowledge.
2. Use `--mode deep` when the first pass is weak or the recall need is conceptual.
3. Use `nmem --json t search` for prior discussions, previous sessions, or exact conversation history.
4. If a memory result includes a `source_thread` or thread search returns a strong hit, inspect the conversation progressively with `nmem --json t show`.

Prefer the smallest retrieval surface that answers the question.

If the runtime already knows the active project or agent lane, add `--space "<space name>"` to these commands.

Mention source threads when they add useful historical context.
