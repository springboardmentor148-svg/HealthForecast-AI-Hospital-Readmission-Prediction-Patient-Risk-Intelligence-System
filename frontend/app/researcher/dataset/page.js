"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPatients } from "../../../lib/api";

export default function ResearchDatasetPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const response = await getPatients();

      let list = [];

      if (Array.isArray(response)) {
        list = response;
      } else if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response.patients)) {
        list = response.patients;
      }

      setPatients(list);
    } catch (err) {
      console.error("Failed to load research dataset:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) => {
      const patientId = String(
        patient.patient_code ??
          patient.patient_id ??
          patient.id ??
          ""
      ).toLowerCase();

      const age = String(patient.age ?? "").toLowerCase();

      const gender = String(
        patient.gender ?? ""
      ).toLowerCase();

      const race = String(
        patient.race ?? ""
      ).toLowerCase();

      const medicalHistory = String(
        patient.medical_history ?? ""
      ).toLowerCase();

      const admissionHistory = String(
        patient.admission_history ?? ""
      ).toLowerCase();

      return (
        patientId.includes(query) ||
        age.includes(query) ||
        gender.includes(query) ||
        race.includes(query) ||
        medicalHistory.includes(query) ||
        admissionHistory.includes(query)
      );
    });
  }, [patients, search]);

  const maleCount = filteredPatients.filter(
    (patient) =>
      String(patient.gender ?? "").toLowerCase() === "male"
  ).length;

  const femaleCount = filteredPatients.filter(
    (patient) =>
      String(patient.gender ?? "").toLowerCase() === "female"
  ).length;

  function exportCSV() {
    if (!filteredPatients.length) {
      return;
    }

    const rows = filteredPatients.map((patient) => ({
      PatientID:
        patient.patient_code ??
        patient.patient_id ??
        patient.id ??
        "",

      Age:
        patient.age ?? "",

      Gender:
        patient.gender ?? "",

      Race:
        patient.race ?? "",

      MedicalHistory:
        patient.medical_history ?? "",

      AdmissionHistory:
        patient.admission_history ?? "",
    }));

    const headers = Object.keys(rows[0]);

    const csvRows = [
      headers.join(","),

      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";

            return `"${String(value)
              .replace(/"/g, '""')
              .replace(/\n/g, " ")}"`;
          })
          .join(",")
      ),
    ];

    const csv = csvRows.join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "Anonymized_Research_Dataset.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Anonymized Research Dataset...
      </div>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>

          <div>
            <div style={styles.eyebrow}>
              HEALTHFORECAST AI
            </div>

            <h1 style={styles.title}>
              Anonymized Research Dataset
            </h1>

            <p style={styles.subtitle}>
              Explore anonymized patient information for
              population-level healthcare research.
            </p>
          </div>

          <Link
            href="/researcher"
            style={styles.dashboardButton}
          >
            ← Dashboard
          </Link>

        </div>

        {/* SUMMARY CARDS */}
        <div style={styles.summaryGrid}>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>
              Total Records
            </div>

            <div style={styles.summaryValue}>
              {filteredPatients.length}
            </div>

            <div style={styles.summaryDescription}>
              Available patient records
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>
              Male
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: "#2563eb",
              }}
            >
              {maleCount}
            </div>

            <div style={styles.summaryDescription}>
              Male patient records
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>
              Female
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: "#db2777",
              }}
            >
              {femaleCount}
            </div>

            <div style={styles.summaryDescription}>
              Female patient records
            </div>
          </div>

        </div>

        {/* TOOLBAR */}
        <div style={styles.toolbar}>

          <div style={styles.searchWrapper}>

            <span style={styles.searchIcon}>
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search patient ID, age, gender, race..."
              style={styles.search}
            />

          </div>

          <button
            onClick={exportCSV}
            style={styles.exportBtn}
          >
            ↓ Export CSV
          </button>

        </div>

        {/* DATASET CARD */}
        <div style={styles.datasetCard}>

          <div style={styles.datasetHeader}>

            <div>
              <h2 style={styles.datasetTitle}>
                Patient Research Records
              </h2>

              <p style={styles.datasetSubtitle}>
                Personally identifiable information is
                excluded from this research view.
              </p>
            </div>

            <div style={styles.recordBadge}>
              {filteredPatients.length} records
            </div>

          </div>

          {/* TABLE */}
          <div style={styles.tableWrapper}>

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    Patient ID
                  </th>

                  <th style={styles.th}>
                    Age
                  </th>

                  <th style={styles.th}>
                    Gender
                  </th>

                  <th style={styles.th}>
                    Race
                  </th>

                  <th style={styles.th}>
                    Medical History
                  </th>

                  <th style={styles.th}>
                    Admission History
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredPatients.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      style={styles.noData}
                    >
                      No patient records found.
                    </td>

                  </tr>

                ) : (

                  filteredPatients.map(
                    (patient, index) => (

                      <tr
                        key={
                          patient.id ??
                          patient.patient_code ??
                          index
                        }
                        style={styles.tableRow}
                      >

                        <td style={styles.td}>
                          <span style={styles.patientId}>
                            {patient.patient_code ??
                              patient.patient_id ??
                              patient.id ??
                              "-"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {patient.age ?? "-"}
                        </td>

                        <td style={styles.td}>

                          <span
                            style={
                              String(
                                patient.gender ?? ""
                              ).toLowerCase() === "male"
                                ? styles.badgeMale
                                : String(
                                    patient.gender ?? ""
                                  ).toLowerCase() ===
                                  "female"
                                ? styles.badgeFemale
                                : styles.badgeOther
                            }
                          >
                            {patient.gender ?? "-"}
                          </span>

                        </td>

                        <td style={styles.td}>
                          {patient.race ?? "-"}
                        </td>

                        <td style={styles.td}>
                          {patient.medical_history ??
                            "-"}
                        </td>

                        <td style={styles.td}>
                          {patient.admission_history ??
                            "-"}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          HealthForecast AI • Anonymized Research Environment
        </div>

      </div>
    </main>
  );
}


/* ============================================================
   STYLES
============================================================ */

const styles = {

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  main: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "40px",
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: "#111827",
  },

  container: {
    maxWidth: "1280px",
    margin: "0 auto",
  },

  /* =========================================================
     HEADER
  ========================================================= */

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "38px",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "34px",
    fontWeight: "700",
    color: "#102a43",
    margin: "0 0 8px 0",
    letterSpacing: "0.2px",
  },

  subtitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "17px",
    fontWeight: "400",
    color: "#5f7892",
    margin: 0,
    lineHeight: 1.6,
  },

  dashboardButton: {
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    padding: "11px 22px",
    borderRadius: "7px",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "15px",
    fontWeight: "700",
    boxShadow: "0 3px 8px rgba(37,99,235,0.15)",
    display: "inline-block",
  },

  /* =========================================================
     SUMMARY SECTION
  ========================================================= */

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    marginBottom: "34px",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "24px 28px",
    minHeight: "130px",
    boxShadow: "0 8px 22px rgba(15,23,42,0.07)",
    border: "1px solid rgba(226,232,240,0.7)",
  },

  summaryCardTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "15px",
    fontWeight: "400",
    color: "#61758a",
    margin: "0 0 10px 0",
  },

  summaryCardValue: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "36px",
    fontWeight: "700",
    color: "#2563eb",
    margin: 0,
  },

  /* =========================================================
     TOOLBAR
  ========================================================= */

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },

  search: {
    width: "340px",
    padding: "12px 15px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "15px",
    fontWeight: "400",
    color: "#1e293b",
    background: "#ffffff",
    outline: "none",
  },

  exportBtn: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "11px 22px",
    borderRadius: "7px",
    cursor: "pointer",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "15px",
    boxShadow: "0 3px 8px rgba(22,163,74,0.15)",
  },

  /* =========================================================
     TABLE
  ========================================================= */

  tableWrapper: {
    background: "#ffffff",
    borderRadius: "14px",
    overflowX: "auto",
    boxShadow: "0 8px 22px rgba(15,23,42,0.07)",
    border: "1px solid rgba(226,232,240,0.7)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: 'Georgia, "Times New Roman", serif',
  },

  th: {
    background: "#f8fafc",
    color: "#102a43",
    padding: "15px 18px",
    textAlign: "left",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "15px",
    borderBottom: "1px solid #dbe4ee",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 18px",
    borderBottom: "1px solid #edf2f7",
    color: "#334e68",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "15px",
    fontWeight: "400",
    whiteSpace: "nowrap",
  },

  /* =========================================================
     GENDER BADGES
  ========================================================= */

  badgeMale: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "5px 12px",
    borderRadius: "14px",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-block",
  },

  badgeFemale: {
    background: "#fde2e8",
    color: "#be185d",
    padding: "5px 12px",
    borderRadius: "14px",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-block",
  },

  badgeOther: {
    background: "#e5e7eb",
    color: "#374151",
    padding: "5px 12px",
    borderRadius: "14px",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-block",
  },

  /* =========================================================
     EMPTY DATA
  ========================================================= */

  noData: {
    textAlign: "center",
    padding: "35px",
    color: "#64748b",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "16px",
    fontWeight: "400",
  },

  /* =========================================================
     FOOTER
  ========================================================= */

  footer: {
    marginTop: "25px",
    textAlign: "center",
    color: "#64748b",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "14px",
  },

};