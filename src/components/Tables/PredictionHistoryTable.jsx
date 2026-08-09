import "./PredictionHistoryTable.css";

import { useEffect, useState } from "react";

import { toast } from "react-hot-toast";

import predictionService from "../../services/predictionService";

import {

    FaEye,

    FaDownload

} from "react-icons/fa";

export default function PredictionHistoryTable({

    search,

    risk,

    doctor,

    date

}) {

    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadHistory();

    }, []);

    const loadHistory = async () => {

        try {

            const response = await predictionService.getPredictions();

            setHistory(response.data);

        }

        catch (error) {

            console.log(error);

            toast.error("Unable to load prediction history");

        }

        finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (

            <h3 className="text-center mt-5">

                Loading Prediction History...

            </h3>

        );

    }

    const filteredHistory = history.filter((item) => {

        const patientMatch =

            search === "" ||

            item.patient_id

                .toString()

                .includes(search);

        const riskMatch =

            risk === "All" ||

            item.risk_level === risk;

        const doctorMatch =

            doctor === "All" ||

            item.predicted_by === doctor;

        const dateMatch =

            date === "" ||

            item.prediction_time.startsWith(date);

        return (

            patientMatch &&

            riskMatch &&

            doctorMatch &&

            dateMatch

        );

    });

    return (

        <div className="historyTableCard">

            <table className="historyTable">

                <thead>

                    <tr>

                        <th>Date</th>

                        <th>Patient ID</th>

                        <th>Prediction</th>

                        <th>Probability</th>

                        <th>Risk</th>

                        <th>Doctor</th>

                        <th>Confidence</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        filteredHistory.map((item) => (

                            <tr

                                key={item.prediction_id}

                            >

                                <td>

                                    {

                                        new Date(

                                            item.prediction_time

                                        ).toLocaleDateString()

                                    }

                                </td>

                                <td>

                                    {item.patient_id}

                                </td>

                                <td>

                                    {

                                        item.predicted_class === 1

                                        ?

                                        "Readmitted"

                                        :

                                        "Not Readmitted"

                                    }

                                </td>

                                <td>

                                    {

                                        Number(

                                            item.probability

                                        ).toFixed(2)

                                    }%

                                </td>

                                <td>

                                    <span

                                        className={`riskBadge ${item.risk_level.toLowerCase().replace(/\s/g,"")}`}

                                    >

                                        {item.risk_level}

                                    </span>

                                </td>

                                <td>

                                    {item.predicted_by}

                                </td>

                                <td>

                                    {item.confidence}

                                </td>

                                <td>

                                    <div className="tableActions">

                                        <button

                                            onClick={() =>

                                                alert(

                                                    item.recommendation.join("\n")

                                                )

                                            }

                                        >

                                            <FaEye/>

                                        </button>

                                        <button>

                                            <FaDownload/>

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

            <div className="pagination">

                <button>

                    Previous

                </button>

                <span>

                    {filteredHistory.length} Predictions

                </span>

                <button>

                    Next

                </button>

            </div>

        </div>

    );

}