import api from "./api";

const predictionService = {

    predict(data) {

        return api.post("/predict", data);

    },

    getPredictions() {

        return api.get("/predictions");

    }

};

export default predictionService;