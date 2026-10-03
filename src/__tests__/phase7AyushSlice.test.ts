/**
 * MedScribeAI — Phase 7: AYUSH Thin Slice (Prakriti & Agni) Test Suite
 *
 * Verifies:
 * 1. Question definitions, classical references, and mandatory PENDING BAMS REVIEW labeling.
 * 2. Deterministic tally scoring engine (Vata, Pitta, Kapha, Dvandvaja, Sama Prakriti, and Agni).
 * 3. Provenance generation (PATIENT_REPORTED, touch, unverified by clinician).
 * 4. Kiosk HTTP endpoints: GET /api/kiosk/ayush/questions, POST /api/kiosk/ayush/evaluate, POST /api/kiosk/ayush/save.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { getDatabase, closeDatabase, saveClinicalCase, updateSessionCase } from '../../server/db/database';
import { createKioskRouter } from '../../server/routes/kioskRoutes';
import {
  PRAKRITI_QUESTIONS,
  AGNI_QUESTIONS,
  evaluateAyushAssessment,
  buildAyushClinicalFacts,
  AYUSH_REVIEW_STATUS,
  AYUSH_DISCLAIMER,
} from '../data/ayush/prakritiAgniRules';
import { ClinicalCase } from '../types/clinicalCase';

describe('Phase 7: AYUSH Thin Slice (Prakriti & Agni)', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    const db = getDatabase(':memory:');

    app = express();
    app.use(express.json());
    app.use('/api/kiosk', createKioskRouter(() => db));

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    closeDatabase();
  });

  describe('1. Clinical Config & Review Labeling Invariants', () => {
    it('enforces PENDING BAMS REVIEW on all 5 Prakriti questions', () => {
      expect(PRAKRITI_QUESTIONS).toHaveLength(5);
      for (const q of PRAKRITI_QUESTIONS) {
        expect(q.reviewStatus).toBe('PENDING BAMS REVIEW');
        expect(q.clinicalRationale).toBeTruthy();
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.title.en).toBeTruthy();
        expect(q.title.hi).toBeTruthy();
        expect(q.title.mr).toBeTruthy();
      }
    });

    it('enforces PENDING BAMS REVIEW on all 3 Agni questions', () => {
      expect(AGNI_QUESTIONS).toHaveLength(3);
      for (const q of AGNI_QUESTIONS) {
        expect(q.reviewStatus).toBe('PENDING BAMS REVIEW');
        expect(q.clinicalRationale).toBeTruthy();
        expect(q.options.length).toBe(4);
        expect(q.title.en).toBeTruthy();
        expect(q.title.hi).toBeTruthy();
        expect(q.title.mr).toBeTruthy();
      }
    });

    it('attaches classical Ayurvedic references to answer options for BAMS audit', () => {
      const vataFrame = PRAKRITI_QUESTIONS[0].options.find((o) => o.dosha === 'vata');
      expect(vataFrame?.classicalReference).toContain('Charaka Vimana');

      const vishamaApp = AGNI_QUESTIONS[0].options.find((o) => o.agniType === 'vishama');
      expect(vishamaApp?.classicalReference).toContain('Charaka Grahani');
    });
  });

  describe('2. Deterministic Prakriti Scoring Engine', () => {
    it('scores dominant Vata prakriti when Vata options prevail', () => {
      const responses = {
        ayush_prakriti_frame: 'frame_vata',
        ayush_prakriti_skin_hair: 'skin_vata',
        ayush_prakriti_weather: 'weather_vata',
        ayush_prakriti_temperament: 'temp_vata',
        ayush_prakriti_sleep: 'sleep_pitta',
      };

      const result = evaluateAyushAssessment(responses);
      expect(result.prakriti.dominantDosha).toContain('Vata Dominant Prakriti');
      expect(result.prakriti.dominantDosha).toContain('[PENDING BAMS REVIEW]');
      expect(result.prakriti.tally.vata).toBe(4);
      expect(result.prakriti.tally.pitta).toBe(1);
      expect(result.prakriti.tally.kapha).toBe(0);
      expect(result.prakriti.reviewStatus).toBe(AYUSH_REVIEW_STATUS);
    });

    it('scores dominant Pitta prakriti when Pitta options prevail', () => {
      const responses = {
        ayush_prakriti_frame: 'frame_pitta',
        ayush_prakriti_skin_hair: 'skin_pitta',
        ayush_prakriti_weather: 'weather_pitta',
        ayush_prakriti_temperament: 'temp_pitta',
        ayush_prakriti_sleep: 'sleep_pitta',
      };

      const result = evaluateAyushAssessment(responses);
      expect(result.prakriti.dominantDosha).toContain('Pitta Dominant Prakriti');
      expect(result.prakriti.tally.pitta).toBe(5);
    });

    it('scores dominant Kapha prakriti when Kapha options prevail', () => {
      const responses = {
        ayush_prakriti_frame: 'frame_kapha',
        ayush_prakriti_skin_hair: 'skin_kapha',
        ayush_prakriti_weather: 'weather_kapha',
        ayush_prakriti_temperament: 'temp_kapha',
        ayush_prakriti_sleep: 'sleep_kapha',
      };

      const result = evaluateAyushAssessment(responses);
      expect(result.prakriti.dominantDosha).toContain('Kapha Dominant Prakriti');
      expect(result.prakriti.tally.kapha).toBe(5);
    });

    it('scores Dvandvaja (dual-dosha) when two doshas tie with higher count', () => {
      const responses = {
        ayush_prakriti_frame: 'frame_vata',
        ayush_prakriti_skin_hair: 'skin_vata',
        ayush_prakriti_weather: 'weather_pitta',
        ayush_prakriti_temperament: 'temp_pitta',
        ayush_prakriti_sleep: 'sleep_kapha',
      };

      const result = evaluateAyushAssessment(responses);
      expect(result.prakriti.dominantDosha).toContain('Vata-Pitta Dvandvaja Prakriti');
      expect(result.prakriti.tally.vata).toBe(2);
      expect(result.prakriti.tally.pitta).toBe(2);
      expect(result.prakriti.tally.kapha).toBe(1);
    });

    it('returns Unassessed / Incomplete when no answers provided', () => {
      const result = evaluateAyushAssessment({});
      expect(result.prakriti.dominantDosha).toBe('Unassessed / Incomplete');
      expect(result.agni.primaryAgni).toBe('Unassessed / Incomplete');
    });
  });

  describe('3. Deterministic Agni Scoring Engine', () => {
    it('scores Vishama Agni for variable appetite and irregular digestion', () => {
      const responses = {
        ayush_agni_appetite: 'agni_app_vishama',
        ayush_agni_post_meal: 'agni_post_vishama',
        ayush_agni_bowel: 'agni_bowel_vishama',
      };

      const result = evaluateAyushAssessment(responses);
      expect(result.agni.primaryAgni).toContain('Vishama Agni');
      expect(result.agni.primaryAgni).toContain('[PENDING BAMS REVIEW]');
      expect(result.agni.tally.vishama).toBe(3);
    });

    it('scores Tikshna Agni for hyper-acidic intense appetite', () => {
      const responses = {
        ayush_agni_appetite: 'agni_app_tikshna',
        ayush_agni_post_meal: 'agni_post_tikshna',
        ayush_agni_bowel: 'agni_bowel_tikshna',
      };

      const result = evaluateAyushAssessment(responses);
      expect(result.agni.primaryAgni).toContain('Tikshna Agni');
      expect(result.agni.tally.tikshna).toBe(3);
    });

    it('scores Sama Agni for regular balanced digestion', () => {
      const responses = {
        ayush_agni_appetite: 'agni_app_sama',
        ayush_agni_post_meal: 'agni_post_sama',
        ayush_agni_bowel: 'agni_bowel_sama',
      };

      const result = evaluateAyushAssessment(responses);
      expect(result.agni.primaryAgni).toContain('Sama Agni');
      expect(result.agni.tally.sama).toBe(3);
    });
  });

  describe('4. Provenance & Fact Attachment', () => {
    it('constructs ClinicalFacts with PATIENT_REPORTED provenance and unverified state', () => {
      const score = evaluateAyushAssessment({
        ayush_prakriti_frame: 'frame_vata',
        ayush_prakriti_skin_hair: 'skin_vata',
        ayush_agni_appetite: 'agni_app_vishama',
      });

      const facts = buildAyushClinicalFacts(score, true);

      expect(facts.prakriti).toBeDefined();
      expect(facts.prakriti?.category).toBe('ayush');
      expect(facts.prakriti?.provenance.source).toBe('PATIENT_REPORTED');
      expect(facts.prakriti?.provenance.method).toBe('touch');
      expect(facts.prakriti?.provenance.verificationState).toBe('patient_confirmed');
      expect(facts.prakriti?.provenance.verifiedBy).toBeUndefined(); // Pending BAMS reviewer

      expect(facts.agni).toBeDefined();
      expect(facts.agni?.category).toBe('ayush');
      expect(facts.agni?.provenance.source).toBe('PATIENT_REPORTED');
      expect(facts.reviewedBy).toBeUndefined();
    });
  });

  describe('5. Kiosk HTTP API Integration', () => {
    it('GET /api/kiosk/ayush/questions serves questions with status and disclaimer', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/ayush/questions`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.reviewStatus).toBe('PENDING BAMS REVIEW');
      expect(data.disclaimer).toBe(AYUSH_DISCLAIMER);
      expect(data.prakriti).toHaveLength(5);
      expect(data.agni).toHaveLength(3);
    });

    it('POST /api/kiosk/ayush/evaluate calculates scores without session auth', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/ayush/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: {
            ayush_prakriti_frame: 'frame_kapha',
            ayush_prakriti_skin_hair: 'skin_kapha',
            ayush_prakriti_weather: 'weather_kapha',
            ayush_agni_appetite: 'agni_app_manda',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.prakriti.dominantDosha).toContain('Kapha Dominant Prakriti');
      expect(data.agni.primaryAgni).toContain('Manda Agni');
      expect(data.prakriti.reviewStatus).toBe('PENDING BAMS REVIEW');
    });

    it('POST /api/kiosk/ayush/save saves AYUSH facts to active case in SQLite', async () => {
      // 1. Start session
      const sessRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const { token } = await sessRes.json();

      // 2. Create case
      const caseId = `case_ayush_${Date.now()}`;
      const dummyCase: ClinicalCase = {
        id: caseId,
        status: 'intake_draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'hi',
        consent: {
          granted: true,
          timestamp: new Date().toISOString(),
          language: 'hi',
          method: 'touch_checkbox',
          version: '1.0',
          scopes: {
            historyCollection: true,
            voiceRecording: false,
            documentProcessing: false,
            cloudAI: false,
            interoperabilityFHIR: true,
          },
        },
        patient: {
          tempId: 'pt_ayush_1',
          name: { field: 'name', value: 'Suresh Patil', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed', confidence: 1.0 } },
          age: { field: 'age', value: 48, provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed', confidence: 1.0 } },
          sex: { field: 'sex', value: 'Male', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed', confidence: 1.0 } },
        },
        intake: {
          chiefComplaint: { field: 'chiefComplaint', value: 'Indigestion and fatigue', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed', confidence: 1.0 } },
          symptomOnset: { field: 'symptomOnset', value: '2 weeks', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed', confidence: 1.0 } },
          questionResponses: {},
          redFlags: [],
        },
        documents: [],
        auditTrail: [],
      };

      await fetch(`${baseUrl}/api/kiosk/case`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dummyCase),
      });

      // 3. Save AYUSH assessment
      const saveRes = await fetch(`${baseUrl}/api/kiosk/ayush/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: {
            ayush_prakriti_frame: 'frame_pitta',
            ayush_prakriti_skin_hair: 'skin_pitta',
            ayush_prakriti_weather: 'weather_pitta',
            ayush_prakriti_temperament: 'temp_pitta',
            ayush_agni_appetite: 'agni_app_tikshna',
            ayush_agni_post_meal: 'agni_post_tikshna',
          },
        }),
      });

      expect(saveRes.status).toBe(200);
      const saveData = await saveRes.json();
      expect(saveData.success).toBe(true);
      expect(saveData.reviewStatus).toBe('PENDING BAMS REVIEW');
      expect(saveData.summary.dominantDosha).toContain('Pitta Dominant Prakriti');
      expect(saveData.summary.primaryAgni).toContain('Tikshna Agni');

      // 4. Verify case retrieval reflects saved AYUSH assessment
      const getRes = await fetch(`${baseUrl}/api/kiosk/case`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const retrieved = await getRes.json();
      const activeCase = retrieved.case;
      expect(activeCase.intake.ayushAssessment).toBeDefined();
      expect(activeCase.intake.ayushAssessment.prakriti.value).toContain('Pitta Dominant Prakriti');
      expect(activeCase.intake.ayushAssessment.agni.value).toContain('Tikshna Agni');
    });
  });
});
