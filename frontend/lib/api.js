// ============================================================
// HEALTHFORECAST AI
// FRONTEND API CONFIGURATION
// ============================================================

import { getToken } from "./auth";

// ============================================================
// API BASE 
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://healthforecast-ai-hospital-readmission-mj5q.onrender.com";

// ============================================================
// COMMON API REQUEST
// ============================================================

async function apiRequest(endpoint, options = {}) {

  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // ----------------------------------------------------------
  // JWT AUTHENTICATION
  // ----------------------------------------------------------

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // ----------------------------------------------------------
  // REQUEST
  // ----------------------------------------------------------

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  // ----------------------------------------------------------
  // AUTHENTICATION ERROR
  // ----------------------------------------------------------

  if (response.status === 401) {

    throw new Error(
      "Not authenticated. Please login again."
    );

  }

  // ----------------------------------------------------------
  // READ RESPONSE
  // ----------------------------------------------------------

  let data = null;

  try {

    data = await response.json();

  } catch {

    data = null;

  }

  // ----------------------------------------------------------
  // API ERROR
  // ----------------------------------------------------------

  if (!response.ok) {

    throw new Error(

      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`

    );

  }

  return data;
}


// ============================================================
// USER APIs
// ============================================================

// GET ALL USERS

export async function getUsers() {

  return apiRequest(
    "/users/",
    {
      method: "GET",
    }
  );

}


// GET ONE USER

export async function getUser(userId) {

  return apiRequest(
    `/users/${userId}`,
    {
      method: "GET",
    }
  );

}


// ============================================================
// PATIENT APIs
// ============================================================

// GET ALL PATIENTS

export async function getPatients() {

  return apiRequest(
    "/patients/",
    {
      method: "GET",
    }
  );

}


// GET ONE PATIENT

export async function getPatient(patientId) {

  return apiRequest(
    `/patients/${patientId}`,
    {
      method: "GET",
    }
  );

}


// ADD PATIENT

export async function addPatient(patientData) {

  return apiRequest(
    "/patients/",
    {
      method: "POST",
      body: JSON.stringify(patientData),
    }
  );

}


// UPDATE PATIENT

export async function updatePatient(
  patientId,
  patientData
) {

  return apiRequest(
    `/patients/${patientId}`,
    {
      method: "PUT",
      body: JSON.stringify(patientData),
    }
  );

}


// DELETE PATIENT

export async function deletePatient(patientId) {

  return apiRequest(
    `/patients/${patientId}`,
    {
      method: "DELETE",
    }
  );

}


// ============================================================
// PREDICTION APIs
// ============================================================

// GET ALL PREDICTIONS

export async function getPredictions() {

  return apiRequest(
    "/predictions/predictions/",
    {
      method: "GET",
    }
  );

}


// GENERATE PREDICTION

export async function generatePrediction(
  predictionData
) {

  return apiRequest(
    "/predictions/predictions/",
    {
      method: "POST",
      body: JSON.stringify(predictionData),
    }
  );

}


// GET PATIENT PREDICTIONS

export async function getPatientPredictions(
  patientId
) {

  return apiRequest(
    `/predictions/patient/${patientId}`,
    {
      method: "GET",
    }
  );

}


// ============================================================
// TREATMENT APIs
// ============================================================

// IMPORTANT:
// Backend treatments router uses:
// prefix="/treatments"
// route="/"
// Therefore the actual URL is:
//
// /treatments/treatments/
//
// FastAPI may redirect this to:
//
// /treatments/treatments
//
// We keep the standard trailing slash here.


// GET ALL TREATMENTS

export async function getTreatments() {

  return apiRequest(
    "/treatments",
    {
      method: "GET",
    }
  );

}


// GET TREATMENTS FOR ONE PATIENT

export async function getPatientTreatments(
  patientId
) {

  return apiRequest(
    `/treatment/patient/${patientId}`,
    {
      method: "GET",
    }
  );

}


// CREATE TREATMENT

export async function addTreatment(
  treatmentData
) {

  return apiRequest(
    "/treatments/",
    {
      method: "POST",
      body: JSON.stringify(treatmentData),
    }
  );

}


// ============================================================
// HOSPITAL ADMIN ANALYTICS APIs
// ============================================================

// GET ALL HOSPITAL PATIENTS

export async function getHospitalPatients() {

  return apiRequest(
    "/patients/",
    {
      method: "GET",
    }
  );

}


// GET ALL HOSPITAL PREDICTIONS

export async function getHospitalPredictions() {

  return apiRequest(
    "/predictions/predictions/",
    {
      method: "GET",
    }
  );

}


// GET ALL HOSPITAL TREATMENTS

export async function getHospitalTreatments() {

  return apiRequest(
    "/treatments/",
    {
      method: "GET",
    }
  );

}


// ============================================================
// ANALYTICS APIs
// ============================================================

// PREDICTION SUMMARY

export async function getAnalyticsSummary() {

  return apiRequest(
    "/analytics/summary",
    {
      method: "GET",
    }
  );

}


// RISK DISTRIBUTION

export async function getRiskDistribution() {

  return apiRequest(
    "/analytics/risk-distribution",
    {
      method: "GET",
    }
  );

}


// MODEL PERFORMANCE

export async function getModelPerformance() {

  return apiRequest(
    "/analytics/model-performance",
    {
      method: "GET",
    }
  );

}


// ============================================================
// MODEL INSIGHTS API
// ============================================================

export async function getModelInsights() {

  return apiRequest(
    "/models/insights",
    {
      method: "GET",
    }
  );

}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {

  // Users
  getUsers,
  getUser,

  // Patients
  getPatients,
  getPatient,
  addPatient,
  updatePatient,
  deletePatient,

  // Predictions
  getPredictions,
  generatePrediction,
  getPatientPredictions,

  // Treatments
  getTreatments,
  getPatientTreatments,
  addTreatment,

  // Hospital Admin
  getHospitalPatients,
  getHospitalPredictions,
  getHospitalTreatments,

  // Analytics
  getAnalyticsSummary,
  getRiskDistribution,
  getModelPerformance,

  // Model
  getModelInsights,

};