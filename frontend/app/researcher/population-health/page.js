"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPredictions } from "../../../lib/api";

export default function PopulationHealthPage() {

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {

    try {

      const response = await getPredictions();

      let list = [];

      if (Array.isArray(response))
        list = response;

      else if (Array.isArray(response.data))
        list = response.data;

      else if (Array.isArray(response.predictions))
        list = response.predictions;

      setPredictions(list);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  }

  const filtered = useMemo(() => {

    return predictions.filter((prediction) => {

      const patientId = String(
        prediction.patient_id ??
        prediction.patientId ??
        prediction.id ??
        ""
      ).toLowerCase();

      return patientId.includes(
        search.toLowerCase()
      );

    });

  }, [predictions, search]);

  const total = filtered.length;

  const highRisk = filtered.filter((p) => {

  const risk = String(
    p.risk_level ??
    p.risk ??
    ""
  ).toLowerCase();

  return risk.includes("high");

}).length;

const mediumRisk = filtered.filter((p) => {

  const risk = String(
    p.risk_level ??
    p.risk ??
    ""
  ).toLowerCase();

  return risk.includes("medium");

}).length;

const lowRisk = filtered.filter((p) => {

  const risk = String(
    p.risk_level ??
    p.risk ??
    ""
  ).toLowerCase();

  return risk.includes("low");

}).length;

const readmissionRate =
total > 0
  ? ((highRisk / total) * 100).toFixed(1)
  : "0.0";
  
  if (loading) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
          fontWeight: "600"
        }}
      >
        Loading Population Health Analytics...
      </div>

    );

  }
    return (

    <main style={styles.main}>

      <div style={styles.container}>

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Population Health Analytics
            </h1>

            <p style={styles.subtitle}>
              Analyze population level readmission trends and risk distribution.
            </p>

          </div>

          <Link
            href="/researcher"
            style={styles.dashboardButton}
          >
            ← Dashboard
          </Link>

        </div>

        <div style={styles.cardGrid}>

          <div style={styles.card}>
            <h3>Total Predictions</h3>
            <h1>{total}</h1>
          </div>

          <div style={styles.card}>
            <h3>High Risk</h3>
            <h1 style={{color:"#dc2626"}}>
              {highRisk}
            </h1>
          </div>

          <div style={styles.card}>
            <h3>Medium Risk</h3>
            <h1 style={{color:"#d97706"}}>
              {mediumRisk}
            </h1>
          </div>

          <div style={styles.card}>
            <h3>Low Risk</h3>
            <h1 style={{color:"#16a34a"}}>
              {lowRisk}
            </h1>
          </div>

          <div style={styles.card}>
            <h3>Readmission Rate</h3>
            <h1 style={{color:"#2563eb"}}>
              {readmissionRate}%
            </h1>
          </div>

        </div>

        <div style={styles.searchSection}>

          <input

            type="text"

            placeholder="Search Patient ID..."

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

            style={styles.searchInput}

          />

        </div>

        <div style={styles.tableWrapper}>

          <table style={styles.table}>

            <thead>

              <tr>

                <th>Patient ID</th>

                <th>Age</th>

                <th>Gender</th>

                <th>Risk Level</th>

                <th>Probability</th>

              </tr>

            </thead>

            <tbody>

              {filtered.length===0 && (

                <tr>

                  <td
                    colSpan={5}
                    style={styles.noData}
                  >
                    No records found
                  </td>

                </tr>

              )}

              {filtered.map((prediction,index)=>(

                <tr key={index}>

                  <td>

                    {prediction.patient_id ??
                     prediction.patientId ??
                     prediction.id}

                  </td>

                  <td>

                    {prediction.age ?? "-"}

                  </td>

                  <td>

                    {prediction.gender ?? "-"}

                  </td>

                  <td>

                    <span

                      style={{

                        ...styles.badge,

                        background:

                          String(

                            prediction.risk_level ??

                            prediction.risk ??

                            ""

                          ).toLowerCase()==="high"

                          ? "#fee2e2"

                          : String(

                              prediction.risk_level ??

                              prediction.risk ??

                              ""

                            ).toLowerCase()==="medium"

                          ? "#fef3c7"

                          : "#dcfce7",

                        color:

                          String(

                            prediction.risk_level ??

                            prediction.risk ??

                            ""

                          ).toLowerCase()==="high"

                          ? "#dc2626"

                          : String(

                              prediction.risk_level ??

                              prediction.risk ??

                              ""

                            ).toLowerCase()==="medium"

                          ? "#b45309"

                          : "#15803d"

                      }}

                    >

                      {prediction.risk_level ??

                       prediction.risk ??

                       "-"}

                    </span>

                  </td>

                  <td>

                    {prediction.probability ??

                     prediction.score ??

                     "-"}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </main>

  );
}
  const styles = {

  main: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: {
    fontSize: "34px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "8px",
  },

  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
  },

  dashboardButton: {
    background: "#2563eb",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: "600",
    transition: "0.3s",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "35px",
  },

  card: {
    background: "#fff",
    borderRadius: "15px",
    padding: "25px",
    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
    textAlign: "center",
  },

  searchSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },

  searchInput: {
    width: "340px",
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
  },

  tableWrapper: {
    background: "#fff",
    borderRadius: "15px",
    overflowX: "auto",
    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  badge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontWeight: "600",
    display: "inline-block",
  },

  noData: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
    fontSize: "16px",
  }

};