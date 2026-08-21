# Nowledge Mem -- Gemini CLI Extension

> Bring your Nowledge Mem knowledge base into Gemini CLI with persistent context, reusable slash commands, and agent skills.

This package is the **Gemini-native product surface** for Nowledge Mem.

It is deliberately **hybrid**:

- Gemini CLI loads `GEMINI.md` plus extension hooks for Context Bundle / Working Memory startup context and session capture
- the extension exposes local Nowledge Mem MCP tools for lower-friction retrieval and memory writes
- bundled commands wrap common `nmem` workflows
- bundled skills teach Gemini when to recall, distill, save real threads, and create handoff summaries
- Gemini can still call `nmem` directly whenever it needs a more flexible path

The recommended Gemini setup is deliberately simple and stable: Gemini CLI on top, MCP for direct retrieval tools, and `nmem` for hooks, thread save, remote auth, and command fallback.

## Requirements

- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Nowledge Mem](https://mem.nowledge.co) running locally, or a reachable remote Nowledge Mem server
- `nmem` CLI in your `PATH`

If Nowledge Mem is already running on the same machine through the desktop app, the cleanest setup is to install the bundled CLI from **Settings -> Preferences -> Developer Tools -> Install CLI**. That gives Gemini direct access to the local Mem instance without any remote configuration.

You can also install `nmem` standalone:

```bash
# Option 1: pip
pip install nmem-cli

# Option 2: uvx
curl -LsSf https://astral.sh/uv/install.sh | sh
uvx --from nmem-cli nmem --version

# Option 3: Arch Linux AUR
yay -S nmem-cli
# or: paru -S nmem-cli
```

Verify the connection:

```bash
nmem status
```

For the default same-machine setup, `nmem status` should show `http://127.0.0.1:14242 (default)`. No `~/.nowledge-mem/config.json` is required unless you are connecting to a remote Mem server.

## Install

For local development or a repository checkout install, use:

```bash
git clone https://github.com/nowledge-co/nowledge-mem-gemini-cli.git
cd nowledge-mem-gemini-cli
gemini extensions link .
```

Restart Gemini CLI after linking.

This repository root is the Gemini extension root for both local development and gallery discovery.

Release packaging and marketplace notes live in [`RELEASING.md`](./RELEASING.md).

## What You Get

**Automatic lifecycle hooks**

- Session start loads Context Bundle when available, with Working Memory as the lightweight fallback
- Before context compression, Gemini imports the current thread so the pre-compression transcript remains searchable
- Session end performs a best-effort real Gemini thread import through `nmem t save --from gemini-cli`

**Bundled MCP**

- Local same-machine installs expose `nowledge-mem` MCP tools at `http://127.0.0.1:14242/mcp/`
- Gemini `settings.json` can override the same `nowledge-mem` server name for remote Mem or a custom local endpoint

**Persistent context**

- `GEMINI.md` tells Gemini how to route recall across Context Bundle, Working Memory, distilled memories, conversation threads, thread save, distillation, and handoff summaries

**Custom commands**

- `/nowledge:read-working-memory` -- Load today's Working Memory briefing
- `/nowledge:search-memory <query>` -- Search your knowledge base before answering
- `/nowledge:distill-memory` -- Save the high-value insights from the current conversation
- `/nowledge:save-thread` -- Save the real Gemini CLI session through `nmem`'s native Gemini importer
- `/nowledge:save-handoff` -- Save a concise resumable handoff summary for the current Gemini session
- `/nowledge:status` -- Check `nmem` and server connectivity

**Agent skills**

- `read-working-memory`
- `search-memory`
- `distill-memory`
- `save-thread`
- `save-handoff`

## Local vs Remote

By default, both `nmem` and the bundled MCP server point to the local Mem server at `http://127.0.0.1:14242`.

For remote Mem, the preferred long-term setup is:

```bash
nmem config client set url https://mem.example.com
nmem config client set api-key nmem_your_key
```

`nmem` loads connection settings with this priority:

- `--api-url` flag
- `NMEM_API_URL` / `NMEM_API_KEY`
- `~/.nowledge-mem/config.json`
- defaults

If you need a temporary override for one Gemini session, launch Gemini from a shell where `NMEM_API_URL` and `NMEM_API_KEY` are already exported. For durable setup, keep using `~/.nowledge-mem/config.json`.

For Gemini MCP tools in remote mode, define a `nowledge-mem` server in Gemini `settings.json`. Gemini gives user settings precedence over the extension's bundled local MCP server:

```bash
nmem config mcp show --host gemini-cli
```

Paste the generated JSON into Gemini's `settings.json`. Direct MCP clients do not read `~/.nowledge-mem/config.json` automatically; the generated block gives Gemini the same URL and key that `nmem` already uses.

For thread save in remote mode, the important detail is that `nmem t save --from gemini-cli` reads Gemini's local session files on the machine running Gemini, then uploads the normalized thread messages to Mem. The remote Mem server does not need direct access to your `~/.gemini` directory.

## Direct `nmem` Use Is Always Allowed

The bundled commands are convenience paths, not a cage. Gemini should freely compose direct `nmem` commands when that is clearer or more flexible. **We recommend reaching for `nmem` directly** for anything outside the per-turn tool set -- including graph and relationship queries (`nmem graph expand <memory-or-crystal-id> --depth 2`, `nmem graph evolves <memory-id>`). Run `nmem --help` to see its full capabilities.

Examples:

```bash
nmem --json wm read
nmem --json m search "auth token rotation" --mode deep --importance 0.7
nmem --json m search "auth token rotation" --mode deep --importance 0.7 --space "Research Agent"
nmem --json m add "JWT refresh failures came from clock skew between the gateway and API nodes." -t "JWT refresh failures traced to clock skew" -i 0.9 --unit-type learning -l auth -l backend -s gemini-cli
nmem --json t save --from gemini-cli -p . -s "Finished the auth refactor and verified the new refresh-token flow."
nmem --json t create -t "Gemini CLI Session - auth refactor" -c "Goal: finish the auth refactor. Decisions: keep refresh verification in the API layer and treat gateway skew as the root cause. Files: api/auth.ts, auth.test.ts. Next: validate expiry behavior against remote sessions." -s gemini-cli
nmem status
```

For historical backfill, preview first:

```bash
nmem t sync --from gemini-cli --all-projects --limit 20
```

Then import:

```bash
nmem t sync --from gemini-cli --all-projects --apply
```

Use `-p /path/to/project` instead of `--all-projects` when you only want one project. The command reads local Gemini CLI session files and writes to the Mem server configured in `nmem`.

## Thread Save vs Handoff

Gemini now supports two separate save paths, and they should stay distinct:

- `/nowledge:save-thread` imports the **real Gemini session messages** into Nowledge Mem with `nmem t save --from gemini-cli`. The summary is only metadata; the stored thread is based on Gemini's recorded transcript. The extension also performs this import automatically before context compression and at session end as best-effort, idempotent lifecycle hooks.
- `/nowledge:save-handoff` creates a **compact resumable handoff summary** with Goal, Decisions, Files, Risks, and Next. Use this when the user wants a lightweight restart point rather than the full transcript.

Use `/nowledge:distill-memory` for durable atomic knowledge, `/nowledge:save-thread` for the full session, and `/nowledge:save-handoff` for a resumable handoff.

## Architecture Choice

This integration keeps the control plane simple:

- Gemini provides the extension surface: `GEMINI.md`, commands, and skills
- MCP provides the direct tool path for retrieval and memory writes when Gemini chooses tools
- `nmem` provides the lifecycle path: Working Memory hooks, capture, thread import, remote auth, and command fallback
- direct `nmem` composition stays available whenever Gemini needs a more flexible command path

The result is a setup that is easier to reason about, easier to support, and easier for advanced users to extend.

## Customize without editing the extension

Gemini CLI already gives you a durable instruction layer through `GEMINI.md`.

- Shared repo behavior: project `GEMINI.md`
- Personal behavior across repos: `~/.gemini/GEMINI.md`
- Large customizations: split them into files and import with `@file.md`
- Do not edit the installed Nowledge Mem extension files directly

That keeps your custom behavior stable while letting the extension keep updating normally.

## Links

- [Documentation](https://mem.nowledge.co/docs/integrations/gemini-cli)
- [Nowledge Mem](https://mem.nowledge.co)
- [Discord](https://nowled.ge/discord)
- [GitHub](https://github.com/nowledge-co/nowledge-mem-gemini-cli)
