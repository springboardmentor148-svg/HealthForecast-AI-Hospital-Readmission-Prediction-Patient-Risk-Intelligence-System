"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getPatients,
  getPredictions,
  getTreatments,
} from "../../lib/api";

// ============================================================
// HOSPITAL ADMIN DASHBOARD
// ============================================================

export default function HospitalAdminPage() {

  // ============================================================
  // STATE
  // ============================================================

  const [patients, setPatients] = useState([]);

  const [predictions, setPredictions] = useState([]);

  const [treatments, setTreatments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // LOAD HOSPITAL DATA
  // ============================================================

  const loadHospitalData = async (isRefresh = false) => {

    try {

      // ----------------------------------------------------------
      // SHOW LOADING STATE
      // ----------------------------------------------------------

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // ----------------------------------------------------------
      // GET ALL HOSPITAL DATA
      // ----------------------------------------------------------

      const [
        patientsData,
        predictionsData,
        treatmentsData,
      ] = await Promise.all([
        getPatients(),
        getPredictions(),
        getTreatments(),
      ]);

      // ==========================================================
      // DEBUG LOGS
      // ==========================================================

      console.log(
        "HOSPITAL ADMIN PATIENTS:",
        patientsData
      );

      console.log(
        "HOSPITAL ADMIN PREDICTIONS:",
        predictionsData
      );

      console.log(
        "HOSPITAL ADMIN TREATMENTS:",
        treatmentsData
      );

      // ==========================================================
      // PATIENT DATA
      // ==========================================================

      let patientsList = [];

      if (Array.isArray(patientsData)) {

        patientsList = patientsData;

      } else if (
        Array.isArray(patientsData?.data)
      ) {

        patientsList = patientsData.data;

      } else if (
        Array.isArray(patientsData?.patients)
      ) {

        patientsList = patientsData.patients;

      }

      // ==========================================================
      // PREDICTION DATA
      // ==========================================================

      let predictionsList = [];

      if (Array.isArray(predictionsData)) {

        predictionsList = predictionsData;

      } else if (
        Array.isArray(predictionsData?.data)
      ) {

        predictionsList = predictionsData.data;

      } else if (
        Array.isArray(predictionsData?.predictions)
      ) {

        predictionsList = predictionsData.predictions;

      }

      // ==========================================================
      // TREATMENT DATA
      // ==========================================================

      let treatmentsList = [];

      if (Array.isArray(treatmentsData)) {

        treatmentsList = treatmentsData;

      } else if (
        Array.isArray(treatmentsData?.data)
      ) {

        treatmentsList = treatmentsData.data;

      } else if (
        Array.isArray(treatmentsData?.treatments)
      ) {

        treatmentsList = treatmentsData.treatments;

      }

      // ==========================================================
      // SAVE UPDATED DATA
      // ==========================================================

      setPatients(patientsList);

      setPredictions(predictionsList);

      setTreatments(treatmentsList);

    } catch (err) {

      console.error(
        "HOSPITAL ADMIN ERROR:",
        err
      );

      setError(
        err?.message ||
        "Failed to load hospital data."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };

  // ============================================================
  // INITIAL DATA LOAD
  // ============================================================

  useEffect(() => {

    loadHospitalData();

  }, []);

  // ============================================================
  // REFRESH ANALYTICS
  // ============================================================

  const handleRefresh = async () => {

    if (refreshing) {
      return;
    }

    await loadHospitalData(true);

  };

  // ============================================================
  // TOTAL PATIENTS
  // ============================================================

  const totalPatients =
    patients.length;

  // ============================================================
  // TOTAL PREDICTIONS
  // ============================================================

  const totalPredictions =
    predictions.length;

  // ============================================================
  // GET PREDICTION RISK
  // ============================================================

  const getPredictionRisk = (
    prediction
  ) => {

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
  // HIGH RISK PATIENTS
  // ============================================================

  const highRiskPatients =

    useMemo(() => {

      return predictions.filter(

        (prediction) => {

          const risk =
            getPredictionRisk(
              prediction
            );

          return risk.includes(
            "high"
          );

        }

      ).length;

    }, [predictions]);

  // ============================================================
  // MEDIUM RISK PATIENTS
  // ============================================================

  const mediumRiskPatients =

    useMemo(() => {

      return predictions.filter(

        (prediction) => {

          const risk =
            getPredictionRisk(
              prediction
            );

          return risk.includes(
            "medium"
          );

        }

      ).length;

    }, [predictions]);

  // ============================================================
  // LOW RISK PATIENTS
  // ============================================================

  const lowRiskPatients =

    useMemo(() => {

      return predictions.filter(

        (prediction) => {

          const risk =
            getPredictionRisk(
              prediction
            );

          return risk.includes(
            "low"
          );

        }

      ).length;

    }, [predictions]);

  // ============================================================
  // TOTAL TREATMENTS
  // ============================================================

  const totalTreatments =
    treatments.length;

  // ============================================================
  // PLANNED TREATMENTS
  // ============================================================

  const plannedTreatments =

    treatments.filter(

      (treatment) =>

        String(
          treatment?.status || ""
        ).toLowerCase() ===
        "planned"

    ).length;

  // ============================================================
  // ONGOING TREATMENTS
  // ============================================================

  const ongoingTreatments =

    treatments.filter(

      (treatment) =>

        String(
          treatment?.status || ""
        ).toLowerCase() ===
        "ongoing"

    ).length;

  // ============================================================
  // COMPLETED TREATMENTS
  // ============================================================

  const completedTreatments =

    treatments.filter(

      (treatment) =>

        String(
          treatment?.status || ""
        ).toLowerCase() ===
        "completed"

    ).length;

  // ============================================================
  // TREATMENT COMPLETION RATE
  // ============================================================

  const treatmentCompletionRate =

    totalTreatments > 0

      ? Math.round(

          (
            completedTreatments /
            totalTreatments
          ) * 100

        )

      : 0;

  // ============================================================
  // SUCCESSFUL TREATMENTS
  // ============================================================

  const successfulTreatments =

    treatments.filter(

      (treatment) => {

        const outcome =

          String(
            treatment?.outcome || ""
          ).toLowerCase();

        return (

          outcome ===
            "successful" ||

          outcome ===
            "success" ||

          outcome ===
            "improved"

        );

      }

    ).length;

  // ============================================================
  // UNSUCCESSFUL TREATMENTS
  // ============================================================

  const unsuccessfulTreatments =

    treatments.filter(

      (treatment) => {

        const outcome =

          String(
            treatment?.outcome || ""
          ).toLowerCase();

        return (

          outcome ===
            "unsuccessful" ||

          outcome ===
            "failed" ||

          outcome ===
            "no improvement"

        );

      }

    ).length;

  // ============================================================
  // NOT EVALUATED TREATMENTS
  // ============================================================

  const notEvaluatedTreatments =

    Math.max(

      0,

      totalTreatments -

      successfulTreatments -

      unsuccessfulTreatments

    );

  // ============================================================
  // INITIAL LOADING
  // ============================================================

  if (loading) {

    return (

      <main style={styles.main}>

        <div style={styles.centerMessage}>

          Loading Hospital Analytics...

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
            Failed to Load Hospital Analytics
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>

          <p>
            Please check whether the backend is running.
          </p>

          <button
            onClick={() => loadHospitalData(true)}
            disabled={refreshing}
            style={styles.retryButton}
          >

            {refreshing
              ? "Refreshing..."
              : "Retry"
            }

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

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>

              Hospital Administrator Dashboard

            </h1>

            <p style={styles.subtitle}>

              Hospital-wide analytics and patient risk management

            </p>

          </div>

          <Link
            href="/login"
            style={styles.logout}
          >

            Logout

          </Link>

        </div>

        {/* ======================================================
            HOSPITAL OVERVIEW
        ====================================================== */}

        <h2 style={styles.sectionTitle}>

          Hospital Overview

        </h2>

        <div style={styles.grid}>

          {/* TOTAL PATIENTS */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Total Patients

            </p>

            <p style={styles.number}>

              {totalPatients}

            </p>

            <p style={styles.description}>

              Registered patients in the hospital system.

            </p>

          </div>

          {/* AI PREDICTIONS */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              AI Predictions

            </p>

            <p style={styles.number}>

              {totalPredictions}

            </p>

            <p style={styles.description}>

              Total AI-based readmission risk predictions.

            </p>

          </div>

          {/* HIGH RISK */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              High Risk Patients

            </p>

            <p style={styles.highRiskNumber}>

              {highRiskPatients}

            </p>

            <p style={styles.description}>

              Patients identified as high readmission risk.

            </p>

          </div>

          {/* TOTAL TREATMENTS */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Total Treatments

            </p>

            <p style={styles.number}>

              {totalTreatments}

            </p>

            <p style={styles.description}>

              Treatments recorded in the hospital system.

            </p>

          </div>

        </div>

        {/* ======================================================
            RISK DISTRIBUTION
        ====================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Patient Risk Distribution

          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>
                High Risk
              </h3>

              <p style={styles.highRiskNumber}>

                {highRiskPatients}

              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Medium Risk
              </h3>

              <p style={styles.mediumRiskNumber}>

                {mediumRiskPatients}

              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Low Risk
              </h3>

              <p style={styles.lowRiskNumber}>

                {lowRiskPatients}

              </p>

            </div>

          </div>

        </section>

        {/* ======================================================
            TREATMENT PERFORMANCE
        ====================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Treatment Performance

          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>
                Planned
              </h3>

              <p style={styles.number}>

                {plannedTreatments}

              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Ongoing
              </h3>

              <p style={styles.number}>

                {ongoingTreatments}

              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Completed
              </h3>

              <p style={styles.number}>

                {completedTreatments}

              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Completion Rate
              </h3>

              <p style={styles.number}>

                {treatmentCompletionRate}%

              </p>

            </div>

          </div>

        </section>

        {/* ======================================================
            TREATMENT OUTCOMES
        ====================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Treatment Outcomes

          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>
                Successful
              </h3>

              <p style={styles.number}>

                {successfulTreatments}

              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Unsuccessful
              </h3>

              <p style={styles.number}>

                {unsuccessfulTreatments}

              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Not Evaluated
              </h3>

              <p style={styles.number}>

                {notEvaluatedTreatments}

              </p>

            </div>

          </div>

        </section>

        {/* ======================================================
            HOSPITAL SUMMARY
        ====================================================== */}

        <section style={styles.summary}>

          <h2>

            Hospital Performance Summary

          </h2>

          <p>

            The hospital currently has{" "}

            <strong>
              {totalPatients}
            </strong>{" "}

            registered patients and{" "}

            <strong>
              {totalPredictions}
            </strong>{" "}

            AI predictions.

          </p>

          <p>

            <strong>
              {highRiskPatients}
            </strong>{" "}

            patients are currently classified as high risk based on available prediction data.

          </p>

          <p>

            The treatment completion rate is currently{" "}

            <strong>
              {treatmentCompletionRate}%
            </strong>.

          </p>

        </section>

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Quick Actions

          </h2>

          <div style={styles.actions}>

            <Link
              href="/hospital_admin/patients"
              style={styles.actionButton}
            >

              Manage Patients

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

              Manage Treatments

            </Link>

            <Link
              href="/hospital_admin/analytics"
              style={styles.actionButton}
            >

              Hospital Analytics

            </Link>

            {/* ==================================================
                REFRESH ANALYTICS BUTTON
            ================================================== */}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                ...styles.actionButton,
                ...(refreshing
                  ? styles.refreshingButton
                  : {}
                ),
              }}
            >

              {refreshing
                ? "Refreshing..."
                : "Refresh Analytics"
              }

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

  },

  title: {

    fontSize: "32px",

    color: "#111827",

    marginBottom: "10px",

  },

  subtitle: {

    color: "#6b7280",

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

  grid: {

    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",

    gap: "20px",

  },

  card: {

    background: "white",

    padding: "25px",

    borderRadius: "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },

  analyticsCard: {

    background: "white",

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

  },

  summary: {

    marginTop: "40px",

    background: "white",

    padding: "30px",

    borderRadius: "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },

  actions: {

    display: "flex",

    gap: "15px",

    flexWrap: "wrap",

  },

  actionButton: {

    display: "inline-block",

    padding: "12px 20px",

    background: "#2563eb",

    color: "white",

    borderRadius: "8px",

    textDecoration: "none",

    border: "none",

    cursor: "pointer",

    fontSize: "15px",

  },

  refreshingButton: {

    opacity: 0.7,

    cursor: "not-allowed",

  },

  logout: {

    color: "#dc2626",

    textDecoration: "none",

    fontWeight: "600",

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

    background: "white",

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

    color: "white",

    border: "none",

    borderRadius: "7px",

    cursor: "pointer",

  },

};