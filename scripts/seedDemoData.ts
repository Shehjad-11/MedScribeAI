import path from 'node:path';
import Database from 'better-sqlite3';
import { getDatabase, saveClinicalCase, recordAuditEvent, saveDocumentRecord } from '../server/db/database';
import { ClinicalCase, createClinicalFact, PatientConsent } from '../src/types/clinicalCase';
import { encryptPayload } from '../server/security/encryption';

/**
 * Synthetic Demo Dataset Seeder
 * Spec: MASTER_PROMPT Phase 13
 * Populates SQLite with 5 realistic synthetic clinical cases spanning Emergency, Urgent, and Normal triage.
 * Strictly 100% synthetic data. No real PHI.
 */

export function seedDemoData(customDb?: Database.Database): void {
  const db = customDb || getDatabase();
  console.log('[Seeder] Starting synthetic demo dataset seeding...');

  const now = new Date();
  const timeOffset = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60 * 1000).toISOString();

  const standardConsent: PatientConsent = {
    granted: true,
    method: 'touch_checkbox',
    scopes: {
      historyCollection: true,
      voiceRecording: true,
      documentProcessing: true,
      cloudAI: true,
      interoperabilityFHIR: true,
    },
    language: 'mr',
    timestamp: timeOffset(24),
    version: '1.0',
  };

  // =========================================================================
  // CASE 1: STAT / EMERGENCY (Priority 1) — Acute Coronary Syndrome
  // =========================================================================
  const case1: ClinicalCase = {
    id: 'case_demo_001_chest_pain',
    status: 'patient_confirmed',
    language: 'mr',
    createdAt: timeOffset(25),
    updatedAt: timeOffset(15),
    consent: standardConsent,
    documents: [],
    auditTrail: [
      { timestamp: timeOffset(25), action: 'INTAKE_STARTED', actor: 'patient', details: 'Started intake at kiosk' },
      { timestamp: timeOffset(15), action: 'CASE_CONFIRMED', actor: 'patient', details: 'Confirmed case' },
    ],
    patient: {
      tempId: 'P_SYNTH_001',
      name: createClinicalFact('name', 'Ramesh Kumar Patil', 'PATIENT_REPORTED', 'touch'),
      age: createClinicalFact('age', 52, 'PATIENT_REPORTED', 'touch'),
      sex: createClinicalFact('sex', 'Male', 'PATIENT_REPORTED', 'touch'),
      phone: createClinicalFact('phone', '9821001122', 'PATIENT_REPORTED', 'touch'),
    },
    intake: {
      chiefComplaint: createClinicalFact('chiefComplaint', 'छातीत खूप दुखणे आणि घाम येणे (Severe crushing chest pain)', 'PATIENT_REPORTED', 'touch'),
      symptomOnset: createClinicalFact('symptomOnset', '2 hours ago', 'PATIENT_REPORTED', 'touch'),
      questionResponses: {
        chest_pain_radiation: createClinicalFact('chest_pain_radiation', 'left_arm, jaw_neck', 'PATIENT_REPORTED', 'touch'),
        diaphoresis: createClinicalFact('diaphoresis', true, 'PATIENT_REPORTED', 'touch'),
        pain_score: createClinicalFact('pain_score', 9, 'PATIENT_REPORTED', 'touch'),
      },
      redFlags: [
        {
          id: 'rf_001_acs',
          ruleId: 'RF-CARD-001',
          ruleVersion: '1.0.0',
          severity: 'EMERGENCY',
          title: 'Acute Coronary Risk / High Priority Chest Symptoms',
          description: 'High-risk chest pain pattern with diaphoresis or radiating pain detected. Requires immediate ECG and clinician evaluation.',
          triggeredAt: timeOffset(20),
          actionRequired: 'Stat 12-lead ECG, vitals monitoring, and immediate emergency clinician triage',
          acknowledgedByClinician: false,
          triggeringFacts: ['chest pain radiation to left arm', 'diaphoresis', 'severe pain 9/10'],
        },
      ],
    },
  };

  // =========================================================================
  // CASE 2: EMERGENCY (Priority 1) — Acute Respiratory Distress
  // =========================================================================
  const case2: ClinicalCase = {
    id: 'case_demo_002_dyspnea',
    status: 'patient_confirmed',
    language: 'hi',
    createdAt: timeOffset(45),
    updatedAt: timeOffset(30),
    consent: { ...standardConsent, language: 'hi' },
    documents: [],
    auditTrail: [{ timestamp: timeOffset(30), action: 'CASE_CONFIRMED', actor: 'patient', details: 'Confirmed case' }],
    patient: {
      tempId: 'P_SYNTH_002',
      name: createClinicalFact('name', 'Sunita Kulkarni', 'PATIENT_REPORTED', 'touch'),
      age: createClinicalFact('age', 68, 'PATIENT_REPORTED', 'touch'),
      sex: createClinicalFact('sex', 'Female', 'PATIENT_REPORTED', 'touch'),
    },
    intake: {
      chiefComplaint: createClinicalFact('chiefComplaint', 'सांस लेने में भारी तकलीफ (Severe Resting Dyspnea)', 'PATIENT_REPORTED', 'touch'),
      symptomOnset: createClinicalFact('symptomOnset', '4 hours ago', 'PATIENT_REPORTED', 'touch'),
      questionResponses: {
        resting_dyspnea: createClinicalFact('resting_dyspnea', true, 'PATIENT_REPORTED', 'touch'),
        stridor_cyanosis: createClinicalFact('stridor_cyanosis', true, 'PATIENT_REPORTED', 'touch'),
      },
      redFlags: [
        {
          id: 'rf_002_resp',
          ruleId: 'RF-RESP-001',
          ruleVersion: '1.0.0',
          severity: 'EMERGENCY',
          title: 'Acute Respiratory Distress / Compromised Airway',
          description: 'Resting dyspnea or signs of cyanosis detected. Emergency oxygenation and physician review required.',
          triggeredAt: timeOffset(40),
          actionRequired: 'Stat pulse oximetry, supplemental oxygen, emergency nebulization evaluation',
          acknowledgedByClinician: false,
          triggeringFacts: ['resting dyspnea', 'stridor/cyanosis noted'],
        },
      ],
    },
  };

  // =========================================================================
  // CASE 3: URGENT (Priority 2) — Prolonged Pyrexia >= 7 Days
  // =========================================================================
  const case3: ClinicalCase = {
    id: 'case_demo_003_fever',
    status: 'patient_confirmed',
    language: 'en',
    createdAt: timeOffset(60),
    updatedAt: timeOffset(50),
    consent: { ...standardConsent, language: 'en' },
    documents: [],
    auditTrail: [{ timestamp: timeOffset(50), action: 'CASE_CONFIRMED', actor: 'patient', details: 'Confirmed case' }],
    patient: {
      tempId: 'P_SYNTH_003',
      name: createClinicalFact('name', 'Suresh Joshi', 'PATIENT_REPORTED', 'touch'),
      age: createClinicalFact('age', 62, 'PATIENT_REPORTED', 'touch'),
      sex: createClinicalFact('sex', 'Male', 'PATIENT_REPORTED', 'touch'),
    },
    intake: {
      chiefComplaint: createClinicalFact('chiefComplaint', 'High grade fever with chills', 'PATIENT_REPORTED', 'touch'),
      symptomOnset: createClinicalFact('symptomOnset', '8 days ago', 'PATIENT_REPORTED', 'touch'),
      questionResponses: {
        fever_duration_days: createClinicalFact('fever_duration_days', 8, 'PATIENT_REPORTED', 'touch'),
        chills_rigors: createClinicalFact('chills_rigors', true, 'PATIENT_REPORTED', 'touch'),
      },
      redFlags: [
        {
          id: 'rf_003_fev',
          ruleId: 'RF-FEV-001',
          ruleVersion: '1.0.0',
          severity: 'URGENT',
          title: 'Prolonged Pyrexia of Unknown Origin (>= 7 Days)',
          description: 'Fever persisting for 7 or more days. Requires investigation for systemic infection.',
          triggeredAt: timeOffset(55),
          actionRequired: 'Complete blood count, peripheral smear for malaria, dengue serology, urinalysis',
          acknowledgedByClinician: false,
          triggeringFacts: ['fever duration 8 days'],
        },
      ],
    },
  };

  // =========================================================================
  // CASE 4: URGENT (Priority 2) — Productive Cough with Hemoptysis
  // =========================================================================
  const case4: ClinicalCase = {
    id: 'case_demo_004_hemoptysis',
    status: 'patient_confirmed',
    language: 'en',
    createdAt: timeOffset(90),
    updatedAt: timeOffset(75),
    consent: { ...standardConsent, language: 'en' },
    documents: [],
    auditTrail: [{ timestamp: timeOffset(75), action: 'CASE_CONFIRMED', actor: 'patient', details: 'Confirmed case' }],
    patient: {
      tempId: 'P_SYNTH_004',
      name: createClinicalFact('name', 'Meera Deshmukh', 'PATIENT_REPORTED', 'touch'),
      age: createClinicalFact('age', 34, 'PATIENT_REPORTED', 'touch'),
      sex: createClinicalFact('sex', 'Female', 'PATIENT_REPORTED', 'touch'),
    },
    intake: {
      chiefComplaint: createClinicalFact('chiefComplaint', 'Chronic cough with blood in sputum', 'PATIENT_REPORTED', 'touch'),
      symptomOnset: createClinicalFact('symptomOnset', '3 weeks ago', 'PATIENT_REPORTED', 'touch'),
      questionResponses: {
        cough_duration_days: createClinicalFact('cough_duration_days', 21, 'PATIENT_REPORTED', 'touch'),
        has_hemoptysis: createClinicalFact('has_hemoptysis', true, 'PATIENT_REPORTED', 'touch'),
      },
      redFlags: [
        {
          id: 'rf_004_hemoptysis',
          ruleId: 'RF-RESP-002',
          ruleVersion: '1.0.0',
          severity: 'URGENT',
          title: 'Hemoptysis in Productive Cough',
          description: 'Blood in sputum reported. Requires urgent chest radiograph and evaluation.',
          triggeredAt: timeOffset(80),
          actionRequired: 'Urgent chest X-ray PA view, sputum AFB / GeneXpert analysis',
          acknowledgedByClinician: false,
          triggeringFacts: ['hemoptysis reported', 'cough duration 21 days'],
        },
      ],
    },
  };

  // =========================================================================
  // CASE 5: NORMAL (Priority 4) — Routine Follow-Up with AYUSH Prakriti/Agni
  // =========================================================================
  const case5: ClinicalCase = {
    id: 'case_demo_005_routine_ayush',
    status: 'patient_confirmed',
    language: 'mr',
    createdAt: timeOffset(120),
    updatedAt: timeOffset(105),
    consent: { ...standardConsent, language: 'mr' },
    documents: [],
    auditTrail: [{ timestamp: timeOffset(105), action: 'CASE_CONFIRMED', actor: 'patient', details: 'Confirmed case' }],
    patient: {
      tempId: 'P_SYNTH_005',
      name: createClinicalFact('name', 'Anand Kapse', 'PATIENT_REPORTED', 'touch'),
      age: createClinicalFact('age', 42, 'PATIENT_REPORTED', 'touch'),
      sex: createClinicalFact('sex', 'Male', 'PATIENT_REPORTED', 'touch'),
    },
    intake: {
      chiefComplaint: createClinicalFact('chiefComplaint', 'नियमित तपासणी आणि पचनाच्या तक्रारी (Routine checkup & dyspepsia)', 'PATIENT_REPORTED', 'touch'),
      symptomOnset: createClinicalFact('symptomOnset', '1 month', 'PATIENT_REPORTED', 'touch'),
      questionResponses: {},
      redFlags: [],
      ayushAssessment: {
        prakriti: createClinicalFact('prakriti', 'Pitta-Kapha Dvandvaja [PENDING BAMS REVIEW]', 'PATIENT_REPORTED', 'touch'),
        agni: createClinicalFact('agni', 'Tikshna Agni [PENDING BAMS REVIEW]', 'PATIENT_REPORTED', 'touch'),
      },
    },
  };

  // Save all 5 cases
  const allCases = [case1, case2, case3, case4, case5];
  for (const c of allCases) {
    saveClinicalCase(db, c);
    recordAuditEvent(db, {
      caseId: c.id,
      actorType: 'system',
      actorId: 'demo_seeder',
      action: 'DEMO_CASE_SEEDED',
      details: { caseId: c.id, patientName: c.patient.name.value, language: c.language },
    });
  }

  // Seed encrypted document for Case 1
  const encryptedPrescription = encryptPayload({
    patient: 'Ramesh Kumar Patil',
    prescriptions: [
      { medication: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: '30 days' },
      { medication: 'Atorvastatin', dosage: '20mg', frequency: 'HS', duration: '30 days' },
    ],
  });

  saveDocumentRecord(db, {
    id: 'doc_demo_amlodipine',
    caseId: case1.id,
    documentType: 'prescription',
    fileName: 'prescription_amlodipine_patil.png',
    ocrRawText: 'Tab. Amlodipine 5mg 1-0-0 x 30 days\nTab. Atorvastatin 20mg 0-0-1 x 30 days',
    extractedData: encryptedPrescription,
  });

  console.log(`[Seeder] Successfully seeded ${allCases.length} synthetic demonstration cases into SQLite!`);
}

// CLI runner
if (process.argv[1]?.includes('seedDemoData')) {
  seedDemoData();
  process.exit(0);
}
