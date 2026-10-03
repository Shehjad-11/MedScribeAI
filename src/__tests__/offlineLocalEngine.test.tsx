import { describe, it, expect } from 'vitest';
import { generateOfflineSOAPNote } from '../utils/offlineLocalEngine';
import { PatientInfo } from '../types';

describe('Offline Local Model NLP Engine', () => {
  const samplePatient: PatientInfo = {
    name: 'Kashish Patel',
    age: 42,
    gender: 'Female',
    encounterType: 'Acute Consultation',
    clinicLocation: 'Community Health Post',
    medicalHistory: 'No chronic illness',
    currentMedications: 'Paracetamol 500mg',
    knownAllergies: 'NKDA',
  };

  it('generates structured SOAP note for malaria case offline', () => {
    const transcript = 'Patient presents with high fever 39.1C, chills, rigors, and positive malaria RDT.';
    const note = generateOfflineSOAPNote(samplePatient, transcript);

    expect(note.subjective.chief_complaint).toContain('fever');
    expect(note.assessment.primary_diagnosis).toBe('Uncomplicated Plasmodium falciparum Malaria');
    expect(note.billing_suggestions.icd_10_codes[0].code).toBe('B50.9');
    expect(note.plan.prescriptions.length).toBeGreaterThan(0);
    expect(note.plan.prescriptions[0].medication).toContain('Artemether-Lumefantrine');
    expect(note.documentation_confidence?.overall_score).toBeGreaterThan(0);
  });

  it('generates structured SOAP note for hypertension case offline', () => {
    const transcript = 'Blood pressure screening today shows BP 152/94 mmHg, patient complains of mild morning headache.';
    const note = generateOfflineSOAPNote(samplePatient, transcript);

    expect(note.assessment.primary_diagnosis).toBe('Essential Primary Hypertension (Stage 2)');
    expect(note.billing_suggestions.icd_10_codes[0].code).toBe('I10');
    expect(note.plan.prescriptions.some((p) => p.medication === 'Lisinopril')).toBe(true);
  });

  it('generates structured SOAP note for otitis media case offline', () => {
    const transcript = 'Right ear pain, crying, fever. Otoscopy shows bulging erythematous right tympanic membrane.';
    const note = generateOfflineSOAPNote(samplePatient, transcript);

    expect(note.assessment.primary_diagnosis).toContain('Otitis Media');
    expect(note.plan.prescriptions.some((p) => p.medication === 'Amoxicillin')).toBe(true);
  });

  it('generates structured SOAP note for gastroenteritis case offline', () => {
    const transcript = 'Watery diarrhea 5 times today, abdominal cramps, vomiting. Mild dehydration.';
    const note = generateOfflineSOAPNote(samplePatient, transcript);

    expect(note.assessment.primary_diagnosis).toContain('Gastroenteritis');
    expect(note.plan.prescriptions.some((p) => p.medication.includes('ORS'))).toBe(true);
  });

  it('includes section documentation confidence and safety alerts in offline mode', () => {
    const transcript = 'Patient with history of hypertension taking Lisinopril presented with severe headache.';
    const note = generateOfflineSOAPNote(samplePatient, transcript);

    expect(note.documentation_confidence).toBeDefined();
    expect(note.documentation_confidence?.subjective.score).toBeGreaterThanOrEqual(60);
    expect(note.meta.uncertainty_flagged).toBe(false);
  });
});
