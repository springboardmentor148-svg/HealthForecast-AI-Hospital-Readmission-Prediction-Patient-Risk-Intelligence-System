import api from "./api";

const authService = {

    async login(data) {
        return await api.post("/login", data);
    },

    async register(data) {
        return await api.post("/register", data);
    },

    async getCurrentUser() {
        return await api.get("/me");
    },

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }

};

export default authService;