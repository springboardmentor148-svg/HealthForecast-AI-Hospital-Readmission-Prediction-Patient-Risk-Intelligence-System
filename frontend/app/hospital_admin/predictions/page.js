"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { getPredictions } from "../../../lib/api";


// ============================================================
// HOSPITAL ADMIN - AI PREDICTIONS PAGE
// ============================================================

export default function HospitalAdminPredictionsPage() {

  // ============================================================
  // STATE
  // ============================================================

  const [predictions, setPredictions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [riskFilter, setRiskFilter] = useState("all");


  // ============================================================
  // LOAD PREDICTIONS
  // ============================================================

  useEffect(() => {

    async function loadPredictions() {

      try {

        setLoading(true);

        setError("");

        const data = await getPredictions();


        // ======================================================
        // HANDLE DIFFERENT API RESPONSE FORMATS
        // ======================================================

        let predictionsList = [];


        if (Array.isArray(data)) {

          predictionsList = data;

        }

        else if (Array.isArray(data?.data)) {

          predictionsList = data.data;

        }

        else if (Array.isArray(data?.predictions)) {

          predictionsList = data.predictions;

        }


        console.log(
          "HOSPITAL ADMIN PREDICTIONS:",
          predictionsList
        );


        setPredictions(predictionsList);

      }

      catch (err) {

        console.error(
          "HOSPITAL ADMIN PREDICTIONS ERROR:",
          err
        );

        setError(
          err?.message ||
          "Failed to load AI predictions."
        );

      }

      finally {

        setLoading(false);

      }

    }


    loadPredictions();

  }, []);


  // ============================================================
  // GET RISK VALUE
  // ============================================================

  const getPredictionRisk = (prediction) => {

    return String(

      prediction?.risk_level ||

      prediction?.riskLevel ||

      prediction?.risk ||

      prediction?.risk_category ||

      prediction?.riskCategory ||

      prediction?.prediction_result ||

      prediction?.predictionResult ||

      prediction?.prediction ||

      prediction?.readmission_risk ||

      prediction?.readmissionRisk ||

      ""

    ).toLowerCase();

  };


  // ============================================================
  // TOTAL PREDICTIONS
  // ============================================================

  const totalPredictions =

    predictions.length;


  // ============================================================
  // HIGH RISK
  // ============================================================

  const highRiskPredictions =

    useMemo(() => {

      return predictions.filter(

        (prediction) =>

          getPredictionRisk(
            prediction
          ).includes("high")

      ).length;

    }, [predictions]);


  // ============================================================
  // MEDIUM RISK
  // ============================================================

  const mediumRiskPredictions =

    useMemo(() => {

      return predictions.filter(

        (prediction) =>

          getPredictionRisk(
            prediction
          ).includes("medium")

      ).length;

    }, [predictions]);


  // ============================================================
  // LOW RISK
  // ============================================================

  const lowRiskPredictions =

    useMemo(() => {

      return predictions.filter(

        (prediction) =>

          getPredictionRisk(
            prediction
          ).includes("low")

      ).length;

    }, [predictions]);


  // ============================================================
  // FILTER PREDICTIONS
  // ============================================================

  const filteredPredictions =

    useMemo(() => {

      return predictions.filter(

        (prediction) => {

          const risk =

            getPredictionRisk(
              prediction
            );


          // ----------------------------------------------------
          // RISK FILTER
          // ----------------------------------------------------

          if (

            riskFilter !== "all" &&

            !risk.includes(
              riskFilter
            )

          ) {

            return false;

          }


          // ----------------------------------------------------
          // SEARCH
          // ----------------------------------------------------

          const patientName = String(

            prediction?.patient_name ||

            prediction?.patientName ||

            prediction?.name ||

            ""

          ).toLowerCase();


          const patientId = String(

            prediction?.patient_id ||

            prediction?.patientId ||

            prediction?.id ||

            ""

          ).toLowerCase();


          const searchValue =

            search.toLowerCase().trim();


          if (

            searchValue &&

            !patientName.includes(
              searchValue
            ) &&

            !patientId.includes(
              searchValue
            )

          ) {

            return false;

          }


          return true;

        }

      );

    }, [

      predictions,

      search,

      riskFilter,

    ]);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <main style={styles.main}>

        <div style={styles.centerMessage}>

          Loading AI Predictions...

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

            Failed to Load AI Predictions

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

              AI Predictions

            </h1>


            <p style={styles.subtitle}>

              Hospital-wide AI-based
              patient readmission risk predictions

            </p>

          </div>


          <Link

            href="/hospital-admin"

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

              Total Predictions

            </p>


            <p style={styles.number}>

              {totalPredictions}

            </p>


            <p style={styles.description}>

              Total AI predictions recorded
              in the hospital system.

            </p>

          </div>


          {/* HIGH */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              High Risk

            </p>


            <p style={styles.highRiskNumber}>

              {highRiskPredictions}

            </p>


            <p style={styles.description}>

              Patients classified as high
              readmission risk.

            </p>

          </div>


          {/* MEDIUM */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Medium Risk

            </p>


            <p style={styles.mediumRiskNumber}>

              {mediumRiskPredictions}

            </p>


            <p style={styles.description}>

              Patients classified as medium
              readmission risk.

            </p>

          </div>


          {/* LOW */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Low Risk

            </p>


            <p style={styles.lowRiskNumber}>

              {lowRiskPredictions}

            </p>


            <p style={styles.description}>

              Patients classified as low
              readmission risk.

            </p>

          </div>

        </div>


        {/* ====================================================
            FILTER SECTION
        ==================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Prediction Records

          </h2>


          <div style={styles.filterCard}>


            {/* SEARCH */}

            <input

              type="text"

              placeholder="Search by patient name or ID..."

              value={search}

              onChange={(e) =>
                setSearch(e.target.value)
              }

              style={styles.searchInput}

            />


            {/* RISK FILTER */}

            <select

              value={riskFilter}

              onChange={(e) =>
                setRiskFilter(e.target.value)
              }

              style={styles.select}

            >

              <option value="all">

                All Risk Levels

              </option>


              <option value="high">

                High Risk

              </option>


              <option value="medium">

                Medium Risk

              </option>


              <option value="low">

                Low Risk

              </option>

            </select>

          </div>


          {/* ==================================================
              TABLE
          ================================================== */}

          <div style={styles.tableCard}>

            {filteredPredictions.length === 0 ? (

              <div style={styles.empty}>

                No prediction records found.

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

                        Risk Level

                      </th>


                      <th style={styles.th}>

                        Prediction

                      </th>


                      <th style={styles.th}>

                        Date

                      </th>


                      <th style={styles.th}>

                        Action

                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredPredictions.map(

                      (prediction, index) => {


                        const risk =

                          getPredictionRisk(
                            prediction
                          );


                        let riskStyle =

                          styles.lowRiskBadge;


                        if (
                          risk.includes("high")
                        ) {

                          riskStyle =
                            styles.highRiskBadge;

                        }

                        else if (
                          risk.includes("medium")
                        ) {

                          riskStyle =
                            styles.mediumRiskBadge;

                        }


                        const patientName =

                          prediction?.patient_name ||

                          prediction?.patientName ||

                          prediction?.name ||

                          "Unknown Patient";


                        const patientId =

                          prediction?.patient_id ||

                          prediction?.patientId ||

                          prediction?.id ||

                          index + 1;


                        const predictionResult =

                          prediction?.prediction_result ||

                          prediction?.predictionResult ||

                          prediction?.prediction ||

                          prediction?.readmission_risk ||

                          prediction?.readmissionRisk ||

                          risk ||

                          "N/A";


                        const predictionDate =

                          prediction?.created_at ||

                          prediction?.createdAt ||

                          prediction?.prediction_date ||

                          prediction?.predictionDate ||

                          prediction?.date ||

                          "N/A";


                        return (

                          <tr

                            key={

                              prediction.id ||

                              index

                            }

                          >

                            <td style={styles.td}>
  {prediction.prediction_id ||
    prediction.id ||
    index + 1}
</td>


                            <td style={styles.td}>

                              {patientName}

                            </td>


                            <td style={styles.td}>

                              <span

                                style={riskStyle}

                              >

                                {risk

                                  ? risk
                                      .charAt(0)
                                      .toUpperCase() +
                                    risk.slice(1)

                                  : "Unknown"}

                              </span>

                            </td>


                            <td style={styles.td}>

                              {String(
                                predictionResult
                              )}

                            </td>


                            <td style={styles.td}>

                              {String(
                                predictionDate
                              )}

                            </td>


                            <td style={styles.td}>

                              <button

                                style={
                                  styles.viewButton
                                }

                                onClick={() => {

                                  alert(

                                    `Patient: ${patientName}\nPrediction: ${predictionResult}\nRisk: ${risk || "Unknown"}`

                                  );

                                }}

                              >

                                View

                              </button>

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


  highRiskNumber: {

    fontSize: "34px",

    fontWeight: "700",

    color: "#dc2626",

    margin: "10px 0",

  },


  mediumRiskNumber: {

    fontSize: "34px",

    fontWeight: "700",

    color: "#d97706",

    margin: "10px 0",

  },


  lowRiskNumber: {

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

    minWidth: "250px",

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


  highRiskBadge: {

    display: "inline-block",

    padding: "6px 10px",

    background: "#fee2e2",

    color: "#b91c1c",

    borderRadius: "20px",

    fontSize: "13px",

    fontWeight: "600",

  },


  mediumRiskBadge: {

    display: "inline-block",

    padding: "6px 10px",

    background: "#fef3c7",

    color: "#b45309",

    borderRadius: "20px",

    fontSize: "13px",

    fontWeight: "600",

  },


  lowRiskBadge: {

    display: "inline-block",

    padding: "6px 10px",

    background: "#dcfce7",

    color: "#15803d",

    borderRadius: "20px",

    fontSize: "13px",

    fontWeight: "600",

  },


  viewButton: {

    padding: "8px 14px",

    background: "#2563eb",

    color: "#ffffff",

    border: "none",

    borderRadius: "6px",

    cursor: "pointer",

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