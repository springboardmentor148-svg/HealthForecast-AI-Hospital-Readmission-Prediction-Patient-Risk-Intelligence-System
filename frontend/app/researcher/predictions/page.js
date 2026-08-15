"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPredictions } from "../../../lib/api";

export default function ResearcherPredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      const data = await getPredictions();

      let list = [];

      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.predictions)) list = data.predictions;

      setPredictions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return predictions.filter((p) => {
      const patientId = String(
        p.patient_id ??
          p.patientId ??
          ""
      ).toLowerCase();

      const predictionId = String(
        p.prediction_id ??
          p.id ??
          ""
      ).toLowerCase();

      return (
        patientId.includes(search.toLowerCase()) ||
        predictionId.includes(search.toLowerCase())
      );
    });
  }, [predictions, search]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        Loading Predictions...
      </div>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Research Predictions</h1>
            <p style={styles.subtitle}>
              Read-only AI prediction records.
            </p>
          </div>

          <Link href="/researcher" style={styles.back}>
            Dashboard
          </Link>
        </div>

        <div style={styles.topBar}>
          <input
            style={styles.input}
            placeholder="Search Prediction ID / Patient ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={styles.totalCard}>
            Total Predictions : {filtered.length}
          </div>
        </div>

        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Prediction ID</th>
              <th style={styles.th}>Patient ID</th>
              <th style={styles.th}>Risk</th>
              <th style={styles.th}>Probability</th>
              <th style={styles.th}>Model</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((prediction, index) => (
              <tr key={index}>
                <td style={styles.td}>
                  {prediction.prediction_id ?? prediction.id}
                </td>

                <td style={styles.td}>
                  {prediction.patient_id ?? prediction.patientId}
                </td>

                <td style={styles.td}>
                  {prediction.risk_level ??
                    prediction.risk ??
                    prediction.risk_category ??
                    "-"}
                </td>

                <td style={styles.td}>
                  {prediction.probability ??
                    prediction.score ??
                    "-"}
                </td>

                <td style={styles.td}>
                  {prediction.model_name ??
                    prediction.model ??
                    "-"}
                </td>

                <td style={styles.td}>
                  {prediction.created_at ??
                    prediction.date ??
                    "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </main>
  );
}

const styles = {
  main: {
    background: "#f5f7fb",
    minHeight: "100vh",
    padding: "40px",
  },

  container: {
    maxWidth: "1300px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    fontSize: "34px",
    fontWeight: "700",
  },

  subtitle: {
    color: "#6b7280",
  },

  back: {
    background: "#2563eb",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "8px",
    textDecoration: "none",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  input: {
    width: "350px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  totalCard: {
    background: "#fff",
    padding: "12px 20px",
    borderRadius: "8px",
    fontWeight: "600",
  },

  table: {
    width: "100%",
    background: "#fff",
    borderCollapse: "collapse",
    borderRadius: "10px",
    overflow: "hidden",
  },

  thead: {
    background: "#2563eb",
    color: "#fff",
  },

  th: {
    padding: "14px",
    textAlign: "left",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #eee",
  },
};