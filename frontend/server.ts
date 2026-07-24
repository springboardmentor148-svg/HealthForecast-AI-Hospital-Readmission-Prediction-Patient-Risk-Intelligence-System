import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PATIENTS, HOSPITAL_ANALYTICS, MODEL_METRICS, TREATMENT_OUTCOMES, INITIAL_AUDIT_LOGS } from './src/mockData.js';
import { PatientRecord, RiskTier, ReadmissionWindow } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for live user interactions
  let patientsStore: PatientRecord[] = [...INITIAL_PATIENTS];
  let auditLogsStore = [...INITIAL_AUDIT_LOGS];

  // Utility to calculate ML Risk Score using Diabetes 130-US Hospitals feature rules
  function calculateMLRiskScore(patient: Partial<PatientRecord>): {
    riskScore: number;
    riskTier: RiskTier;
    readmissionLikelihood: ReadmissionWindow;
    readmissionProbability: number;
    dischargeReadinessScore: number;
    riskFactors: any[];
    careRecommendations: string[];
  } {
    let score = 15; // baseline

    const factors: any[] = [];

    // 1. Inpatient visits (Highest weight feature in XGBoost model)
    const inp = patient.numInpatientVisits || 0;
    if (inp >= 3) {
      score += 28;
      factors.push({ factor: 'High Prior Inpatient Admissions (≥3)', impactPercent: 28, description: `${inp} prior hospital stays in past 12 mo`, category: 'utilization' });
    } else if (inp >= 1) {
      score += 14;
      factors.push({ factor: 'Prior Inpatient Hospitalization', impactPercent: 14, description: `${inp} prior inpatient stay`, category: 'utilization' });
    }

    // 2. Emergency visits
    const er = patient.numEmergencyVisits || 0;
    if (er >= 2) {
      score += 20;
      factors.push({ factor: 'Multiple Emergency Room Visits (≥2)', impactPercent: 20, description: `${er} ER visits indicating fragile outpatient management`, category: 'utilization' });
    } else if (er === 1) {
      score += 10;
      factors.push({ factor: 'Prior ER Visit', impactPercent: 10, description: 'Recent emergency room attendance', category: 'utilization' });
    }

    // 3. Glycemic Control (A1c & Glucose)
    if (patient.a1cResult === '>8') {
      score += 18;
      factors.push({ factor: 'Elevated HbA1c (>8%)', impactPercent: 18, description: 'Severe chronic glycemic dysregulation', category: 'lab' });
    } else if (patient.a1cResult === '>7') {
      score += 8;
      factors.push({ factor: 'Moderate HbA1c Elevation (>7%)', impactPercent: 8, description: 'Sub-optimal blood glucose control', category: 'lab' });
    }

    if (patient.glucoseTest === '>300') {
      score += 12;
      factors.push({ factor: 'Acute Glucose Elevation (>300 mg/dL)', impactPercent: 12, description: 'Acute inpatient hyperglycemia', category: 'lab' });
    }

    // 4. Medications & Titration
    const medCount = patient.numMedications || 0;
    if (medCount > 20) {
      score += 12;
      factors.push({ factor: 'Severe Polypharmacy (>20 Meds)', impactPercent: 12, description: `${medCount} active prescription drugs`, category: 'medication' });
    } else if (medCount > 12) {
      score += 6;
      factors.push({ factor: 'Polypharmacy (12-20 Meds)', impactPercent: 6, description: `${medCount} active medications`, category: 'medication' });
    }

    if (patient.medications?.insulin === 'Up') {
      score += 15;
      factors.push({ factor: 'Rapid Insulin Dosage Escalation', impactPercent: 15, description: 'Inpatient insulin requirement increased', category: 'medication' });
    }

    // 5. Length of Stay
    const timeHosp = patient.timeInHospital || 1;
    if (timeHosp >= 7) {
      score += 10;
      factors.push({ factor: 'Extended Length of Stay (≥7 Days)', impactPercent: 10, description: `Inpatient stay of ${timeHosp} days`, category: 'utilization' });
    }

    // Outpatient protective factor
    const out = patient.numOutpatientVisits || 0;
    if (out >= 2) {
      score -= 10;
      factors.push({ factor: 'Active Outpatient Engagement', impactPercent: -10, description: `${out} outpatient appointments attended`, category: 'utilization' });
    }

    // Cap score 0-99
    const finalScore = Math.max(5, Math.min(98, score));
    
    let riskTier: RiskTier = 'Low';
    let readmissionLikelihood: ReadmissionWindow = 'No Readmission';
    if (finalScore >= 80) {
      riskTier = 'Critical';
      readmissionLikelihood = '<30 Days';
    } else if (finalScore >= 65) {
      riskTier = 'High';
      readmissionLikelihood = '<30 Days';
    } else if (finalScore >= 45) {
      riskTier = 'Medium';
      readmissionLikelihood = '>30 Days';
    }

    const prob = Number((finalScore / 100).toFixed(2));
    const readiness = Math.max(10, Math.min(95, 100 - finalScore + 10));

    const recommendations = [
      `Schedule post-discharge primary/specialist consultation within ${finalScore > 70 ? '48 hours' : '7 days'}`,
      finalScore > 60 ? 'Enroll in Telehealth Continuous Glucose & Vital Signs Monitoring' : 'Provide standard diabetes self-management education packet',
      'Clinical pharmacist reconciliation of discharge prescription list',
      finalScore > 75 ? 'Home Health Nursing visit on Day 2 post-discharge for insulin administration audit' : 'Routine 30-day follow-up lab panel',
    ];

    return {
      riskScore: finalScore,
      riskTier,
      readmissionLikelihood,
      readmissionProbability: prob,
      dischargeReadinessScore: readiness,
      riskFactors: factors,
      careRecommendations: recommendations,
    };
  }

  // --- API ENDPOINTS ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get patients with search & filtering
  app.get('/api/patients', (req, res) => {
    const { search, riskTier, department, doctorId } = req.query;
    let filtered = [...patientsStore];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.medicalRecordNumber.toLowerCase().includes(q) ||
          p.primaryDiagnosis.toLowerCase().includes(q)
      );
    }

    if (riskTier && typeof riskTier === 'string' && riskTier !== 'All') {
      filtered = filtered.filter((p) => p.riskTier === riskTier);
    }

    if (department && typeof department === 'string' && department !== 'All') {
      filtered = filtered.filter((p) => p.department === department);
    }

    if (doctorId && typeof doctorId === 'string' && doctorId !== 'All') {
      filtered = filtered.filter((p) => p.assignedDoctorId === doctorId);
    }

    res.json({ patients: filtered, count: filtered.length });
  });

  // Get single patient detail
  app.get('/api/patients/:id', (req, res) => {
    const patient = patientsStore.find((p) => p.id === req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient record not found' });
    }
    res.json({ patient });
  });

  // Add or update patient record
  app.post('/api/patients', (req, res) => {
    const data = req.body;
    const existingIndex = patientsStore.findIndex((p) => p.id === data.id);

    const calculatedRisk = calculateMLRiskScore(data);

    const updatedPatient: PatientRecord = {
      id: data.id || `PAT-${Math.floor(10000 + Math.random() * 90000)}`,
      medicalRecordNumber: data.medicalRecordNumber || `MRN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: data.name || 'Anonymous Patient',
      age: data.age || '[60-70)',
      gender: data.gender || 'Male',
      race: data.race || 'Caucasian',
      admissionType: data.admissionType || 'Emergency',
      dischargeDisposition: data.dischargeDisposition || 'Discharged to Home',
      admissionSource: data.admissionSource || 'Emergency Room',
      timeInHospital: Number(data.timeInHospital || 4),
      numLabProcedures: Number(data.numLabProcedures || 40),
      numProcedures: Number(data.numProcedures || 1),
      numMedications: Number(data.numMedications || 15),
      numOutpatientVisits: Number(data.numOutpatientVisits || 0),
      numInpatientVisits: Number(data.numInpatientVisits || 0),
      numEmergencyVisits: Number(data.numEmergencyVisits || 0),
      primaryDiagnosis: data.primaryDiagnosis || '250.00 - Type 2 Diabetes Mellitus',
      secondaryDiagnosis1: data.secondaryDiagnosis1 || '',
      secondaryDiagnosis2: data.secondaryDiagnosis2 || '',
      glucoseTest: data.glucoseTest || 'Normal',
      a1cResult: data.a1cResult || 'Normal',
      medications: data.medications || {
        insulin: 'Steady',
        metformin: 'Steady',
        glipizide: 'No',
        glyburide: 'No',
        changeInDiabetesMed: 'No',
        diabetesMedPrescribed: 'Yes',
      },
      department: data.department || 'Endocrinology',
      assignedDoctor: data.assignedDoctor || 'Dr. Sarah Lin, MD',
      assignedDoctorId: data.assignedDoctorId || 'u-doc-1',
      admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
      riskScore: calculatedRisk.riskScore,
      riskTier: calculatedRisk.riskTier,
      readmissionLikelihood: calculatedRisk.readmissionLikelihood,
      readmissionProbability: calculatedRisk.readmissionProbability,
      riskFactors: calculatedRisk.riskFactors,
      careRecommendations: calculatedRisk.careRecommendations,
      dischargeReadinessScore: calculatedRisk.dischargeReadinessScore,
      lastAssessmentDate: new Date().toISOString().split('T')[0],
    };

    if (existingIndex >= 0) {
      patientsStore[existingIndex] = updatedPatient;
    } else {
      patientsStore.unshift(updatedPatient);
    }

    auditLogsStore.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: 'doctor@healthforecast.ai',
      userName: 'Dr. Sarah Lin, MD',
      userRole: 'doctor',
      action: existingIndex >= 0 ? 'Patient Record Updated' : 'New Patient Intake Created',
      targetPatientId: updatedPatient.id,
      details: `Updated risk profile for ${updatedPatient.name} (Risk Score: ${updatedPatient.riskScore}%)`,
    });

    res.json({ success: true, patient: updatedPatient });
  });

  // Calculate live ML risk prediction without saving
  app.post('/api/predict-risk', (req, res) => {
    const patientData = req.body;
    const riskResult = calculateMLRiskScore(patientData);
    res.json({ success: true, prediction: riskResult });
  });

  // Analytics endpoint
  app.get('/api/analytics', (req, res) => {
    res.json({
      analytics: HOSPITAL_ANALYTICS,
      treatmentOutcomes: TREATMENT_OUTCOMES,
    });
  });

  // Model MLOps management endpoint
  app.get('/api/model-metrics', (req, res) => {
    res.json({ model: MODEL_METRICS });
  });

  // Trigger model retraining simulation
  app.post('/api/model-retrain', (req, res) => {
    const newMetrics = {
      ...MODEL_METRICS,
      accuracy: 0.892,
      rocAuc: 0.921,
      lastTrained: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    };

    auditLogsStore.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: 'alex.mercer@healthforecast.ai',
      userName: 'Alex Mercer',
      userRole: 'sysadmin',
      action: 'AI Model Retrained',
      details: 'Retrained XGBoost-ReadmitNet model on 101,766 encounters. ROC-AUC improved to 0.921.',
    });

    res.json({ success: true, message: 'Model retrained and deployed successfully', metrics: newMetrics });
  });

  // Audit logs endpoint
  app.get('/api/audit-logs', (req, res) => {
    res.json({ logs: auditLogsStore });
  });

  // Gemini Clinical Decision Support Endpoint
  app.post('/api/gemini/clinical-assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
      }

      const { patient, prompt, mode } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let systemInstruction = `You are HealthForecast AI, an expert clinical decision support assistant specialized in hospital readmission prevention, endocrinology, and inpatient diabetes management based on the Diabetes 130-US Hospitals dataset standards. Provide concise, high-value clinical guidance, risk factor analysis, and evidence-based post-discharge recommendations. Always organize your advice with bullet points and clear sections.`;

      let userMessage = prompt;

      if (mode === 'care_plan' && patient) {
        userMessage = `Generate a targeted 30-Day Hospital Readmission Prevention & Care Plan for patient:
Name: ${patient.name}
Age: ${patient.age}, Gender: ${patient.gender}, Race: ${patient.race}
Primary Diagnosis: ${patient.primaryDiagnosis}
Secondary Diagnoses: ${patient.secondaryDiagnosis1 || 'None'}, ${patient.secondaryDiagnosis2 || 'None'}
Hospital Stay: ${patient.timeInHospital} days | Lab Procedures: ${patient.numLabProcedures} | Meds: ${patient.numMedications}
Prior Stays: ${patient.numInpatientVisits} Inpatient, ${patient.numEmergencyVisits} ER, ${patient.numOutpatientVisits} Outpatient
Glucose Test: ${patient.glucoseTest}, HbA1c: ${patient.a1cResult}
Medications: Insulin (${patient.medications?.insulin}), Metformin (${patient.medications?.metformin})
AI Risk Score: ${patient.riskScore}% (${patient.riskTier} Tier, Likelihood: ${patient.readmissionLikelihood})

Include:
1. Primary Clinical Risk Drivers
2. Medication Reconciliation & Titration Strategy
3. Post-Discharge Follow-up Timeline (48h, 7d, 30d)
4. Red Flag Warnings & Early Warning Indicators for Home Health Nursing`;
      } else if (mode === 'discharge_readiness' && patient) {
        userMessage = `Evaluate Discharge Readiness & Risk Mitigation Checklist for patient ${patient.name} (Risk Score: ${patient.riskScore}%, Discharge Readiness Score: ${patient.dischargeReadinessScore}%). Provide a 5-step clinical clearance checklist prior to releasing the patient.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({
        text: response.text,
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate clinical insights with Gemini' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthForecast AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
