"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getPatients,
  getPredictions,
  getTreatments,
} from "../../lib/api";

export default function HealthcareResearcherPage() {

  const [patients, setPatients] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [treatments, setTreatments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD RESEARCH DATA
  // ============================================================

  const loadResearchData = async (
    isRefresh = false
  ) => {

    try {

      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // IMPORTANT:
      // Promise.allSettled prevents the 422 treatment
      // endpoint from breaking the complete researcher page.

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
          "RESEARCH PATIENT ERROR:",
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
          "RESEARCH PREDICTION ERROR:",
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

        console.error(
          "RESEARCH TREATMENT ERROR:",
          treatmentsResult.reason
        );

        setTreatments([]);
      }

    } catch (err) {

      console.error(
        "HEALTHCARE RESEARCHER ERROR:",
        err
      );

      setError(
        err?.message ||
        "Failed to load research data."
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

    loadResearchData();

  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalResearchRecords =
    patients.length;

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

  const highRisk =
    useMemo(() => {

      return predictions.filter(
        (prediction) =>
          getPredictionRisk(
            prediction
          ).includes("high")
      ).length;

    }, [predictions]);

  const mediumRisk =
    useMemo(() => {

      return predictions.filter(
        (prediction) =>
          getPredictionRisk(
            prediction
          ).includes("medium")
      ).length;

    }, [predictions]);

  const lowRisk =
    useMemo(() => {

      return predictions.filter(
        (prediction) =>
          getPredictionRisk(
            prediction
          ).includes("low")
      ).length;

    }, [predictions]);

  const highRiskPercentage =
    totalPredictions > 0
      ? Math.round(
          (highRisk /
            totalPredictions) *
            100
        )
      : 0;

  const mediumRiskPercentage =
    totalPredictions > 0
      ? Math.round(
          (mediumRisk /
            totalPredictions) *
            100
        )
      : 0;

  const lowRiskPercentage =
    totalPredictions > 0
      ? Math.round(
          (lowRisk /
            totalPredictions) *
            100
        )
      : 0;

  // ============================================================
  // TREATMENT STATISTICS
  // ============================================================

  const totalTreatments =
    treatments.length;

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

  const treatmentEffectiveness =
    totalTreatments > 0
      ? Math.round(
          (
            successfulTreatments /
            totalTreatments
          ) * 100
        )
      : 0;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <main style={styles.main}>

        <div style={styles.centerMessage}>

          Loading Healthcare Research Dashboard...

        </div>

      </main>

    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (

    <main style={styles.main}>

      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Healthcare Researcher Dashboard
            </h1>

            <p style={styles.subtitle}>
              Healthcare analytics, population
              health research, and clinical
              outcome analysis
            </p>

          </div>

          <Link
            href="/login"
            style={styles.logout}
          >
            Logout
          </Link>

        </div>

        {/* RESEARCH NOTICE */}

        <div style={styles.notice}>

          <strong>
            Research Access
          </strong>

          <p>
            This dashboard is designed for
            healthcare research using
            anonymized patient data and
            aggregated healthcare analytics.
          </p>

        </div>

        {/* API INFORMATION */}

        {treatments.length === 0 &&
          totalResearchRecords > 0 && (

          <div style={styles.info}>

            Treatment data is currently
            unavailable. Research patient
            and prediction analytics remain
            available.

          </div>

        )}

        {/* RESEARCH OVERVIEW */}

        <h2 style={styles.sectionTitle}>
          Research Overview
        </h2>

        <div style={styles.grid}>

          <div style={styles.card}>

            <p style={styles.cardLabel}>
              Research Records
            </p>

            <p style={styles.number}>
              {totalResearchRecords}
            </p>

            <p style={styles.description}>
              Available records for anonymized
              healthcare research analysis.
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
              Total readmission predictions
              available for aggregated analysis.
            </p>

          </div>

          <div style={styles.card}>

            <p style={styles.cardLabel}>
              High Risk
            </p>

            <p style={styles.highRiskNumber}>
              {highRiskPercentage}%
            </p>

            <p style={styles.description}>
              Predictions classified as high risk.
            </p>

          </div>

          <div style={styles.card}>

            <p style={styles.cardLabel}>
              Treatment Effectiveness
            </p>

            <p style={styles.successNumber}>
              {treatmentEffectiveness}%
            </p>

            <p style={styles.description}>
              Successful treatment outcome rate.
            </p>

          </div>

        </div>

        {/* POPULATION RISK */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Population Risk Distribution
          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>
                High Risk
              </h3>

              <p style={styles.highRiskNumber}>
                {highRisk}
              </p>

              <span>
                {highRiskPercentage}%
                {" "}of predictions
              </span>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Medium Risk
              </h3>

              <p style={styles.mediumRiskNumber}>
                {mediumRisk}
              </p>

              <span>
                {mediumRiskPercentage}%
                {" "}of predictions
              </span>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Low Risk
              </h3>

              <p style={styles.lowRiskNumber}>
                {lowRisk}
              </p>

              <span>
                {lowRiskPercentage}%
                {" "}of predictions
              </span>

            </div>

          </div>

        </section>

        {/* TREATMENT RESEARCH */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Treatment Effectiveness Research
          </h2>

          <div style={styles.grid}>

            <div style={styles.analyticsCard}>

              <h3>
                Total Treatments
              </h3>

              <p style={styles.number}>
                {totalTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Successful
              </h3>

              <p style={styles.successNumber}>
                {successfulTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Unsuccessful
              </h3>

              <p style={styles.highRiskNumber}>
                {unsuccessfulTreatments}
              </p>

            </div>

            <div style={styles.analyticsCard}>

              <h3>
                Effectiveness Rate
              </h3>

              <p style={styles.successNumber}>
                {treatmentEffectiveness}%
              </p>

            </div>

          </div>

        </section>

        {/* SUMMARY */}

        <section style={styles.summary}>

          <h2>
            Research Summary
          </h2>

          <p>
            The research dataset currently
            contains{" "}
            <strong>
              {totalResearchRecords}
            </strong>{" "}
            available records.
          </p>

          <p>
            A total of{" "}
            <strong>
              {totalPredictions}
            </strong>{" "}
            AI-based readmission predictions
            are available for aggregated analysis.
          </p>

          <p>
            High-risk predictions account for{" "}
            <strong>
              {highRiskPercentage}%
            </strong>{" "}
            of available prediction data.
          </p>

        </section>

        {/* QUICK ACTIONS */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Quick Actions
          </h2>

          <div style={styles.actions}>

            <Link
              href="/researcher/population-health"
              style={styles.actionButton}
            >
              Research Analytics
            </Link>

            <Link
              href="/researcher/dataset"
              style={styles.actionButton}
            >
              Research Datasets
            </Link>

            <Link
              href="/researcher/reports"
              style={styles.actionButton}
            >
              Research Reports
            </Link>

            <button
              onClick={() =>
                loadResearchData(true)
              }
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
    lineHeight: "1.5",
  },

  logout: {
    padding: "10px 18px",
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
  },

  notice: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "25px",
    color: "#1e40af",
  },

  info: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
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

  successNumber: {
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

  centerMessage: {
    textAlign: "center",
    paddingTop: "100px",
    fontSize: "20px",
    color: "#374151",
  },

};