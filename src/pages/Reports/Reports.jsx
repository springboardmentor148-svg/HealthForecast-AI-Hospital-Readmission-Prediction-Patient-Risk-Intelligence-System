import "./Reports.css";

import {
    FaFilePdf,
    FaFileExcel,
    FaCalendarDay,
    FaCalendarWeek,
    FaCalendarAlt,
    FaSearch,
    FaDownload,
    FaFileMedical
} from "react-icons/fa";

export default function Reports() {

    const reports = [

        {
            title:"Daily Prediction Report",
            date:"31 Jul 2026",
            type:"PDF",
            patients:18
        },

        {
            title:"Weekly Summary",
            date:"28 Jul 2026",
            type:"Excel",
            patients:104
        },

        {
            title:"Monthly Readmission Report",
            date:"01 Jul 2026",
            type:"PDF",
            patients:426
        },

        {
            title:"High Risk Patients",
            date:"30 Jul 2026",
            type:"PDF",
            patients:46
        }

    ];

    return(

        <div className="reportsPage">

            {/* Header */}

            <div className="reportsHeader">

                <div>

                    <h2>

                        Reports

                    </h2>

                    <p>

                        Generate and download AI prediction reports.

                    </p>

                </div>

            </div>

            {/* Quick Reports */}

            <div className="reportCards">

                <div className="reportCard">

                    <FaCalendarDay/>

                    <h4>

                        Daily Report

                    </h4>

                    <button>

                        Generate

                    </button>

                </div>

                <div className="reportCard">

                    <FaCalendarWeek/>

                    <h4>

                        Weekly Report

                    </h4>

                    <button>

                        Generate

                    </button>

                </div>

                <div className="reportCard">

                    <FaCalendarAlt/>

                    <h4>

                        Monthly Report

                    </h4>

                    <button>

                        Generate

                    </button>

                </div>

            </div>

            {/* Search */}

            <div className="searchReport">

                <FaSearch/>

                <input

                    placeholder="Search reports..."

                />

            </div>

            {/* Report History */}

            <div className="reportHistory">

                <div className="tableTitle">

                    <FaFileMedical/>

                    Report History

                </div>

                <table>

                    <thead>

                        <tr>

                            <th>Report</th>

                            <th>Date</th>

                            <th>Patients</th>

                            <th>Type</th>

                            <th>Download</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            reports.map((report,index)=>(

                                <tr key={index}>

                                    <td>

                                        {report.title}

                                    </td>

                                    <td>

                                        {report.date}

                                    </td>

                                    <td>

                                        {report.patients}

                                    </td>

                                    <td>

                                        {

                                            report.type==="PDF"

                                            ?

                                            <span className="pdf">

                                                <FaFilePdf/>

                                                PDF

                                            </span>

                                            :

                                            <span className="excel">

                                                <FaFileExcel/>

                                                Excel

                                            </span>

                                        }

                                    </td>

                                    <td>

                                        <button className="downloadBtn">

                                            <FaDownload/>

                                        </button>

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}