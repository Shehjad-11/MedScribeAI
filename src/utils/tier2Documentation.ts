/**
 * MedScribeAI — Tier 2 Clinical Documentation Engine
 * 1. Unified ClinicalCase documentation completeness & confidence scoring.
 * 2. ICD-10 primary care diagnosis suggestions (CPT billing stays strictly off).
 */

import { ClinicalCase } from '../types/clinicalCase';
import { ICD10Code } from '../types';

export interface SectionConfidence {
  score: number; // 0 to 100
  status: 'COMPLETE' | 'PARTIAL' | 'MINIMAL';
  missingItems: string[];
}

export interface CaseConfidenceReport {
  overallScore: number; // 0 to 100
  rating: 'HIGH' | 'MODERATE' | 'LOW';
  sections: {
    demographics: SectionConfidence;
    intakeComplaint: SectionConfidence;
    clinicalHistory: SectionConfidence;
    documentsAndTriage: SectionConfidence;
  };
  missingInformationSummary: string[];
  assessedAt: string;
}

export interface ICD10SuggestionResult {
  primaryCode: ICD10Code;
  differentialCodes: ICD10Code[];
  clinicalRationale: string;
  cptBilling: {
    enabled: false;
    disclaimer: 'CPT Coding Disabled (Indian Primary Care Context / SIH Spec)';
  };
}

/**
 * Calculates a deterministic documentation completeness and confidence score (0-100)
 * for a unified ClinicalCase across its four clinical domains.
 */
export function calculateCaseConfidence(clinicalCase: ClinicalCase): CaseConfidenceReport {
  const missingSummary: string[] = [];

  // 1. Demographics Section (25% weight)
  const missingDemo: string[] = [];
  let demoPoints = 0;
  if (clinicalCase.patient?.name?.value && clinicalCase.patient.name.value !== 'Anonymous Patient') {
    demoPoints += 10;
  } else {
    missingDemo.push('Patient legal / official name');
  }

  if (clinicalCase.patient?.age?.value) {
    demoPoints += 8;
  } else {
    missingDemo.push('Patient age');
  }

  if (clinicalCase.patient?.sex?.value) {
    demoPoints += 7;
  } else {
    missingDemo.push('Biological sex');
  }

  const demoScore = Math.min(100, Math.round((demoPoints / 25) * 100));

  // 2. Intake & Chief Complaint (25% weight)
  const missingIntake: string[] = [];
  let intakePoints = 0;
  if (clinicalCase.intake?.chiefComplaint?.value) {
    intakePoints += 15;
  } else {
    missingIntake.push('Primary chief complaint');
  }

  if (clinicalCase.intake?.symptomOnset?.value && clinicalCase.intake.symptomOnset.value !== 'Not documented') {
    intakePoints += 10;
  } else {
    missingIntake.push('Symptom onset duration');
  }

  const intakeScore = Math.min(100, Math.round((intakePoints / 25) * 100));

  // 3. Clinical History & Medications (25% weight)
  const missingHistory: string[] = [];
  let historyPoints = 0;
  if (clinicalCase.intake?.pastMedicalHistory?.value) {
    historyPoints += 10;
  } else {
    missingHistory.push('Past medical history / comorbidities');
  }

  if (clinicalCase.intake?.currentMedications?.value?.length) {
    historyPoints += 8;
  } else {
    missingHistory.push('Current medication regimen');
  }

  if (clinicalCase.intake?.allergies?.value?.length) {
    historyPoints += 7;
  } else {
    missingHistory.push('Drug allergies documentation (or confirmed NKDA)');
  }

  const historyScore = Math.min(100, Math.round((historyPoints / 25) * 100));

  // 4. Documents & Triage Evaluation (25% weight)
  const missingTriage: string[] = [];
  let triagePoints = 15; // Base points for completed red flag rule evaluation
  if (clinicalCase.documents?.length) {
    triagePoints += 10;
  } else {
    missingTriage.push('Prior clinical prescriptions / lab reports');
  }

  const triageScore = Math.min(100, Math.round((triagePoints / 25) * 100));

  // Aggregate overall weighted score
  const overallScore = Math.round(
    demoScore * 0.25 + intakeScore * 0.25 + historyScore * 0.25 + triageScore * 0.25
  );

  missingSummary.push(...missingDemo, ...missingIntake, ...missingHistory, ...missingTriage);

  let rating: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
  if (overallScore >= 80) rating = 'HIGH';
  else if (overallScore >= 50) rating = 'MODERATE';

  return {
    overallScore,
    rating,
    sections: {
      demographics: {
        score: demoScore,
        status: demoScore >= 80 ? 'COMPLETE' : demoScore >= 40 ? 'PARTIAL' : 'MINIMAL',
        missingItems: missingDemo,
      },
      intakeComplaint: {
        score: intakeScore,
        status: intakeScore >= 80 ? 'COMPLETE' : intakeScore >= 40 ? 'PARTIAL' : 'MINIMAL',
        missingItems: missingIntake,
      },
      clinicalHistory: {
        score: historyScore,
        status: historyScore >= 80 ? 'COMPLETE' : historyScore >= 40 ? 'PARTIAL' : 'MINIMAL',
        missingItems: missingHistory,
      },
      documentsAndTriage: {
        score: triageScore,
        status: triageScore >= 80 ? 'COMPLETE' : triageScore >= 40 ? 'PARTIAL' : 'MINIMAL',
        missingItems: missingTriage,
      },
    },
    missingInformationSummary: missingSummary,
    assessedAt: new Date().toISOString(),
  };
}

/**
 * Deterministically generates primary care ICD-10 diagnostic code suggestions based on
 * chief complaint, red-flag triage alerts, and medical history.
 * Explicitly keeps CPT billing turned off per Indian Primary Care / SIH requirement.
 */
export function suggestICD10ForCase(clinicalCase: ClinicalCase): ICD10SuggestionResult {
  const complaint = (clinicalCase.intake?.chiefComplaint?.value || '').toLowerCase();
  const redFlags = clinicalCase.intake?.redFlags || [];
  const history = (clinicalCase.intake?.pastMedicalHistory?.value || '').toLowerCase();

  let primaryCode: ICD10Code = {
    code: 'R69',
    description: 'Illness, unspecified',
    confidence: 'Low',
  };

  const differentialCodes: ICD10Code[] = [];
  let rationale = 'Routine primary care clinical evaluation.';

  // Chest Symptoms
  if (complaint.includes('chest') || complaint.includes('angina') || complaint.includes('retrosternal')) {
    if (redFlags.some((rf) => rf.ruleId === 'RF-CARD-001' || rf.severity === 'EMERGENCY')) {
      primaryCode = {
        code: 'I20.0',
        description: 'Unstable angina',
        confidence: 'High',
      };
      differentialCodes.push(
        { code: 'I21.9', description: 'Acute myocardial infarction, unspecified', confidence: 'High' },
        { code: 'R07.9', description: 'Chest pain, unspecified', confidence: 'Medium' },
        { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', confidence: 'Low' }
      );
      rationale = 'Emergency retrosternal chest symptoms with radiation/diaphoresis warrant ACS triage.';
    } else {
      primaryCode = {
        code: 'R07.9',
        description: 'Chest pain, unspecified',
        confidence: 'High',
      };
      differentialCodes.push(
        { code: 'R07.89', description: 'Other chest pain (musculoskeletal)', confidence: 'Medium' },
        { code: 'I20.9', description: 'Angina pectoris, unspecified', confidence: 'Medium' }
      );
      rationale = 'Unspecified chest discomfort without high-risk ischemic radiation.';
    }
  }
  // Febrile Illness
  else if (complaint.includes('fever') || complaint.includes('pyrexia') || complaint.includes('chills')) {
    primaryCode = {
      code: 'R50.9',
      description: 'Fever, unspecified',
      confidence: 'High',
    };
    differentialCodes.push(
      { code: 'A90', description: 'Dengue fever [classical dengue]', confidence: 'Medium' },
      { code: 'B54', description: 'Unspecified malaria', confidence: 'Medium' },
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', confidence: 'Medium' }
    );
    rationale = 'Acute febrile illness requiring differential screening for endemic infections.';
  }
  // Respiratory
  else if (complaint.includes('cough') || complaint.includes('breath') || complaint.includes('dyspnea')) {
    primaryCode = {
      code: 'J06.9',
      description: 'Acute upper respiratory infection, unspecified',
      confidence: 'High',
    };
    differentialCodes.push(
      { code: 'R05.9', description: 'Cough, unspecified', confidence: 'Medium' },
      { code: 'J18.9', description: 'Pneumonia, unspecified organism', confidence: 'Medium' },
      { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', confidence: 'Low' }
    );
    rationale = 'Acute respiratory presentation with cough and dyspnea.';
  }
  // Abdominal
  else if (complaint.includes('abdom') || complaint.includes('stomach') || complaint.includes('vomit') || complaint.includes('diarrhea')) {
    primaryCode = {
      code: 'R10.9',
      description: 'Abdominal pain, unspecified',
      confidence: 'High',
    };
    differentialCodes.push(
      { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified', confidence: 'Medium' },
      { code: 'K29.70', description: 'Gastritis, unspecified, without bleeding', confidence: 'Medium' }
    );
    rationale = 'Acute gastrointestinal presentation.';
  }
  // Headache
  else if (complaint.includes('headache') || complaint.includes('cephalgia')) {
    primaryCode = {
      code: 'R51.9',
      description: 'Headache, unspecified',
      confidence: 'High',
    };
    differentialCodes.push(
      { code: 'G44.209', description: 'Tension-type headache, unspecified, not intractable', confidence: 'Medium' },
      { code: 'G43.909', description: 'Migraine, unspecified, not intractable', confidence: 'Medium' }
    );
    rationale = 'Cephalgia without focal neurological deficit.';
  }

  // Include chronic comorbidities if present in medical history
  if (history.includes('hypertens') && !differentialCodes.some((c) => c.code === 'I10')) {
    differentialCodes.push({ code: 'I10', description: 'Essential (primary) hypertension', confidence: 'High' });
  }
  if (history.includes('diabet') && !differentialCodes.some((c) => c.code === 'E11.9')) {
    differentialCodes.push({ code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', confidence: 'High' });
  }

  return {
    primaryCode,
    differentialCodes,
    clinicalRationale: rationale,
    cptBilling: {
      enabled: false,
      disclaimer: 'CPT Coding Disabled (Indian Primary Care Context / SIH Spec)',
    },
  };
}
