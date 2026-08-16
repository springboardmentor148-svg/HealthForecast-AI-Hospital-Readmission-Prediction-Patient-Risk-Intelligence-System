import axios from "axios";

const authApiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export async function registerUser(payload) {
  try {
    const response = await authApiClient.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    }
    throw new Error("Registration failed. Please try again.");
  }
}

export async function loginUser(payload) {
  try {
    const response = await authApiClient.post("/auth/login", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    }
    throw new Error("Login failed. Please check your credentials.");
  }
}

export async function verifyOtp(payload) {
  try {
    const response = await authApiClient.post("/auth/verify-otp", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    }
    throw new Error("Failed to verify code. Please try again.");
  }
}

export async function resendOtp(payload) {
  try {
    const response = await authApiClient.post("/auth/resend-otp", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    }
    throw new Error("Failed to resend code. Please try again.");
  }
}