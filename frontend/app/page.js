import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: "40px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "50px",
          borderRadius: "16px",
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "15px",
            color: "#111827",
          }}
        >
          HealthForecast AI
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#6b7280",
            marginBottom: "30px",
          }}
        >
          AI-Based Diabetic Patient Readmission Prediction System
        </p>

        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
          <Link
            href="/login"
            style={{
              background: "#2563eb",
              color: "white",
              padding: "12px 25px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Login
          </Link>

          <Link
            href="/register"
            style={{
              background: "#e5e7eb",
              color: "#111827",
              padding: "12px 25px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}