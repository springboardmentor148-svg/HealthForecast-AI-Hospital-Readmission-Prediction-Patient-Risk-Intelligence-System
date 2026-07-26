import API from "./api";

export const getPatients = async () => {
    const response = await API.get("/patients/");
    return response.data;
};

export const addPatient = async (patientData) => {
    const response = await API.post("/patients/", patientData);
    return response.data;
};

export const updatePatient = async (patientId, patientData) => {
    const response = await API.put(`/patients/${patientId}`, patientData);
    return response.data;
};

export const deletePatient = async (patientId) => {
    const response = await API.delete(`/patients/${patientId}`);
    return response.data;
};