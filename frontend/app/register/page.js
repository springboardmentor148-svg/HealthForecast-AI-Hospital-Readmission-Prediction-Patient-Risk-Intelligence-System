"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "doctor",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // FORMAT BACKEND ERROR
  // ============================================================

  const getErrorMessage = (data) => {
    // FastAPI normal string error
    if (typeof data?.detail === "string") {
      return data.detail;
    }

    // FastAPI validation error array
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((error) => {
          if (typeof error === "string") {
            return error;
          }

          if (error?.msg) {
            return error.msg;
          }

          if (error?.message) {
            return error.message;
          }

          return JSON.stringify(error);
        })
        .join(", ");
    }

    // Object error
    if (
      data?.detail &&
      typeof data.detail === "object"
    ) {
      return (
        data.detail.msg ||
        data.detail.message ||
        JSON.stringify(data.detail)
      );
    }

    return (
      data?.message ||
      "Registration failed. Please try again."
    );
  };

  // ============================================================
  // HANDLE REGISTRATION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://healthforecast-ai-hospital-readmission-mj5q.onrender.com";

      // --------------------------------------------------------
      // DEBUG: CHECK DATA SENT TO BACKEND
      // --------------------------------------------------------

      console.log(
        "REGISTRATION DATA:",
        formData
      );

      // --------------------------------------------------------
      // SEND REGISTRATION REQUEST
      // --------------------------------------------------------

      const response = await fetch(
        `${apiUrl}/auth/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );

      // --------------------------------------------------------
      // READ RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      console.log(
        "REGISTRATION RESPONSE:",
        data
      );

      // --------------------------------------------------------
      // HANDLE ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        const errorMessage =
          getErrorMessage(data);

        throw new Error(
          errorMessage
        );
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setMessage(
        "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setMessage(
        error?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow:
            "0 10px 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* ======================================================
            TITLE
        ====================================================== */}

        <h1
          style={{
            textAlign: "center",
            fontSize: "32px",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "10px",
          }}
        >
          Create Account
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
          }}
        >
          Register for HealthForecast AI
        </p>

        {/* ======================================================
            REGISTRATION FORM
        ====================================================== */}

        <form onSubmit={handleSubmit}>

          {/* ====================================================
              FULL NAME
          ==================================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Full Name
            </label>

            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* ====================================================
              EMAIL
          ==================================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* ====================================================
              PASSWORD
          ==================================================== */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* ====================================================
              ROLE
          ==================================================== */}

          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Role
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                background: "#ffffff",
                boxSizing: "border-box",
              }}
            >
              <option value="doctor">
                Doctor
              </option>

             <option value="researcher">
    HealthCare Researcher
</option>
              <option value="hospital_admin">
                Hospital Administrator
              </option>

              <option value="system_admin">
                System Administrator
              </option>
            </select>
          </div>

          {/* ====================================================
              MESSAGE
          ==================================================== */}

          {message && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                borderRadius: "8px",
                background:
                  message.includes(
                    "successful"
                  )
                    ? "#dcfce7"
                    : "#fee2e2",
                color:
                  message.includes(
                    "successful"
                  )
                    ? "#166534"
                    : "#991b1b",
                textAlign: "center",
                wordBreak: "break-word",
              }}
            >
              {message}
            </div>
          )}

          {/* ====================================================
              REGISTER BUTTON
          ==================================================== */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading
                ? "#93c5fd"
                : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Creating Account..."
              : "Register"}
          </button>
        </form>

        {/* ======================================================
            LOGIN LINK
        ====================================================== */}

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            color: "#6b7280",
          }}
        >
          Already have an account?{" "}

          <Link
            href="/login"
            style={{
              color: "#2563eb",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}