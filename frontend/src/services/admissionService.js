import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/admissions";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getAdmissionsByPatient = async (patientId) => {
    const response = await axios.get(`${BASE_URL}/patient/${patientId}`, {
        headers: authHeaders(),
    });
    return response.data;
};

export const addAdmission = async (admissionData) => {
    const response = await axios.post(`${BASE_URL}/`, admissionData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const updateAdmission = async (admissionId, admissionData) => {
    const response = await axios.put(`${BASE_URL}/${admissionId}`, admissionData, {
        headers: authHeaders(),
    });
    return response.data;
};

export const deleteAdmission = async (admissionId) => {
    const response = await axios.delete(`${BASE_URL}/${admissionId}`, {
        headers: authHeaders(),
    });
    return response.data;
};