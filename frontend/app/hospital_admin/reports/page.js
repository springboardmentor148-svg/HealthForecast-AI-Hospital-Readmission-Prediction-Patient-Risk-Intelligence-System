"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getPatients,
  getPredictions,
  getTreatments,
} from "../../../lib/api";

export default function HospitalReportsPage() {

  const [patients, setPatients] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [treatments, setTreatments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD REPORT DATA
  // ============================================================

  async function loadReports() {

    try {

      setLoading(true);
      setError("");

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
          setPredictions(data.predictions);
        }

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
          setTreatments(data.treatments);
        }

      }

      // Treatment failure should not destroy the report.
      if (
        treatmentsResult.status === "rejected"
      ) {

        console.error(
          "Treatment API error:",
          treatmentsResult.reason
        );

      }

    }

    catch (err) {

      console.error(
        "REPORTS ERROR:",
        err
      );

      setError(
        err?.message ||
        "Failed to load hospital reports."
      );

    }

    finally {

      setLoading(false);

    }

  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadReports();

  }, []);

  // ============================================================
  // RISK DETECTION
  // ============================================================

  function getRisk(prediction) {

    return String(

      prediction?.risk_level ||

      prediction?.riskLevel ||

      prediction?.risk ||

      prediction?.risk_category ||

      prediction?.riskCategory ||

      ""

    ).toLowerCase();

  }

  const highRisk =
    predictions.filter(
      (prediction) =>
        getRisk(prediction).includes("high")
    ).length;

  const mediumRisk =
    predictions.filter(
      (prediction) =>
        getRisk(prediction).includes("medium")
    ).length;

  const lowRisk =
    predictions.filter(
      (prediction) =>
        getRisk(prediction).includes("low")
    ).length;

  // ============================================================
  // TREATMENT STATISTICS
  // ============================================================

  const completedTreatments =
    treatments.filter(
      (treatment) =>
        String(
          treatment?.status || ""
        ).toLowerCase() === "completed"
    ).length;

  const ongoingTreatments =
    treatments.filter(
      (treatment) =>
        String(
          treatment?.status || ""
        ).toLowerCase() === "ongoing"
    ).length;

  const plannedTreatments =
    treatments.filter(
      (treatment) =>
        String(
          treatment?.status || ""
        ).toLowerCase() === "planned"
    ).length;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <main style={styles.main}>

        <div style={styles.centerMessage}>

          Loading Hospital Reports...

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
            Failed to Load Reports
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>

          <button
            onClick={loadReports}
            style={styles.button}
          >
            Retry
          </button>

        </div>

      </main>

    );

  }

  // ============================================================
  // REPORT PAGE
  // ============================================================

  return (

    <main style={styles.main}>

      <div style={styles.container}>

        {/* HEADER */}

        <header style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Hospital Reports
            </h1>

            <p style={styles.subtitle}>
              Hospital-wide patient,
              prediction and treatment report
            </p>

          </div>

          <div style={styles.headerActions}>

            <Link
              href="/hospital_admin"
              style={styles.backButton}
            >
              Back to Hospital admin
            </Link>

            <button
              onClick={() => window.print()}
              style={styles.printButton}
            >
              Print Report
            </button>

          </div>

        </header>

        {/* OVERVIEW */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Hospital Overview
          </h2>

          <div style={styles.grid}>

            <div style={styles.card}>

              <p style={styles.label}>
                Total Patients
              </p>

              <p style={styles.number}>
                {patients.length}
              </p>

            </div>

            <div style={styles.card}>

              <p style={styles.label}>
                Total AI Predictions
              </p>

              <p style={styles.number}>
                {predictions.length}
              </p>

            </div>

            <div style={styles.card}>

              <p style={styles.label}>
                High Risk
              </p>

              <p style={styles.highRisk}>
                {highRisk}
              </p>

            </div>

            <div style={styles.card}>

              <p style={styles.label}>
                Total Treatments
              </p>

              <p style={styles.number}>
                {treatments.length}
              </p>

            </div>

          </div>

        </section>

        {/* RISK REPORT */}

        <section style={styles.reportCard}>

          <h2>
            AI Risk Distribution
          </h2>

          <div style={styles.reportRow}>

            <span>
              High Risk
            </span>

            <strong style={styles.highRisk}>
              {highRisk}
            </strong>

          </div>

          <div style={styles.reportRow}>

            <span>
              Medium Risk
            </span>

            <strong style={styles.mediumRisk}>
              {mediumRisk}
            </strong>

          </div>

          <div style={styles.reportRow}>

            <span>
              Low Risk
            </span>

            <strong style={styles.lowRisk}>
              {lowRisk}
            </strong>

          </div>

        </section>

        {/* TREATMENT REPORT */}

        <section style={styles.reportCard}>

          <h2>
            Treatment Report
          </h2>

          <div style={styles.reportRow}>

            <span>
              Planned Treatments
            </span>

            <strong>
              {plannedTreatments}
            </strong>

          </div>

          <div style={styles.reportRow}>

            <span>
              Ongoing Treatments
            </span>

            <strong>
              {ongoingTreatments}
            </strong>

          </div>

          <div style={styles.reportRow}>

            <span>
              Completed Treatments
            </span>

            <strong>
              {completedTreatments}
            </strong>

          </div>

        </section>

        {/* SUMMARY */}

        <section style={styles.reportCard}>

          <h2>
            Hospital Performance Summary
          </h2>

          <p>
            The hospital currently has{" "}
            <strong>
              {patients.length}
            </strong>{" "}
            registered patients.
          </p>

          <p>
            A total of{" "}
            <strong>
              {predictions.length}
            </strong>{" "}
            AI-based readmission risk
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
            Total treatments:{" "}
            <strong>
              {treatments.length}
            </strong>
          </p>

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
    gap: "20px",
    marginBottom: "40px",
  },

  headerActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
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

  reportCard: {
    marginTop: "30px",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.06)",
  },

  label: {
    color: "#6b7280",
    fontWeight: "600",
  },

  number: {
    fontSize: "34px",
    fontWeight: "700",
    color: "#2563eb",
    margin: "10px 0",
  },

  highRisk: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: "28px",
  },

  mediumRisk: {
    color: "#d97706",
    fontWeight: "700",
    fontSize: "28px",
  },

  lowRisk: {
    color: "#16a34a",
    fontWeight: "700",
    fontSize: "28px",
  },

  reportRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 0",
    borderBottom:
      "1px solid #e5e7eb",
  },

  backButton: {
    padding: "11px 18px",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
  },

  printButton: {
    padding: "11px 18px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  button: {
    padding: "11px 18px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
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
  },

  errorText: {
    color: "#dc2626",
  },

};