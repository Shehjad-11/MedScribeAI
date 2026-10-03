/**
 * MedScribeAI Client API Service
 * Handles communication with /api/kiosk/* and /api/clinician/* endpoints
 * Supports session token management and error handling
 */

import { ClinicalCase, CaseStatus } from '../types/clinicalCase';

const API_BASE = '';

export interface KioskSessionInfo {
  token: string;
  expiresAt: string;
}

export interface ClinicianSessionInfo {
  token: string;
  displayName: string;
  expiresAt: string;
}

export interface QueueItem {
  id: string;
  status: CaseStatus;
  patientName: string;
  age?: number | string;
  sex?: string;
  chiefComplaint: string;
  language: string;
  hasRedFlags: boolean;
  redFlagsCount: number;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   KIOSK API CLIENT
   ========================================================================= */

export async function startKioskSession(): Promise<KioskSessionInfo> {
  const res = await fetch(`${API_BASE}/api/kiosk/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start kiosk session');
  }
  return res.json();
}

export async function resetKioskSession(kioskToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/kiosk/session/reset`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kioskToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset kiosk session');
  }
}

export async function recordKioskConsent(
  kioskToken: string,
  payload: {
    patientId: string;
    granted: boolean;
    language?: string;
    method?: string;
    version?: string;
    scopes?: Record<string, boolean>;
  }
): Promise<{ success: boolean; consentId: string }> {
  const res = await fetch(`${API_BASE}/api/kiosk/consent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kioskToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record consent');
  }
  return res.json();
}

export async function saveKioskCase(
  kioskToken: string,
  caseData: ClinicalCase
): Promise<{ success: boolean; caseId: string; status: CaseStatus }> {
  const res = await fetch(`${API_BASE}/api/kiosk/case`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kioskToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(caseData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save clinical case');
  }
  return res.json();
}

export async function getKioskCase(kioskToken: string): Promise<ClinicalCase> {
  const res = await fetch(`${API_BASE}/api/kiosk/case`, {
    headers: { Authorization: `Bearer ${kioskToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to retrieve active case');
  }
  const data = await res.json();
  return data.case;
}

export async function confirmKioskCase(
  kioskToken: string
): Promise<{ success: boolean; caseId: string; status: CaseStatus }> {
  const res = await fetch(`${API_BASE}/api/kiosk/case/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kioskToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to confirm case');
  }
  return res.json();
}

/* =========================================================================
   CLINICIAN API CLIENT
   ========================================================================= */

export async function clinicianLogin(
  username: string,
  pass: string
): Promise<ClinicianSessionInfo> {
  const res = await fetch(`${API_BASE}/api/clinician/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: pass }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid credentials');
  }
  return res.json();
}

export async function getClinicianQueue(
  clinicianToken: string,
  statusFilter?: CaseStatus
): Promise<QueueItem[]> {
  const url = statusFilter
    ? `${API_BASE}/api/clinician/queue?status=${statusFilter}`
    : `${API_BASE}/api/clinician/queue`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${clinicianToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load clinician queue');
  }
  const data = await res.json();
  return data.queue;
}

export async function getClinicianCase(
  clinicianToken: string,
  caseId: string
): Promise<ClinicalCase> {
  const res = await fetch(`${API_BASE}/api/clinician/cases/${caseId}`, {
    headers: { Authorization: `Bearer ${clinicianToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load clinical case');
  }
  const data = await res.json();
  return data.case;
}

export async function approveClinicianCase(
  clinicianToken: string,
  caseId: string,
  payload: { approvedBy: string; clinicianNotes?: string }
): Promise<{ success: boolean; caseId: string; status: CaseStatus; approvedAt: string }> {
  const res = await fetch(`${API_BASE}/api/clinician/cases/${caseId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clinicianToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to approve case');
  }
  return res.json();
}

export async function exportClinicianFHIR(
  clinicianToken: string,
  caseId: string
): Promise<{ success: boolean; caseId: string; status: CaseStatus }> {
  const res = await fetch(`${API_BASE}/api/clinician/cases/${caseId}/fhir-export`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clinicianToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record FHIR export');
  }
  return res.json();
}
