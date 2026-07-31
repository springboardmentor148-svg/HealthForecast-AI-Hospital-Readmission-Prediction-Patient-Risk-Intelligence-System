import API from "./api";

export const predictPatient = async (patientData) => {
    const response = await API.post("/prediction/predict", patientData);
    return response.data;
};

export const getPredictionHistory = async () => {
    const response = await API.get("/prediction/history");
    return response.data;
};