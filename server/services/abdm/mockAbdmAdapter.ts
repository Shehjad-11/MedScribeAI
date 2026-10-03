/**
 * MedScribeAI — Mock ABDM (Ayushman Bharat Digital Mission) Adapter
 *
 * STATUS: MOCK ONLY (DEMO / DEVELOPMENT MODE)
 * DISCLAIMER: MOCK ABDM ADAPTER — SYNTHETIC DATA ONLY (NO REAL ABDM/NHA GATEWAY CONNECTION)
 * Zero real patient identifiers. Zero external NHA API calls.
 */

import { FHIRBundle } from '../../../src/utils/fhirConverter';

export const ABDM_MOCK_DISCLAIMER =
  'MOCK ABDM ADAPTER — SYNTHETIC DATA ONLY (NO REAL ABDM/NHA GATEWAY CONNECTION)';

export interface AbdmCareContext {
  patientReference: string;
  careContextReference: string;
  display: string;
}

export interface AbdmLinkResult {
  isMock: true;
  disclaimer: typeof ABDM_MOCK_DISCLAIMER;
  success: boolean;
  transactionId: string;
  careContext: AbdmCareContext;
  linkedAt: string;
}

export interface AbdmPushResult {
  isMock: true;
  disclaimer: typeof ABDM_MOCK_DISCLAIMER;
  success: boolean;
  transactionId: string;
  bundleId: string;
  resourceCount: number;
  hipId: string;
  pushedAt: string;
  status: 'DELIVERED_TO_MOCK_GATEWAY';
}

export class MockAbdmAdapter {
  private readonly defaultHipId = 'IN2710001234'; // Synthetic Health Information Provider ID

  /**
   * Simulates linking a care context to an ABHA ID under ABDM M1/M2 milestone
   */
  async linkCareContext(
    abhaId: string,
    patientName: string,
    caseId: string
  ): Promise<AbdmLinkResult> {
    const timestamp = new Date().toISOString();
    const transactionId = `txn_abdm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const careContextRef = `CC_${caseId.replace(/[^a-zA-Z0-9_]/g, '')}`;

    return {
      isMock: true,
      disclaimer: ABDM_MOCK_DISCLAIMER,
      success: true,
      transactionId,
      careContext: {
        patientReference: abhaId,
        careContextReference: careContextRef,
        display: `MedScribe Primary Care Consultation (${patientName})`,
      },
      linkedAt: timestamp,
    };
  }

  /**
   * Simulates health record data push to ABDM Health Information Exchange (M3 milestone)
   */
  async pushHealthData(
    caseId: string,
    careContext: AbdmCareContext,
    fhirBundle: FHIRBundle
  ): Promise<AbdmPushResult> {
    if (!fhirBundle || fhirBundle.resourceType !== 'Bundle') {
      throw new Error('Invalid FHIR Bundle: missing or malformed bundle payload');
    }

    const timestamp = new Date().toISOString();
    const transactionId = `push_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      isMock: true,
      disclaimer: ABDM_MOCK_DISCLAIMER,
      success: true,
      transactionId,
      bundleId: fhirBundle.id,
      resourceCount: fhirBundle.entry?.length || 0,
      hipId: this.defaultHipId,
      pushedAt: timestamp,
      status: 'DELIVERED_TO_MOCK_GATEWAY',
    };
  }
}

export const mockAbdmAdapter = new MockAbdmAdapter();
