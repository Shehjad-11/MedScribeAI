export interface PatientInfo {
  id?: string;
  name: string;
  age: number | string;
  sex?: 'Male' | 'Female' | 'Other' | string;
  gender?: string;
  medicalHistory?: string;
  currentMedications?: string;
  knownAllergies?: string;
  encounterType?: string; // e.g. "Routine Follow-up", "Acute Visit", "Antenatal Care"
  clinicLocation?: string;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
  duration?: string;
}

export interface Subjective {
  chief_complaint: string;
  history_of_present_illness: string;
  review_of_systems?: string;
  current_medications: string[];
  allergies: string[];
}

export interface Objective {
  vital_signs: string;
  physical_exam: string;
  labs_and_imaging: string;
}

export interface Assessment {
  primary_diagnosis: string;
  differential_diagnoses: string[];
  clinical_summary: string;
}

export interface Plan {
  prescriptions: Prescription[];
  diagnostic_tests_ordered: string[];
  patient_education: string;
  follow_up: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface CPTCode {
  code: string;
  description: string;
  rationale: string;
}

export interface BillingSuggestions {
  icd_10_codes: ICD10Code[];
  cpt_codes: CPTCode[];
}

export interface SafetyAlert {
  type: 'Drug Interaction' | 'Allergy Alert' | 'Missing Info' | 'Red Flag' | string;
  severity: 'High' | 'Medium' | 'Low';
  message: string;
}

export interface MetaInfo {
  uncertainty_flagged: boolean;
  time_saved_estimate_minutes: number;
}

export interface SectionDocumentationScore {
  score: number; // 0 - 100 percentage score representing transcript support & detail completeness
  reasoning: string;
  missing_information?: string[];
}

export interface DocumentationConfidence {
  overall_score: number;
  subjective: SectionDocumentationScore;
  objective: SectionDocumentationScore;
  assessment: SectionDocumentationScore;
  plan: SectionDocumentationScore;
}

export interface SOAPNote {
  subjective: Subjective;
  objective: Objective;
  assessment: Assessment;
  plan: Plan;
  billing_suggestions?: BillingSuggestions;
  safety_alerts?: SafetyAlert[];
  meta?: MetaInfo;
  documentation_confidence?: DocumentationConfidence;
}

export interface EncounterRecord {
  id: string;
  timestamp: string;
  patientInfo: PatientInfo;
  transcript: string;
  soapNote: SOAPNote;
  status: 'draft' | 'finalized';
  notesEdited?: boolean;
}

export interface SampleScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  patientInfo: PatientInfo;
  transcript: string;
}
