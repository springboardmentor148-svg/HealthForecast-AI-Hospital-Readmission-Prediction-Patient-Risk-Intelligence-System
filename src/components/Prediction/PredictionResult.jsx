import "./PredictionResult.css";

import {
    FaRobot,
    FaExclamationTriangle,
    FaDownload,
    FaSave,
    FaCheckCircle
} from "react-icons/fa";

export default function PredictionResult() {

    const featureImportance = [

        {
            feature:"Age",
            value:32
        },

        {
            feature:"Creatinine",
            value:24
        },

        {
            feature:"Diabetes",
            value:18
        },

        {
            feature:"Blood Pressure",
            value:14
        },

        {
            feature:"Previous Admission",
            value:12
        }

    ];

    return(

        <div className="predictionResult">

            {/* Top */}

            <div className="resultHeader">

                <FaRobot className="robot"/>

                <div>

                    <h2>

                        AI Prediction Result

                    </h2>

                    <p>

                        Hospital Readmission Prediction

                    </p>

                </div>

            </div>

            {/* Stats */}

            <div className="resultCards">

                <div className="resultBox">

                    <h5>

                        Readmission Probability

                    </h5>

                    <h1>

                        91.6%

                    </h1>

                </div>

                <div className="resultBox danger">

                    <FaExclamationTriangle/>

                    <h3>

                        HIGH RISK

                    </h3>

                </div>

                <div className="resultBox">

                    <h5>

                        Confidence Score

                    </h5>

                    <h1>

                        96.8%

                    </h1>

                </div>

            </div>

            {/* Recommendations */}

            <div className="recommendationCard">

                <h3>

                    AI Recommendations

                </h3>

                <ul>

                    <li>

                        <FaCheckCircle/>

                        Schedule follow-up within 7 days

                    </li>

                    <li>

                        <FaCheckCircle/>

                        Review prescribed medications

                    </li>

                    <li>

                        <FaCheckCircle/>

                        Monitor blood glucose daily

                    </li>

                    <li>

                        <FaCheckCircle/>

                        Recommend cardiology consultation

                    </li>

                </ul>

            </div>

            {/* Feature Importance */}

            <div className="featureCard">

                <h3>

                    Feature Importance

                </h3>

                {

                    featureImportance.map((item,index)=>(

                        <div
                            className="featureRow"
                            key={index}
                        >

                            <span>

                                {item.feature}

                            </span>

                            <div className="progress">

                                <div

                                    className="progressBar"

                                    style={{
                                        width:`${item.value}%`
                                    }}

                                />

                            </div>

                            <strong>

                                {item.value}%

                            </strong>

                        </div>

                    ))

                }

            </div>

            {/* Buttons */}

            <div className="resultButtons">

                <button className="download">

                    <FaDownload/>

                    Download PDF

                </button>

                <button className="save">

                    <FaSave/>

                    Save Prediction

                </button>

            </div>

        </div>

    );

}