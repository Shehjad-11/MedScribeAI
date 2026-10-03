# Translation Status & Verification Ledger

**Document Version:** 1.0.0  
**Phase:** Phase 2 (Kiosk Shell & Multilingual Foundation)  
**Standard:** Tier 1 SIH Spec — Multi-Language Support

---

## Language Support Status Table

| Language Code | Language Name | Coverage | Verification State | Reviewer / Sign-off | Notes |
|:---|:---|:---|:---|:---|:---|
| `en` | English | Complete (100%) | VERIFIED | Human clinical verified | Primary baseline language for all clinic workflows. |
| `es` | Spanish (Español) | Complete (100%) | VERIFIED | Evaluated in Phase 5 suite | Legacy multi-language support preserved intact. |
| `hi` | Hindi (हिन्दी) | Complete (100%) | **NEEDS NATIVE-SPEAKER REVIEW** | PENDING MBBS / CLINICIAN REVIEW | Synthetic clinical terms translated for demonstration. Do not claim formal validation without native clinician sign-off. |
| `mr` | Marathi (मराठी) | Complete (100%) | **NEEDS NATIVE-SPEAKER REVIEW** | PENDING NATIVE CLINICIAN REVIEW | Marathi UI strings provided for rural Maharashtra PHC workflows. ASR gate and clinical review required before live deployment. |

---

## Review Policy & Disclaimer
1. **No Unverified Clinical Claims:** All non-English medical terminology (e.g. symptom descriptors, red flag warnings, consent forms) generated for demonstration must clearly carry the `NEEDS NATIVE-SPEAKER REVIEW` status in this ledger and the source repository until reviewed by a certified healthcare professional.
2. **Deterministic UI Fallbacks:** If an error occurs in any non-English locale, the application safely falls back to English strings without crash or data corruption.
3. **Speech / ASR Status:** Marathi voice dictation is gated behind the Marathi ASR accuracy gate (Phase 4). When ASR is unverified, touch/text selection is the primary reliable intake modality.
