import api from "./api";

const patientService = {

    getPatients() {

        return api.get("/patients");

    },

    getPatient(id) {

        return api.get(`/patients/${id}`);

    },

    addPatient(data) {

        return api.post("/patients", data);

    },

    updatePatient(id, data) {

        return api.put(`/patients/${id}`, data);

    },

    deletePatient(id) {

        return api.delete(`/patients/${id}`);

    }

};

export default patientService;