import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/treatments";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getTreatmentsByPatient = async (patientId) => {
    const response = await axios.get(`${BASE_URL}/patient/${patientId}`, {
        headers: authHeaders(),
    });
    return response.data;
};

export const getAllTreatments = async () => {
    const response = await axios.get(`${BASE_URL}/`, {
        headers: authHeaders(),
    });
    return response.data;
};

export const addTreatment = async (treatmentData) => {
    const response = await axios.post(`${BASE_URL}/`, treatmentData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const updateTreatment = async (treatmentId, treatmentData) => {
    const response = await axios.put(`${BASE_URL}/${treatmentId}`, treatmentData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const deleteTreatment = async (treatmentId) => {
    const response = await axios.delete(`${BASE_URL}/${treatmentId}`, {
        headers: authHeaders(),
    });
    return response.data;
};