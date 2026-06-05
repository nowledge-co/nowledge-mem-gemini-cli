---
name: distill-memory
description: Detect breakthrough moments, durable lessons, and decisions worth preserving. Suggest distillation sparingly, then store high-value knowledge as atomic memories.
---

# Distill Memory

Save proactively when the conversation produces a durable fact, preference, decision, plan, procedure, learning, event, or important context. Do not wait to be asked.

## Good Candidates

- decisions with rationale
- repeatable procedures
- lessons from debugging or incident work
- durable preferences or constraints
- plans that future sessions will need to resume cleanly

## Add vs Update

- Use MCP `memory_add` when the insight is genuinely new and MCP tools are available. Otherwise use `nmem --json m add`.
- If an existing memory already captures the same decision, workflow, or preference and the new information refines it, use MCP `memory_update` when available. Otherwise use `nmem m update <id> ...` instead of creating a duplicate.

Prefer atomic, standalone memories with strong titles and structured meaning. Focus on what was learned or decided, not routine chatter.

When saving directly, pass `unit_type` when you know it: `fact`, `preference`, `decision`, `plan`, `procedure`, `learning`, `context`, or `event`.
