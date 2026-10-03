import { PatientInfo, SOAPNote } from '../types';

export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection';
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: FHIRResource;
  }>;
}

/**
 * Converts MedScribe Lite PatientInfo and SOAPNote into a standard HL7 FHIR R4 JSON Bundle.
 */
export function exportToFHIRBundle(patientInfo: PatientInfo, soapNote: SOAPNote): FHIRBundle {
  const safePatient = patientInfo || ({} as PatientInfo);
  const safeNote = soapNote || ({} as SOAPNote);

  const timestamp = new Date().toISOString();
  const bundleId = `bundle-medscribe-${Date.now()}`;
  const patientId = `patient-${Date.now()}`;
  const encounterId = `encounter-${Date.now()}`;

  const entries: Array<{ fullUrl: string; resource: FHIRResource }> = [];

  // 1. FHIR Patient Resource
  const patientResource: FHIRResource = {
    resourceType: 'Patient',
    id: patientId,
    name: [
      {
        use: 'official',
        text: safePatient.name || 'Anonymous Patient',
      },
    ],
    gender: (safePatient.gender || safePatient.sex) === 'Female' ? 'female' : (safePatient.gender || safePatient.sex) === 'Male' ? 'male' : 'other',
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-age',
        valueString: `${safePatient.age || 'Unspecified'} years`,
      },
    ],
  };
  entries.push({
    fullUrl: `urn:uuid:${patientId}`,
    resource: patientResource,
  });

  // 2. FHIR Encounter Resource
  const encounterResource: FHIRResource = {
    resourceType: 'Encounter',
    id: encounterId,
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: safePatient.encounterType === 'Telehealth' ? 'VR' : 'AMB',
      display: safePatient.encounterType || 'Ambulatory',
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: safePatient.name || 'Anonymous Patient',
    },
    period: {
      start: timestamp,
      end: timestamp,
    },
    location: [
      {
        location: {
          display: safePatient.clinicLocation || 'Community Health Clinic',
        },
      },
    ],
  };
  entries.push({
    fullUrl: `urn:uuid:${encounterId}`,
    resource: encounterResource,
  });

  // 3. FHIR Condition Resources (ICD-10 Diagnoses)
  const icdCodes = safeNote.billing_suggestions?.icd_10_codes || [];
  if (icdCodes.length > 0) {
    icdCodes.forEach((icd, idx) => {
      const conditionId = `condition-${idx + 1}-${Date.now()}`;
      const conditionResource: FHIRResource = {
        resourceType: 'Condition',
        id: conditionId,
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active',
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
              code: 'confirmed',
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'encounter-diagnosis',
                display: 'Encounter Diagnosis',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-10',
              code: icd.code,
              display: icd.description,
            },
          ],
          text: icd.description,
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
      };
      entries.push({
        fullUrl: `urn:uuid:${conditionId}`,
        resource: conditionResource,
      });
    });
  } else if (safeNote.assessment?.primary_diagnosis) {
    const conditionId = `condition-primary-${Date.now()}`;
    entries.push({
      fullUrl: `urn:uuid:${conditionId}`,
      resource: {
        resourceType: 'Condition',
        id: conditionId,
        code: {
          text: safeNote.assessment.primary_diagnosis,
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
      },
    });
  }

  // 4. FHIR MedicationRequest Resources (Prescriptions)
  const prescriptions = safeNote.plan?.prescriptions || [];
  prescriptions.forEach((rx, idx) => {
    const medRequestId = `medrequest-${idx + 1}-${Date.now()}`;
    const medRequestResource: FHIRResource = {
      resourceType: 'MedicationRequest',
      id: medRequestId,
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        text: rx.medication,
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      encounter: {
        reference: `Encounter/${encounterId}`,
      },
      dosageInstruction: [
        {
          text: `${rx.dosage} ${rx.frequency} for ${rx.duration}. ${rx.instructions || ''}`.trim(),
          additionalInstruction: [
            {
              text: rx.instructions || '',
            },
          ],
        },
      ],
    };
    entries.push({
      fullUrl: `urn:uuid:${medRequestId}`,
      resource: medRequestResource,
    });
  });

  // 5. FHIR Composition Resource (Structured SOAP Note Document)
  const compositionId = `composition-${Date.now()}`;
  const compositionResource: FHIRResource = {
    resourceType: 'Composition',
    id: compositionId,
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11506-3',
          display: 'Progress Note',
        },
      ],
      text: 'Clinical Progress Note (SOAP)',
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: safePatient.name || 'Anonymous Patient',
    },
    encounter: {
      reference: `Encounter/${encounterId}`,
    },
    date: timestamp,
    title: 'MedScribe Lite Clinical SOAP Note',
    section: [
      {
        title: 'Subjective',
        code: {
          coding: [{ system: 'http://loinc.org', code: '61150-0', display: 'Subjective Note' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Chief Complaint:</strong> ${safeNote.subjective?.chief_complaint || ''}</p><p><strong>HPI:</strong> ${safeNote.subjective?.history_of_present_illness || ''}</p></div>`,
        },
      },
      {
        title: 'Objective',
        code: {
          coding: [{ system: 'http://loinc.org', code: '61149-2', display: 'Objective Note' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Vitals:</strong> ${safeNote.objective?.vital_signs || ''}</p><p><strong>Exam:</strong> ${safeNote.objective?.physical_exam || ''}</p></div>`,
        },
      },
      {
        title: 'Assessment',
        code: {
          coding: [{ system: 'http://loinc.org', code: '51848-0', display: 'Assessment Note' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Diagnosis:</strong> ${safeNote.assessment?.primary_diagnosis || ''}</p><p><strong>Summary:</strong> ${safeNote.assessment?.clinical_summary || ''}</p></div>`,
        },
      },
      {
        title: 'Plan',
        code: {
          coding: [{ system: 'http://loinc.org', code: '18776-5', display: 'Plan Note' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Education:</strong> ${safeNote.plan?.patient_education || ''}</p><p><strong>Follow-up:</strong> ${safeNote.plan?.follow_up || ''}</p></div>`,
        },
      },
    ],
  };
  entries.push({
    fullUrl: `urn:uuid:${compositionId}`,
    resource: compositionResource,
  });

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'collection',
    timestamp,
    entry: entries,
  };
}
