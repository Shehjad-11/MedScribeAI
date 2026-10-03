/**
 * Deterministic Red-Flag Triage Engine (Tier 1 SIH Spec)
 * Evaluates intake clinical facts against versioned rules and computes triage queue priority.
 */

import { RED_FLAG_RULES, RedFlagRule, RedFlagSeverity } from '../data/redFlagRules';
import { RedFlagAlert } from '../types/clinicalCase';

export interface EvaluatedRedFlagAlert extends RedFlagAlert {
  ruleVersion: string; // Version is strictly mandated on every alert
  queuePriority: number;
  safeWording: string;
}

export interface RedFlagEvaluationResult {
  hasRedFlags: boolean;
  highestSeverity: RedFlagSeverity | 'NORMAL';
  assignedQueuePriority: number; // 1 = Immediate / STAT, 2 = Urgent, 3 = High, 4 = Normal
  alerts: EvaluatedRedFlagAlert[];
}

/**
 * Deterministically evaluates intake facts against all active red-flag rules
 */
export function evaluateRedFlags(facts: Record<string, any>): RedFlagEvaluationResult {
  const alerts: EvaluatedRedFlagAlert[] = [];

  for (const rule of RED_FLAG_RULES) {
    const { triggered, triggeringFacts } = rule.evaluate(facts);

    if (triggered) {
      alerts.push({
        id: `alert_${rule.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ruleId: rule.id,
        ruleVersion: rule.ruleVersion,
        severity: rule.severity,
        queuePriority: rule.queuePriority,
        title: rule.title,
        description: rule.safeWording,
        safeWording: rule.safeWording,
        actionRequired: rule.actionRequired,
        triggeringFacts,
        triggeredAt: new Date().toISOString(),
        acknowledgedByClinician: false,
      });
    }
  }

  // Sort by queue priority ascending (1 = STAT / EMERGENCY first)
  alerts.sort((a, b) => a.queuePriority - b.queuePriority);

  let highestSeverity: RedFlagSeverity | 'NORMAL' = 'NORMAL';
  let assignedQueuePriority = 4; // Normal queue priority default

  if (alerts.length > 0) {
    assignedQueuePriority = alerts[0].queuePriority;
    highestSeverity = alerts[0].severity;
  }

  return {
    hasRedFlags: alerts.length > 0,
    highestSeverity,
    assignedQueuePriority,
    alerts,
  };
}
