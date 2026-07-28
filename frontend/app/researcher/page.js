"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResearcherPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const response = await fetch(`${apiUrl}/predictions/`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPredictions = predictions.length;

  const highRisk = predictions.filter(
    (item) =>
      item.risk_level === "High Risk" ||
      item.risk_level === "High"
  ).length;

  const lowRisk = predictions.filter(
    (item) =>
      item.risk_level === "Low Risk" ||
      item.risk_level === "Low"
  ).length;

  const mediumRisk = predictions.filter(
    (item) =>
      item.risk_level === "Medium Risk" ||
      item.risk_level === "Medium"
  ).length;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "white",
            padding: "25px 30px",
            borderRadius: "12px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#111827",
              }}
            >
              Researcher Dashboard
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
              }}
            >
              Analyze AI prediction data and readmission risk trends.
            </p>
          </div>

          <button
            onClick={logout}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>

        {/* Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <StatCard
            title="Total Predictions"
            value={loading ? "..." : totalPredictions}
          />

          <StatCard
            title="High Risk"
            value={loading ? "..." : highRisk}
          />

          <StatCard
            title="Medium Risk"
            value={loading ? "..." : mediumRisk}
          />

          <StatCard
            title="Low Risk"
            value={loading ? "..." : lowRisk}
          />
        </div>

        {/* Research Tools */}
        <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  }}
>
  <ResearchCard
    title="Prediction Data"
    description="View all AI-generated patient readmission predictions."
    button="View Predictions"
    href="/dashboard?view=predictions"
  />

  <ResearchCard
    title="Risk Analysis"
    description="Analyze high-risk, medium-risk and low-risk patients."
    button="Analyze Risk"
    href="/dashboard?view=risk"
  />

  <ResearchCard
    title="Prediction Trends"
    description="Monitor prediction patterns and hospital readmission trends."
    button="View Trends"
    href="/dashboard?view=trends"
  />

  <ResearchCard
    title="Model Insights"
    description="Review AI model prediction results and performance."
    button="Model Insights"
    href="/dashboard?view=models"
  />

        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
      }}
    >
      <p
        style={{
          color: "#6b7280",
          margin: "0 0 10px",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: 0,
          fontSize: "32px",
          color: "#111827",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function ResearchCard({ title, description, button, href }) {
  return (
    <div
      style={{
        background: "white",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color: "#111827",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: "#6b7280",
          minHeight: "45px",
        }}
      >
        {description}
      </p>

      <Link
        href={href}
        style={{
          display: "inline-block",
          background: "#2563eb",
          color: "white",
          padding: "10px 18px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "600",
        }}
      >
        {button}
      </Link>
    </div>
  );
}