"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { getTreatments } from "../../../lib/api";
// ============================================================
// HOSPITAL ADMIN - TREATMENT MANAGEMENT
// ============================================================
export default function HospitalAdminTreatmentsPage() {
  // ============================================================
  // STATE
  // ============================================================
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  // ============================================================
  // LOAD TREATMENTS
  // ============================================================

  useEffect(() => {

    async function loadTreatments() {

      try {

        setLoading(true);

        setError("");

        const data = await getTreatments();


        // ======================================================
        // HANDLE DIFFERENT API RESPONSE FORMATS
        // ======================================================

        let treatmentsList = [];


        if (Array.isArray(data)) {

          treatmentsList = data;

        }

        else if (Array.isArray(data?.data)) {

          treatmentsList = data.data;

        }

        else if (Array.isArray(data?.treatments)) {

          treatmentsList = data.treatments;

        }


        console.log(
          "HOSPITAL ADMIN TREATMENTS:",
          treatmentsList
        );


        setTreatments(treatmentsList);

      }

      catch (err) {

        console.error(
          "HOSPITAL ADMIN TREATMENTS ERROR:",
          err
        );

        setError(
          err?.message ||
          "Failed to load treatment data."
        );

      }

      finally {

        setLoading(false);

      }

    }


    loadTreatments();

  }, []);


  // ============================================================
  // GET STATUS
  // ============================================================

  const getTreatmentStatus = (treatment) => {

    return String(

      treatment?.status ||

      treatment?.treatment_status ||

      treatment?.treatmentStatus ||

      ""

    ).toLowerCase();

  };


  // ============================================================
  // TOTAL TREATMENTS
  // ============================================================

  const totalTreatments =

    treatments.length;


  // ============================================================
  // PLANNED TREATMENTS
  // ============================================================

  const plannedTreatments =

    useMemo(() => {

      return treatments.filter(

        (treatment) => {

          const status =

            getTreatmentStatus(
              treatment
            );

          return (

            status === "planned" ||

            status === "scheduled"

          );

        }

      ).length;

    }, [treatments]);


  // ============================================================
  // ONGOING TREATMENTS
  // ============================================================

  const ongoingTreatments =

    useMemo(() => {

      return treatments.filter(

        (treatment) => {

          const status =

            getTreatmentStatus(
              treatment
            );

          return (

            status === "ongoing" ||

            status === "in progress" ||

            status === "in_progress"

          );

        }

      ).length;

    }, [treatments]);


  // ============================================================
  // COMPLETED TREATMENTS
  // ============================================================

  const completedTreatments =

    useMemo(() => {

      return treatments.filter(

        (treatment) => {

          const status =

            getTreatmentStatus(
              treatment
            );

          return (

            status === "completed" ||

            status === "complete"

          );

        }

      ).length;

    }, [treatments]);


  // ============================================================
  // FILTER TREATMENTS
  // ============================================================

  const filteredTreatments =

    useMemo(() => {

      return treatments.filter(

        (treatment) => {


          // ----------------------------------------------------
          // STATUS FILTER
          // ----------------------------------------------------

          const status =

            getTreatmentStatus(
              treatment
            );


          if (

            statusFilter !== "all" &&

            !status.includes(
              statusFilter
            )

          ) {

            return false;

          }


          // ----------------------------------------------------
          // PATIENT NAME
          // ----------------------------------------------------

          const patientName = String(

            treatment?.patient_name ||

            treatment?.patientName ||

            treatment?.name ||

            ""

          ).toLowerCase();


          // ----------------------------------------------------
          // PATIENT ID
          // ----------------------------------------------------

          const patientId = String(

            treatment?.patient_id ||

            treatment?.patientId ||

            ""

          ).toLowerCase();


          // ----------------------------------------------------
          // TREATMENT TYPE
          // ----------------------------------------------------

          const treatmentType = String(

            treatment?.treatment_type ||

            treatment?.treatmentType ||

            treatment?.type ||

            ""

          ).toLowerCase();


          // ----------------------------------------------------
          // SEARCH
          // ----------------------------------------------------

          const searchValue =

            search.toLowerCase().trim();


          if (

            searchValue &&

            !patientName.includes(
              searchValue
            ) &&

            !patientId.includes(
              searchValue
            ) &&

            !treatmentType.includes(
              searchValue
            )

          ) {

            return false;

          }


          return true;

        }

      );

    }, [

      treatments,

      search,

      statusFilter,

    ]);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <main style={styles.main}>

        <div style={styles.centerMessage}>

          Loading Treatment Management...

        </div>

      </main>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (

      <main style={styles.main}>

        <div style={styles.errorCard}>

          <h2>

            Failed to Load Treatment Data

          </h2>


          <p style={styles.errorText}>

            {error}

          </p>


          <p>

            Please check whether the backend
            is running.

          </p>


          <button

            onClick={() =>
              window.location.reload()
            }

            style={styles.retryButton}

          >

            Retry

          </button>

        </div>

      </main>

    );

  }


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <main style={styles.main}>

      <div style={styles.container}>


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>

              Treatment Management

            </h1>


            <p style={styles.subtitle}>

              Hospital-wide treatment monitoring
              and performance management

            </p>

          </div>


          <Link

            href="/hospital_admin/analytics"

            style={styles.backButton}

          >

            Back to Hospital Dashboard

          </Link>

        </div>


        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <div style={styles.grid}>


          {/* TOTAL */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Total Treatments

            </p>


            <p style={styles.number}>

              {totalTreatments}

            </p>


            <p style={styles.description}>

              Total treatments recorded
              in the hospital system.

            </p>

          </div>


          {/* PLANNED */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Planned

            </p>


            <p style={styles.plannedNumber}>

              {plannedTreatments}

            </p>


            <p style={styles.description}>

              Treatments that are planned
              or scheduled.

            </p>

          </div>


          {/* ONGOING */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Ongoing

            </p>


            <p style={styles.ongoingNumber}>

              {ongoingTreatments}

            </p>


            <p style={styles.description}>

              Treatments currently in progress.

            </p>

          </div>


          {/* COMPLETED */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Completed

            </p>


            <p style={styles.completedNumber}>

              {completedTreatments}

            </p>


            <p style={styles.description}>

              Treatments successfully completed.

            </p>

          </div>

        </div>


        {/* ====================================================
            TREATMENT RECORDS
        ==================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Treatment Records

          </h2>


          {/* ==================================================
              FILTERS
          ================================================== */}

          <div style={styles.filterCard}>


            {/* SEARCH */}

            <input

              type="text"

              placeholder="Search patient ID, patient name, or treatment type..."

              value={search}

              onChange={(e) =>
                setSearch(e.target.value)
              }

              style={styles.searchInput}

            />


            {/* STATUS FILTER */}

            <select

              value={statusFilter}

              onChange={(e) =>
                setStatusFilter(e.target.value)
              }

              style={styles.select}

            >

              <option value="all">

                All Status

              </option>


              <option value="planned">

                Planned

              </option>


              <option value="ongoing">

                Ongoing

              </option>


              <option value="completed">

                Completed

              </option>

            </select>

          </div>


          {/* ==================================================
              TABLE
          ================================================== */}

          <div style={styles.tableCard}>

            {filteredTreatments.length === 0 ? (

              <div style={styles.empty}>

                No treatment records found.

              </div>

            ) : (

              <div style={styles.tableWrapper}>

                <table style={styles.table}>

                  <thead>

                    <tr>

                      <th style={styles.th}>

                        ID

                      </th>


                      <th style={styles.th}>

                        Patient

                      </th>


                      <th style={styles.th}>

                        Treatment Type

                      </th>


                      <th style={styles.th}>

                        Status

                      </th>


                      <th style={styles.th}>

                        Start Date

                      </th>


                      <th style={styles.th}>

                        End Date

                      </th>


                      <th style={styles.th}>

                        Outcome

                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredTreatments.map(

                      (treatment, index) => {


                        // ------------------------------------------------
                        // STATUS
                        // ------------------------------------------------

                        const status =

                          getTreatmentStatus(
                            treatment
                          );


                        // ------------------------------------------------
                        // PATIENT
                        // ------------------------------------------------

                        const patientName =

                          treatment?.patient_name ||

                          treatment?.patientName ||

                          treatment?.name ||

                          "Unknown Patient";


                        // ------------------------------------------------
                        // PATIENT ID
                        // ------------------------------------------------

                        const patientId =

                          treatment?.patient_id ||

                          treatment?.patientId ||

                          "N/A";


                        // ------------------------------------------------
                        // TREATMENT ID
                        // ------------------------------------------------

                        const treatmentId =

                          treatment?.treatment_id ||

                          treatment?.treatmentId ||

                          treatment?.id ||

                          index + 1;


                        // ------------------------------------------------
                        // TREATMENT TYPE
                        // ------------------------------------------------

                        const treatmentType =

                          treatment?.treatment_type ||

                          treatment?.treatmentType ||

                          treatment?.type ||

                          "N/A";


                        // ------------------------------------------------
                        // START DATE
                        // ------------------------------------------------

                        const startDate =

                          treatment?.start_date ||

                          treatment?.startDate ||

                          "N/A";


                        // ------------------------------------------------
                        // END DATE
                        // ------------------------------------------------

                        const endDate =

                          treatment?.end_date ||

                          treatment?.endDate ||

                          "N/A";


                        // ------------------------------------------------
                        // OUTCOME
                        // ------------------------------------------------

                        const outcome =

                          treatment?.outcome ||

                          treatment?.result ||

                          "Not Evaluated";


                        // ------------------------------------------------
                        // STATUS BADGE
                        // ------------------------------------------------

                        let statusStyle =

                          styles.unknownBadge;


                        if (

                          status ===
                            "planned" ||

                          status ===
                            "scheduled"

                        ) {

                          statusStyle =
                            styles.plannedBadge;

                        }

                        else if (

                          status ===
                            "ongoing" ||

                          status ===
                            "in progress" ||

                          status ===
                            "in_progress"

                        ) {

                          statusStyle =
                            styles.ongoingBadge;

                        }

                        else if (

                          status ===
                            "completed" ||

                          status ===
                            "complete"

                        ) {

                          statusStyle =
                            styles.completedBadge;

                        }


                        return (

                          <tr

                            key={

                              treatment.treatment_id ||

                              treatment.id ||

                              index

                            }

                          >

                            <td style={styles.td}>

                              {treatmentId}

                            </td>


                            <td style={styles.td}>

                              <strong>

                                {patientName}

                              </strong>

                              <br />

                              <small>

                                Patient ID:{" "}

                                {patientId}

                              </small>

                            </td>


                            <td style={styles.td}>

                              {treatmentType}

                            </td>


                            <td style={styles.td}>

                              <span

                                style={statusStyle}

                              >

                                {status

                                  ? status
                                      .replace(
                                        "_",
                                        " "
                                      )
                                      .replace(
                                        /\b\w/g,
                                        (letter) =>
                                          letter.toUpperCase()
                                      )

                                  : "Unknown"}

                              </span>

                            </td>


                            <td style={styles.td}>

                              {String(
                                startDate
                              )}

                            </td>


                            <td style={styles.td}>

                              {String(
                                endDate
                              )}

                            </td>


                            <td style={styles.td}>

                              {String(
                                outcome
                              )}

                            </td>

                          </tr>

                        );

                      }

                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

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

    marginBottom: "40px",

    gap: "20px",

    flexWrap: "wrap",

  },


  title: {

    fontSize: "32px",

    color: "#111827",

    margin: 0,

    marginBottom: "10px",

  },


  subtitle: {

    color: "#6b7280",

    margin: 0,

  },


  backButton: {

    padding: "12px 20px",

    background: "#2563eb",

    color: "#ffffff",

    borderRadius: "8px",

    textDecoration: "none",

    fontWeight: "600",

  },


  grid: {

    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",

    gap: "20px",

  },


  card: {

    background: "#ffffff",

    padding: "25px",

    borderRadius: "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  cardLabel: {

    color: "#6b7280",

    fontSize: "14px",

    margin: 0,

  },


  number: {

    fontSize: "34px",

    fontWeight: "700",

    color: "#2563eb",

    margin: "10px 0",

  },


  plannedNumber: {

    fontSize: "34px",

    fontWeight: "700",

    color: "#7c3aed",

    margin: "10px 0",

  },


  ongoingNumber: {

    fontSize: "34px",

    fontWeight: "700",

    color: "#d97706",

    margin: "10px 0",

  },


  completedNumber: {

    fontSize: "34px",

    fontWeight: "700",

    color: "#16a34a",

    margin: "10px 0",

  },


  description: {

    color: "#6b7280",

    fontSize: "14px",

    lineHeight: "1.5",

    margin: 0,

  },


  section: {

    marginTop: "40px",

  },


  sectionTitle: {

    fontSize: "24px",

    color: "#111827",

    marginBottom: "20px",

  },


  filterCard: {

    background: "#ffffff",

    padding: "20px",

    borderRadius: "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

    display: "flex",

    gap: "15px",

    flexWrap: "wrap",

    marginBottom: "20px",

  },


  searchInput: {

    flex: 1,

    minWidth: "280px",

    padding: "12px",

    border:
      "1px solid #d1d5db",

    borderRadius: "8px",

    fontSize: "15px",

    outline: "none",

  },


  select: {

    padding: "12px",

    border:
      "1px solid #d1d5db",

    borderRadius: "8px",

    fontSize: "15px",

    background: "#ffffff",

    minWidth: "180px",

  },


  tableCard: {

    background: "#ffffff",

    padding: "25px",

    borderRadius: "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  tableWrapper: {

    overflowX: "auto",

  },


  table: {

    width: "100%",

    borderCollapse: "collapse",

    minWidth: "900px",

  },


  th: {

    textAlign: "left",

    padding: "14px",

    background: "#f3f4f6",

    color: "#374151",

    borderBottom:
      "1px solid #e5e7eb",

    whiteSpace: "nowrap",

  },


  td: {

    padding: "14px",

    borderBottom:
      "1px solid #e5e7eb",

    color: "#374151",

  },


  plannedBadge: {

    display: "inline-block",

    padding: "6px 10px",

    background: "#ede9fe",

    color: "#6d28d9",

    borderRadius: "20px",

    fontSize: "13px",

    fontWeight: "600",

  },


  ongoingBadge: {

    display: "inline-block",

    padding: "6px 10px",

    background: "#fef3c7",

    color: "#b45309",

    borderRadius: "20px",

    fontSize: "13px",

    fontWeight: "600",

  },


  completedBadge: {

    display: "inline-block",

    padding: "6px 10px",

    background: "#dcfce7",

    color: "#15803d",

    borderRadius: "20px",

    fontSize: "13px",

    fontWeight: "600",

  },


  unknownBadge: {

    display: "inline-block",

    padding: "6px 10px",

    background: "#f3f4f6",

    color: "#4b5563",

    borderRadius: "20px",

    fontSize: "13px",

    fontWeight: "600",

  },


  empty: {

    textAlign: "center",

    padding: "40px",

    color: "#6b7280",

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

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  errorText: {

    color: "#dc2626",

    fontWeight: "600",

  },


  retryButton: {

    marginTop: "15px",

    padding: "10px 20px",

    background: "#2563eb",

    color: "#ffffff",

    border: "none",

    borderRadius: "7px",

    cursor: "pointer",

  },

};