import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Download, Check, FileCode, ShieldCheck } from 'lucide-react';
import { PatientInfo, SOAPNote } from '../../types';
import { exportToFHIRBundle, FHIRBundle } from '../../utils/fhirConverter';

interface FHIRExportModalProps {
  patientInfo: PatientInfo;
  soapNote: SOAPNote;
  onClose: () => void;
}

export const FHIRExportModal: React.FC<FHIRExportModalProps> = ({ patientInfo, soapNote, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [fhirBundle, setFhirBundle] = useState<FHIRBundle | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bundle = exportToFHIRBundle(patientInfo, soapNote);
    setFhirBundle(bundle);
  }, [patientInfo, soapNote]);

  // Keyboard trap & Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const jsonString = fhirBundle ? JSON.stringify(fhirBundle, null, 2) : '';

  const handleCopy = async () => {
    if (!jsonString) return;
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonString) return;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (patientInfo.name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.href = url;
    a.download = `fhir_bundle_${safeName}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fhir-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-900/60 backdrop-blur-xs"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="fhir-modal-title" className="text-lg font-bold text-slate-800">
                  HL7 FHIR R4 Export
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Standard R4 Bundle
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Interoperable clinical JSON bundle formatted for EHR integration (Epic, Cerner, OpenMRS).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - JSON Preview */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed space-y-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
            <span>resourceType: "Bundle" (collection)</span>
            <span>{fhirBundle?.entry?.length || 0} FHIR Resources</span>
          </div>
          <pre className="whitespace-pre-wrap break-words">{jsonString}</pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Contains Patient, Encounter, Condition (ICD-10), MedicationRequest, and Composition resources.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Bundle</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
