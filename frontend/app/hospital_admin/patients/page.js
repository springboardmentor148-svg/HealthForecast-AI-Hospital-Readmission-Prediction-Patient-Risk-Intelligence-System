"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { getPatients } from "../../../lib/api";


// ============================================================
// HOSPITAL ADMIN - PATIENT MANAGEMENT
// ============================================================

export default function HospitalAdminPatientsPage() {

  // ============================================================
  // STATE
  // ============================================================

  const [patients, setPatients] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ============================================================
  // LOAD PATIENTS
  // ============================================================

  useEffect(() => {

    async function loadPatients() {

      try {

        setLoading(true);

        setError("");


        // --------------------------------------------------------
        // GET PATIENTS FROM BACKEND
        // --------------------------------------------------------

        const data = await getPatients();


        console.log(

          "HOSPITAL ADMIN PATIENTS:",

          data

        );


        // --------------------------------------------------------
        // HANDLE DIFFERENT API RESPONSE FORMATS
        // --------------------------------------------------------

        let patientsList = [];


        if (

          Array.isArray(data)

        ) {

          patientsList = data;

        }

        else if (

          Array.isArray(

            data?.data

          )

        ) {

          patientsList = data.data;

        }

        else if (

          Array.isArray(

            data?.patients

          )

        ) {

          patientsList = data.patients;

        }


        // --------------------------------------------------------
        // SAVE PATIENTS
        // --------------------------------------------------------

        setPatients(

          patientsList

        );

      }

      catch (err) {

        console.error(

          "PATIENTS LOAD ERROR:",

          err

        );


        setError(

          err?.message ||

          "Failed to load patients."

        );

      }

      finally {

        setLoading(false);

      }

    }


    loadPatients();

  }, []);


  // ============================================================
  // SEARCH PATIENTS
  // ============================================================

  const filteredPatients = useMemo(() => {

    const search =

      searchTerm

        .trim()

        .toLowerCase();


    // ----------------------------------------------------------
    // IF SEARCH IS EMPTY
    // ----------------------------------------------------------

    if (!search) {

      return patients;

    }


    // ----------------------------------------------------------
    // FILTER PATIENTS
    // ----------------------------------------------------------

    return patients.filter(

      (patient) => {

        const patientId = String(

          patient?.id ||

          patient?.patient_id ||

          patient?.patientId ||

          ""

        ).toLowerCase();


        const name = String(

          patient?.full_name ||

          patient?.fullName ||

          patient?.name ||

          patient?.patient_name ||

          patient?.patientName ||

          ""

        ).toLowerCase();


        const email = String(

          patient?.email ||

          ""

        ).toLowerCase();


        const phone = String(

          patient?.phone ||

          patient?.phone_number ||

          patient?.phoneNumber ||

          ""

        ).toLowerCase();


        return (

          patientId.includes(search) ||

          name.includes(search) ||

          email.includes(search) ||

          phone.includes(search)

        );

      }

    );

  }, [

    patients,

    searchTerm,

  ]);


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (

      <main

        style={styles.main}

      >

        <div

          style={styles.centerMessage}

        >

          Loading Patients...

        </div>

      </main>

    );

  }


  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {

    return (

      <main

        style={styles.main}

      >

        <div

          style={styles.errorCard}

        >

          <h2>

            Failed to Load Patients

          </h2>


          <p

            style={styles.errorText}

          >

            {error}

          </p>


          <p>

            Please check whether the backend is running.

          </p>


          <div

            style={styles.errorActions}

          >

            <button

              onClick={() =>

                window.location.reload()

              }

              style={styles.retryButton}

            >

              Retry

            </button>


            <Link

              href="/hospital_admin"

              style={styles.backButton}

            >

              Back to Hospital Admin

            </Link>

          </div>

        </div>

      </main>

    );

  }


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <main

      style={styles.main}

    >

      <div

        style={styles.container}

      >


        {/* ======================================================
            HEADER
        ====================================================== */}

        <div

          style={styles.header}

        >

          <div>

            <h1

              style={styles.title}

            >

              Patient Management

            </h1>


            <p

              style={styles.subtitle}

            >

              View and search patients registered in the hospital system.

            </p>

          </div>


          <Link

            href="/hospital_admin"

            style={styles.backButton}

          >

            ← Hospital Admin Dashboard

          </Link>

        </div>


        {/* ======================================================
            PATIENT SUMMARY
        ====================================================== */}

        <div

          style={styles.summaryCard}

        >

          <div>

            <p

              style={styles.summaryLabel}

            >

              Total Registered Patients

            </p>


            <p

              style={styles.summaryNumber}

            >

              {patients.length}

            </p>

          </div>


          <div>

            <p

              style={styles.summaryLabel}

            >

              Search Results

            </p>


            <p

              style={styles.summaryNumber}

            >

              {filteredPatients.length}

            </p>

          </div>

        </div>


        {/* ======================================================
            SEARCH SECTION
        ====================================================== */}

        <section

          style={styles.searchSection}

        >

          <h2

            style={styles.sectionTitle}

          >

            Search Patients

          </h2>


          <input

            type="text"

            value={searchTerm}

            onChange={(e) =>

              setSearchTerm(

                e.target.value

              )

            }

            placeholder="Search by patient ID, name, email, or phone..."

            style={styles.searchInput}

          />

        </section>


        {/* ======================================================
            PATIENT TABLE
        ====================================================== */}

        <section

          style={styles.patientSection}

        >

          <div

            style={styles.tableHeader}

          >

            <h2

              style={styles.sectionTitle}

            >

              Registered Patients

            </h2>


            <span

              style={styles.resultCount}

            >

              {filteredPatients.length} patient(s)

            </span>

          </div>


          {filteredPatients.length === 0 ? (

            <div

              style={styles.emptyCard}

            >

              <h3>

                No Patients Found

              </h3>


              <p>

                {patients.length === 0

                  ? "There are currently no patients registered in the hospital system."

                  : "No patients match your search criteria."

                }

              </p>

            </div>

          ) : (

            <div

              style={styles.tableWrapper}

            >

              <table

                style={styles.table}

              >

                <thead>

                  <tr>

                    <th

                      style={styles.th}

                    >

                      Patient ID

                    </th>


                    <th

                      style={styles.th}

                    >

                      Name

                    </th>


                    <th

                      style={styles.th}

                    >

                      Email

                    </th>


                    <th

                      style={styles.th}

                    >

                      Phone

                    </th>


                    <th

                      style={styles.th}

                    >

                      Gender

                    </th>


                    <th

                      style={styles.th}

                    >

                      Age

                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredPatients.map(

                    (patient, index) => {


                      const patientId =

                        patient?.id ||

                        patient?.patient_id ||

                        patient?.patientId ||

                        index + 1;


                      const patientName =

                        patient?.full_name ||

                        patient?.fullName ||

                        patient?.name ||

                        patient?.patient_name ||

                        patient?.patientName ||

                        "N/A";


                      const email =

                        patient?.email ||

                        "N/A";


                      const phone =

                        patient?.phone ||

                        patient?.phone_number ||

                        patient?.phoneNumber ||

                        "N/A";


                      const gender =

                        patient?.gender ||

                        patient?.sex ||

                        "N/A";


                      const age =

                        patient?.age ||

                        "N/A";


                      return (

                        <tr

                          key={

                            patient?.id ||

                            patient?.patient_id ||

                            index

                          }

                        >

                          <td

                            style={styles.td}

                          >

                            {patientId}

                          </td>


                          <td

                            style={styles.td}

                          >

                            <strong>

                              {patientName}

                            </strong>

                          </td>


                          <td

                            style={styles.td}

                          >

                            {email}

                          </td>


                          <td

                            style={styles.td}

                          >

                            {phone}

                          </td>


                          <td

                            style={styles.td}

                          >

                            {gender}

                          </td>


                          <td

                            style={styles.td}

                          >

                            {age}

                          </td>

                        </tr>

                      );

                    }

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ======================================================
            BOTTOM ACTIONS
        ====================================================== */}

        <div

          style={styles.bottomActions}

        >

          <Link

            href="/hospital_admin"

            style={styles.backButton}

          >

            ← Back to Hospital Admin Dashboard

          </Link>

        </div>


      </div>

    </main>

  );

}


// ============================================================
// STYLES
// ============================================================

const styles = {

  main: {

    minHeight: "100vh",

    background: "#f5f7fb",

    padding: "40px",

  },


  container: {

    maxWidth: "1200px",

    margin: "0 auto",

  },


  header: {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "flex-start",

    gap: "20px",

    marginBottom: "35px",

    flexWrap: "wrap",

  },


  title: {

    fontSize: "32px",

    color: "#111827",

    margin: "0 0 10px 0",

  },


  subtitle: {

    color: "#6b7280",

    margin: 0,

    fontSize: "16px",

  },


  backButton: {

    display: "inline-block",

    padding: "11px 18px",

    background: "#2563eb",

    color: "#ffffff",

    borderRadius: "8px",

    textDecoration: "none",

    fontWeight: "600",

    fontSize: "14px",

  },


  summaryCard: {

    display: "grid",

    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

    gap: "20px",

    marginBottom: "35px",

  },


  summaryLabel: {

    margin: 0,

    color: "#6b7280",

    fontSize: "14px",

  },


  summaryNumber: {

    margin: "8px 0 0 0",

    color: "#2563eb",

    fontSize: "32px",

    fontWeight: "700",

  },


  searchSection: {

    background: "#ffffff",

    padding: "25px",

    borderRadius: "14px",

    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",

    marginBottom: "35px",

  },


  sectionTitle: {

    margin: "0 0 18px 0",

    fontSize: "22px",

    color: "#111827",

  },


  searchInput: {

    width: "100%",

    padding: "14px 16px",

    border: "1px solid #d1d5db",

    borderRadius: "8px",

    fontSize: "15px",

    outline: "none",

    boxSizing: "border-box",

  },


  patientSection: {

    marginTop: "30px",

  },


  tableHeader: {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    gap: "15px",

    marginBottom: "20px",

    flexWrap: "wrap",

  },


  resultCount: {

    color: "#6b7280",

    fontSize: "14px",

  },


  tableWrapper: {

    background: "#ffffff",

    borderRadius: "14px",

    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",

    overflowX: "auto",

  },


  table: {

    width: "100%",

    borderCollapse: "collapse",

    minWidth: "800px",

  },


  th: {

    textAlign: "left",

    padding: "16px",

    background: "#f9fafb",

    color: "#374151",

    fontSize: "14px",

    fontWeight: "700",

    borderBottom: "1px solid #e5e7eb",

  },


  td: {

    padding: "16px",

    color: "#4b5563",

    fontSize: "14px",

    borderBottom: "1px solid #f3f4f6",

  },


  emptyCard: {

    background: "#ffffff",

    padding: "50px",

    borderRadius: "14px",

    textAlign: "center",

    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",

  },


  bottomActions: {

    marginTop: "35px",

  },


  centerMessage: {

    textAlign: "center",

    paddingTop: "100px",

    fontSize: "20px",

    color: "#374151",

  },


  errorCard: {

    maxWidth: "600px",

    margin: "100px auto",

    padding: "30px",

    background: "#ffffff",

    borderRadius: "14px",

    textAlign: "center",

    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",

  },


  errorText: {

    color: "#dc2626",

    fontWeight: "600",

  },


  errorActions: {

    display: "flex",

    justifyContent: "center",

    gap: "15px",

    marginTop: "20px",

    flexWrap: "wrap",

  },


  retryButton: {

    padding: "11px 20px",

    background: "#2563eb",

    color: "#ffffff",

    border: "none",

    borderRadius: "8px",

    cursor: "pointer",

    fontWeight: "600",

  },

};