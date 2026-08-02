// Import axios library to make HTTP requests
import axios from "axios";
import { API_BASE_URL } from "../config";

// Create one axios instance
// This saves us from writing the backend URL every time.
const API = axios.create({

    // FastAPI Backend URL
    baseURL: API_BASE_URL

});

// Automatically attach the JWT token (if present) to every outgoing request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Export this API object so it can be used anywhere
export default API;