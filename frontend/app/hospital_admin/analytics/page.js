"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  getPatients,
  getAnalyticsSummary,
  getRiskDistribution,
  getModelPerformance,
} from "../../../lib/api";


// ============================================================
// HOSPITAL ADMIN ANALYTICS
// ============================================================

export default function HospitalAnalyticsPage() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [patients, setPatients] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [riskDistribution, setRiskDistribution] =
    useState({});

  const [modelPerformance, setModelPerformance] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  async function loadAnalytics() {

    try {

      setLoading(true);

      setError("");


      // ========================================================
      // FETCH ANALYTICS
      // ========================================================

      const [

        patientsData,

        summaryData,

        riskData,

        modelData,

      ] = await Promise.all([

        getPatients(),

        getAnalyticsSummary(),

        getRiskDistribution(),

        getModelPerformance(),

      ]);


      console.log(
        "HOSPITAL ANALYTICS PATIENTS:",
        patientsData
      );

      console.log(
        "HOSPITAL ANALYTICS SUMMARY:",
        summaryData
      );

      console.log(
        "HOSPITAL ANALYTICS RISK:",
        riskData
      );

      console.log(
        "HOSPITAL ANALYTICS MODEL:",
        modelData
      );


      // ========================================================
      // NORMALIZE PATIENTS
      // ========================================================

      let patientList = [];


      if (
        Array.isArray(patientsData)
      ) {

        patientList =
          patientsData;

      }

      else if (
        Array.isArray(
          patientsData?.data
        )
      ) {

        patientList =
          patientsData.data;

      }

      else if (
        Array.isArray(
          patientsData?.patients
        )
      ) {

        patientList =
          patientsData.patients;

      }


      // ========================================================
      // SAVE DATA
      // ========================================================

      setPatients(
        patientList
      );


      setSummary(
        summaryData || {}
      );


      setRiskDistribution(
        riskData?.distribution || {}
      );


      setModelPerformance(
        modelData || {}
      );

    }

    catch (err) {

      console.error(
        "HOSPITAL ANALYTICS ERROR:",
        err
      );


      setError(
        err?.message ||
        "Failed to load Hospital Analytics."
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadAnalytics();

  }, []);


  // ==========================================================
  // VALUES
  // ==========================================================

  const totalPatients =
    patients.length;


  const totalPredictions =
    Number(
      summary?.total_predictions || 0
    );


  const highRisk =
    Number(
      summary?.high_risk || 0
    );


  const mediumRisk =
    Number(
      summary?.medium_risk || 0
    );


  const lowRisk =
    Number(
      summary?.low_risk || 0
    );


  // ==========================================================
  // RISK TOTAL
  // ==========================================================

  const riskTotal =
    highRisk +
    mediumRisk +
    lowRisk;


  // ==========================================================
  // RISK PERCENTAGES
  // ==========================================================

  const highRiskPercentage =
    riskTotal > 0
      ? Math.round(
          (highRisk / riskTotal) * 100
        )
      : 0;


  const mediumRiskPercentage =
    riskTotal > 0
      ? Math.round(
          (mediumRisk / riskTotal) * 100
        )
      : 0;


  const lowRiskPercentage =
    riskTotal > 0
      ? Math.round(
          (lowRisk / riskTotal) * 100
        )
      : 0;


  // ==========================================================
  // MODEL
  // ==========================================================

  const modelName =
    modelPerformance?.model_name ||
    "CatBoost";


  const modelStatus =
    modelPerformance?.model_status ||
    "unknown";


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <main
        style={styles.main}
      >

        <div
          style={styles.centerMessage}
        >

          Loading Hospital Analytics...

        </div>

      </main>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <main
        style={styles.main}
      >

        <div
          style={styles.errorCard}
        >

          <h2
            style={styles.errorTitle}
          >

            Failed to Load Hospital Analytics

          </h2>


          <p
            style={styles.errorText}
          >

            {error}

          </p>


          <p
            style={styles.errorDescription}
          >

            Please check whether the backend
            is running and your account is
            authorized to access analytics.

          </p>


          <button
            onClick={loadAnalytics}
            style={styles.retryButton}
          >

            Retry

          </button>

        </div>

      </main>

    );

  }


  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (

    <main
      style={styles.main}
    >

      <div
        style={styles.container}
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header
          style={styles.header}
        >

          <div>

            <h1
              style={styles.title}
            >

              Hospital Analytics

            </h1>


            <p
              style={styles.subtitle}
            >

              Hospital-wide patient risk
              and AI prediction analytics

            </p>

          </div>


          <div
            style={styles.headerActions}
          >

            <Link
              href="/hospital_admin"
              style={styles.backButton}
            >

              Back to Hospital Admin

            </Link>


            <Link
              href="/login"
              style={styles.logout}
            >

              Logout

            </Link>

          </div>

        </header>


        {/* ====================================================
            HOSPITAL OVERVIEW
        ==================================================== */}

        <section
          style={styles.section}
        >

          <h2
            style={styles.sectionTitle}
          >

            Hospital Overview

          </h2>


          <div
            style={styles.grid}
          >

            {/* PATIENTS */}

            <div
              style={styles.card}
            >

              <p
                style={styles.cardLabel}
              >

                Total Patients

              </p>


              <p
                style={styles.number}
              >

                {totalPatients}

              </p>


              <p
                style={styles.description}
              >

                Registered patients in the
                hospital system.

              </p>

            </div>


            {/* PREDICTIONS */}

            <div
              style={styles.card}
            >

              <p
                style={styles.cardLabel}
              >

                AI Predictions

              </p>


              <p
                style={styles.number}
              >

                {totalPredictions}

              </p>


              <p
                style={styles.description}
              >

                Total readmission risk predictions.

              </p>

            </div>


            {/* HIGH RISK */}

            <div
              style={styles.card}
            >

              <p
                style={styles.cardLabel}
              >

                High Risk

              </p>


              <p
                style={styles.highRiskNumber}
              >

                {highRisk}

              </p>


              <p
                style={styles.description}
              >

                Patients classified as high risk.

              </p>

            </div>


            {/* MODEL */}

            <div
              style={styles.card}
            >

              <p
                style={styles.cardLabel}
              >

                Active Model

              </p>


              <p
                style={styles.modelNumber}
              >

                {modelName}

              </p>


              <p
                style={styles.description}
              >

                Status: {modelStatus}

              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            RISK DISTRIBUTION
        ==================================================== */}

        <section
          style={styles.section}
        >

          <h2
            style={styles.sectionTitle}
          >

            Patient Risk Distribution

          </h2>


          <div
            style={styles.grid}
          >

            {/* HIGH */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                High Risk

              </h3>


              <p
                style={styles.highRiskNumber}
              >

                {highRisk}

              </p>


              <p
                style={styles.percentage}
              >

                {highRiskPercentage}%

              </p>


              <div
                style={styles.progressBackground}
              >

                <div
                  style={{
                    ...styles.progressHighRisk,
                    width:
                      `${highRiskPercentage}%`,
                  }}
                />

              </div>

            </div>


            {/* MEDIUM */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Medium Risk

              </h3>


              <p
                style={styles.mediumRiskNumber}
              >

                {mediumRisk}

              </p>


              <p
                style={styles.percentage}
              >

                {mediumRiskPercentage}%

              </p>


              <div
                style={styles.progressBackground}
              >

                <div
                  style={{
                    ...styles.progressMediumRisk,
                    width:
                      `${mediumRiskPercentage}%`,
                  }}
                />

              </div>

            </div>


            {/* LOW */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Low Risk

              </h3>


              <p
                style={styles.lowRiskNumber}
              >

                {lowRisk}

              </p>


              <p
                style={styles.percentage}
              >

                {lowRiskPercentage}%

              </p>


              <div
                style={styles.progressBackground}
              >

                <div
                  style={{
                    ...styles.progressLowRisk,
                    width:
                      `${lowRiskPercentage}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            RISK DISTRIBUTION FROM DATABASE
        ==================================================== */}

        <section
          style={styles.section}
        >

          <h2
            style={styles.sectionTitle}
          >

            Database Risk Distribution

          </h2>


          <div
            style={styles.summary}
          >

            {Object.keys(
              riskDistribution
            ).length === 0 ? (

              <p>

                No risk distribution data
                is currently available.

              </p>

            ) : (

              Object.entries(
                riskDistribution
              ).map(
                ([risk, count]) => (

                  <div
                    key={risk}
                    style={styles.riskRow}
                  >

                    <span>

                      {risk || "Unknown"}

                    </span>


                    <strong>

                      {Number(count)}

                    </strong>

                  </div>

                )
              )

            )}

          </div>

        </section>


        {/* ====================================================
            PERFORMANCE SUMMARY
        ==================================================== */}

        <section
          style={styles.summary}
        >

          <h2>

            Hospital Performance Summary

          </h2>


          <p>

            The hospital currently has{" "}

            <strong>
              {totalPatients}
            </strong>

            {" "}registered patients.

          </p>


          <p>

            A total of{" "}

            <strong>
              {totalPredictions}
            </strong>

            {" "}AI-based readmission risk
            predictions have been recorded.

          </p>


          <p>

            High-risk predictions:{" "}

            <strong>
              {highRisk}
            </strong>

          </p>


          <p>

            Medium-risk predictions:{" "}

            <strong>
              {mediumRisk}
            </strong>

          </p>


          <p>

            Low-risk predictions:{" "}

            <strong>
              {lowRisk}
            </strong>

          </p>


          <p>

            Active prediction model:{" "}

            <strong>
              {modelName}
            </strong>

          </p>

        </section>


        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <section
          style={styles.section}
        >

          <h2
            style={styles.sectionTitle}
          >

            Quick Actions

          </h2>


          <div
            style={styles.actions}
          >

            <Link
              href="/hospital_admin/patients"
              style={styles.actionButton}
            >

              View Patients

            </Link>


            <Link
              href="/hospital_admin/predictions"
              style={styles.actionButton}
            >

              View AI Predictions

            </Link>


            <Link
              href="/hospital_admin/treatments"
              style={styles.actionButton}
            >

              View Treatments

            </Link>


            <button
              onClick={loadAnalytics}
              style={styles.refreshButton}
            >

              Refresh Analytics

            </button>

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

    minHeight:
      "100vh",

    background:
      "#f5f7fb",

    padding:
      "40px",

  },


  container: {

    maxWidth:
      "1200px",

    margin:
      "0 auto",

  },


  header: {

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      "20px",

    marginBottom:
      "40px",

  },


  headerActions: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "15px",

  },


  title: {

    fontSize:
      "32px",

    color:
      "#111827",

    margin:
      "0 0 10px 0",

  },


  subtitle: {

    color:
      "#6b7280",

    margin:
      0,

  },


  section: {

    marginTop:
      "40px",

  },


  sectionTitle: {

    fontSize:
      "24px",

    color:
      "#111827",

    marginBottom:
      "20px",

  },


  grid: {

    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",

    gap:
      "20px",

  },


  card: {

    background:
      "#ffffff",

    padding:
      "25px",

    borderRadius:
      "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  analyticsCard: {

    background:
      "#ffffff",

    padding:
      "25px",

    borderRadius:
      "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  cardLabel: {

    color:
      "#6b7280",

    fontSize:
      "14px",

    margin:
      0,

  },


  number: {

    fontSize:
      "34px",

    fontWeight:
      "700",

    color:
      "#2563eb",

    margin:
      "10px 0",

  },


  modelNumber: {

    fontSize:
      "25px",

    fontWeight:
      "700",

    color:
      "#7c3aed",

    margin:
      "10px 0",

  },


  highRiskNumber: {

    fontSize:
      "34px",

    fontWeight:
      "700",

    color:
      "#dc2626",

    margin:
      "10px 0",

  },


  mediumRiskNumber: {

    fontSize:
      "34px",

    fontWeight:
      "700",

    color:
      "#d97706",

    margin:
      "10px 0",

  },


  lowRiskNumber: {

    fontSize:
      "34px",

    fontWeight:
      "700",

    color:
      "#16a34a",

    margin:
      "10px 0",

  },


  percentage: {

    color:
      "#6b7280",

    fontSize:
      "15px",

    fontWeight:
      "600",

  },


  description: {

    color:
      "#6b7280",

    fontSize:
      "14px",

    lineHeight:
      "1.5",

  },


  progressBackground: {

    width:
      "100%",

    height:
      "10px",

    background:
      "#e5e7eb",

    borderRadius:
      "10px",

    overflow:
      "hidden",

    marginTop:
      "15px",

  },


  progressHighRisk: {

    height:
      "100%",

    background:
      "#dc2626",

    borderRadius:
      "10px",

  },


  progressMediumRisk: {

    height:
      "100%",

    background:
      "#d97706",

    borderRadius:
      "10px",

  },


  progressLowRisk: {

    height:
      "100%",

    background:
      "#16a34a",

    borderRadius:
      "10px",

  },


  summary: {

    marginTop:
      "40px",

    background:
      "#ffffff",

    padding:
      "30px",

    borderRadius:
      "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

    lineHeight:
      "1.7",

  },


  riskRow: {

    display:
      "flex",

    justifyContent:
      "space-between",

    padding:
      "12px 0",

    borderBottom:
      "1px solid #e5e7eb",

  },


  actions: {

    display:
      "flex",

    gap:
      "15px",

    flexWrap:
      "wrap",

  },


  actionButton: {

    display:
      "inline-block",

    padding:
      "12px 20px",

    background:
      "#2563eb",

    color:
      "#ffffff",

    borderRadius:
      "8px",

    textDecoration:
      "none",

    fontSize:
      "15px",

  },


  refreshButton: {

    padding:
      "12px 20px",

    background:
      "#111827",

    color:
      "#ffffff",

    border:
      "none",

    borderRadius:
      "8px",

    cursor:
      "pointer",

    fontSize:
      "15px",

  },


  backButton: {

    padding:
      "10px 16px",

    background:
      "#2563eb",

    color:
      "#ffffff",

    borderRadius:
      "8px",

    textDecoration:
      "none",

    fontWeight:
      "600",

  },


  logout: {

    color:
      "#dc2626",

    textDecoration:
      "none",

    fontWeight:
      "600",

  },


  centerMessage: {

    textAlign:
      "center",

    paddingTop:
      "100px",

    fontSize:
      "20px",

    color:
      "#374151",

  },


  errorCard: {

    maxWidth:
      "600px",

    margin:
      "100px auto",

    padding:
      "30px",

    background:
      "#ffffff",

    borderRadius:
      "14px",

    textAlign:
      "center",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  errorTitle: {

    color:
      "#111827",

  },


  errorText: {

    color:
      "#dc2626",

    fontWeight:
      "600",

  },


  errorDescription: {

    color:
      "#6b7280",

  },


  retryButton: {

    marginTop:
      "15px",

    padding:
      "10px 20px",

    background:
      "#2563eb",

    color:
      "#ffffff",

    border:
      "none",

    borderRadius:
      "7px",

    cursor:
      "pointer",

  },

};