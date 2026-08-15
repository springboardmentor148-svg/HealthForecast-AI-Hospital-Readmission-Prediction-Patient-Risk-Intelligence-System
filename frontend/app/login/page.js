"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // ============================================================
  // FORM STATES
  // ============================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOGIN FUNCTION
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // --------------------------------------------------------
      // API URL
      // --------------------------------------------------------

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";

      // --------------------------------------------------------
      // SEND LOGIN REQUEST
      // --------------------------------------------------------

      const response = await fetch(
        `${apiUrl}/auth/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
            role: role,
          }),
        }
      );

      // --------------------------------------------------------
      // READ RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      console.log(
        "Login Status:",
        response.status
      );

      console.log(
        "Login Response:",
        data
      );

      // --------------------------------------------------------
      // HANDLE BACKEND ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        let errorMessage =
          "Invalid email, password, or role.";

        if (
          typeof data.detail === "string"
        ) {
          errorMessage = data.detail;
        } else if (
          data.detail &&
          typeof data.detail === "object"
        ) {
          errorMessage =
            data.detail.message ||
            data.detail.detail ||
            errorMessage;
        }

        throw new Error(
          errorMessage
        );
      }

      // --------------------------------------------------------
      // CHECK ACCESS TOKEN
      // --------------------------------------------------------

      if (!data.access_token) {
        throw new Error(
          "Login successful, but access token was not received."
        );
      }

      // --------------------------------------------------------
      // CHECK USER DETAILS
      // --------------------------------------------------------

      if (!data.user) {
        throw new Error(
          "Login successful, but user details were not received."
        );
      }

      // ========================================================
      // SAVE LOGIN INFORMATION
      // ========================================================

      // Save JWT token
      localStorage.setItem(
        "token",
        data.access_token
      );

      // Save complete user object
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Save email
      localStorage.setItem(
        "user_email",
        email.trim()
      );

      // Save role
      localStorage.setItem(
        "user_role",
        data.user.role
      );

      // ========================================================
      // ROLE-BASED REDIRECTION
      // ========================================================

      const userRole =
        data.user.role
          ?.trim()
          .toLowerCase();

      console.log(
        "Logged-in User Role:",
        userRole
      );

      // --------------------------------------------------------
      // DOCTOR
      // --------------------------------------------------------

      if (
        userRole === "doctor"
      ) {
        router.push(
          "/dashboard"
        );
      }

      // --------------------------------------------------------
      // HOSPITAL ADMIN
      // --------------------------------------------------------

      else if (
        userRole ===
        "hospital_admin"
      ) {
        router.push(
          "/hospital_admin"
        );
      }

      // --------------------------------------------------------
      // RESEARCHER
      // --------------------------------------------------------

      // --------------------------------------------------------
// RESEARCHER
// --------------------------------------------------------

else if (userRole === "researcher") {
    router.push("/researcher");
}
      
      // --------------------------------------------------------
      // SYSTEM ADMIN
      // --------------------------------------------------------

      else if (
        userRole === "system_admin"
      ) {
        router.push(
          "/system_admin"
        );
      }

      // --------------------------------------------------------
      // UNKNOWN ROLE
      // --------------------------------------------------------

      else {
        throw new Error(
          `Unknown user role: ${userRole}`
        );
      }

    } catch (err) {

      console.error(
        "Login Error:",
        err
      );

      setError(
        err.message ||
        "Login failed. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main style={styles.main}>

      <div style={styles.card}>

        {/* ================================================== */}
        {/* TITLE */}
        {/* ================================================== */}

        <h1 style={styles.title}>
          HealthForecast AI
        </h1>

        <p style={styles.subtitle}>
          AI-Based Diabetic Patient Readmission
          Prediction System
        </p>

        <h2 style={styles.loginTitle}>
          Login
        </h2>

        {/* ================================================== */}
        {/* ERROR MESSAGE */}
        {/* ================================================== */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* LOGIN FORM */}
        {/* ================================================== */}

        <form onSubmit={handleLogin}>

          {/* ================================================== */}
          {/* EMAIL */}
          {/* ================================================== */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(
                  e.target.value
                );

                setError("");
              }}
              required
              style={styles.input}
            />

          </div>

          {/* ================================================== */}
          {/* PASSWORD */}
          {/* ================================================== */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(
                  e.target.value
                );

                setError("");
              }}
              required
              style={styles.input}
            />

          </div>

          {/* ================================================== */}
          {/* ROLE */}
          {/* ================================================== */}

          <div style={styles.inputGroup}>

            <label style={styles.label}>
              Login As
            </label>

            <select
              value={role}
              onChange={(e) => {
                setRole(
                  e.target.value
                );

                setError("");
              }}
              required
              style={styles.input}
            >

              <option value="doctor">
                Doctor
              </option>

              <option value="hospital_admin">
                Hospital Administrator
              </option>

              <option value="researcher">
    HealthCare Researcher
</option>

              <option value="system_admin">
                System Administrator
              </option>

            </select>

          </div>

          {/* ================================================== */}
          {/* LOGIN BUTTON */}
          {/* ================================================== */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,

              opacity:
                loading
                  ? 0.6
                  : 1,

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>

        {/* ================================================== */}
        {/* REGISTER */}
        {/* ================================================== */}

        <p style={styles.registerText}>
          Don't have an account?
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/register"
            )
          }
          style={
            styles.registerButton
          }
        >
          Create Account
        </button>

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

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background: "#f5f7fb",

    padding: "30px",
  },

  card: {
    width: "100%",

    maxWidth: "450px",

    background: "#ffffff",

    padding: "40px",

    borderRadius: "16px",

    boxShadow:
      "0 10px 30px rgba(0,0,0,0.08)",
  },

  title: {
    textAlign: "center",

    color: "#2563eb",

    fontSize: "30px",

    fontWeight: "700",

    marginBottom: "10px",
  },

  subtitle: {
    textAlign: "center",

    color: "#6b7280",

    lineHeight: "1.5",

    marginBottom: "30px",
  },

  loginTitle: {
    textAlign: "center",

    color: "#111827",

    marginBottom: "25px",
  },

  inputGroup: {
    marginBottom: "20px",
  },

  label: {
    display: "block",

    marginBottom: "8px",

    color: "#374151",

    fontWeight: "600",
  },

  input: {
    width: "100%",

    padding: "12px",

    border:
      "1px solid #d1d5db",

    borderRadius: "8px",

    fontSize: "16px",

    boxSizing: "border-box",

    background: "#ffffff",
  },

  button: {
    width: "100%",

    padding: "13px",

    background: "#2563eb",

    color: "#ffffff",

    border: "none",

    borderRadius: "8px",

    fontSize: "16px",

    fontWeight: "600",
  },

  error: {
    background: "#fee2e2",

    color: "#b91c1c",

    padding: "12px",

    borderRadius: "8px",

    marginBottom: "20px",

    textAlign: "center",
  },

  registerText: {
    textAlign: "center",

    color: "#6b7280",

    marginTop: "25px",

    marginBottom: "10px",
  },

  registerButton: {
    width: "100%",

    padding: "12px",

    background: "#e5e7eb",

    color: "#111827",

    border: "none",

    borderRadius: "8px",

    fontSize: "15px",

    fontWeight: "600",

    cursor: "pointer",
  },

};