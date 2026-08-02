import axios from "axios";
import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/medical-history`;

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getMedicalHistoryByPatient = async (patientId) => {
    const response = await axios.get(`${BASE_URL}/patient/${patientId}`, {
        headers: authHeaders(),
    });
    return response.data;
};

export const addMedicalHistory = async (historyData) => {
    const response = await axios.post(`${BASE_URL}/`, historyData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const updateMedicalHistory = async (historyId, historyData) => {
    const response = await axios.put(`${BASE_URL}/${historyId}`, historyData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const deleteMedicalHistory = async (historyId) => {
    const response = await axios.delete(`${BASE_URL}/${historyId}`, {
        headers: authHeaders(),
    });
    return response.data;
};