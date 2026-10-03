/**
 * OCR Field Extraction Scoring Harness (Precision / Recall / F1)
 * Evaluates extracted prescriptions and lab values against ground truth annotations.
 */

export interface FieldScore {
  field: string;
  expected: string;
  extracted: string;
  match: boolean;
}

export interface DocumentScoreReport {
  id: string;
  documentType: string;
  fieldsEvaluated: number;
  fieldsMatched: number;
  accuracy: number;
  details: FieldScore[];
}

export function scorePrescriptionExtraction(
  expected: Array<{ medication: string; dosage: string }>,
  extracted: Array<{ medication: string; dosage: string }>
): DocumentScoreReport {
  const details: FieldScore[] = [];
  let matches = 0;

  for (const exp of expected) {
    const found = extracted.find(
      (ext) => ext.medication.toLowerCase().includes(exp.medication.toLowerCase())
    );

    const medMatch = !!found;
    details.push({
      field: 'medication',
      expected: exp.medication,
      extracted: found ? found.medication : 'NONE',
      match: medMatch,
    });
    if (medMatch) matches++;

    const doseMatch = !!found && found.dosage.toLowerCase().includes(exp.dosage.toLowerCase());
    details.push({
      field: 'dosage',
      expected: exp.dosage,
      extracted: found ? found.dosage : 'NONE',
      match: doseMatch,
    });
    if (doseMatch) matches++;
  }

  const totalFields = expected.length * 2;
  const accuracy = totalFields > 0 ? matches / totalFields : 1.0;

  return {
    id: 'rx_eval',
    documentType: 'prescription',
    fieldsEvaluated: totalFields,
    fieldsMatched: matches,
    accuracy: Number(accuracy.toFixed(4)),
    details,
  };
}

export function scoreLabExtraction(
  expected: Array<{ testName: string; value: string }>,
  extracted: Array<{ testName: string; value: string }>
): DocumentScoreReport {
  const details: FieldScore[] = [];
  let matches = 0;

  for (const exp of expected) {
    const expTokens = exp.testName.toLowerCase().split(/\s+/);
    const found = extracted.find((ext) => {
      const extLower = ext.testName.toLowerCase();
      return (
        extLower.includes(exp.testName.toLowerCase()) ||
        exp.testName.toLowerCase().includes(extLower) ||
        expTokens.every((token) => extLower.includes(token))
      );
    });

    const testMatch = !!found;
    details.push({
      field: 'testName',
      expected: exp.testName,
      extracted: found ? found.testName : 'NONE',
      match: testMatch,
    });
    if (testMatch) matches++;

    const valMatch = !!found && found.value === exp.value;
    details.push({
      field: 'value',
      expected: exp.value,
      extracted: found ? found.value : 'NONE',
      match: valMatch,
    });
    if (valMatch) matches++;
  }

  const totalFields = expected.length * 2;
  const accuracy = totalFields > 0 ? matches / totalFields : 1.0;

  return {
    id: 'lab_eval',
    documentType: 'lab_report',
    fieldsEvaluated: totalFields,
    fieldsMatched: matches,
    accuracy: Number(accuracy.toFixed(4)),
    details,
  };
}
