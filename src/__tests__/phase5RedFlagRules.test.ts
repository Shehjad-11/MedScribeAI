import { describe, it, expect } from 'vitest';
import { evaluateRedFlags } from '../utils/redFlagEngine';
import { RED_FLAG_RULES } from '../data/redFlagRules';

describe('Phase 5: Deterministic Versioned Red-Flag Rules & Triage Engine', () => {
  // -------------------------------------------------------------------------
  // 1. Rule Versioning & Completeness
  // -------------------------------------------------------------------------
  it('defines versioned rules with non-empty version string on every rule and alert', () => {
    expect(RED_FLAG_RULES.length).toBeGreaterThanOrEqual(10);

    RED_FLAG_RULES.forEach((rule) => {
      expect(rule.id).toMatch(/^RF-[A-Z]+-\d{3}$/);
      expect(rule.ruleVersion).toBeTruthy();
      expect(rule.safeWording).toBeTruthy();
      expect([1, 2, 3]).toContain(rule.queuePriority);
      expect(['EMERGENCY', 'URGENT', 'WARNING']).toContain(rule.severity);
    });

    const result = evaluateRedFlags({ diaphoresis: true });
    expect(result.hasRedFlags).toBe(true);
    result.alerts.forEach((alert) => {
      expect(alert.ruleVersion).toBe('1.0.0');
      expect(alert.safeWording).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Positive Clinical Red Flag Triggers
  // -------------------------------------------------------------------------
  describe('Positive Red Flag Trigger Scenarios', () => {
    it('triggers RF-CARD-001 (EMERGENCY, Priority 1) on diaphoresis with chest pain', () => {
      const res = evaluateRedFlags({
        diaphoresis: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.highestSeverity).toBe('EMERGENCY');
      expect(res.assignedQueuePriority).toBe(1);
      const cardAlert = res.alerts.find((a) => a.ruleId === 'RF-CARD-001');
      expect(cardAlert).toBeDefined();
      expect(cardAlert?.safeWording).toContain('Not a diagnostic confirmation');
    });

    it('triggers RF-RESP-001 on resting dyspnea or cyanosis', () => {
      const res = evaluateRedFlags({
        shortness_of_breath_at_rest: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.assignedQueuePriority).toBe(1);
      expect(res.alerts.some((a) => a.ruleId === 'RF-RESP-001')).toBe(true);
    });

    it('triggers RF-RESP-002 on frank hemoptysis (URGENT, Priority 2)', () => {
      const res = evaluateRedFlags({
        hemoptysis: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.assignedQueuePriority).toBe(2);
      expect(res.alerts.some((a) => a.ruleId === 'RF-RESP-002')).toBe(true);
    });

    it('triggers RF-NEURO-001 on thunderclap headache onset', () => {
      const res = evaluateRedFlags({
        thunderclap_onset: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.highestSeverity).toBe('EMERGENCY');
      expect(res.alerts.some((a) => a.ruleId === 'RF-NEURO-001')).toBe(true);
    });

    it('triggers RF-GI-001 on peritoneal rigidity and rebound tenderness', () => {
      const res = evaluateRedFlags({
        rebound_tenderness: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.highestSeverity).toBe('EMERGENCY');
      expect(res.alerts.some((a) => a.ruleId === 'RF-GI-001')).toBe(true);
    });

    it('triggers RF-HEM-001 on febrile petechial rash / bleeding', () => {
      const res = evaluateRedFlags({
        petechiae_bleeding: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.alerts.some((a) => a.ruleId === 'RF-HEM-001')).toBe(true);
    });

    it('triggers RF-REN-001 on gross hematuria', () => {
      const res = evaluateRedFlags({
        frank_hematuria: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.alerts.some((a) => a.ruleId === 'RF-REN-001')).toBe(true);
    });

    it('triggers RF-HYP-001 on acute target-organ warning in hypertension', () => {
      const res = evaluateRedFlags({
        blurred_vision_chest_tightness: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.alerts.some((a) => a.ruleId === 'RF-HYP-001')).toBe(true);
    });

    it('triggers RF-MSK-001 on acute inability to bear weight', () => {
      const res = evaluateRedFlags({
        inability_to_bear_weight: true,
      });

      expect(res.hasRedFlags).toBe(true);
      expect(res.alerts.some((a) => a.ruleId === 'RF-MSK-001')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Negative Scenarios (Zero False Positives)
  // -------------------------------------------------------------------------
  describe('Negative Clinical Scenarios', () => {
    it('does not trigger red flags for routine uncomplicated febrile cold', () => {
      const res = evaluateRedFlags({
        duration_days: '2 days',
        chills_rigors: true,
        petechiae_bleeding: false,
        cough_nature: 'productive',
        hemoptysis: false,
      });

      expect(res.hasRedFlags).toBe(false);
      expect(res.highestSeverity).toBe('NORMAL');
      expect(res.assignedQueuePriority).toBe(4);
      expect(res.alerts.length).toBe(0);
    });

    it('does not trigger red flags for mild tension headache without meningism or thunderclap', () => {
      const res = evaluateRedFlags({
        thunderclap_onset: false,
        neck_stiffness_fever: false,
        pain_score: 4,
      });

      expect(res.hasRedFlags).toBe(false);
      expect(res.alerts.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Boundary Threshold Tests
  // -------------------------------------------------------------------------
  describe('Boundary Condition Testing', () => {
    it('enforces exact duration boundary for prolonged fever (RF-FEV-001 >= 7 days)', () => {
      // 6 days: Boundary Negative
      const negRes = evaluateRedFlags({ duration_days: '6 days' });
      expect(negRes.alerts.some((a) => a.ruleId === 'RF-FEV-001')).toBe(false);

      // 7 days: Boundary Positive
      const posRes = evaluateRedFlags({ duration_days: '7 days' });
      expect(posRes.alerts.some((a) => a.ruleId === 'RF-FEV-001')).toBe(true);

      // 10 days: Over-boundary Positive
      const highRes = evaluateRedFlags({ duration_days: '10 days' });
      expect(highRes.alerts.some((a) => a.ruleId === 'RF-FEV-001')).toBe(true);
    });

    it('enforces pain score boundary for radiating chest pain (Pain >= 7)', () => {
      // Radiation + Pain score 6: Does not trigger
      const resScore6 = evaluateRedFlags({
        chest_pain_radiation: ['left_arm'],
        pain_score: 6,
        diaphoresis: false,
      });
      expect(resScore6.alerts.some((a) => a.ruleId === 'RF-CARD-001')).toBe(false);

      // Radiation + Pain score 7: Triggers
      const resScore7 = evaluateRedFlags({
        chest_pain_radiation: ['left_arm'],
        pain_score: 7,
        diaphoresis: false,
      });
      expect(resScore7.alerts.some((a) => a.ruleId === 'RF-CARD-001')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Triage Queue Sorting
  // -------------------------------------------------------------------------
  it('sorts multiple red-flag alerts strictly by queuePriority ascending', () => {
    const multiRes = evaluateRedFlags({
      inability_to_bear_weight: true, // Priority 3 (HIGH)
      hemoptysis: true,               // Priority 2 (URGENT)
      thunderclap_onset: true,        // Priority 1 (EMERGENCY)
    });

    expect(multiRes.alerts.length).toBe(3);
    expect(multiRes.assignedQueuePriority).toBe(1);
    expect(multiRes.highestSeverity).toBe('EMERGENCY');

    // Priority 1 comes first
    expect(multiRes.alerts[0].queuePriority).toBe(1);
    expect(multiRes.alerts[0].ruleId).toBe('RF-NEURO-001');

    // Priority 2 second
    expect(multiRes.alerts[1].queuePriority).toBe(2);
    expect(multiRes.alerts[1].ruleId).toBe('RF-RESP-002');

    // Priority 3 third
    expect(multiRes.alerts[2].queuePriority).toBe(3);
    expect(multiRes.alerts[2].ruleId).toBe('RF-MSK-001');
  });
});
