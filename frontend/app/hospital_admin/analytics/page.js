"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getPatients,
  getPredictions,
  getTreatments,
} from "../../../lib/api";


// ============================================================
// HOSPITAL ANALYTICS PAGE
// ============================================================

export default function HospitalAnalyticsPage() {

  // ============================================================
  // STATE
  // ============================================================

  const [patients, setPatients] = useState([]);

  const [predictions, setPredictions] = useState([]);

  const [treatments, setTreatments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ============================================================
  // LOAD ANALYTICS DATA
  // ============================================================

  useEffect(() => {

    async function loadAnalyticsData() {

      try {

        setLoading(true);

        setError("");


        // --------------------------------------------------------
        // FETCH ALL HOSPITAL DATA
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
        // DEBUG
        // ========================================================

        console.log(
          "ANALYTICS PATIENTS:",
          patientsData
        );

        console.log(
          "ANALYTICS PREDICTIONS:",
          predictionsData
        );

        console.log(
          "ANALYTICS TREATMENTS:",
          treatmentsData
        );


        // ========================================================
        // NORMALIZE PATIENT DATA
        // ========================================================

        let patientsList = [];


        if (
          Array.isArray(patientsData)
        ) {

          patientsList = patientsData;

        }

        else if (
          Array.isArray(
            patientsData?.data
          )
        ) {

          patientsList =
            patientsData.data;

        }

        else if (
          Array.isArray(
            patientsData?.patients
          )
        ) {

          patientsList =
            patientsData.patients;

        }


        // ========================================================
        // NORMALIZE PREDICTION DATA
        // ========================================================

        let predictionsList = [];


        if (
          Array.isArray(predictionsData)
        ) {

          predictionsList =
            predictionsData;

        }

        else if (
          Array.isArray(
            predictionsData?.data
          )
        ) {

          predictionsList =
            predictionsData.data;

        }

        else if (
          Array.isArray(
            predictionsData?.predictions
          )
        ) {

          predictionsList =
            predictionsData.predictions;

        }


        // ========================================================
        // NORMALIZE TREATMENT DATA
        // ========================================================

        let treatmentsList = [];


        if (
          Array.isArray(treatmentsData)
        ) {

          treatmentsList =
            treatmentsData;

        }

        else if (
          Array.isArray(
            treatmentsData?.data
          )
        ) {

          treatmentsList =
            treatmentsData.data;

        }

        else if (
          Array.isArray(
            treatmentsData?.treatments
          )
        ) {

          treatmentsList =
            treatmentsData.treatments;

        }


        // ========================================================
        // SAVE DATA
        // ========================================================

        setPatients(
          patientsList
        );

        setPredictions(
          predictionsList
        );

        setTreatments(
          treatmentsList
        );

      }

      catch (err) {

        console.error(
          "HOSPITAL ANALYTICS ERROR:",
          err
        );

        setError(
          err?.message ||
          "Failed to load hospital analytics."
        );

      }

      finally {

        setLoading(false);

      }

    }


    loadAnalyticsData();

  }, []);


  // ============================================================
  // BASIC COUNTS
  // ============================================================

  const totalPatients =
    patients.length;


  const totalPredictions =
    predictions.length;


  const totalTreatments =
    treatments.length;


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
  // RISK ANALYTICS
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
  // RISK PERCENTAGES
  // ============================================================

  const highRiskPercentage =

    totalPredictions > 0

      ? Math.round(

          (
            highRiskPatients /
            totalPredictions
          ) * 100

        )

      : 0;


  const mediumRiskPercentage =

    totalPredictions > 0

      ? Math.round(

          (
            mediumRiskPatients /
            totalPredictions
          ) * 100

        )

      : 0;


  const lowRiskPercentage =

    totalPredictions > 0

      ? Math.round(

          (
            lowRiskPatients /
            totalPredictions
          ) * 100

        )

      : 0;


  // ============================================================
  // TREATMENT STATUS
  // ============================================================

  const plannedTreatments =

    treatments.filter(

      (treatment) =>

        String(

          treatment?.status ||

          ""

        ).toLowerCase() ===

        "planned"

    ).length;


  const ongoingTreatments =

    treatments.filter(

      (treatment) =>

        String(

          treatment?.status ||

          ""

        ).toLowerCase() ===

        "ongoing"

    ).length;


  const completedTreatments =

    treatments.filter(

      (treatment) =>

        String(

          treatment?.status ||

          ""

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
  // TREATMENT OUTCOMES
  // ============================================================

  const successfulTreatments =

    treatments.filter(

      (treatment) => {

        const outcome =

          String(

            treatment?.outcome ||

            ""

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


  const unsuccessfulTreatments =

    treatments.filter(

      (treatment) => {

        const outcome =

          String(

            treatment?.outcome ||

            ""

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


  const notEvaluatedTreatments =

    Math.max(

      0,

      totalTreatments -

      successfulTreatments -

      unsuccessfulTreatments

    );


  // ============================================================
  // TREATMENT OUTCOME PERCENTAGES
  // ============================================================

  const successfulPercentage =

    totalTreatments > 0

      ? Math.round(

          (

            successfulTreatments /

            totalTreatments

          ) * 100

        )

      : 0;


  const unsuccessfulPercentage =

    totalTreatments > 0

      ? Math.round(

          (

            unsuccessfulTreatments /

            totalTreatments

          ) * 100

        )

      : 0;


  const notEvaluatedPercentage =

    totalTreatments > 0

      ? Math.round(

          (

            notEvaluatedTreatments /

            totalTreatments

          ) * 100

        )

      : 0;


  // ============================================================
  // LOADING
  // ============================================================

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


  // ============================================================
  // ERROR
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

            Failed to Load Analytics

          </h2>


          <p
            style={styles.errorText}
          >

            {error}

          </p>


          <p>

            Please make sure the backend
            is running correctly.

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

              Hospital Analytics

            </h1>


            <p
              style={styles.subtitle}
            >

              Hospital-wide performance,
              patient risk and treatment analytics

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

        </div>


        {/* ======================================================
            OVERVIEW
        ====================================================== */}

        <section>

          <h2
            style={styles.sectionTitle}
          >

            Hospital Overview

          </h2>


          <div
            style={styles.grid}
          >


            {/* TOTAL PATIENTS */}

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

                Registered patients in the hospital system.

              </p>

            </div>


            {/* TOTAL PREDICTIONS */}

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

                Total AI-based readmission risk predictions.

              </p>

            </div>


            {/* HIGH RISK */}

            <div
              style={styles.card}
            >

              <p
                style={styles.cardLabel}
              >

                High Risk Patients

              </p>


              <p
                style={styles.highRiskNumber}
              >

                {highRiskPatients}

              </p>


              <p
                style={styles.description}
              >

                Patients identified as high readmission risk.

              </p>

            </div>


            {/* TREATMENTS */}

            <div
              style={styles.card}
            >

              <p
                style={styles.cardLabel}
              >

                Total Treatments

              </p>


              <p
                style={styles.number}
              >

                {totalTreatments}

              </p>


              <p
                style={styles.description}
              >

                Treatments recorded in the hospital system.

              </p>

            </div>

          </div>

        </section>


        {/* ======================================================
            PATIENT RISK ANALYTICS
        ====================================================== */}

        <section
          style={styles.section}
        >

          <h2
            style={styles.sectionTitle}
          >

            Patient Risk Analytics

          </h2>


          <div
            style={styles.grid}
          >


            {/* HIGH RISK */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                High Risk

              </h3>


              <p
                style={styles.highRiskNumber}
              >

                {highRiskPatients}

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


            {/* MEDIUM RISK */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Medium Risk

              </h3>


              <p
                style={styles.mediumRiskNumber}
              >

                {mediumRiskPatients}

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


            {/* LOW RISK */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Low Risk

              </h3>


              <p
                style={styles.lowRiskNumber}
              >

                {lowRiskPatients}

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


        {/* ======================================================
            TREATMENT STATUS ANALYTICS
        ====================================================== */}

        <section
          style={styles.section}
        >

          <h2
            style={styles.sectionTitle}
          >

            Treatment Status Analytics

          </h2>


          <div
            style={styles.grid}
          >


            {/* PLANNED */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Planned

              </h3>


              <p
                style={styles.number}
              >

                {plannedTreatments}

              </p>

            </div>


            {/* ONGOING */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Ongoing

              </h3>


              <p
                style={styles.number}
              >

                {ongoingTreatments}

              </p>

            </div>


            {/* COMPLETED */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Completed

              </h3>


              <p
                style={styles.number}
              >

                {completedTreatments}

              </p>

            </div>


            {/* COMPLETION RATE */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Completion Rate

              </h3>


              <p
                style={styles.number}
              >

                {treatmentCompletionRate}%

              </p>


              <div
                style={styles.progressBackground}
              >

                <div

                  style={{
                    ...styles.progressCompleted,
                    width:
                      `${treatmentCompletionRate}%`,
                  }}

                />

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            TREATMENT OUTCOME ANALYTICS
        ====================================================== */}

        <section
          style={styles.section}
        >

          <h2
            style={styles.sectionTitle}
          >

            Treatment Outcome Analytics

          </h2>


          <div
            style={styles.grid}
          >


            {/* SUCCESSFUL */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Successful

              </h3>


              <p
                style={styles.successNumber}
              >

                {successfulTreatments}

              </p>


              <p
                style={styles.percentage}
              >

                {successfulPercentage}%

              </p>

            </div>


            {/* UNSUCCESSFUL */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Unsuccessful

              </h3>


              <p
                style={styles.unsuccessfulNumber}
              >

                {unsuccessfulTreatments}

              </p>


              <p
                style={styles.percentage}
              >

                {unsuccessfulPercentage}%

              </p>

            </div>


            {/* NOT EVALUATED */}

            <div
              style={styles.analyticsCard}
            >

              <h3>

                Not Evaluated

              </h3>


              <p
                style={styles.number}
              >

                {notEvaluatedTreatments}

              </p>


              <p
                style={styles.percentage}
              >

                {notEvaluatedPercentage}%

              </p>

            </div>

          </div>

        </section>


        {/* ======================================================
            PERFORMANCE SUMMARY
        ====================================================== */}

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

            </strong>{" "}

            registered patients.

          </p>


          <p>

            A total of{" "}

            <strong>

              {totalPredictions}

            </strong>{" "}

            AI-based readmission risk predictions
            have been recorded.

          </p>


          <p>

            There are{" "}

            <strong>

              {highRiskPatients}

            </strong>{" "}

            high-risk patients based on
            available prediction data.

          </p>


          <p>

            The hospital has recorded{" "}

            <strong>

              {totalTreatments}

            </strong>{" "}

            treatments with a current completion
            rate of{" "}

            <strong>

              {treatmentCompletionRate}%

            </strong>.

          </p>


          <p>

            Successful treatment outcomes:

            {" "}

            <strong>

              {successfulTreatments}

            </strong>

          </p>

        </section>


        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

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

              onClick={() =>
                window.location.reload()
              }

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

    marginBottom:
      "40px",

    gap:
      "20px",

  },


  headerActions: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "20px",

  },


  title: {

    fontSize:
      "32px",

    color:
      "#111827",

    marginBottom:
      "10px",

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
      "white",

    padding:
      "25px",

    borderRadius:
      "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  analyticsCard: {

    background:
      "white",

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


  successNumber: {

    fontSize:
      "34px",

    fontWeight:
      "700",

    color:
      "#16a34a",

    margin:
      "10px 0",

  },


  unsuccessfulNumber: {

    fontSize:
      "34px",

    fontWeight:
      "700",

    color:
      "#dc2626",

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


  progressCompleted: {

    height:
      "100%",

    background:
      "#2563eb",

    borderRadius:
      "10px",

  },


  summary: {

    marginTop:
      "40px",

    background:
      "white",

    padding:
      "30px",

    borderRadius:
      "14px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

    lineHeight:
      "1.7",

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
      "white",

    borderRadius:
      "8px",

    textDecoration:
      "none",

    border:
      "none",

    cursor:
      "pointer",

    fontSize:
      "15px",

  },


  refreshButton: {

    padding:
      "12px 20px",

    background:
      "#111827",

    color:
      "white",

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
      "white",

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
      "white",

    borderRadius:
      "14px",

    textAlign:
      "center",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",

  },


  errorText: {

    color:
      "#dc2626",

    fontWeight:
      "600",

  },


  retryButton: {

    marginTop:
      "15px",

    padding:
      "10px 20px",

    background:
      "#2563eb",

    color:
      "white",

    border:
      "none",

    borderRadius:
      "7px",

    cursor:
      "pointer",

  },

};