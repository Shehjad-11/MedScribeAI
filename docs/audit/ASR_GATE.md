# Marathi ASR Decision Gate & Speech Evaluation Report

**Document Status:** PENDING AUDIO SUBMISSION FROM OPERATOR  
**Evaluation Execution:** **NOT RUN** (Audio recordings missing; no invented metrics per Absolute Rule 5)  
**Target Decision Threshold:** Average Word Error Rate (WER) $\le 25\%$ (0.25) across primary care clinical scenarios.

---

## 1. Decision Policy (MASTER_PROMPT Section 11)
- **Condition A (WER $\le 25\%$):** Marathi voice dictation is officially approved as an active demo voice input path.
- **Condition B (WER $> 25\%$ or Audio Fixtures Missing):**
  - **Marathi Voice Status:** Experimental / Demo Only.
  - **Primary Demo Voice Language:** Hindi or English.
  - **Marathi Primary Intake Modality:** Touch-first interface (100% reliable deterministic touch buttons and complaint stubs).
  - **Honesty Rule:** Never claim Marathi voice accuracy has been clinically validated without verified benchmark test runs against real audio files.

---

## 2. Required Audio Recordings (Operator Checklist)
To run the automated scoring harness (`scripts/scoreAsr.ts`), please place the following `.wav` audio files (16kHz, mono, 16-bit PCM) in `fixtures/audio/marathi_eval/`:

| File Name Required | Ground Truth Reference Text | Target Speaker Demographic | Clinical Complaint | Status |
|:---|:---|:---|:---|:---|
| `mr_fever_elderly_male.wav` | `मला तीन दिवसांपासून खूप ताप आहे आणि अंगात थंडी भरते.` | Male, 62 yrs, Rural Pune accent | FEVER | **NOT RUN (AWAITING AUDIO)** |
| `mr_chest_pain_adult_female.wav` | `दोन तासांपासून छातीत खूप जडपणा वाटतोय आणि डाव्या हातात कळ जातेय.` | Female, 50 yrs, Western Maharashtra | CHEST_PAIN | **NOT RUN (AWAITING AUDIO)** |
| `mr_cough_young_adult.wav` | `गेल्या आठवड्यापासून सतत कोरडा खोकला येतोय आणि घसा दुखतोय.` | Male, 28 yrs, Urban/Peri-urban | COUGH | **NOT RUN (AWAITING AUDIO)** |
| `mr_dyspnea_noisy_background.wav` | `जरा चाललो तरी खूप धाप लागते आणि श्वास घेता येत नाही.` | Female, 68 yrs, Ambulatory noise | BREATHLESSNESS | **NOT RUN (AWAITING AUDIO)** |
| `mr_diabetes_routine_followup.wav` | `माझी साखरेची गोळी संपली आहे म्हणून पुन्हा दाखवायला आलो आहे.` | Male, 54 yrs, Native Marathi speaker | CHRONIC FOLLOW-UP | **NOT RUN (AWAITING AUDIO)** |

---

## 3. Evaluation Harness
The scoring script is located at:
`scripts/scoreAsr.ts`

When audio files are placed into `fixtures/audio/marathi_eval/`, execute:
```bash
npx tsx scripts/scoreAsr.ts
```
The script automatically generates WER, CER, substitutions, deletions, and insertions, and outputs the final gate recommendation.
