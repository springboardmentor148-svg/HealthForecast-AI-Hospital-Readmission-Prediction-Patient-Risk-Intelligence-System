"use client";

import Link from "next/link";

export default function DoctorPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Doctor Dashboard</h1>
        <p style={styles.subtitle}>
          HealthForecast AI - Patient Risk & Prediction Management
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2>Patient Management</h2>
            <p>View and manage registered patients.</p>
            <Link href="/dashboard?view=patients" style={styles.button}>
  View Patients
</Link>
          </div>

          <div style={styles.card}>
            <h2>AI Predictions</h2>
            <p>Generate and view patient readmission risk predictions.</p>
            <Link href="/dashboard?view=predictions" style={styles.button}>
  View Predictions
</Link>

          </div>

          <div style={styles.card}>
            <h2>High Risk Patients</h2>
            <p>Identify patients who require closer monitoring.</p>
            <Link href="/dashboard?view=risk" style={styles.button}>
  View High Risk
</Link>
          </div>
        </div>

        <Link href="/login" style={styles.logout}>
          Logout
        </Link>
      </div>
    </main>
  );
}

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
  title: {
    fontSize: "32px",
    color: "#111827",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
  },
  button: {
    display: "inline-block",
    marginTop: "15px",
    padding: "10px 18px",
    background: "#2563eb",
    color: "white",
    borderRadius: "7px",
    textDecoration: "none",
  },
  logout: {
    display: "inline-block",
    marginTop: "30px",
    color: "#dc2626",
    textDecoration: "none",
    fontWeight: "600",
  },
};