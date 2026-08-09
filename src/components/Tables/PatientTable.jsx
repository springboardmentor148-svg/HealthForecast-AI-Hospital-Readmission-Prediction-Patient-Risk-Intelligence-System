import "./PatientTable.css";

import {
    FaEye,
    FaEdit,
    FaTrash
} from "react-icons/fa";

export default function PatientTable({

    search,
    riskFilter,
    genderFilter,
    statusFilter

}) {

    const patients = [

        {
            id:"P001",
            name:"Rahul Sharma",
            age:56,
            gender:"Male",
            disease:"Diabetes",
            prediction:"91%",
            risk:"High",
            status:"Active"
        },

        {
            id:"P002",
            name:"Priya Patel",
            age:63,
            gender:"Female",
            disease:"Heart Disease",
            prediction:"84%",
            risk:"High",
            status:"Active"
        },

        {
            id:"P003",
            name:"Amit Kumar",
            age:45,
            gender:"Male",
            disease:"Asthma",
            prediction:"25%",
            risk:"Low",
            status:"Active"
        },

        {
            id:"P004",
            name:"Sara Khan",
            age:38,
            gender:"Female",
            disease:"Kidney Disease",
            prediction:"54%",
            risk:"Medium",
            status:"Inactive"
        },

        {
            id:"P005",
            name:"John David",
            age:60,
            gender:"Male",
            disease:"Hypertension",
            prediction:"73%",
            risk:"Medium",
            status:"Active"
        },

        {
            id:"P006",
            name:"Rohan Singh",
            age:51,
            gender:"Male",
            disease:"Stroke",
            prediction:"89%",
            risk:"High",
            status:"Active"
        }

    ];

    const filtered = patients.filter((patient)=>{

        const searchMatch = patient.name
        .toLowerCase()
        .includes(search.toLowerCase());

        const riskMatch =
        riskFilter==="All" ||
        patient.risk===riskFilter;

        const genderMatch =
        genderFilter==="All" ||
        patient.gender===genderFilter;

        const statusMatch =
        statusFilter==="All" ||
        patient.status===statusFilter;

        return(
            searchMatch &&
            riskMatch &&
            genderMatch &&
            statusMatch
        );

    });

    return(

        <div className="patientTable">

            <table className="table align-middle">

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Patient</th>

                        <th>Age</th>

                        <th>Gender</th>

                        <th>Disease</th>

                        <th>Prediction</th>

                        <th>Risk</th>

                        <th>Status</th>

                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        filtered.map((patient)=>(

                            <tr key={patient.id}>

                                <td>

                                    {patient.id}

                                </td>

                                <td>

                                    <div className="patientName">

                                        <img
                                            src={`https://ui-avatars.com/api/?name=${patient.name}&background=2563EB&color=fff`}
                                            alt={patient.name}
                                        />

                                        <span>

                                            {patient.name}

                                        </span>

                                    </div>

                                </td>

                                <td>

                                    {patient.age}

                                </td>

                                <td>

                                    {patient.gender}

                                </td>

                                <td>

                                    {patient.disease}

                                </td>

                                <td>

                                    {patient.prediction}

                                </td>

                                <td>

                                    <span className={`risk ${patient.risk.toLowerCase()}`}>

                                        {patient.risk}

                                    </span>

                                </td>

                                <td>

                                    <span className={`status ${patient.status.toLowerCase()}`}>

                                        {patient.status}

                                    </span>

                                </td>

                                <td>

                                    <div className="actions">

                                        <button className="view">

                                            <FaEye/>

                                        </button>

                                        <button className="edit">

                                            <FaEdit/>

                                        </button>

                                        <button className="delete">

                                            <FaTrash/>

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

            <div className="paginationArea">

                <span>

                    Showing 1 - {filtered.length} of {patients.length} Patients

                </span>

                <div className="pages">

                    <button>

                        Previous

                    </button>

                    <button className="active">

                        1

                    </button>

                    <button>

                        Next

                    </button>

                </div>

            </div>

        </div>

    );

}