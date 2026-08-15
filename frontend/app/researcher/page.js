"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getPatients,
  getPredictions,
  getTreatments,
} from "../../lib/api";


// ============================================================
// HEALTHCARE RESEARCHER DASHBOARD
// ============================================================

export default function HealthcareResearcherPage() {

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
  // LOAD RESEARCH DATA
  // ============================================================

  const loadResearchData = async () => {

    try {

      setError("");

      const isRefresh = patients.length > 0 ||
        predictions.length > 0 ||
        treatments.length > 0;

      if (isRefresh) {

        setRefreshing(true);

      } else {

        setLoading(true);

      }


      // --------------------------------------------------------
      // FETCH DATA
      // --------------------------------------------------------

      const [

        patientsData,

        predictionsData,

        treatmentsData,

      ] = await Promise.all([

        getPatients(),

        getPredictions(),

        getTreatments(),

      ]);


      // ========================================================
      // PATIENT DATA
      // ========================================================

      let patientsList = [];


      if (Array.isArray(patientsData)) {

        patientsList = patientsData;

      }

      else if (
        Array.isArray(patientsData?.data)
      ) {

        patientsList = patientsData.data;

      }

      else if (
        Array.isArray(patientsData?.patients)
      ) {

        patientsList = patientsData.patients;

      }


      // ========================================================
      // PREDICTION DATA
      // ========================================================

      let predictionsList = [];


      if (Array.isArray(predictionsData)) {

        predictionsList = predictionsData;

      }

      else if (
        Array.isArray(predictionsData?.data)
      ) {

        predictionsList = predictionsData.data;

      }

      else if (
        Array.isArray(predictionsData?.predictions)
      ) {

        predictionsList = predictionsData.predictions;

      }


      // ========================================================
      // TREATMENT DATA
      // ========================================================

      let treatmentsList = [];


      if (Array.isArray(treatmentsData)) {

        treatmentsList = treatmentsData;

      }

      else if (
        Array.isArray(treatmentsData?.data)
      ) {

        treatmentsList = treatmentsData.data;

      }

      else if (
        Array.isArray(treatmentsData?.treatments)
      ) {

        treatmentsList = treatmentsData.treatments;

      }


      // ========================================================
      // SAVE DATA
      // ========================================================

      setPatients(patientsList);

      setPredictions(predictionsList);

      setTreatments(treatmentsList);


      console.log(
        "RESEARCHER DATA LOADED:",
        {
          patients: patientsList,
          predictions: predictionsList,
          treatments: treatmentsList,
        }
      );


    }

    catch (err) {

      console.error(
        "HEALTHCARE RESEARCHER ERROR:",
        err
      );

      setError(
        err?.message ||
        "Failed to load research data."
      );

    }

    finally {

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
  // TOTAL RESEARCH RECORDS
  // ============================================================

  const totalResearchRecords =

    patients.length;


  // ============================================================
  // TOTAL AI PREDICTIONS
  // ============================================================

  const totalPredictions =

    predictions.length;


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
  // HIGH RISK
  // ============================================================

  const highRisk = useMemo(() => {

    return predictions.filter(

      (prediction) => {

        const risk =
          getPredictionRisk(prediction);

        return risk.includes("high");

      }

    ).length;

  }, [predictions]);


  // ============================================================
  // MEDIUM RISK
  // ============================================================

  const mediumRisk = useMemo(() => {

    return predictions.filter(

      (prediction) => {

        const risk =
          getPredictionRisk(prediction);

        return risk.includes("medium");

      }

    ).length;

  }, [predictions]);


  // ============================================================
  // LOW RISK
  // ============================================================

  const lowRisk = useMemo(() => {

    return predictions.filter(

      (prediction) => {

        const risk =
          getPredictionRisk(prediction);

        return risk.includes("low");

      }

    ).length;

  }, [predictions]);


  // ============================================================
  // RISK PERCENTAGES
  // ============================================================

  const highRiskPercentage =

    totalPredictions > 0

      ? Math.round(
          (highRisk / totalPredictions) * 100
        )

      : 0;


  const mediumRiskPercentage =

    totalPredictions > 0

      ? Math.round(
          (mediumRisk / totalPredictions) * 100
        )

      : 0;


  const lowRiskPercentage =

    totalPredictions > 0

      ? Math.round(
          (lowRisk / totalPredictions) * 100
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

        const outcome = String(

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

        const outcome = String(

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

          (successfulTreatments /

            totalTreatments) *

            100

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
  // ERROR
  // ============================================================

  if (error) {

    return (

      <main style={styles.main}>

        <div style={styles.errorCard}>

          <h2>

            Failed to Load Research Data

          </h2>

          <p style={styles.errorText}>

            {error}

          </p>

          <p>

            Please check whether the backend is running.

          </p>

          <button

            onClick={loadResearchData}

            style={styles.retryButton}

          >

            Retry

          </button>

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


        {/* ======================================================
            HEADER
        ====================================================== */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>

              Healthcare Researcher Dashboard

            </h1>

            <p style={styles.subtitle}>

              Healthcare analytics, population health research,
              and clinical outcome analysis

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
            RESEARCH NOTICE
        ====================================================== */}

        <div style={styles.notice}>

          <strong>

            Research Access

          </strong>

          <p>

            This dashboard is designed for healthcare research
            using anonymized patient data and aggregated
            healthcare analytics.

          </p>

        </div>


        {/* ======================================================
            RESEARCH OVERVIEW
        ====================================================== */}

        <h2 style={styles.sectionTitle}>

          Research Overview

        </h2>


        <div style={styles.grid}>


          {/* RESEARCH RECORDS */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Research Records

            </p>

            <p style={styles.number}>

              {totalResearchRecords}

            </p>

            <p style={styles.description}>

              Available records for anonymized healthcare
              research analysis.

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

              Total readmission risk predictions available
              for aggregated analysis.

            </p>

          </div>


          {/* HIGH RISK */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              High Risk

            </p>

            <p style={styles.highRiskNumber}>

              {highRiskPercentage}%

            </p>

            <p style={styles.description}>

              Percentage of predictions classified as high risk.

            </p>

          </div>


          {/* TREATMENT EFFECTIVENESS */}

          <div style={styles.card}>

            <p style={styles.cardLabel}>

              Treatment Effectiveness

            </p>

            <p style={styles.successNumber}>

              {treatmentEffectiveness}%

            </p>

            <p style={styles.description}>

              Overall successful treatment outcome rate.

            </p>

          </div>

        </div>


        {/* ======================================================
            POPULATION RISK DISTRIBUTION
        ====================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Population Risk Distribution

          </h2>


          <div style={styles.grid}>


            {/* HIGH */}

            <div style={styles.analyticsCard}>

              <h3>

                High Risk

              </h3>

              <p style={styles.highRiskNumber}>

                {highRisk}

              </p>

              <span style={styles.percentageText}>

                {highRiskPercentage}% of predictions

              </span>

            </div>


            {/* MEDIUM */}

            <div style={styles.analyticsCard}>

              <h3>

                Medium Risk

              </h3>

              <p style={styles.mediumRiskNumber}>

                {mediumRisk}

              </p>

              <span style={styles.percentageText}>

                {mediumRiskPercentage}% of predictions

              </span>

            </div>


            {/* LOW */}

            <div style={styles.analyticsCard}>

              <h3>

                Low Risk

              </h3>

              <p style={styles.lowRiskNumber}>

                {lowRisk}

              </p>

              <span style={styles.percentageText}>

                {lowRiskPercentage}% of predictions

              </span>

            </div>

          </div>

        </section>


        {/* ======================================================
            TREATMENT EFFECTIVENESS
        ====================================================== */}

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


        {/* ======================================================
            RESEARCH SUMMARY
        ====================================================== */}

        <section style={styles.summary}>

          <h2>

            Research Summary

          </h2>


          <p>

            The research dataset currently contains{" "}

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

            AI-based readmission predictions are available
            for aggregated analysis.

          </p>


          <p>

            High-risk predictions account for{" "}

            <strong>

              {highRiskPercentage}%

            </strong>{" "}

            of the available prediction data.

          </p>


          <p>

            The observed treatment effectiveness rate is{" "}

            <strong>

              {treatmentEffectiveness}%

            </strong>.

          </p>

        </section>


        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>

            Research Tools

          </h2>


          <div style={styles.actions}>


            <Link

              href="researcher/dataset"

              style={styles.actionButton}

            >

              Anonymized Dataset

            </Link>


            <Link

              href="researcher/predictions"

              style={styles.actionButton}

            >

              AI Prediction Analysis

            </Link>


            <Link href="/researcher/population-health"
              style={styles.actionButton}

            >

              Population Health Analytics

            </Link>
            <Link

              href="researcher/reports"

              style={styles.actionButton}

            >

              Research Reports

            </Link>


            <button

              onClick={loadResearchData}

              disabled={refreshing}

              style={

                refreshing

                  ? styles.refreshButtonDisabled

                  : styles.refreshButton

              }

            >

              {refreshing

                ? "Refreshing..."

                : "Refresh Research Data"}

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

    marginBottom: "30px",

  },


  title: {

    fontSize: "32px",

    color: "#111827",

    marginBottom: "10px",

  },


  subtitle: {

    color: "#6b7280",

    margin: 0,

    maxWidth: "700px",

  },


  logout: {

    color: "#dc2626",

    textDecoration: "none",

    fontWeight: "600",

  },


  notice: {

    background: "#eff6ff",

    border: "1px solid #bfdbfe",

    padding: "20px",

    borderRadius: "12px",

    marginBottom: "35px",

    color: "#1e3a8a",

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


  successNumber: {

    fontSize: "34px",

    fontWeight: "700",

    color: "#16a34a",

    margin: "10px 0",

  },


  percentageText: {

    color: "#6b7280",

    fontSize: "14px",

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


  refreshButton: {

    padding: "12px 20px",

    background: "#16a34a",

    color: "white",

    borderRadius: "8px",

    border: "none",

    cursor: "pointer",

    fontSize: "15px",

    fontWeight: "600",

  },


  refreshButtonDisabled: {

    padding: "12px 20px",

    background: "#9ca3af",

    color: "white",

    borderRadius: "8px",

    border: "none",

    cursor: "not-allowed",

    fontSize: "15px",

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