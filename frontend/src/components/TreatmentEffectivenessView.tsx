import React from 'react';
import { TreatmentOutcomeMetric } from '../types';
import { Pill, Activity, CheckCircle, Award, TrendingDown, Clock, HeartHandshake } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TreatmentEffectivenessViewProps {
  outcomes: TreatmentOutcomeMetric[];
}

export const TreatmentEffectivenessView: React.FC<TreatmentEffectivenessViewProps> = ({ outcomes }) => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Pill className="w-5 h-5 text-emerald-600" />
          Treatment Effectiveness & Recovery Monitoring
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Comparative evaluation of inpatient diabetes therapeutic regimens, length-of-stay efficiency, and 30-day readmission suppression
        </p>
      </div>

      {/* Regimen Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {outcomes.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Regimen #{idx + 1}
              </span>
              <span className="text-xs font-mono text-slate-400">{item.patientCount.toLocaleString()} Patients</span>
            </div>

            <h3 className="font-bold text-slate-900 text-xs leading-snug">{item.regime}</h3>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">30-Day Readmit Rate:</span>
                <span className={`font-bold ${item.readmissionRate30Day < 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {item.readmissionRate30Day}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Avg Stay Duration:</span>
                <span className="font-bold text-slate-800">{item.avgLengthOfStay} Days</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">HbA1c Reduction:</span>
                <span className="font-bold text-teal-700">↓ {item.a1cReductionAvg}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Treatment Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Readmission Rate by Regimen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Readmission Rate by Therapeutic Regimen (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="regime" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Readmission Rate']} />
                <Bar dataKey="readmissionRate30Day" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Length of Stay Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Average Hospital Days by Regimen</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="regime" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val} Days`, 'Length of Stay']} />
                <Bar dataKey="avgLengthOfStay" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
