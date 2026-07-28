"use client";

import Link from "next/link";

export default function SystemAdminPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>System Administrator Dashboard</h1>
        <p style={styles.subtitle}>
          Manage users, roles, AI models and system configuration
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2>User Management</h2>
            <p>Manage system users and their access permissions.</p>
            <Link href="/dashboard?view=patients" style={styles.button}>
  Manage Users
</Link>
          </div>

          <div style={styles.card}>
            <h2>Role Management</h2>
            <p>Manage Doctor, Hospital Admin, Researcher and System Admin roles.</p>
            <Link href="/dashboard?view=roles" style={styles.button}>
  Manage Roles
</Link>

          </div>

          <div style={styles.card}>
            <h2>AI Model Management</h2>
            <p>Monitor deployed AI models and prediction services.</p>
            <Link href="/dashboard?view=models" style={styles.button}>
  Manage Models
</Link>

          </div>

          <div style={styles.card}>
            <h2>System Monitoring</h2>
            <p>Monitor application health and system activity.</p>
            <Link href="/dashboard?view=trends" style={styles.button}>
  View System
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
    marginTop: "15px",
    padding: "10px 18px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },
  logout: {
    display: "inline-block",
    marginTop: "30px",
    color: "#dc2626",
    textDecoration: "none",
    fontWeight: "600",
  },
};