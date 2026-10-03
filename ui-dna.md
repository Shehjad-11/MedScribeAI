# UI DNA & Design System Specification (ui-dna.md)

---

## 1. CURRENT Design Language (As Implemented)

### Color Tokens & Palette Usage
- **Primary Background:** Slate neutral theme (`bg-slate-50`, `bg-slate-100`, `bg-slate-900` dark containers, `bg-white`).
- **Primary Brand Color:** Royal Blue (`bg-blue-600`, `text-blue-600`, `border-blue-200`, `bg-blue-50`).
- **Clinical Accent Palette:**
  - **Objective / Positive States:** Emerald (`bg-emerald-50`, `text-emerald-700`, `bg-emerald-600`).
  - **Assessment / Diagnostics:** Indigo (`bg-indigo-50`, `text-indigo-700`, `bg-indigo-600`).
  - **Safety Warnings / Dictation:** Amber & Orange (`bg-amber-50`, `text-amber-800`, `bg-orange-50`, `text-orange-950`).
  - **Critical Errors / Recording Active:** Red (`bg-red-50`, `bg-red-600`, `text-red-700`).
  - **Secondary Actions / Modals:** Teal (`text-teal-400`, `bg-teal-600`).

### Border Radius Conventions
- **Outermost Component Cards:** `rounded-3xl` (`PatientForm`, `TranscriptInput`, `SOAPNoteView`, `BillingCodingPanel`).
- **Standard Cards & Containers:** `rounded-2xl` (Intro banner, Error alerts, SOAP sections).
- **Interactive Buttons & Badges:** `rounded-xl` & `rounded-lg` (Action buttons, scenario pills, status tags).

### Iconography Library
- **`lucide-react` (`^0.546.0`)** used across all components.
- Standardized icons: `Stethoscope`, `Activity`, `History`, `BarChart3`, `Wifi`, `ShieldAlert`, `Sparkles`, `Mic`, `Upload`, `FileCheck`, `Printer`, `Save`, `Copy`, `RotateCcw`, `Volume2`, `Trash2`, `AlertCircle`, `CheckCircle2`.

### Spacing & Grid Layout Patterns
- **Main Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6`.
- **Card Padding:** `p-5` (standard sections), `p-4` (compact items), `p-8` (empty state card).
- **Component Gap:** `gap-3` to `gap-4` in grid layouts.

### Header Component Layout (`src/components/Header.tsx`)
- **Structure:** Sticky top bar (`h-16 flex items-center justify-between bg-white border-b border-slate-200`).
- **Left Branding:** Stethoscope logo icon in blue circle + Title ("MedScribe Lite") + Badge (`"Bento AI"` tag) + Subtitle ("Clinical Documentation & Safety Assistant").
- **Center Status:** Pill showing `"Gemini 3.6 Engine"` and `"Low-Resource Optimized"`.
- **Right Actions:** "Load Sample Case" button, "Encounters" history button (with count badge), and "Analytics" button.

---

## 2. TARGET Design System (Tokens & Standard Specifications)

### Primary, Secondary & Accent Color Palette
- **Brand Primary (Royal Blue):**
  - Light Tint: `#eff6ff` (`blue-50`)
  - Border/Ring: `#bfdbfe` (`blue-200`)
  - Core Brand: `#2563eb` (`blue-600`)
  - Hover/Active: `#1d4ed8` (`blue-700`)
- **Surface Neutrals (Slate):**
  - App Background: `#f8fafc` (`slate-50`)
  - Card Surface: `#ffffff` (`white`)
  - Sub-surface / Input Fill: `#f1f5f9` (`slate-100`)
  - Border Neutral: `#e2e8f0` (`slate-200`)
  - Text Secondary: `#64748b` (`slate-500`)
  - Text Primary: `#1e293b` (`slate-800`)
  - Dark Surface / Modal Fill: `#0f172a` (`slate-900`)
- **Clinical Functional Palette:**
  - **Subjective (Blue):** Core `#2563eb`, Light `#eff6ff`
  - **Objective (Emerald):** Core `#059669`, Light `#ecfdf5`, Text `#047857`
  - **Assessment (Indigo):** Core `#4f46e5`, Light `#eef2ff`, Text `#4338ca`
  - **Plan (Teal):** Core `#0d9488`, Light `#f0fdfa`, Text `#0f766e`
  - **Safety Warning (Amber):** Core `#d97706`, Light `#fffbeb`, Text `#b45309`
  - **Danger / Active Dictation (Red):** Core `#dc2626`, Light `#fef2f2`, Text `#b91c1c`

### Typography Scale & Font Families
- **Font Stack:**
  - Base Sans: `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Clinical Mono: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace`
- **6-Step Type Scale:**
  1. `text-xs` (10px - 11px / 0.75rem): Micro labels, status badges, timestamps.
  2. `text-sm-body` (12px - 13px / 0.875rem): Dense clinical text, table entries, helper hints.
  3. `text-base-body` (14px / 1rem): Standard body copy, form inputs, primary content text.
  4. `text-lg-heading` (16px / 1.125rem): Card section headings, modal titles.
  5. `text-xl-heading` (18px - 20px / 1.25rem - 1.5rem): Primary component section titles, header brand lockup.
  6. `text-2xl-title` (24px / 2rem): Hero titles, key metric callouts.

### Spacing & Layout Scale (8px Grid)
- `space-1` / `0.25rem` (4px): Micro gaps, inline badge paddings.
- `space-2` / `0.5rem` (8px): Button internal vertical padding, tight item gaps.
- `space-3` / `0.75rem` (12px): Standard form element gap, chip padding.
- `space-4` / `1rem` (16px): Card internal padding, field row spacing.
- `space-6` / `1.5rem` (24px): Standard section spacing, card grid gaps.
- `space-8` / `2rem` (32px): Major layout block separation.

### Button & Badge Variants
- **Button Variants:**
  - `.btn-primary`: `bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-colors`
  - `.btn-secondary`: `bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition-colors border border-slate-200`
  - `.btn-outline`: `bg-transparent hover:bg-slate-100 text-slate-600 border border-slate-300 font-bold px-3 py-1.5 rounded-xl transition-colors`
  - `.btn-danger`: `bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-colors`
  - `.btn-teal`: `bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors`
- **Badge Variants:**
  - `.badge-brand`: `bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs px-2.5 py-0.5 rounded-lg`
  - `.badge-success`: `bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs px-2.5 py-0.5 rounded-lg`
  - `.badge-warning`: `bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs px-2.5 py-0.5 rounded-lg`
  - `.badge-danger`: `bg-red-50 text-red-700 border border-red-200 font-bold text-xs px-2.5 py-0.5 rounded-lg`
- **Card & Modal Variants:**
  - `.card-base`: `bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5`
  - `.card-interactive`: `bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-shadow p-5`
  - `.modal-overlay`: `fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4`
  - `.modal-container`: `bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden`

### Empty, Loading & Error State Patterns
- **Empty State:** `bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500`
- **Loading Spinner:** `animate-spin text-blue-600` with descriptive progress text.
- **Error Banner:** `bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center space-x-3`
