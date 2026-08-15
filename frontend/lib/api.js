// ============================================================
// API CONFIGURATION
// ============================================================

import { getToken } from "./auth";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";


// ============================================================
// COMMON API REQUEST
// ============================================================

async function apiRequest(
  endpoint,
  options = {}
) {

  const token = getToken();


  const headers = {

    "Content-Type":
      "application/json",

    ...(options.headers || {}),

  };


  // ----------------------------------------------------------
  // JWT AUTHENTICATION
  // ----------------------------------------------------------

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


  // ----------------------------------------------------------
  // SEND REQUEST
  // ----------------------------------------------------------

  const response = await fetch(

    `${API_URL}${endpoint}`,

    {

      ...options,

      headers,

    }

  );


  // ----------------------------------------------------------
  // AUTH ERROR
  // ----------------------------------------------------------

  if (
    response.status === 401
  ) {

    throw new Error(
      "Not authenticated. Please login again."
    );

  }


  // ----------------------------------------------------------
  // READ RESPONSE
  // ----------------------------------------------------------

  let data = null;


  try {

    data =
      await response.json();

  } catch (error) {

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

// ------------------------------------------------------------
// GET ALL USERS
// ------------------------------------------------------------

export async function getUsers() {

  return apiRequest(

    "/users/",

    {
      method: "GET",
    }

  );

}


// ------------------------------------------------------------
// GET ONE USER
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// GET ALL PATIENTS
// ------------------------------------------------------------

export async function getPatients() {

  return apiRequest(

    "/patients/",

    {

      method: "GET",

    }

  );

}


// ------------------------------------------------------------
// GET ONE PATIENT
// ------------------------------------------------------------

export async function getPatient(
  patientId
) {

  return apiRequest(

    `/patients/${patientId}`,

    {

      method: "GET",

    }

  );

}


// ------------------------------------------------------------
// ADD PATIENT
// ------------------------------------------------------------

export async function addPatient(
  patientData
) {

  return apiRequest(

    "/patients/",

    {

      method: "POST",

      body:
        JSON.stringify(
          patientData
        ),

    }

  );

}


// ------------------------------------------------------------
// UPDATE PATIENT
// ------------------------------------------------------------

export async function updatePatient(

  patientId,

  patientData

) {

  return apiRequest(

    `/patients/${patientId}`,

    {

      method: "PUT",

      body:
        JSON.stringify(
          patientData
        ),

    }

  );

}


// ------------------------------------------------------------
// DELETE PATIENT
// ------------------------------------------------------------

export async function deletePatient(
  patientId
) {

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


// ------------------------------------------------------------
// GET ALL PREDICTIONS
// ------------------------------------------------------------

export async function getPredictions() {

  return apiRequest(

    "/predictions/predictions/",

    {

      method: "GET",

    }

  );

}


// ------------------------------------------------------------
// GENERATE PREDICTION
// ------------------------------------------------------------

export async function generatePrediction(

  predictionData

) {

  return apiRequest(

    "/predictions/predictions/",

    {

      method: "POST",

      body:
        JSON.stringify(
          predictionData
        ),

    }

  );

}


// ------------------------------------------------------------
// GET PATIENT PREDICTIONS
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// GET ALL TREATMENTS
// ------------------------------------------------------------

// ------------------------------------------------------------
// GET ALL TREATMENTS
// ------------------------------------------------------------

export async function getTreatments() {

  return apiRequest(

    "/treatments/treatments/",

    {

      method: "GET",

    }

  );

}


// ------------------------------------------------------------
// GET TREATMENTS FOR ONE PATIENT
// ------------------------------------------------------------

export async function getPatientTreatments(

  patientId

) {

  return apiRequest(

    `/treatments/treatments/patient/${patientId}`,

    {

      method: "GET",

    }

  );

}


// ------------------------------------------------------------
// CREATE / ADD TREATMENT
// ------------------------------------------------------------

export async function addTreatment(

  treatmentData

) {

  return apiRequest(

    "/treatments/treatments/",

    {

      method: "POST",

      body:
        JSON.stringify(
          treatmentData
        ),

    }

  );
}
// ============================================================
// HOSPITAL ADMIN ANALYTICS APIs
// ============================================================

// ------------------------------------------------------------
// GET ALL PATIENTS
// ------------------------------------------------------------

export async function getHospitalPatients() {
  return apiRequest(
    "/patients/",
    {
      method: "GET",
    }
  );
}


// ------------------------------------------------------------
// GET ALL PREDICTIONS
// ------------------------------------------------------------

export async function getHospitalPredictions() {
  return apiRequest(
    "/predictions/predictions/",
    {
      method: "GET",
    }
  );
}


// ------------------------------------------------------------
// GET ALL TREATMENTS
// ------------------------------------------------------------

export async function getHospitalTreatments() {
  return apiRequest(
    "/treatments/treatments/",
    {
      method: "GET",
    }
  );
}

// ============================================================
// MODEL INSIGHTS API
// ============================================================


// ------------------------------------------------------------
// GET REAL CATBOOST MODEL INFORMATION
// ------------------------------------------------------------

export async function getModelInsights() {

  return apiRequest(

    "/models/insights",

    {

      method: "GET",

    }

  );

}


// ============================================================
// EXPORT
// ============================================================

export default {

  getPatients,

  getPatient,

  addPatient,

  updatePatient,

  deletePatient,

  getPredictions,

  generatePrediction,

  getPatientPredictions,
  getTreatments,

  getPatientTreatments,

  addTreatment,

  getModelInsights,
  getHospitalPatients,
  getHospitalPredictions,
  getHospitalTreatments,


};