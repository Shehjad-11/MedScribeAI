import { describe, it, expect } from 'vitest';
import {
  startInterview,
  getCurrentQuestion,
  processAnswer,
  confirmHighRiskFact,
  confirmBatchSummary,
  extractSlotsOffline,
} from '../utils/interviewEngine';
import { INTERVIEW_TEMPLATES } from '../data/interviewTemplates';

describe('Phase 3: Deterministic Clinical Interview Engine & Question Graph', () => {
  // -------------------------------------------------------------------------
  // 1. Complaint Templates Completeness
  // -------------------------------------------------------------------------
  it('loads deterministic templates for all 10 clinical complaints', () => {
    const complaintCodes = [
      'FEVER',
      'COUGH',
      'CHEST_PAIN',
      'ABDOMINAL_PAIN',
      'HEADACHE',
      'BREATHLESSNESS',
      'VOMITING_DIARRHEA',
      'JOINT_PAIN',
      'URINARY_SYMPTOMS',
      'DIABETES_HYPERTENSION',
    ];

    complaintCodes.forEach((code) => {
      const template = INTERVIEW_TEMPLATES[code];
      expect(template).toBeDefined();
      expect(template.questions.length).toBeGreaterThanOrEqual(2);

      template.questions.forEach((q) => {
        expect(q.id).toBeTruthy();
        expect(q.fieldKey).toBeTruthy();
        expect(q.prompt.en).toBeTruthy();
        expect(q.prompt.hi).toBeTruthy();
        expect(q.prompt.mr).toBeTruthy();
        expect(['HIGH', 'LOW']).toContain(q.riskCategory);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. Traversal & Required Fields Enforcement
  // -------------------------------------------------------------------------
  it('enforces required questions and prevents advancing on missing mandatory input', () => {
    const session = startInterview('FEVER');
    const firstQ = getCurrentQuestion(session);
    expect(firstQ).not.toBeNull();
    expect(firstQ?.id).toBe('q_fever_duration');
    expect(firstQ?.required).toBe(true);

    // Required field cannot be empty
    expect(() => {
      processAnswer(session, firstQ!.id, '');
    }).toThrow(/required for clinical safety/);

    expect(() => {
      processAnswer(session, firstQ!.id, null);
    }).toThrow(/required for clinical safety/);
  });

  it('assigns explicit "Not documented" for skipped non-mandatory questions', () => {
    const session = startInterview('FEVER');
    // Find non-required question
    const optionalQ = session.template.questions.find((q) => !q.required);
    expect(optionalQ).toBeDefined();

    const result = processAnswer(session, optionalQ!.id, '', 'touch_select');
    expect(result.fact.value).toBe('Not documented');
    expect(result.fact.provenance.source).toBe('PATIENT_REPORTED');
  });

  // -------------------------------------------------------------------------
  // 3. Confirmation Policy: High-Risk Individual vs Low-Risk Batch
  // -------------------------------------------------------------------------
  it('requires individual confirmation for HIGH-RISK questions', () => {
    let session = startInterview('CHEST_PAIN');
    const firstQ = getCurrentQuestion(session);
    expect(firstQ?.riskCategory).toBe('HIGH');

    // Answer high-risk question
    const result = processAnswer(session, firstQ!.id, 'sudden_acute', 'touch_select');
    expect(result.confirmationRequired).toBe(true);
    expect(result.fact.provenance.verificationState).toBe('unverified');
    expect(result.nextState.pendingConfirmationFact).not.toBeNull();

    // Patient confirms the high-risk fact
    session = confirmHighRiskFact(result.nextState, 'sudden_acute');
    expect(session.pendingConfirmationFact).toBeNull();
    expect(session.facts[0].provenance.verificationState).toBe('patient_confirmed');
    expect(session.currentQuestionIndex).toBe(1);
  });

  it('queues LOW-RISK questions for batch confirmation without interrupting flow', () => {
    let session = startInterview('FEVER');
    // First question is duration (high risk)
    const q1 = getCurrentQuestion(session)!;
    const r1 = processAnswer(session, q1.id, '3 days');
    session = confirmHighRiskFact(r1.nextState, '3 days');

    // Second question is chills (low risk)
    const q2 = getCurrentQuestion(session)!;
    expect(q2.riskCategory).toBe('LOW');

    const r2 = processAnswer(session, q2.id, true, 'touch_select');
    expect(r2.confirmationRequired).toBe(false);
    expect(r2.nextState.batchConfirmationsPending.length).toBeGreaterThan(0);
    expect(r2.nextState.currentQuestionIndex).toBe(2);

    // Run batch confirmation at conclusion
    const finalSession = confirmBatchSummary(r2.nextState);
    expect(finalSession.batchConfirmationsPending.length).toBe(0);
    expect(finalSession.facts.every((f) => f.provenance.verificationState === 'patient_confirmed')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 4. Deterministic Offline Slot Extraction
  // -------------------------------------------------------------------------
  describe('Deterministic Offline Slot Extractor', () => {
    it('extracts duration correctly in English and regional terms', () => {
      const durationQ = INTERVIEW_TEMPLATES.FEVER.questions[0];

      expect(extractSlotsOffline(durationQ, 'I have had fever for 4 days')).toBe('4 days');
      expect(extractSlotsOffline(durationQ, '3 दिन')).toBe('3 days');
      expect(extractSlotsOffline(durationQ, '५ दिवस')).toBe('5 days');
    });

    it('extracts boolean Yes/No correctly across languages', () => {
      const yesNoQ = INTERVIEW_TEMPLATES.FEVER.questions[1];

      expect(extractSlotsOffline(yesNoQ, 'Yes, severe shivering')).toBe(true);
      expect(extractSlotsOffline(yesNoQ, 'हाँ, बहुत ठंड लगती है')).toBe(true);
      expect(extractSlotsOffline(yesNoQ, 'होय')).toBe(true);
      expect(extractSlotsOffline(yesNoQ, 'No chills')).toBe(false);
      expect(extractSlotsOffline(yesNoQ, 'नाही')).toBe(false);
    });

    it('extracts numeric scale rating from 1 to 10', () => {
      const painQ = INTERVIEW_TEMPLATES.CHEST_PAIN.questions.find((q) => q.type === 'numeric_scale')!;
      expect(extractSlotsOffline(painQ, 'It is about an 8')).toBe(8);
      expect(extractSlotsOffline(painQ, '9 out of 10')).toBe(9);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Clinical Fact Provenance & Audit Trail
  // -------------------------------------------------------------------------
  it('preserves provenance method and raw transcript fragment on every fact', () => {
    const session = startInterview('COUGH');
    const q = getCurrentQuestion(session)!;
    const rawVoice = 'मला चार दिवसांपासून खोकला आहे';

    const result = processAnswer(session, q.id, '4 days', 'voice_extracted');
    expect(result.fact.provenance.source).toBe('PATIENT_REPORTED');
    expect(result.fact.provenance.method).toBe('voice_asr');
    expect(result.fact.provenance.confidence).toBe(0.88);
    expect(result.fact.provenance.timestamp).toBeTruthy();
  });
});
