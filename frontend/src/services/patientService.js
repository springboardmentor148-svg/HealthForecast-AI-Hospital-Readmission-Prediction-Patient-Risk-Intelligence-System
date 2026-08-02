import axios from "axios";
import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/patients`;

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getPatients = async () => {
    const response = await axios.get(`${BASE_URL}/`, {
        headers: authHeaders(),
    });
    return response.data;
};

export const addPatient = async (patientData) => {
    const response = await axios.post(`${BASE_URL}/`, patientData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const updatePatient = async (patientId, patientData) => {
    const response = await axios.put(`${BASE_URL}/${patientId}`, patientData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const deletePatient = async (patientId) => {
    const response = await axios.delete(`${BASE_URL}/${patientId}`, {
        headers: authHeaders(),
    });
    return response.data;
};