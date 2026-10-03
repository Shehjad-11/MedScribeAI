/**
 * Deterministic Versioned Red-Flag Ruleset for 10 Primary Care Complaints
 * Tier 1 SIH Spec — Clinical Triage & Queue Prioritization
 * All rules marked PENDING CLINICIAN REVIEW in docs/CLINICAL_SPEC.md
 */

export type RedFlagSeverity = 'EMERGENCY' | 'URGENT' | 'WARNING';

export interface RedFlagRule {
  id: string; // e.g. RF-CARD-001
  ruleVersion: string; // e.g. 1.0.0 (required on every alert)
  complaintCode: string;
  title: string;
  severity: RedFlagSeverity;
  queuePriority: number; // 1 (Immediate / STAT), 2 (Urgent < 15 min), 3 (Priority < 30 min)
  safeWording: string; // Non-diagnostic clinical safety phrasing
  actionRequired: string;
  evaluate: (facts: Record<string, any>) => { triggered: boolean; triggeringFacts: string[] };
}

export const RED_FLAG_RULES: RedFlagRule[] = [
  // 1. CHEST PAIN — Suspected Acute Coronary Syndrome (RF-CARD-001)
  {
    id: 'RF-CARD-001',
    ruleVersion: '1.0.0',
    complaintCode: 'CHEST_PAIN',
    title: 'Acute Coronary Risk / High Priority Chest Symptoms',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'High-risk chest pain pattern with diaphoresis or radiating pain detected. Requires immediate ECG and clinician evaluation. Not a diagnostic confirmation.',
    actionRequired: 'Stat 12-lead ECG, vitals monitoring, and immediate emergency clinician triage',
    evaluate: (facts) => {
      const hasDiaphoresis = facts.diaphoresis === true;
      const radiation = Array.isArray(facts.chest_pain_radiation)
        ? facts.chest_pain_radiation
        : [facts.chest_pain_radiation];
      const hasCoronaryRadiation = radiation.some((r: string) =>
        ['left_arm', 'jaw_neck', 'arm'].includes(String(r || '').toLowerCase())
      );
      const isSevere = Number(facts.pain_score) >= 7;

      const triggered = hasDiaphoresis || (hasCoronaryRadiation && isSevere);
      const triggeringFacts: string[] = [];
      if (hasDiaphoresis) triggeringFacts.push('Profuse diaphoresis/sweating with chest discomfort');
      if (hasCoronaryRadiation) triggeringFacts.push('Radiation to left arm, shoulder, or jaw');
      if (isSevere) triggeringFacts.push(`Severe pain score: ${facts.pain_score}/10`);

      return { triggered, triggeringFacts };
    },
  },

  // 2. RESPIRATORY — Critical Airway / Hypoxia (RF-RESP-001)
  {
    id: 'RF-RESP-001',
    ruleVersion: '1.0.0',
    complaintCode: 'BREATHLESSNESS',
    title: 'Severe Respiratory Distress / Airway Compromise',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'Signs of acute respiratory distress or cyanosis detected. Requires immediate airway, breathing, and SpO2 evaluation.',
    actionRequired: 'Immediate pulse oximetry, supplemental oxygen if SpO2 < 92%, and emergency triage',
    evaluate: (facts) => {
      const atRest = facts.shortness_of_breath_at_rest === true;
      const cyanosisStridor = facts.cyanosis_stridor === true;
      const triggered = atRest || cyanosisStridor;

      const triggeringFacts: string[] = [];
      if (atRest) triggeringFacts.push('Dyspnea at rest');
      if (cyanosisStridor) triggeringFacts.push('Cyanosis or stridor observed');

      return { triggered, triggeringFacts };
    },
  },

  // 3. RESPIRATORY — Hemoptysis Warning (RF-RESP-002)
  {
    id: 'RF-RESP-002',
    ruleVersion: '1.0.0',
    complaintCode: 'COUGH',
    title: 'Frank Hemoptysis in Productive Cough',
    severity: 'URGENT',
    queuePriority: 2,
    safeWording: 'Blood observed in sputum/cough. Requires urgent physician assessment, chest auscultation, and sputum evaluation.',
    actionRequired: 'Urgent chest X-ray and sputum examination for tuberculosis or vascular lesion',
    evaluate: (facts) => {
      const hemoptysis = facts.hemoptysis === true;
      return {
        triggered: hemoptysis,
        triggeringFacts: hemoptysis ? ['Frank blood in sputum (Hemoptysis)'] : [],
      };
    },
  },

  // 4. NEUROLOGICAL — Thunderclap Headache / SAH Risk (RF-NEURO-001)
  {
    id: 'RF-NEURO-001',
    ruleVersion: '1.0.0',
    complaintCode: 'HEADACHE',
    title: 'Sudden Peak / Thunderclap Headache',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'Sudden-onset explosive headache reaching peak severity in seconds detected. Requires immediate neurological evaluation.',
    actionRequired: 'Urgent neurological screening, blood pressure monitoring, and non-contrast CT referral',
    evaluate: (facts) => {
      const thunderclap = facts.thunderclap_onset === true;
      return {
        triggered: thunderclap,
        triggeringFacts: thunderclap ? ['Sudden explosive headache reaching peak in seconds'] : [],
      };
    },
  },

  // 5. NEUROLOGICAL — Meningism / Nuchal Rigidity (RF-NEURO-002)
  {
    id: 'RF-NEURO-002',
    ruleVersion: '1.0.0',
    complaintCode: 'HEADACHE',
    title: 'Nuchal Rigidity / Suspected Meningism',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'Neck stiffness and high fever detected. Triage flag for potential acute central nervous system infection.',
    actionRequired: 'Stat clinician assessment of Kernig/Brudzinski signs, immediate tertiary referral',
    evaluate: (facts) => {
      const stiffNeck = facts.neck_stiffness_fever === true;
      return {
        triggered: stiffNeck,
        triggeringFacts: stiffNeck ? ['Nuchal rigidity / stiff neck with fever'] : [],
      };
    },
  },

  // 6. GASTROINTESTINAL — Peritoneal Rigidity / Surgical Abdomen (RF-GI-001)
  {
    id: 'RF-GI-001',
    ruleVersion: '1.0.0',
    complaintCode: 'ABDOMINAL_PAIN',
    title: 'Rebound Tenderness / Involuntary Guarding',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'Severe abdominal wall rigidity or guarding detected. Triage flag for acute peritonitis or surgical abdomen.',
    actionRequired: 'Stat surgical consultation, NPO (nil per os), and IV line establishment',
    evaluate: (facts) => {
      const rigidity = facts.rebound_tenderness === true;
      return {
        triggered: rigidity,
        triggeringFacts: rigidity ? ['Involuntary abdominal rigidity or severe rebound pain'] : [],
      };
    },
  },

  // 7. GASTROINTESTINAL — Severe Dehydration / Shock (RF-GI-002)
  {
    id: 'RF-GI-002',
    ruleVersion: '1.0.0',
    complaintCode: 'VOMITING_DIARRHEA',
    title: 'Severe Volume Depletion / Anuria Warning',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'Severe gastrointestinal fluid losses with absent urination or altered consciousness. Risk of hypovolemic shock.',
    actionRequired: 'Immediate IV fluid resuscitation, electrolyte panel, and hemodynamic monitoring',
    evaluate: (facts) => {
      const anuria = facts.anuria_lethargy === true;
      const severeFreq = facts.stool_frequency_24h === 'severe_7_plus';
      const triggered = anuria || severeFreq;

      const triggeringFacts: string[] = [];
      if (anuria) triggeringFacts.push('Anuria / altered sensorium in dehydrating illness');
      if (severeFreq) triggeringFacts.push('High frequency fluid loss > 6 episodes / 24h');

      return { triggered, triggeringFacts };
    },
  },

  // 8. HEMATOLOGICAL — Petechiae / Hemorrhagic Manifestations (RF-HEM-001)
  {
    id: 'RF-HEM-001',
    ruleVersion: '1.0.0',
    complaintCode: 'FEVER',
    title: 'Petechial Purpura / Hemorrhagic Diathesis in Febrile Illness',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'Febrile illness accompanied by cutaneous petechiae or mucosal bleeding. Triage flag for severe thrombocytopenia or dengue hemorrhagic fever.',
    actionRequired: 'Stat platelet count, hematocrit, torniquet test, and urgent physician triage',
    evaluate: (facts) => {
      const petechiae = facts.petechiae_bleeding === true;
      return {
        triggered: petechiae,
        triggeringFacts: petechiae ? ['Petechial rash or mucosal bleeding with fever'] : [],
      };
    },
  },

  // 9. FEBRILE — Prolonged Pyrexia of Unknown Origin (RF-FEV-001)
  {
    id: 'RF-FEV-001',
    ruleVersion: '1.0.0',
    complaintCode: 'FEVER',
    title: 'Prolonged Pyrexia (Duration >= 7 Days)',
    severity: 'URGENT',
    queuePriority: 2,
    safeWording: 'Continuous fever lasting 7 or more days. Triage flag for enteric fever, malaria, or deep focus bacterial infection.',
    actionRequired: 'Complete blood count, peripheral blood smear for malaria, and Widal/blood culture',
    evaluate: (facts) => {
      const rawDuration = String(facts.duration_days || '');
      const match = rawDuration.match(/(\d+)/);
      const days = match ? parseInt(match[1], 10) : 0;
      const triggered = days >= 7;

      return {
        triggered,
        triggeringFacts: triggered ? [`Fever duration documented as ${days} days (>= 7 day threshold)`] : [],
      };
    },
  },

  // 10. NEPHROLOGY — Frank Hematuria (RF-REN-001)
  {
    id: 'RF-REN-001',
    ruleVersion: '1.0.0',
    complaintCode: 'URINARY_SYMPTOMS',
    title: 'Gross / Frank Hematuria',
    severity: 'URGENT',
    queuePriority: 2,
    safeWording: 'Visible macroscopic blood in urine. Requires prompt renal ultrasound, urinalysis, and urological workup.',
    actionRequired: 'Urinalysis microscopy, renal ultrasonography, and clinician evaluation',
    evaluate: (facts) => {
      const hematuria = facts.frank_hematuria === true;
      return {
        triggered: hematuria,
        triggeringFacts: hematuria ? ['Macroscopic blood observed in urine'] : [],
      };
    },
  },

  // 11. HYPERTENSIVE — Target Organ Warning in Hypertension (RF-HYP-001)
  {
    id: 'RF-HYP-001',
    ruleVersion: '1.0.0',
    complaintCode: 'DIABETES_HYPERTENSION',
    title: 'Acute Target-Organ Symptoms in Chronic Hypertension',
    severity: 'EMERGENCY',
    queuePriority: 1,
    safeWording: 'Patient with hypertensive history reporting sudden visual blurring or acute chest tightness. Triage flag for hypertensive crisis.',
    actionRequired: 'Stat blood pressure measurement, fundoscopy, 12-lead ECG, and emergency triage',
    evaluate: (facts) => {
      const visionChest = facts.blurred_vision_chest_tightness === true;
      return {
        triggered: visionChest,
        triggeringFacts: visionChest ? ['Sudden blurry vision or chest tightness in hypertensive patient'] : [],
      };
    },
  },

  // 12. MUSCULOSKELETAL — Inability to Bear Weight (RF-MSK-001)
  {
    id: 'RF-MSK-001',
    ruleVersion: '1.0.0',
    complaintCode: 'JOINT_PAIN',
    title: 'Acute Inability to Bear Weight / Suspected Fracture or Septic Joint',
    severity: 'WARNING',
    queuePriority: 3,
    safeWording: 'Complete inability to bear weight on affected limb. Requires radiographic evaluation to rule out acute fracture or septic arthritis.',
    actionRequired: 'Plain X-ray of joint/limb, joint temperature assessment, and immobilization',
    evaluate: (facts) => {
      const unable = facts.inability_to_bear_weight === true;
      return {
        triggered: unable,
        triggeringFacts: unable ? ['Complete inability to bear weight on affected limb'] : [],
      };
    },
  },
];
