# Clinical Specification & Intake Question Graph (SIH 2026)

> [!WARNING]
> **CLINICAL REVIEW STATUS: PENDING MBBS / CLINICIAN REVIEW**  
> All interview question nodes, branching logic, risk categorizations, and red-flag trigger thresholds documented herein are clinical design specifications for system demonstration. They MUST NOT be deployed into real patient care without formal written sign-off by a certified MBBS physician.

---

## 1. Architectural Principles
1. **Deterministic Question Graph**: Questions, required fields, branching, and safety red flags are strictly controlled by the deterministic question engine (`src/utils/interviewEngine.ts`), NOT an unconstrained LLM.
2. **Role of AI / LLM**: Gemini is used exclusively for natural-language slot extraction and rephrasing patient answers. It does not select questions or diagnose.
3. **Missing Information Policy**: If a non-mandatory question is skipped or unstated by the patient, the clinical fact is recorded explicitly as `"Not documented"`. Fabricating missing facts is strictly prohibited.
4. **Confirmation Policy**:
   - **HIGH-RISK facts** (potential red-flag symptoms, severe pain scores, cardiac/neurological symptoms): Confirmed individually before advancing.
   - **LOW-RISK facts** (mild symptoms, routine patterns): Confirmed in a single batch summary screen.

---

## 2. Complaint Question Graph Catalog (10 Primary Care Complaints)

### 1. Fever & Acute Febrile Illness (`FEVER`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_fever_duration` | `duration_days` | Duration | **HIGH** | Yes | Duration > 7 days | Screen for prolonged fever / enteric fever / malaria. |
| `q_fever_chills` | `chills_rigors` | Yes/No | **LOW** | Yes | No | Identify rigors characteristic of malaria or bacteremia. |
| `q_fever_pattern` | `fever_pattern` | Single Choice | **LOW** | No | No | Distinguish continuous vs intermittent spikes. |
| `q_fever_red_flag_rash` | `petechiae_bleeding` | Yes/No | **HIGH** | Yes | **YES (`RF-HEM-001`)** | Triage immediate dengue hemorrhagic / meningococcemia risk. |

### 2. Cough & Respiratory Symptoms (`COUGH`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_cough_duration` | `cough_duration` | Duration | **HIGH** | Yes | Duration > 14 days | Screen for chronic tuberculosis or bronchiectasis. |
| `q_cough_type` | `cough_nature` | Single Choice | **LOW** | Yes | No | Differentiate dry viral cough from productive bacterial infection. |
| `q_cough_hemoptysis` | `hemoptysis` | Yes/No | **HIGH** | Yes | **YES (`RF-RESP-001`)** | Identify hemoptysis requiring immediate physician evaluation. |

### 3. Acute Chest Pain / Angina Protocol (`CHEST_PAIN`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_cp_onset` | `chest_pain_onset` | Single Choice | **HIGH** | Yes | Sudden onset | Differentiate acute coronary event from musculoskeletal pain. |
| `q_cp_radiation` | `chest_pain_radiation` | Multiple Choice | **HIGH** | Yes | Radiation to left arm/jaw | Classic ischemic radiation pattern. |
| `q_cp_associated_sweat` | `diaphoresis` | Yes/No | **HIGH** | Yes | **YES (`RF-CARD-001`)** | Diaphoresis + chest pain triggers EMERGENCY priority. |
| `q_cp_severity` | `pain_score` | Numeric (1-10) | **HIGH** | Yes | Score >= 7 | Gauge pain intensity for immediate analgesia and ECG. |

### 4. Abdominal & Gastrointestinal Pain (`ABDOMINAL_PAIN`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_abdo_location` | `pain_location` | Single Choice | **LOW** | Yes | No | Localize organ system (epigastric vs RLQ vs diffuse). |
| `q_abdo_rigidity` | `rebound_tenderness` | Yes/No | **HIGH** | Yes | **YES (`RF-GI-001`)** | Detect peritonitis / acute surgical abdomen. |

### 5. Headache & Neurological Triage (`HEADACHE`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_ha_thunderclap` | `thunderclap_onset` | Yes/No | **HIGH** | Yes | **YES (`RF-NEURO-001`)** | Screen for subarachnoid hemorrhage (thunderclap headache). |
| `q_ha_neck_stiffness` | `neck_stiffness_fever` | Yes/No | **HIGH** | Yes | **YES (`RF-NEURO-002`)** | Screen for acute meningitis. |

### 6. Acute Dyspnea & Respiratory Distress (`BREATHLESSNESS`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_dyspnea_rest` | `shortness_of_breath_at_rest` | Yes/No | **HIGH** | Yes | **YES (`RF-RESP-002`)** | Distinguish exertional dyspnea from resting failure. |
| `q_dyspnea_stridor_cyanosis` | `cyanosis_stridor` | Yes/No | **HIGH** | Yes | **YES (`RF-RESP-003`)** | Critical airway obstruction or severe hypoxia. |

### 7. Acute Gastroenteritis & Dehydration (`VOMITING_DIARRHEA`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_gi_frequency` | `stool_frequency_24h` | Single Choice | **LOW** | Yes | No | Quantify fluid loss frequency. |
| `q_gi_dehydration` | `anuria_lethargy` | Yes/No | **HIGH** | Yes | **YES (`RF-GI-002`)** | Identify severe hypovolemic shock / acute kidney injury. |

### 8. Musculoskeletal & Arthritis Triage (`JOINT_PAIN`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_joint_swelling` | `joint_swelling_redness` | Yes/No | **LOW** | Yes | No | Differentiate inflammatory arthritis from mechanical arthralgia. |
| `q_joint_weightbearing` | `inability_to_bear_weight` | Yes/No | **HIGH** | Yes | **YES (`RF-MSK-001`)** | Assess fracture or acute septic joint risk. |

### 9. Urinary Tract & Renal Evaluation (`URINARY_SYMPTOMS`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_uri_dysuria` | `burning_micturition` | Yes/No | **LOW** | Yes | No | Classic cystitis / lower urinary tract symptom. |
| `q_uri_hematuria` | `frank_hematuria` | Yes/No | **HIGH** | Yes | **YES (`RF-REN-001`)** | Frank hematuria requires immediate renal / urological workup. |

### 10. Chronic Cardiometabolic Routine Surveillance (`DIABETES_HYPERTENSION`)
| ID | Field Key | Question Type | Risk Category | Required | Red Flag Trigger | Clinical Intent |
|:---|:---|:---|:---|:---|:---|:---|
| `q_chronic_med_compliance` | `medication_adherence` | Single Choice | **LOW** | Yes | No | Monitor chronic prescription compliance. |
| `q_chronic_acute_headache_vision` | `blurred_vision_chest_tightness` | Yes/No | **HIGH** | Yes | **YES (`RF-HYP-001`)** | Hypertensive crisis / target organ damage warning. |

---

## 3. Reviewer Sign-Off Block
- **Reviewing Physician:** `PENDING MBBS ASSIGNMENT`
- **Date Reviewed:** `PENDING`
- **Clinical Recommendation:** `PENDING`
