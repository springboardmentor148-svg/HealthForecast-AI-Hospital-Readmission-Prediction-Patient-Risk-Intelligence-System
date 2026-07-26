// import axios from "axios";

// const API_URL = "http://127.0.0.1:8000/prediction/predict";

// export const predictPatient = async (patientData) => {
//     const token = localStorage.getItem("token");

//     const response = await axios.post(API_URL, patientData, {
//         headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//         },
//     });

//     return response.data;
// };





// import axios from "axios";

// const BASE_URL = "http://127.0.0.1:8000/prediction";

// export const predictPatient = async (patientData) => {
//     const token = localStorage.getItem("token");

//     const response = await axios.post(`${BASE_URL}/predict`, patientData, {
//         headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//         },
//     });

//     return response.data;
// };

// export const getPredictionHistory = async () => {
//     const token = localStorage.getItem("token");

//     const response = await axios.get(`${BASE_URL}/history`, {
//         headers: {
//             Authorization: `Bearer ${token}`,
//         },
//     });

//     return response.data;
// };




import API from "./api";

export const predictPatient = async (patientData) => {
    const response = await API.post("/prediction/predict", patientData);
    return response.data;
};

export const getPredictionHistory = async () => {
    const response = await API.get("/prediction/history");
    return response.data;
};