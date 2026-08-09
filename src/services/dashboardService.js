import api from "./api";

const dashboardService = {

    async getDashboard() {

        return await api.get("/dashboard");

    }

};

export default dashboardService;