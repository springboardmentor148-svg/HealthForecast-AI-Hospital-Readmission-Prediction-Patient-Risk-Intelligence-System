import "./Patients.css";

import { useState } from "react";

import {
    FaPlus,
    FaSearch,
    FaDownload
} from "react-icons/fa";

import PatientTable from "../../components/Tables/PatientTable";

export default function Patients() {

    const [search, setSearch] = useState("");

    const [riskFilter, setRiskFilter] = useState("All");

    const [genderFilter, setGenderFilter] = useState("All");

    const [statusFilter, setStatusFilter] = useState("All");

    return (

        <div className="patients-page">

            {/* Header */}

            <div className="patients-header">

                <div>

                    <h2>Patients Management</h2>

                    <p>
                        Manage all registered hospital patients.
                    </p>

                </div>

                <button className="add-btn">

                    <FaPlus />

                    Add Patient

                </button>

            </div>

            {/* Filters */}

            <div className="patients-toolbar">

                <div className="search-box">

                    <FaSearch />

                    <input

                        type="text"

                        placeholder="Search patient..."

                        value={search}

                        onChange={(e) =>
                            setSearch(e.target.value)
                        }

                    />

                </div>

                <select

                    value={riskFilter}

                    onChange={(e) =>
                        setRiskFilter(e.target.value)
                    }

                >

                    <option>All</option>

                    <option>High</option>

                    <option>Medium</option>

                    <option>Low</option>

                </select>

                <select

                    value={genderFilter}

                    onChange={(e) =>
                        setGenderFilter(e.target.value)
                    }

                >

                    <option>All</option>

                    <option>Male</option>

                    <option>Female</option>

                </select>

                <select

                    value={statusFilter}

                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }

                >

                    <option>All</option>

                    <option>Active</option>

                    <option>Inactive</option>

                </select>

                <button className="export-btn">

                    <FaDownload />

                    Export

                </button>

            </div>

            {/* Patient Table */}

            <PatientTable

                search={search}

                riskFilter={riskFilter}

                genderFilter={genderFilter}

                statusFilter={statusFilter}

            />

        </div>

    );

}