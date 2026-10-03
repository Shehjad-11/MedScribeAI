/**
 * Protected Tunnel Pre-Flight Verification Script
 * Spec: MASTER_PROMPT Phase 14
 * Enforces mandatory safety invariants BEFORE any remote tunnel can be initiated.
 * Strictly performs local validation only. Zero external network requests.
 */

export interface TunnelPreFlightResult {
  enabled: boolean;
  demoModeEnforced: boolean;
  accessControlConfigured: boolean;
  canProceed: boolean;
  messages: string[];
}

export function verifyTunnelPreFlight(env: Record<string, string | undefined> = process.env): TunnelPreFlightResult {
  const messages: string[] = [];

  const isEnabled = env.TUNNEL_ENABLED === 'true';
  const isDemo = env.DEMO_MODE === 'true' || env.NODE_ENV !== 'production';
  const hasToken = !!env.TUNNEL_ACCESS_TOKEN;

  if (!isEnabled) {
    messages.push('[SAFE DEFAULT] TUNNEL_ENABLED is not set to true. Tunnel is DISABLED.');
  }

  if (!isDemo) {
    messages.push('[SAFETY VIOLATION] Remote tunnel cannot be enabled outside DEMO_MODE.');
  }

  if (isEnabled && !hasToken) {
    messages.push('[ACCESS CONTROL REQUIRED] TUNNEL_ACCESS_TOKEN must be configured to prevent unauthorized exposure.');
  }

  const canProceed = isEnabled && isDemo && hasToken;

  return {
    enabled: isEnabled,
    demoModeEnforced: isDemo,
    accessControlConfigured: hasToken,
    canProceed,
    messages,
  };
}

// CLI Execution
if (process.argv[1]?.includes('tunnelGuide')) {
  console.log('[Tunnel Guard] Evaluating Phase 14 Tunnel Pre-Flight Conditions...');
  const result = verifyTunnelPreFlight();
  for (const msg of result.messages) {
    console.log(`  ${msg}`);
  }

  if (!result.canProceed) {
    console.log('\n[Tunnel Guard] Result: TUNNEL BLOCKED (Safe Default). No remote services contacted.');
    process.exit(0);
  } else {
    console.log('\n[Tunnel Guard] Result: Pre-flight conditions satisfied. Manual administrator tunnel launch permitted.');
    process.exit(0);
  }
}
