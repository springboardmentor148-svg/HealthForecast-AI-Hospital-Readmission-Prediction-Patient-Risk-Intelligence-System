import "./PredictionHistory.css";

import { useState } from "react";

import { FaDownload, FaSearch } from "react-icons/fa";

import PredictionHistoryTable from "../../components/Tables/PredictionHistoryTable";

export default function PredictionHistory() {

    const [search, setSearch] = useState("");

    const [risk, setRisk] = useState("All");

    const [doctor, setDoctor] = useState("All");

    const [date, setDate] = useState("");

    return (

        <div className="historyPage">

            {/* Header */}

            <div className="historyHeader">

                <div>

                    <h2>

                        Prediction History

                    </h2>

                    <p>

                        View all previous AI generated readmission predictions.

                    </p>

                </div>

                <button className="exportHistory">

                    <FaDownload />

                    Export History

                </button>

            </div>

            {/* Toolbar */}

            <div className="historyToolbar">

                <div className="historySearch">

                    <FaSearch />

                    <input

                        type="text"

                        placeholder="Search Patient"

                        value={search}

                        onChange={(e) => setSearch(e.target.value)}

                    />

                </div>

                <select

                    value={risk}

                    onChange={(e) => setRisk(e.target.value)}

                >

                    <option value="All">All Risk</option>

                    <option value="High Risk">High Risk</option>

                    <option value="Medium Risk">Medium Risk</option>

                    <option value="Low Risk">Low Risk</option>

                </select>

                <select

                    value={doctor}

                    onChange={(e) => setDoctor(e.target.value)}

                >

                    <option value="All">All Doctors</option>

                </select>

                <input

                    type="date"

                    value={date}

                    onChange={(e) => setDate(e.target.value)}

                />

            </div>

            <PredictionHistoryTable

                search={search}

                risk={risk}

                doctor={doctor}

                date={date}

            />

        </div>

    );

}