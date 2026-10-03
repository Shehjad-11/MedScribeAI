/**
 * MedScribeAI — Unified ClinicalCase Domain Types & Provenance Model
 * Specification: docs/MASTER_PROMPT.md (Sections 5, 16) & docs/audit/PHASE_1_PROPOSAL.md
 * Tier: 1 (MUST / SIH Demo-Critical)
 */

export type CaseStatus =
  | 'intake_draft'
  | 'patient_confirmed'
  | 'doctor_reviewing'
  | 'clinician_approved'
  | 'fhir_exported';

export type ProvenanceSource =
  | 'PATIENT_REPORTED'
  | 'CLINICIAN_OBSERVED'
  | 'DOCUMENT_EXTRACTED'
  | 'AI_GENERATED'
  | 'CLINICIAN_VERIFIED';

export type ProvenanceMethod =
  | 'touch'
  | 'voice_asr'
  | 'ocr'
  | 'doctor_entry'
  | 'rule_engine'
  | 'llm_extraction'
  | 'manual_entry';

export type VerificationState =
  | 'unverified'
  | 'patient_confirmed'
  | 'clinician_verified'
  | 'rejected';

export interface ProvenanceRecord {
  source: ProvenanceSource;
  confidence?: number; // 0.0 to 1.0 (defaults to 1.0 for patient_reported/clinician_observed)
  timestamp: string; // ISO 8601 string
  method: ProvenanceMethod;
  verificationState: VerificationState;
  rawFragment?: string; // verbatim patient quote, OCR bounding box/text, or raw ASR
  verifiedBy?: string; // clinician or patient identifier
}

export interface ClinicalFact<T = string> {
  id?: string;
  caseId?: string;
  category?: 'demographics' | 'complaint' | 'hpi' | 'medication' | 'allergy' | 'history' | 'ayush' | 'other';
  field: string;
  value: T;
  provenance: ProvenanceRecord;
}

export interface PatientConsent {
  granted: boolean;
  timestamp: string;
  language: 'en' | 'hi' | 'mr';
  method: 'touch_checkbox' | 'verbal_recorded';
  version: string;
  scopes: {
    historyCollection: boolean;
    voiceRecording: boolean;
    documentProcessing: boolean;
    cloudAI: boolean;
    interoperabilityFHIR: boolean;
  };
}

export interface RedFlagAlert {
  id: string;
  ruleId: string;
  severity: 'EMERGENCY' | 'URGENT' | 'WARNING';
  title: string;
  description: string;
  triggeredAt: string;
  actionRequired: string;
  acknowledgedByClinician: boolean;
  triggeringFacts?: string[];
}

export interface ExtractedPrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  provenance: ProvenanceRecord;
}

export interface CaseDocument {
  id: string;
  documentType: 'prescription' | 'lab_report';
  fileName: string;
  mimeType?: string;
  ocrRawText?: string;
  extractedPrescriptions?: ExtractedPrescriptionItem[];
  timelineDate?: string;
  uploadedAt: string;
}

export interface AyushAssessment {
  prakriti?: ClinicalFact<string>;
  agni?: ClinicalFact<string>;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ClinicalCase {
  id: string; // Case identifier: case_<timestamp>_<rand>
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  language: 'en' | 'hi' | 'mr';
  consent: PatientConsent;
  patient: {
    tempId: string;
    name: ClinicalFact<string>;
    age: ClinicalFact<number | string>;
    sex: ClinicalFact<'Male' | 'Female' | 'Other'>;
    phone?: ClinicalFact<string>;
  };
  intake: {
    chiefComplaint: ClinicalFact<string>;
    symptomOnset: ClinicalFact<string>;
    questionResponses: Record<string, ClinicalFact<string | boolean | number>>;
    redFlags: RedFlagAlert[];
    pastMedicalHistory?: ClinicalFact<string>;
    currentMedications?: ClinicalFact<string[]>;
    allergies?: ClinicalFact<string[]>;
    ayushAssessment?: AyushAssessment;
  };
  documents: CaseDocument[];
  consultation?: {
    transcript?: string;
    clinicianNotes?: string;
    approvedAt?: string;
    approvedBy?: string;
  };
  auditTrail: Array<{
    timestamp: string;
    action: string;
    actor: 'patient' | 'kiosk' | 'clinician' | 'system';
    actorId?: string;
    details: string;
  }>;
}

/**
 * Creates a standard ClinicalFact with default provenance
 */
export function createClinicalFact<T>(
  field: string,
  value: T,
  source: ProvenanceSource,
  method: ProvenanceMethod,
  options?: Partial<ProvenanceRecord> & { category?: ClinicalFact['category'] }
): ClinicalFact<T> {
  return {
    field,
    value,
    category: options?.category,
    provenance: {
      source,
      method,
      confidence: options?.confidence ?? (source === 'AI_GENERATED' ? 0.85 : 1.0),
      timestamp: options?.timestamp ?? new Date().toISOString(),
      verificationState: options?.verificationState ?? (source === 'CLINICIAN_VERIFIED' ? 'clinician_verified' : 'unverified'),
      rawFragment: options?.rawFragment,
      verifiedBy: options?.verifiedBy,
    },
  };
}
