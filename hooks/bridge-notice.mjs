import { bridgeNoticeHint, bridgeSessionHint, closeLocalBridgeSession, readBridgeHookInput } from './agent-bridge-notices.mjs';

const input = readBridgeHookInput();
const session = input.session_id;
const event = input.hook_event_name;
let hint = '';
if (event === 'SessionEnd') {
  closeLocalBridgeSession('gemini-cli', session);
} else if (event === 'BeforeAgent') {
  hint = bridgeNoticeHint('gemini-cli', session);
} else if (event === 'SessionStart' && process.env.NMEM_BRIDGE_INBOX_ON_START === '1' && process.env.NMEM_AGENT_CONTEXT?.trim()) {
  hint = bridgeSessionHint('gemini-cli', session);
}
process.stdout.write(JSON.stringify(hint ? {
  suppressOutput: true, hookSpecificOutput: {hookEventName: event, additionalContext: hint},
} : {suppressOutput: true}));
