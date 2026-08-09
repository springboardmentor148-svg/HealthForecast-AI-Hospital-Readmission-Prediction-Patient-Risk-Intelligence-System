import "./RecentPredictionTable.css";

import {
    FaEye,
    FaDownload,
    FaTrash,
    FaSearch
} from "react-icons/fa";

function RecentPredictionTable() {

    const data = [

        {
            patient:"John Doe",
            age:65,
            disease:"Diabetes",
            risk:"High",
            probability:"91%",
            doctor:"Dr Rahul"
        },

        {
            patient:"Sarah Smith",
            age:54,
            disease:"Hypertension",
            risk:"Medium",
            probability:"67%",
            doctor:"Dr Rahul"
        },

        {
            patient:"Alex Brown",
            age:70,
            disease:"Heart Disease",
            risk:"High",
            probability:"88%",
            doctor:"Dr Rahul"
        },

        {
            patient:"Robert Lee",
            age:45,
            disease:"Asthma",
            risk:"Low",
            probability:"23%",
            doctor:"Dr Rahul"
        }

    ];

    return (

        <div className="predictionTable">

            <div className="tableHeader">



                <div className="tableSearch">

                    <FaSearch/>

                    <input

                        placeholder="Search patient..."

                    />

                </div>

            </div>

            <table className="table align-middle">

                <thead>

                    <tr>

                        <th>Patient</th>

                        <th>Age</th>

                        <th>Disease</th>

                        <th>Probability</th>

                        <th>Risk</th>

                        <th>Doctor</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        data.map((item,index)=>(

                            <tr key={index}>

                                <td>

                                    {item.patient}

                                </td>

                                <td>

                                    {item.age}

                                </td>

                                <td>

                                    {item.disease}

                                </td>

                                <td>

                                    {item.probability}

                                </td>

                                <td>

                                    <span className={`badgeRisk ${item.risk.toLowerCase()}`}>

                                        {item.risk}

                                    </span>

                                </td>

                                <td>

                                    {item.doctor}

                                </td>

                                <td>

                                    <div className="actions">

                                        <button>

                                            <FaEye/>

                                        </button>

                                        <button>

                                            <FaDownload/>

                                        </button>

                                        <button>

                                            <FaTrash/>

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default RecentPredictionTable;