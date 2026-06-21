import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Agent identity fingerprint
// ---------------------------------------------------------------------------

/**
 * Derive a stable per-machine agent identity from system sources.
 *
 * Ordered by preference (universal across bare metal, VMs, Docker, LPK):
 *   1. /etc/machine-id    — systemd hosts (gold standard, unique per machine)
 *   2. MAC address        — primary non-loopback interface (universal on Linux;
 *                           Docker assigns per-host IP→MAC, unique in practice)
 *   3. /proc/1/mountinfo  — overlay upperdir layer hash (last resort for
 *                           containers; content-addressed, NOT machine-unique)
 *
 * Returns "gemini-cli-XXXXXXXX" (8 hex chars) or an empty string.
 *
 * @returns {string}
 */
function hostAgentFingerprint() {
  // 1) /etc/machine-id
  try {
    const raw = readFileSync('/etc/machine-id', 'utf8').trim();
    if (raw) {
      const digest = createHash('sha256').update(raw).digest('hex');
      return `gemini-cli-${digest.substring(0, 8)}`;
    }
  } catch { /* unavailable */ }

  // 2) MAC address — first non-loopback interface
  try {
    const netDir = '/sys/class/net';
    const ifaces = readdirSync(netDir).sort();
    for (const iface of ifaces) {
      try {
        const addr = readFileSync(`${netDir}/${iface}/address`, 'utf8').trim();
        if (addr && addr !== '00:00:00:00:00:00') {
          const digest = createHash('sha256').update(addr).digest('hex');
          return `gemini-cli-${digest.substring(0, 8)}`;
        }
      } catch { /* skip this interface */ }
    }
  } catch { /* /sys/class/net not available */ }

  // 3) /proc/1/mountinfo — overlay upperdir layer hash (last resort)
  try {
    const raw = readFileSync('/proc/1/mountinfo', 'utf8');
    const line = raw.split('\n').find(
      l => l.includes(' / ') && l.includes('overlay') && l.includes('upperdir=')
    );
    if (line) {
      const upperdir = line.split('upperdir=')[1].split(',')[0].trim();
      // Extract the 64-char hex layer ID from the path
      const parts = upperdir.replace(/\/+$/, '').split('/');
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].length === 64 && /^[0-9a-f]+$/.test(parts[i])) {
          const digest = createHash('sha256').update(parts[i]).digest('hex');
          return `gemini-cli-${digest.substring(0, 8)}`;
        }
      }
    }
  } catch { /* unavailable */ }

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
