import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { X, UserPlus, Activity, Sparkles } from 'lucide-react';

interface NewPatientModalProps {
  onClose: () => void;
  onPatientCreated: (newPatient: PatientRecord) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({ onClose, onPatientCreated }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('[60-70)');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [race, setRace] = useState('Caucasian');
  const [department, setDepartment] = useState<'Endocrinology' | 'Cardiology' | 'Internal Medicine' | 'Emergency' | 'General Surgery'>('Endocrinology');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('250.02 - Type 2 Diabetes w/ Uncontrolled Hyperglycemia');
  const [timeInHospital, setTimeInHospital] = useState(6);
  const [numLabProcedures, setNumLabProcedures] = useState(55);
  const [numMedications, setNumMedications] = useState(18);
  const [numInpatientVisits, setNumInpatientVisits] = useState(2);
  const [numEmergencyVisits, setNumEmergencyVisits] = useState(1);
  const [numOutpatientVisits, setNumOutpatientVisits] = useState(0);
  const [a1cResult, setA1cResult] = useState<'>8' | '>7' | 'Normal' | 'None'>('>8');
  const [glucoseTest, setGlucoseTest] = useState<'>300' | '>200' | 'Normal' | 'None'>('>300');
  const [insulinStatus, setInsulinStatus] = useState<'Up' | 'Steady' | 'Down' | 'No'>('Up');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      const payload = {
        name,
        age,
        gender,
        race,
        department,
        primaryDiagnosis,
        timeInHospital: Number(timeInHospital),
        numLabProcedures: Number(numLabProcedures),
        numMedications: Number(numMedications),
        numInpatientVisits: Number(numInpatientVisits),
        numEmergencyVisits: Number(numEmergencyVisits),
        numOutpatientVisits: Number(numOutpatientVisits),
        a1cResult,
        glucoseTest,
        medications: {
          insulin: insulinStatus,
          metformin: 'Steady',
          glipizide: 'No',
          glyburide: 'No',
          changeInDiabetesMed: 'Ch',
          diabetesMedPrescribed: 'Yes',
        },
      };

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.patient) {
        onPatientCreated(data.patient);
        onClose();
      }
    } catch (err) {
      console.error('Error creating patient:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-base">New Patient Encounter Intake</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Samuel Henderson"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Clinical Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Endocrinology">Endocrinology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Emergency">Emergency</option>
                <option value="General Surgery">General Surgery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Age Bracket</label>
              <select value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="[40-50)">[40-50)</option>
                <option value="[50-60)">[50-60)</option>
                <option value="[60-70)">[60-70)</option>
                <option value="[70-80)">[70-80)</option>
                <option value="[80-90)">[80-90)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Race/Ethnicity</label>
              <select value={race} onChange={(e) => setRace(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="Caucasian">Caucasian</option>
                <option value="African American">African American</option>
                <option value="Hispanic">Hispanic</option>
                <option value="Asian">Asian</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Primary ICD-9 Diagnosis</label>
            <input
              type="text"
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Utilization Grid */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Inpatient Days</label>
              <input
                type="number"
                min={1}
                max={14}
                value={timeInHospital}
                onChange={(e) => setTimeInHospital(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Lab Procedures</label>
              <input
                type="number"
                value={numLabProcedures}
                onChange={(e) => setNumLabProcedures(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Active Meds Count</label>
              <input
                type="number"
                value={numMedications}
                onChange={(e) => setNumMedications(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Prior Inpatient Stays</label>
              <input
                type="number"
                value={numInpatientVisits}
                onChange={(e) => setNumInpatientVisits(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Prior ER Visits</label>
              <input
                type="number"
                value={numEmergencyVisits}
                onChange={(e) => setNumEmergencyVisits(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Prior Outpatient Visits</label>
              <input
                type="number"
                value={numOutpatientVisits}
                onChange={(e) => setNumOutpatientVisits(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">HbA1c Level</label>
              <select value={a1cResult} onChange={(e) => setA1cResult(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value=">8">&gt; 8%</option>
                <option value=">7">&gt; 7%</option>
                <option value="Normal">Normal</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Glucose Level</label>
              <select value={glucoseTest} onChange={(e) => setGlucoseTest(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value=">300">&gt; 300 mg/dL</option>
                <option value=">200">&gt; 200 mg/dL</option>
                <option value="Normal">Normal</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Insulin Titration</label>
              <select value={insulinStatus} onChange={(e) => setInsulinStatus(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="Up">Up (Increase)</option>
                <option value="Steady">Steady</option>
                <option value="Down">Down</option>
                <option value="No">No Insulin</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Activity className="w-4 h-4" />
              {loading ? 'Evaluating Risk & Saving...' : 'Save & Calculate Risk'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
