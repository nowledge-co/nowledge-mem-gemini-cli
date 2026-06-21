import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Agent identity fingerprint
// ---------------------------------------------------------------------------

/**
 * Derive a stable per-machine agent identity from system sources.
 *
 * Ordered by preference:
 *   1. /etc/machine-id (systemd / standard Linux)
 *   2. /proc/1/mountinfo overlay upperdir (Docker / LazyCat containers)
 *
 * Returns "gemini-cli-XXXXXXXX" (8 hex chars) or an empty string.
 *
 * @returns {string}
 */
function hostAgentFingerprint() {
  const sources = ['/etc/machine-id', '/proc/1/mountinfo'];
  for (const source of sources) {
    try {
      let raw = readFileSync(source, 'utf8').trim();
      if (!raw) continue;

      // /proc/1/mountinfo: extract the overlay upperdir layer hash
      if (source === '/proc/1/mountinfo') {
        const line = raw.split('\n').find(l => l.includes('upperdir='));
        if (!line) continue;
        const upperdir = line.split('upperdir=')[1].split(',')[0].trim();
        raw = upperdir.split('/').pop();
      }

      const digest = createHash('sha256').update(raw).digest('hex');
      return `gemini-cli-${digest.substring(0, 8)}`;
    } catch {
      // Source unavailable, try next
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function readHookInput() {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const hookInput = readHookInput();
const cwd = typeof hookInput.cwd === 'string' && hookInput.cwd.trim()
  ? hookInput.cwd
  : process.cwd();
const sessionId = typeof hookInput.session_id === 'string' && hookInput.session_id.trim()
  ? hookInput.session_id
  : undefined;

const args = ['--json', 't', 'save', '--from', 'gemini-cli', '-p', cwd, '--truncate'];

// NOTE: --host-agent-id requires nmem CLI >= TBD (currently unrecognized).
// The nmem maintainer has been asked to add this flag to 'nmem t save'.
// Until then, this is a no-op — the flag is silently ignored by older nmem.
const hostAgentId = hostAgentFingerprint();
if (hostAgentId) {
  args.push('--host-agent-id', hostAgentId);
}

if (sessionId) {
  args.push('--session-id', sessionId);
}

spawnSync('nmem', args, {
  encoding: 'utf8',
  timeout: 20000,
});

process.stdout.write(JSON.stringify({ suppressOutput: true }));
