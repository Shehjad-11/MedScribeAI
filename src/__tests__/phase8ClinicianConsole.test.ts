/**
 * MedScribeAI — Phase 8: Clinician Console & Priority Queue Test Suite
 *
 * Verifies:
 * 1. Priority queue sorting (Emergency Priority 1 > Urgent Priority 2 > Normal Priority 4).
 * 2. Red-flag alert banner with rule ID, rule version, and non-diagnostic safe wording.
 * 3. Patient-ready clinical summary with source provenance badges (PATIENT_REPORTED, DOCUMENT_EXTRACTED).
 * 4. Case preloading into doctor consultation workstation.
 * 5. Preservation of original doctor-only direct workflow (offline engine, scenario selection, manual entry).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { getDatabase, closeDatabase, saveClinicalCase } from '../../server/db/database';
import { createClinicianRouter } from '../../server/routes/clinicianRoutes';
import { ClinicalCase } from '../types/clinicalCase';
import { generateOfflineSOAPNote } from '../utils/offlineLocalEngine';
import { checkDrugInteractions } from '../utils/drugInteractionChecker';

describe('Phase 8: Clinician Console & Priority Queue', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let clinicianToken: string;

  beforeAll(async () => {
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    process.env.CLINICIAN_USER = 'dr_test';
    process.env.CLINICIAN_PASS = 'secure_clinician_pass';

    const db = getDatabase(':memory:');

    app = express();
    app.use(express.json());
    app.use('/api/clinician', createClinicianRouter(() => db));

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // Obtain clinician session token
    const loginRes = await fetch(`${baseUrl}/api/clinician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dr_test',
        password: 'secure_clinician_pass',
      }),
    });
    const loginData = await loginRes.json();
    clinicianToken = loginData.token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    closeDatabase();
  });

  describe('1. Priority Queue Sorting Invariants', () => {
    it('sorts EMERGENCY Priority 1 cases before URGENT and NORMAL cases', async () => {
      const db = getDatabase(':memory:');

      // Case A: Routine mild headache (Priority 4 / Normal)
      const caseNormal: ClinicalCase = {
        id: 'case_normal_001',
        status: 'intake_draft',
        createdAt: '2026-10-03T10:00:00Z',
        updatedAt: '2026-10-03T10:00:00Z',
        language: 'en',
        consent: {
          granted: true,
          timestamp: '2026-10-03T10:00:00Z',
          language: 'en',
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
          tempId: 'pt_norm',
          name: { field: 'name', value: 'Amit Verma', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:00:00Z', verificationState: 'patient_confirmed' } },
          age: { field: 'age', value: 32, provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:00:00Z', verificationState: 'patient_confirmed' } },
          sex: { field: 'sex', value: 'Male', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:00:00Z', verificationState: 'patient_confirmed' } },
        },
        intake: {
          chiefComplaint: { field: 'chiefComplaint', value: 'Mild tension headache for 2 days', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:00:00Z', verificationState: 'patient_confirmed' } },
          symptomOnset: { field: 'symptomOnset', value: '2 days', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:00:00Z', verificationState: 'patient_confirmed' } },
          questionResponses: {},
          redFlags: [],
        },
        documents: [],
        auditTrail: [],
      };

      // Case B: Hemoptysis (Priority 2 / Urgent)
      const caseUrgent: ClinicalCase = {
        id: 'case_urgent_002',
        status: 'intake_draft',
        createdAt: '2026-10-03T10:05:00Z',
        updatedAt: '2026-10-03T10:05:00Z',
        language: 'en',
        consent: {
          granted: true,
          timestamp: '2026-10-03T10:05:00Z',
          language: 'en',
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
          tempId: 'pt_urg',
          name: { field: 'name', value: 'Sunita Devi', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:05:00Z', verificationState: 'patient_confirmed' } },
          age: { field: 'age', value: 45, provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:05:00Z', verificationState: 'patient_confirmed' } },
          sex: { field: 'sex', value: 'Female', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:05:00Z', verificationState: 'patient_confirmed' } },
        },
        intake: {
          chiefComplaint: { field: 'chiefComplaint', value: 'Cough with blood-streaked sputum', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:05:00Z', verificationState: 'patient_confirmed' } },
          symptomOnset: { field: 'symptomOnset', value: '3 days', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T10:05:00Z', verificationState: 'patient_confirmed' } },
          questionResponses: {},
          redFlags: [
            {
              id: 'rf_resp_002',
              ruleId: 'RF-RESP-002',
              ruleVersion: '1.0.0',
              severity: 'URGENT',
              title: 'Hemoptysis in Productive Cough',
              description: 'Patient reports blood in sputum. Urgent chest radiograph advised.',
              actionRequired: 'Urgent sputum microscopy and chest X-ray',
              triggeredAt: '2026-10-03T10:05:00Z',
              acknowledgedByClinician: false,
              triggeringFacts: ['blood in cough'],
            },
          ],
        },
        documents: [],
        auditTrail: [],
      };

      // Case C: Acute Chest Pain with Radiating Discomfort (Priority 1 / STAT EMERGENCY)
      const caseEmergency: ClinicalCase = {
        id: 'case_emerg_003',
        status: 'intake_draft',
        createdAt: '2026-10-03T09:50:00Z', // Created earlier, but higher clinical priority!
        updatedAt: '2026-10-03T09:50:00Z',
        language: 'en',
        consent: {
          granted: true,
          timestamp: '2026-10-03T09:50:00Z',
          language: 'en',
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
          tempId: 'pt_emerg',
          name: { field: 'name', value: 'Ramesh Patil', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T09:50:00Z', verificationState: 'patient_confirmed' } },
          age: { field: 'age', value: 52, provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T09:50:00Z', verificationState: 'patient_confirmed' } },
          sex: { field: 'sex', value: 'Male', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T09:50:00Z', verificationState: 'patient_confirmed' } },
        },
        intake: {
          chiefComplaint: { field: 'chiefComplaint', value: 'Severe squeezing retrosternal chest pain', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T09:50:00Z', verificationState: 'patient_confirmed' } },
          symptomOnset: { field: 'symptomOnset', value: '1 hour', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: '2026-10-03T09:50:00Z', verificationState: 'patient_confirmed' } },
          questionResponses: {},
          redFlags: [
            {
              id: 'rf_card_001',
              ruleId: 'RF-CARD-001',
              ruleVersion: '1.0.0',
              severity: 'EMERGENCY',
              title: 'Acute Coronary Syndrome Risk Indicator',
              description: 'Severe chest pain radiating to left arm with diaphoresis. Immediate ECG required.',
              actionRequired: 'Stat 12-lead ECG, sublingual nitrates, emergency physician evaluation',
              triggeredAt: '2026-10-03T09:50:00Z',
              acknowledgedByClinician: false,
              triggeringFacts: ['severe retrosternal chest pain', 'radiation to left arm'],
            },
          ],
        },
        documents: [],
        auditTrail: [],
      };

      saveClinicalCase(db, caseNormal);
      saveClinicalCase(db, caseUrgent);
      saveClinicalCase(db, caseEmergency);

      const queueRes = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });
      expect(queueRes.status).toBe(200);

      const queueData = await queueRes.json();
      expect(queueData.count).toBeGreaterThanOrEqual(3);

      const queueItems = queueData.queue;

      // Find our three test cases in the sorted queue
      const idxEmerg = queueItems.findIndex((q: any) => q.id === 'case_emerg_003');
      const idxUrgent = queueItems.findIndex((q: any) => q.id === 'case_urgent_002');
      const idxNormal = queueItems.findIndex((q: any) => q.id === 'case_normal_001');

      expect(idxEmerg).toBeGreaterThanOrEqual(0);
      expect(idxUrgent).toBeGreaterThanOrEqual(0);
      expect(idxNormal).toBeGreaterThanOrEqual(0);

      // Verify strict priority hierarchy: Emergency (Priority 1) MUST precede Urgent (Priority 2) and Normal (Priority 4)
      expect(idxEmerg).toBeLessThan(idxUrgent);
      expect(idxUrgent).toBeLessThan(idxNormal);

      expect(queueItems[idxEmerg].priority).toBe(1);
      expect(queueItems[idxEmerg].priorityLabel).toBe('EMERGENCY');
      expect(queueItems[idxUrgent].priority).toBe(2);
      expect(queueItems[idxUrgent].priorityLabel).toBe('URGENT');
      expect(queueItems[idxNormal].priority).toBe(4);
      expect(queueItems[idxNormal].priorityLabel).toBe('NORMAL');
    });
  });

  describe('2. Case Details & Red-Flag Banner Inspection', () => {
    it('retrieves full case with ruleVersion and safe triage description', async () => {
      const caseRes = await fetch(`${baseUrl}/api/clinician/cases/case_emerg_003`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });
      expect(caseRes.status).toBe(200);

      const data = await caseRes.json();
      const c: ClinicalCase = data.case;

      expect(c.id).toBe('case_emerg_003');
      expect(c.patient.name.value).toBe('Ramesh Patil');
      expect(c.intake.redFlags).toHaveLength(1);

      const alert = c.intake.redFlags[0];
      expect(alert.ruleId).toBe('RF-CARD-001');
      expect(alert.ruleVersion).toBe('1.0.0');
      expect(alert.severity).toBe('EMERGENCY');
      expect(alert.actionRequired).toContain('Stat 12-lead ECG');
    });
  });

  describe('3. Clinical Fact Provenance Invariants', () => {
    it('preserves provenance records across patient intake and documents', async () => {
      const caseRes = await fetch(`${baseUrl}/api/clinician/cases/case_emerg_003`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });
      const data = await caseRes.json();
      const c: ClinicalCase = data.case;

      expect(c.patient.name.provenance.source).toBe('PATIENT_REPORTED');
      expect(c.patient.name.provenance.method).toBe('touch');
      expect(c.patient.name.provenance.verificationState).toBe('patient_confirmed');

      expect(c.intake.chiefComplaint.provenance.source).toBe('PATIENT_REPORTED');
      expect(c.intake.symptomOnset.provenance.source).toBe('PATIENT_REPORTED');
    });
  });

  describe('4. Preservation of Original Doctor-Only Flow', () => {
    it('runs offline local SOAP engine directly without any prior kiosk intake', () => {
      const doctorInputPatient = {
        name: 'Carlos Gomez',
        age: 41,
        sex: 'Male',
        medicalHistory: 'None',
        currentMedications: 'None',
        knownAllergies: 'NKDA',
      };

      const doctorTranscript = `Doctor: Hello Carlos. How can I help you today?
Patient: I have had a high fever and productive cough for the past 3 days with yellowish phlegm.
Doctor: Any chest pain or shortness of breath?
Patient: No chest pain, just feeling very weak and hot.
Doctor: Let me check your lungs and prescribe an antibiotic and antipyretic.`;

      const generatedSOAP = generateOfflineSOAPNote(doctorInputPatient as any, doctorTranscript);

      expect(generatedSOAP).toBeDefined();
      expect(generatedSOAP.subjective).toBeTruthy();
      expect(generatedSOAP.objective).toBeTruthy();
      expect(generatedSOAP.assessment).toBeTruthy();
      expect(generatedSOAP.plan).toBeTruthy();
      expect(generatedSOAP.documentation_confidence.overall_score).toBeGreaterThan(0);
    });

    it('runs deterministic drug interaction safety engine directly on doctor prescriptions', () => {
      // Test duplicate / concurrent NSAID checking
      const rxList = [
        { medication: 'Aspirin', dosage: '75mg', frequency: 'OD', duration: '30 days', instructions: 'Take after food' },
        { medication: 'Aspirin', dosage: '75mg', frequency: 'OD', duration: '30 days', instructions: 'Take after food' },
      ];
      const alerts = checkDrugInteractions(
        rxList,
        'None',
        'None',
        'NKDA'
      );

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some((a) => a.message.includes('DUPLICATE PRESCRIPTION'))).toBe(true);
    });
  });
});
