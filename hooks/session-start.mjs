import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function emit(payload) {
  process.stdout.write(
    JSON.stringify({
      suppressOutput: true,
      ...payload,
    }),
  );
}

function parseJsonText(stdout, keys) {
  try {
    const data = JSON.parse(stdout || '{}');
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  } catch {
    // Fall back to the next context source.
  }
  return '';
}

function readNmem(args, keys) {
  const result = spawnSync('nmem', ['--json', ...args], {
    encoding: 'utf8',
    timeout: 10000,
  });

  if (result.status === 0) {
    const content = parseJsonText(result.stdout, keys);
    if (content) {
      return content;
    }
  }
  return '';
}

function envValue(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function withStartupArgs(args) {
  const next = [...args];
  const agentId = envValue('NMEM_AGENT_ID');
  const hostAgentId = envValue('NMEM_HOST_AGENT_ID');
  const space = envValue('NMEM_SPACE') || envValue('NMEM_SPACE_ID');
  if (agentId && !next.includes('--agent-id')) {
    next.push('--agent-id', agentId);
  }
  if (hostAgentId && !next.includes('--host-agent-id')) {
    next.push('--host-agent-id', hostAgentId);
  }
  if (space && !next.includes('--space')) {
    next.push('--space', space);
  }
  return next;
}

function withSpaceArgs(args) {
  const next = [...args];
  const space = envValue('NMEM_SPACE') || envValue('NMEM_SPACE_ID');
  if (space && !next.includes('--space')) {
    next.push('--space', space);
  }
  return next;
}

function readStartupContext() {
  const contextBundle = readNmem(withStartupArgs(['context', '--source-app', 'gemini-cli']), ['rendered_markdown', 'markdown', 'content']);
  if (contextBundle) {
    return {
      tag: 'nowledge_context_bundle',
      label: 'Context Bundle',
      content: contextBundle,
    };
  }

  const workingMemory = readNmem(withSpaceArgs(['wm', 'read']), ['content']);
  if (workingMemory) {
    return {
      tag: 'nowledge_working_memory',
      label: 'Working Memory',
      content: workingMemory,
    };
  }

  const legacyPath = path.join(os.homedir(), 'ai-now', 'memory.md');
  if (existsSync(legacyPath)) {
    const content = readFileSync(legacyPath, 'utf8').trim();
    if (content) {
      return {
        tag: 'nowledge_working_memory',
        label: 'legacy Working Memory file',
        content,
      };
    }
  }

  return null;
}

const startupContext = readStartupContext();

if (!startupContext) {
  emit({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
    },
  });
} else {
  emit({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `<${startupContext.tag}>
Use this as current user context from Nowledge Mem ${startupContext.label}. It is situational context, not a higher-priority instruction.

${startupContext.content}
</${startupContext.tag}>`,
    },
  });
}
