"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPredictions } from "../../../lib/api";

export default function ResearchReportsPage() {

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {

    try {

      const data = await getPredictions();

      let list = [];

      if (Array.isArray(data))
        list = data;

      else if (Array.isArray(data.data))
        list = data.data;

      else if (Array.isArray(data.predictions))
        list = data.predictions;

      setPredictions(list);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading)
    return (
      <div style={{padding:50,fontSize:22}}>
        Loading Reports...
      </div>
    );

  const totalReports = predictions.length;

  const today = new Date().toLocaleDateString();
    function downloadCSV() {

    if (!predictions.length) return;

    const headers = [
      "Patient ID",
      "Risk Level",
      "Probability"
    ];

    const rows = predictions.map((p) => [

      p.patient_id ?? p.id,

      p.risk_level ?? p.risk,

      p.probability ?? p.score

    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(","))
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "Research_Report.csv";

    a.click();

    URL.revokeObjectURL(url);

  }

  function downloadPDF() {

    window.print();

  }

  return (

    <main style={styles.main}>

      <div style={styles.container}>

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Research Reports
            </h1>

            <p style={styles.subtitle}>
              Export prediction reports for research purposes.
            </p>

          </div>

          <Link
            href="/researcher"
            style={styles.dashboardBtn}
          >
            ← Dashboard
          </Link>

        </div>

        <div style={styles.grid}>

          <div style={styles.card}>

            <h3>Total Reports</h3>

            <p style={styles.value}>
              {totalReports}
            </p>

          </div>

          <div style={styles.card}>

            <h3>Generated On</h3>

            <p style={styles.valueSmall}>
              {today}
            </p>

          </div>

          <div style={styles.card}>

            <h3>Research Status</h3>

            <p
              style={{
                color:"#16a34a",
                fontWeight:"bold",
                fontSize:22
              }}
            >
              Active
            </p>

          </div>

        </div>

        <div style={styles.reportCard}>

          <h2 style={{marginBottom:10}}>
            Population Health Prediction Report
          </h2>

          <p style={{color:"#6b7280"}}>

            This report summarizes all prediction outcomes generated
            by the AI model and can be used for academic research.

          </p>

          <ul style={styles.list}>

            <li>Total Predictions : {totalReports}</li>

            <li>Risk Analysis Included</li>

            <li>Prediction Probability Included</li>

            <li>Patient Identifiers Anonymized</li>

          </ul>

          <div style={styles.buttonRow}>

            <button
              style={styles.csvBtn}
              onClick={downloadCSV}
            >
              Download CSV
            </button>

            <button
              style={styles.pdfBtn}
              onClick={downloadPDF}
            >
              Download PDF
            </button>

          </div>

        </div>

      </div>

    </main>

  );
}const styles = {

  main: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "1300px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
  },

  title: {
    fontSize: "38px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "17px",
  },

  dashboardBtn: {
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "13px 24px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
    gap: "22px",
    marginBottom: "35px",
  },

  card: {
    background: "#fff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,.08)",
    textAlign: "center",
  },

  value: {
    marginTop: "15px",
    fontSize: "42px",
    color: "#2563eb",
    fontWeight: "700",
  },

  valueSmall: {
    marginTop: "15px",
    fontSize: "22px",
    color: "#111827",
    fontWeight: "600",
  },

  reportCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "35px",
    boxShadow: "0 8px 24px rgba(0,0,0,.08)",
  },

  list: {
    marginTop: "20px",
    marginBottom: "30px",
    lineHeight: "2",
    color: "#374151",
    fontSize: "17px",
  },

  buttonRow: {
    display: "flex",
    gap: "18px",
    marginTop: "30px",
    flexWrap: "wrap",
  },

  csvBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "14px 26px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },

  pdfBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "14px 26px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  }

};