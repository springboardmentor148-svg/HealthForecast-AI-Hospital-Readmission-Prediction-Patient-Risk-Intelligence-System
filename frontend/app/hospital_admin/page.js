"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getPatients,
  getPredictions,
  getTreatments,
} from "../../lib/api";

export default function HospitalAdminPage() {

  const [patients, setPatients] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [treatments, setTreatments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD HOSPITAL DATA
  // ============================================================

  const loadHospitalData = async (
    isRefresh = false
  ) => {

    try {

      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // ========================================================
      // IMPORTANT:
      // DO NOT USE Promise.all()
      //
      // One 422 treatment error should NOT destroy
      // the complete hospital dashboard.
      // ========================================================

      const [
        patientsResult,
        predictionsResult,
        treatmentsResult,
      ] = await Promise.allSettled([

        getPatients(),

        getPredictions(),

        getTreatments(),

      ]);

      // ========================================================
      // PATIENTS
      // ========================================================

      if (
        patientsResult.status === "fulfilled"
      ) {

        const data =
          patientsResult.value;

        if (Array.isArray(data)) {
          setPatients(data);
        }

        else if (
          Array.isArray(data?.data)
        ) {
          setPatients(data.data);
        }

        else if (
          Array.isArray(data?.patients)
        ) {
          setPatients(data.patients);
        }

        else {
          setPatients([]);
        }

      } else {

        console.error(
          "PATIENT API ERROR:",
          patientsResult.reason
        );

        setPatients([]);
      }

      // ========================================================
      // PREDICTIONS
      // ========================================================

      if (
        predictionsResult.status === "fulfilled"
      ) {

        const data =
          predictionsResult.value;

        if (Array.isArray(data)) {
          setPredictions(data);
        }

        else if (
          Array.isArray(data?.data)
        ) {
          setPredictions(data.data);
        }

        else if (
          Array.isArray(data?.predictions)
        ) {
          setPredictions(
            data.predictions
          );
        }

        else {
          setPredictions([]);
        }

      } else {

        console.error(
          "PREDICTION API ERROR:",
          predictionsResult.reason
        );

        setPredictions([]);
      }

      // ========================================================
      // TREATMENTS
      // ========================================================

      if (
        treatmentsResult.status === "fulfilled"
      ) {

        const data =
          treatmentsResult.value;

        if (Array.isArray(data)) {
          setTreatments(data);
        }

        else if (
          Array.isArray(data?.data)
        ) {
          setTreatments(data.data);
        }

        else if (
          Array.isArray(data?.treatments)
        ) {
          setTreatments(
            data.treatments
          );
        }

        else {
          setTreatments([]);
        }

      } else {

        // Treatment API currently returns 422.
        // Keep dashboard working.

        console.error(
          "TREATMENT API ERROR:",
          treatmentsResult.reason
        );

        setTreatments([]);
      }

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
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadHospitalData();

  }, []);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {

    if (refreshing) {
      return;
    }

    await loadHospitalData(true);
  };

  // ============================================================
  // PATIENT STATISTICS
  // ============================================================

  const totalPatients =
    patients.length;

  // ============================================================
  // PREDICTION STATISTICS
  // ============================================================

  const totalPredictions =
    predictions.length;

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

  const highRiskPatients =
    useMemo(() => {

      return predictions.filter(
        (prediction) =>
          getPredictionRisk(
            prediction
          ).includes("high")
      ).length;

    }, [predictions]);

  const mediumRiskPatients =
    useMemo(() => {

      return predictions.filter(
        (prediction) =>
          getPredictionRisk(
            prediction
          ).includes("medium")
      ).length;

    }, [predictions]);

  const lowRiskPatients =
    useMemo(() => {

      return predictions.filter(
        (prediction) =>
          getPredictionRisk(
            prediction
          ).includes("low")
      ).length;

    }, [predictions]);

  // ============================================================
  // TREATMENT STATISTICS
  // ============================================================

  const totalTreatments =
    treatments.length;

  const plannedTreatments =
    treatments.filter(
      (treatment) =>
        String(
          treatment?.status || ""
        ).toLowerCase() ===
        "planned"
    ).length;

  const ongoingTreatments =
    treatments.filter(
      (treatment) =>
        String(
          treatment?.status || ""
        ).toLowerCase() ===
        "ongoing"
    ).length;

  const completedTreatments =
    treatments.filter(
      (treatment) =>
        String(
          treatment?.status || ""
        ).toLowerCase() ===
        "completed"
    ).length;

  const treatmentCompletionRate =
    totalTreatments > 0
      ? Math.round(
          (
            completedTreatments /
            totalTreatments
          ) * 100
        )
      : 0;

  const successfulTreatments =
    treatments.filter(
      (treatment) => {

        const outcome =
          String(
            treatment?.outcome || ""
          ).toLowerCase();

        return (
          outcome === "successful" ||
          outcome === "success" ||
          outcome === "improved"
        );

      }
    ).length;

  const unsuccessfulTreatments =
    treatments.filter(
      (treatment) => {

        const outcome =
          String(
            treatment?.outcome || ""
          ).toLowerCase();

        return (
          outcome === "unsuccessful" ||
          outcome === "failed" ||
          outcome === "no improvement"
        );

      }
    ).length;

  const notEvaluatedTreatments =
    Math.max(
      0,
      totalTreatments -
        successfulTreatments -
        unsuccessfulTreatments
    );

  // ============================================================
  // LOADING
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
  // MAIN DASHBOARD
  // ============================================================

  return (

    <main style={styles.main}>

      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Hospital Administrator Dashboard
            </h1>

            <p style={styles.subtitle}>
              Hospital-wide analytics and
              patient risk management
            </p>

          </div>

          <Link
            href="/login"
            style={styles.logout}
          >
            Logout
          </Link>

        </div>

        {/* API WARNING */}

        {error && (

          <div style={styles.warning}>

            {error}

          </div>

        )}

        {/* TREATMENT API WARNING */}

        {treatments.length === 0 &&
          totalPatients > 0 && (

          <div style={styles.info}>

            Treatment data is currently
            unavailable. Patient and prediction
            analytics are still displayed.

          </div>

        )}

        {/* OVERVIEW */}

        <h2 style={styles.sectionTitle}>
          Hospital Overview
        </h2>

        <div style={styles.grid}>

          <div style={styles.card}>

            <p style={styles.cardLabel}>
              Total Patients
            </p>

            <p style={styles.number}>
              {totalPatients}
            </p>

            <p style={styles.description}>
              Registered patients in the
              hospital system.
            </p>

          </div>

          <div style={styles.card}>

            <p style={styles.cardLabel}>
              AI Predictions
            </p>

            <p style={styles.number}>
              {totalPredictions}
            </p>

            <p style={styles.description}>
              Total AI-based readmission
              risk predictions.
            </p>

          </div>

          <div style={styles.card}>

            <p style={styles.cardLabel}>
              High Risk Patients
            </p>

            <p style={styles.highRiskNumber}>
              {highRiskPatients}
            </p>

            <p style={styles.description}>
              Patients identified as high
              readmission risk.
            </p>

          </div>

          <div style={styles.card}>

            <p style={styles.cardLabel}>
              Total Treatments
            </p>

            <p style={styles.number}>
              {totalTreatments}
            </p>

            <p style={styles.description}>
              Treatments recorded in the
              hospital system.
            </p>

          </div>

        </div>

        {/* RISK DISTRIBUTION */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Patient Risk Distribution
          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>High Risk</h3>

              <p style={styles.highRiskNumber}>
                {highRiskPatients}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>Medium Risk</h3>

              <p style={styles.mediumRiskNumber}>
                {mediumRiskPatients}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>Low Risk</h3>

              <p style={styles.lowRiskNumber}>
                {lowRiskPatients}
              </p>

            </div>

          </div>

        </section>

        {/* TREATMENT PERFORMANCE */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Treatment Performance
          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>Planned</h3>

              <p style={styles.number}>
                {plannedTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>Ongoing</h3>

              <p style={styles.number}>
                {ongoingTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>Completed</h3>

              <p style={styles.number}>
                {completedTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>Completion Rate</h3>

              <p style={styles.number}>
                {treatmentCompletionRate}%
              </p>

            </div>

          </div>

        </section>

        {/* TREATMENT OUTCOMES */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Treatment Outcomes
          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>Successful</h3>

              <p style={styles.number}>
                {successfulTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>Unsuccessful</h3>

              <p style={styles.number}>
                {unsuccessfulTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>Not Evaluated</h3>

              <p style={styles.number}>
                {notEvaluatedTreatments}
              </p>

            </div>

          </div>

        </section>

        {/* SUMMARY */}

        <section style={styles.summary}>

          <h2>
            Hospital Performance Summary
          </h2>

          <p>
            The hospital currently has{" "}
            <strong>
              {totalPatients}
            </strong>{" "}
            registered patients.
          </p>

          <p>
            A total of{" "}
            <strong>
              {totalPredictions}
            </strong>{" "}
            AI predictions are available.
          </p>

          <p>
            <strong>
              {highRiskPatients}
            </strong>{" "}
            patients are currently
            classified as high risk.
          </p>

        </section>

        {/* QUICK ACTIONS */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Quick Actions
          </h2>

          <div style={styles.actions}>

            <Link
              href="/hospital_admin/analytics"
              style={styles.actionButton}
            >
              Hospital Analytics
            </Link>

            <Link
              href="/hospital_admin/reports"
              style={styles.actionButton}
            >
              Reports
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={
                refreshing
                  ? styles.refreshDisabled
                  : styles.refreshButton
              }
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}

const styles = {

  main: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "30px",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
  },

  logout: {
    padding: "10px 18px",
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
  },

  section: {
    marginTop: "35px",
  },

  sectionTitle: {
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
    background: "#ffffff",
    padding: "25px",
    borderRadius: "14px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.06)",
  },

  analyticsCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.06)",
  },

  cardLabel: {
    color: "#6b7280",
    fontWeight: "600",
  },

  number: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#2563eb",
    margin: "10px 0",
  },

  highRiskNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#dc2626",
  },

  mediumRiskNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#d97706",
  },

  lowRiskNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#16a34a",
  },

  description: {
    color: "#6b7280",
    lineHeight: "1.5",
  },

  summary: {
    marginTop: "35px",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.06)",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
  },

  actionButton: {
    padding: "12px 20px",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
  },

  refreshButton: {
    padding: "12px 20px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  refreshDisabled: {
    padding: "12px 20px",
    background: "#9ca3af",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontWeight: "600",
  },

  warning: {
    padding: "15px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  info: {
    padding: "15px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  centerMessage: {
    textAlign: "center",
    paddingTop: "100px",
    fontSize: "20px",
    color: "#374151",
  },

};