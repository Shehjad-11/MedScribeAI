# MedScribeAI — AYUSH Clinical Review Packet
## Prakriti & Agni Assessment Module (Thin Slice)

> **STATUS: PENDING BAMS REVIEW**  
> **DISCLAIMER:** This document and the associated software module represent an unvalidated clinical prototype.  
> No claim of clinical efficacy, regulatory approval, or diagnostic accuracy is made. All questions, options, and scoring logic require formal sign-off by a registered Bachelor of Ayurvedic Medicine and Surgery (BAMS) or MD (Ayurveda) practitioner before live deployment.

---

### 1. Document Control & Metadata
- **System:** MedScribeAI (Smart India Hackathon PS 26047)
- **Module:** AYUSH Thin Slice — Prakriti & Agni Intake
- **Version:** 1.0.0-PROTOTYPE
- **Target Audience:** BAMS Clinical Reviewer, Ayurvedic Faculty, Clinical Investigators
- **Review Date:** Pending Reviewer Assignment
- **Primary Objective:** Provide structured, patient-friendly Ayurvedic intake at rural/primary healthcare kiosks while preserving clinical provenance and leaving all final diagnosis/prescribing exclusively to qualified physicians.

---

### 2. Module Principles & Safety Invariants
1. **Zero Autonomous Prescribing:** The system NEVER prescribes Ayurvedic formulations, herbs, or therapies autonomously.
2. **Deterministic Tally Logic:** Prakriti and Agni scores are calculated through transparent option counting based on classical Ayurvedic treatises (Brihat Trayi: Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya). Zero LLM hallucinations are used in the scoring pipeline.
3. **Transparent Clinical Provenance:** Every response is recorded as a `ClinicalFact` tagged with `source: 'PATIENT_REPORTED'`, `method: 'touch'`, and `verificationState: 'unverified'` until reviewed by a doctor.
4. **Visibly Marked in UI:** Every screen, question card, and clinical summary carries the mandatory badge: `[PENDING BAMS REVIEW]`.

---

### 3. Prakriti Assessment Questions (Sharira Prakriti)

The module assesses 5 core phenotypic and behavioral dimensions to evaluate primary doshic dominance (Vata, Pitta, Kapha).

#### Question 1: Body Frame & Physique (Sharira Pramana & Samhanana)
- **Clinical Rationale:** Assessment of bone structure, mass accumulation, and joint prominence per *Charaka Samhita, Vimana Sthana 8:96–98*.
- **Options:**
  1. **Vata:** Lean, slender, prominent joints, difficulty gaining weight (*Alpa Sharira, Ruksha*).
  2. **Pitta:** Medium athletic build, moderate muscle mass, stable weight (*Madhya Sharira*).
  3. **Kapha:** Broad, sturdy, well-developed bone frame, gains weight easily (*Brihat Sharira, Snigdha*).

#### Question 2: Skin & Hair Characteristics (Sparsha & Kesa Lakshana)
- **Clinical Rationale:** Assessment of organ qualities (Guna) per *Ashtanga Hridaya, Sutrasthana 1:11–12*.
- **Options:**
  1. **Vata:** Dry, rough skin, prone to cracks; thin, brittle or frizzy hair (*Ruksha, Khara*).
  2. **Pitta:** Warm, reddish/flushed skin, prone to moles/freckles; fine hair, early greying (*Ushna, Tikshna, Goura*).
  3. **Kapha:** Thick, smooth, oily/cool skin; dense, dark, lustrous thick hair (*Snigdha, Slakshna, Sandra*).

#### Question 3: Weather & Temperature Sensitivity (Sheeta/Ushna Satmya)
- **Clinical Rationale:** Evaluation of environmental tolerance per *Sushruta Samhita, Sharira Sthana 4:64–72*.
- **Options:**
  1. **Vata:** Dislikes cold and dry drafts; prefers warm, sunny weather (*Sheeta Asahatva*).
  2. **Pitta:** Dislikes excessive heat and direct sunlight; prefers cool breezes (*Ushna Asahatva*).
  3. **Kapha:** Dislikes damp cold and humid rainy seasons; tolerates summer well (*Kleda Asahatva*).

#### Question 4: Mental Temperament & Stress Response (Manasa Guna & Sattva)
- **Clinical Rationale:** Cognitive agility, memory retention, and emotional reaction under stress per *Charaka Samhita, Sharira Sthana 4:36–38*.
- **Options:**
  1. **Vata:** Quick learner, enthusiastic, quick to worry/anxiety under pressure (*Chala Chitta, Bhaya*).
  2. **Pitta:** Sharp intellect, decisive, ambitious, irritable or impatient when frustrated (*Krodha, Tejas*).
  3. **Kapha:** Calm, patient, forgiving, slow to react, resistant to sudden change (*Dhriti, Gambhira*).

#### Question 5: Sleep Quality & Pattern (Nidra Lakshana)
- **Clinical Rationale:** Quality, duration, and disturbance of sleep per *Charaka Samhita, Sutrasthana 21:35–37*.
- **Options:**
  1. **Vata:** Light, interrupted sleep, easily awakened by small noises (*Alpa Nidra, Jagarana*).
  2. **Pitta:** Moderate sound sleep (6–7 hrs), wake refreshed, vivid dreams (*Madhya Nidra*).
  3. **Kapha:** Deep, heavy, prolonged sleep (>8 hrs), hard to wake up early (*Ati Nidra, Tandra*).

---

### 4. Agni Assessment Questions (Digestive Fire)

The module evaluates the four states of metabolic and digestive capacity (*Jatharagni*) per *Charaka Samhita, Chikitsa Sthana 15:50–53*.

#### Question 1: Appetite Regularity (Abhyavaharana Shakti)
- **Options:**
  1. **Vishama Agni (Vata):** Irregular / Variable — ravenous on some days, zero appetite on others.
  2. **Tikshna Agni (Pitta):** Excessive / Intense — cannot tolerate delayed meals, irritable or faint when hungry.
  3. **Manda Agni (Kapha):** Sluggish / Low — feels full for many hours, eats out of habit rather than hunger.
  4. **Sama Agni (Balanced):** Balanced — regular, healthy hunger at predictable mealtimes without discomfort.

#### Question 2: Post-Meal Digestive Sensation (Jarana Shakti)
- **Options:**
  1. **Vishama Agni:** Bloating, gas, rumbling sounds, or colicky tightness post-meal (*Adhmana, Anaha*).
  2. **Tikshna Agni:** Heartburn, acid reflux, sour belching, or burning sensations (*Amlika, Vidaha*).
  3. **Manda Agni:** Heavy fullness, sluggish lethargy, drowsiness immediately after eating (*Gourava, Tandra*).
  4. **Sama Agni:** Comfortable digestion, lightness in the body within 2–3 hours (*Laghuta, Sukha*).

#### Question 3: Bowel Habits & Evacuation (Koshtha Lakshana)
- **Options:**
  1. **Vishama Agni (Krura Koshtha):** Dry, hard stools, tendency toward constipation, irregular evacuation.
  2. **Tikshna Agni (Mridu Koshtha):** Loose or semi-solid stools, urgent evacuation, burning sensations.
  3. **Manda Agni (Guru Koshtha):** Heavy, mucous-like stools, slow evacuation, incomplete feeling.
  4. **Sama Agni (Madhyama Koshtha):** Formed, smooth, regular 1–2 times daily without strain.

---

### 5. Scoring Algorithm Specification
1. Let $T_V, T_P, T_K$ be the tally count of Vata, Pitta, and Kapha options selected across the 5 Prakriti questions.
2. If $T_V > T_P \land T_V > T_K \implies \text{Vata Dominant Prakriti}$.
3. If $T_P > T_V \land T_P > T_K \implies \text{Pitta Dominant Prakriti}$.
4. If $T_K > T_V \land T_K > T_P \implies \text{Kapha Dominant Prakriti}$.
5. If two doshas tie with higher count than the third $\implies$ Dual-dosha (Dvandvaja, e.g., Vata-Pitta, Pitta-Kapha).
6. If $T_V = T_P = T_K \implies \text{Sama Prakriti (Tridoshic Balanced)}$.
7. Agni classification takes the mode (highest frequency) among the 3 Agni questions (Vishama, Tikshna, Manda, or Sama).
8. All outputs append `[PENDING BAMS REVIEW]`.

---

### 6. BAMS Reviewer Sign-Off Sheet

| Item Under Review | Clinically Appropriate? (Yes / No) | Classical Reference Validated? | Reviewer Comments / Requested Amendments |
|:---|:---:|:---:|:---|
| 1. Body Frame (Sharira Pramana) | [ ] Yes  [ ] No | [ ] Validated | |
| 2. Skin & Hair (Sparsha/Kesa) | [ ] Yes  [ ] No | [ ] Validated | |
| 3. Weather Sensitivity (Satmya) | [ ] Yes  [ ] No | [ ] Validated | |
| 4. Temperament (Manasa Guna) | [ ] Yes  [ ] No | [ ] Validated | |
| 5. Sleep Pattern (Nidra) | [ ] Yes  [ ] No | [ ] Validated | |
| 6. Appetite (Abhyavaharana Shakti) | [ ] Yes  [ ] No | [ ] Validated | |
| 7. Post-Meal Sensation (Jarana) | [ ] Yes  [ ] No | [ ] Validated | |
| 8. Bowel Habits (Koshtha) | [ ] Yes  [ ] No | [ ] Validated | |
| 9. Tally Scoring Logic | [ ] Yes  [ ] No | [ ] Validated | |
| 10. Non-Diagnostic Guardrails | [ ] Yes  [ ] No | [ ] Validated | |

#### Formal Reviewer Attestation:
- **Reviewer Name:** ____________________________________________________
- **Qualification:** [ ] BAMS  [ ] MD (Ayurveda)  [ ] PhD (Ayurveda)
- **State / Central Board Registration Number:** __________________________
- **Affiliated Institution / Clinic:** ___________________________________
- **Signature:** ___________________________ **Date:** ___________________
- **Decision:** [ ] APPROVED FOR PILOT  [ ] REVISIONS REQUIRED  [ ] REJECTED
