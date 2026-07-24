import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { X, Sparkles, Send, Bot, Stethoscope, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';

interface ClinicalAssistantModalProps {
  patient: PatientRecord | null;
  mode: 'care_plan' | 'discharge_readiness' | 'custom';
  onClose: () => void;
}

export const ClinicalAssistantModal: React.FC<ClinicalAssistantModalProps> = ({
  patient,
  mode,
  onClose,
}) => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (patient) {
      generateClinicalInsight(mode);
    }
  }, [patient, mode]);

  const generateClinicalInsight = async (requestedMode: 'care_plan' | 'discharge_readiness' | 'custom', promptOverride?: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/clinical-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient,
          mode: requestedMode,
          prompt: promptOverride || customPrompt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setResponse(data.text);
      } else {
        setError(data.error || 'Failed to generate clinical decision support response.');
      }
    } catch (err: any) {
      console.error('Clinical Assistant Error:', err);
      setError(err.message || 'Error connecting to Gemini Clinical Engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    generateClinicalInsight('custom', customPrompt);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight flex items-center gap-2">
                Gemini AI Clinical Decision Support
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30 font-mono">
                  gemini-3.6-flash
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {patient ? `Evaluating ${patient.name} (${patient.id} • Risk Score: ${patient.riskScore}%)` : 'Inpatient Diabetes Decision Engine'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle Quick Bar */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateClinicalInsight('care_plan')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-500 font-medium text-slate-800 transition-all"
            >
              30-Day Readmission Care Plan
            </button>
            <button
              onClick={() => generateClinicalInsight('discharge_readiness')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 font-medium text-slate-800 transition-all"
            >
              Discharge Readiness Audit
            </button>
          </div>

          {response && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Plan'}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-800 space-y-4 leading-relaxed">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="font-semibold text-slate-700">Synthesizing clinical risk factors & care plan with Gemini AI...</p>
              <p className="text-[11px] text-slate-400">Processing Diabetes 130-US Hospitals clinical feature vectors</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error Generating Clinical Advice</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-xs whitespace-pre-wrap font-sans bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
              {response}
            </div>
          )}
        </div>

        {/* Custom Question Prompt Bar */}
        <form onSubmit={handleCustomSubmit} className="p-4 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ask Gemini a specific clinical question about this patient (e.g. insulin dosing, renal clearance)..."
            className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
          <button
            type="submit"
            disabled={loading || !customPrompt.trim()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Ask
          </button>
        </form>

      </div>
    </div>
  );
};
