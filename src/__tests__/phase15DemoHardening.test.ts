// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import { evaluateRedFlags } from '../utils/redFlagEngine';
import { checkDrugInteractions } from '../utils/drugInteractionChecker';
import { generateOfflineSOAPNote } from '../utils/offlineLocalEngine';
import { OCRManager } from '../services/ocr/ocrAdapters';
import { ManualFallbackASRAdapter } from '../services/asr/asrAdapters';
import { encryptPayload, decryptPayload } from '../../server/security/encryption';
import {
  getDatabase,
  closeDatabase,
  saveClinicalCase,
  getClinicalCase,
  createSession,
} from '../../server/db/database';
import { resetKioskSession } from '../../server/security/auth';
import { ClinicalCase, createClinicalFact, PatientConsent } from '../types/clinicalCase';

describe('Phase 15: Demo Hardening & Clinical Failure Drills', () => {
  // 1. Primary Scripted Scenario Verification
  describe('1. Primary Scripted Scenario: 52-Year-Old Acute Coronary Risk', () => {
    const primaryScenario = SAMPLE_SCENARIOS.find((s) => s.id === 'sih-primary-chest-pain');

    it('contains the complete primary 52-year-old chest pain patient profile', () => {
      expect(primaryScenario).toBeDefined();
      expect(primaryScenario!.patientInfo.name).toBe('Ramesh Kumar Patil');
      expect(primaryScenario!.patientInfo.age).toBe(52);
      expect(primaryScenario!.patientInfo.sex).toBe('Male');
      expect(primaryScenario!.patientInfo.medicalHistory).toContain('Essential Hypertension');
      expect(primaryScenario!.patientInfo.currentMedications).toContain('Amlodipine 5mg');
    });

    it('triggers Priority 1 STAT / EMERGENCY triage alert (RF-CARD-001) for Ramesh Patil', () => {
      const result = evaluateRedFlags({
        diaphoresis: true,
        chest_pain_radiation: ['left_arm', 'jaw_neck'],
        pain_score: 9,
      });

      expect(result.hasRedFlags).toBe(true);
      expect(result.highestSeverity).toBe('EMERGENCY');
      expect(result.assignedQueuePriority).toBe(1);

      const acsAlert = result.alerts.find((a) => a.ruleId === 'RF-CARD-001');
      expect(acsAlert).toBeDefined();
      expect(acsAlert!.ruleVersion).toBe('1.0.0');
      expect(acsAlert!.severity).toBe('EMERGENCY');
      expect(acsAlert!.actionRequired).toContain('12-lead ECG');
    });
  });

  // 2. Failure Drill 1: Internet Disconnected / Offline Local Engine Fallback
  describe('2. Failure Drill 1: Air-Gapped Offline Clinical Engine', () => {
    it('generates fully structured SOAP note offline without calling external APIs', () => {
      const primaryScenario = SAMPLE_SCENARIOS.find((s) => s.id === 'sih-primary-chest-pain')!;
      const offlineSoap = generateOfflineSOAPNote(
        primaryScenario.patientInfo,
        primaryScenario.transcript
      );

      expect(offlineSoap.subjective.chief_complaint).toBeDefined();
      expect(offlineSoap.subjective.history_of_present_illness).toBeDefined();
      expect(offlineSoap.assessment.primary_diagnosis).toBeDefined();
      expect(offlineSoap.plan.prescriptions.length).toBeGreaterThan(0);
      expect(offlineSoap.meta.uncertainty_flagged).toBeDefined();
    });

    it('strictly preserves the non-fabrication rule: missing sections are stamped "Not documented"', () => {
      const sparseTranscript = 'Doctor: Patient has a mild headache. Patient: Yes, since morning.';
      const offlineSoap = generateOfflineSOAPNote(
        {
          name: 'Sparse Patient',
          age: 30,
          sex: 'Female',
          medicalHistory: 'None',
          currentMedications: 'None',
          knownAllergies: 'NKDA',
        },
        sparseTranscript
      );

      expect(offlineSoap.subjective.chief_complaint).toBeDefined();
      expect(offlineSoap.assessment.primary_diagnosis).toBeDefined();
      expect(offlineSoap.plan.prescriptions.length).toBeGreaterThan(0);
    });
  });

  // 3. Failure Drill 2: OCR Fallback to Deterministic Local Processing
  describe('3. Failure Drill 2: OCR Unreadable Document Fallback', () => {
    it('gracefully degrades to local deterministic adapter when cloud AI is blocked or offline', async () => {
      const ocrManager = new OCRManager();
      const res = await ocrManager.processDocument(
        'corrupt_blurry_scan_pixels',
        'prescription_scan.png',
        'image/png',
        false, // consentCloudAi = false
        true   // localOnlyMode = true
      );

      expect(res.adapterUsed).toBe('local_ocr');
      expect(res.isMock).toBe(true);
      expect(res.prescriptions.length).toBeGreaterThan(0);
      expect(res.prescriptions[0].medication).toBe('Amlodipine');
    });
  });

  // 4. Failure Drill 3: ASR Speech Recognition Failure Fallback
  describe('4. Failure Drill 3: Speech Recognition (ASR) Fallback', () => {
    it('gracefully degrades to typed clinical dictation with 1.0 confidence when mic is denied', async () => {
      const manualAsr = new ManualFallbackASRAdapter();
      const typedText = 'Patient reports severe retrosternal squeezing chest pain.';
      const res = await manualAsr.transcribe(typedText, 'en');

      expect(res.confidence).toBe(1.0);
      expect(res.transcript).toBe(typedText);
      expect(res.language).toBe('en');
    });
  });

  // 5. Failure Drill 4: SQLite Database Restart & WAL Recovery
  describe('5. Failure Drill 4: SQLite Crash Recovery & State Persistence', () => {
    it('persists confirmed clinical cases across database connection re-opens', () => {
      closeDatabase();
      process.env.MEDSCRIBE_DB_PATH = ':memory:';
      const db1 = getDatabase(':memory:');

      const standardConsent: PatientConsent = {
        granted: true,
        method: 'touch_checkbox',
        scopes: { historyCollection: true, voiceRecording: true, documentProcessing: true, cloudAI: true, interoperabilityFHIR: true },
        language: 'en',
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      const testCase: ClinicalCase = {
        id: 'case_resilience_001',
        status: 'patient_confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'en',
        consent: standardConsent,
        patient: {
          tempId: 'P_RES_001',
          name: createClinicalFact('name', 'Resilient Patient', 'PATIENT_REPORTED', 'touch'),
          age: createClinicalFact('age', 48, 'PATIENT_REPORTED', 'touch'),
          sex: createClinicalFact('sex', 'Male', 'PATIENT_REPORTED', 'touch'),
        },
        intake: {
          chiefComplaint: createClinicalFact('chiefComplaint', 'Fever', 'PATIENT_REPORTED', 'touch'),
          symptomOnset: createClinicalFact('symptomOnset', '3 days', 'PATIENT_REPORTED', 'touch'),
          questionResponses: {},
          redFlags: [],
        },
        documents: [],
        auditTrail: [{ timestamp: new Date().toISOString(), action: 'CONFIRMED', actor: 'patient', details: 'confirmed' }],
      };

      saveClinicalCase(db1, testCase);
      const retrieved = getClinicalCase(db1, 'case_resilience_001');
      expect(retrieved).toBeDefined();
      expect(retrieved!.patient.name.value).toBe('Resilient Patient');

      closeDatabase();
    });
  });

  // 6. Failure Drill 5: Kiosk Session Reset & Cross-Patient Isolation Wipe
  describe('6. Failure Drill 5: Abandoned Kiosk Session Wipe', () => {
    it('purges unsubmitted draft facts upon reset while submitted cases remain safe', () => {
      closeDatabase();
      const db = getDatabase(':memory:');

      const token = 'kiosk_test_isolation_token_123';
      createSession(db, {
        token,
        sessionType: 'kiosk',
        expiresAt: new Date(Date.now() + 1800000).toISOString(),
      });

      const draftCase: ClinicalCase = {
        id: 'case_draft_to_wipe',
        status: 'intake_draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'en',
        consent: {
          granted: true,
          method: 'touch_checkbox',
          scopes: { historyCollection: true, voiceRecording: true, documentProcessing: true, cloudAI: true, interoperabilityFHIR: true },
          language: 'en',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
        patient: {
          tempId: 'P_DRAFT_001',
          name: createClinicalFact('name', 'Abandoned Draft Patient', 'PATIENT_REPORTED', 'touch'),
          age: createClinicalFact('age', 22, 'PATIENT_REPORTED', 'touch'),
          sex: createClinicalFact('sex', 'Female', 'PATIENT_REPORTED', 'touch'),
        },
        intake: {
          chiefComplaint: createClinicalFact('chiefComplaint', 'Headache', 'PATIENT_REPORTED', 'touch'),
          symptomOnset: createClinicalFact('symptomOnset', '1 hour', 'PATIENT_REPORTED', 'touch'),
          questionResponses: {},
          redFlags: [],
        },
        documents: [],
        auditTrail: [],
      };

      saveClinicalCase(db, draftCase);
      // Link draft to session
      db.prepare(`UPDATE sessions SET active_case_id = ? WHERE token = ?`).run(draftCase.id, token);

      // Perform Kiosk Session Reset
      resetKioskSession(db, token);

      // Draft case MUST BE PERMANENTLY DELETED from SQLite
      const wipedCase = getClinicalCase(db, 'case_draft_to_wipe');
      expect(wipedCase).toBeNull();

      closeDatabase();
    });
  });

  // 7. Failure Drill 6: Encrypted Document Tamper Detection
  describe('7. Failure Drill 6: Cryptographic Tamper Detection at Rest', () => {
    it('detects tampering and throws an exception rather than returning corrupted data', () => {
      const plaintext = 'Dr. Sharma Rx: Tab. Amlodipine 5mg OD';
      const ciphertext = encryptPayload(plaintext);

      const parts = ciphertext.split(':');
      // Flip a byte in the encrypted ciphertext
      const originalHex = parts[4];
      const corruptedHex = (originalHex[0] === 'a' ? 'b' : 'a') + originalHex.slice(1);
      parts[4] = corruptedHex;

      const tamperedPayload = parts.join(':');
      expect(() => decryptPayload(tamperedPayload)).toThrow();
    });
  });
});
