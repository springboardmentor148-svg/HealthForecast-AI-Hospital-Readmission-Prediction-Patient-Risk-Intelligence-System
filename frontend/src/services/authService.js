// Import API instance
import API from "./api";

// Login Function
export const loginUser = async (email, password) => {

    // Send JSON request
    const response = await API.post(
        "/auth/login",
        {
            email,
            password
        }
    );

    return response.data;
};


// Register Function
export const registerUser = async (userData) => {
    const response = await API.post("/auth/register", userData);
    return response.data;
};


// Get Logged-in Doctor's Profile
export const getProfile = async () => {
    const response = await API.get("/auth/me");
    return response.data;
};


// Update Logged-in Doctor's Profile
export const updateProfile = async (profileData) => {
    const response = await API.put("/auth/me", profileData);
    return response.data;
};