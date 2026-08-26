"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPatients } from "../../../lib/api";

export default function ResearchDatasetPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ============================================================
  // LOAD PATIENT DATA
  // ============================================================

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const response = await getPatients();

      let list = [];

      if (Array.isArray(response)) {
        list = response;
      } else if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.patients)) {
        list = response.patients;
      }

      setPatients(list);
    } catch (err) {
      console.error(
        "Failed to load research dataset:",
        err
      );

      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FILTER PATIENTS
  // ============================================================

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

      const age = String(
        patient.age ?? ""
      ).toLowerCase();

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

  // ============================================================
  // SUMMARY CARD VALUES
  // ============================================================

  const totalResearchRecords =
    filteredPatients.length;

  const maleCount =
    filteredPatients.filter(
      (patient) =>
        String(
          patient.gender ?? ""
        ).toLowerCase() === "male"
    ).length;

  const femaleCount =
    filteredPatients.filter(
      (patient) =>
        String(
          patient.gender ?? ""
        ).toLowerCase() === "female"
    ).length;

  // ============================================================
  // EXPORT CSV
  // ============================================================

  function exportCSV() {
    if (!filteredPatients.length) {
      return;
    }

    const rows = filteredPatients.map(
      (patient) => ({
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
      })
    );

    const headers =
      Object.keys(rows[0]);

    const csvRows = [
      headers.join(","),

      ...rows.map((row) =>
        headers
          .map((header) => {
            const value =
              row[header] ?? "";

            return `"${String(value)
              .replace(/"/g, '""')
              .replace(/\n/g, " ")}"`;
          })
          .join(",")
      ),
    ];

    const csv =
      csvRows.join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "Anonymized_Research_Dataset.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Anonymized Research Dataset...
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main style={styles.main}>

      <div style={styles.container}>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div style={styles.header}>

          <div>

            <div style={styles.brand}>
              HEALTHFORECAST AI
            </div>

            <h1 style={styles.title}>
              Anonymized Research Dataset
            </h1>

            <p style={styles.subtitle}>
              Explore anonymized patient information
              for population-level healthcare research.
            </p>

          </div>

          <Link
            href="/researcher"
            style={styles.dashboardButton}
          >
            ← Dashboard
          </Link>

        </div>

        {/* ======================================================
            THREE SUMMARY CARDS
        ====================================================== */}

        <div style={styles.summaryGrid}>

          {/* TOTAL RECORDS */}

          <div style={styles.summaryCard}>

            <div style={styles.summaryCardTitle}>
              Total Records
            </div>

            <div
              style={styles.summaryCardValue}
            >
              {totalResearchRecords}
            </div>

          </div>

          {/* MALE */}

          <div style={styles.summaryCard}>

            <div style={styles.summaryCardTitle}>
              Male
            </div>

            <div
              style={{
                ...styles.summaryCardValue,
                color: "#2563eb",
              }}
            >
              {maleCount}
            </div>

          </div>

          {/* FEMALE */}

          <div style={styles.summaryCard}>

            <div style={styles.summaryCardTitle}>
              Female
            </div>

            <div
              style={{
                ...styles.summaryCardValue,
                color: "#db2777",
              }}
            >
              {femaleCount}
            </div>

          </div>

        </div>

        {/* ======================================================
            TOOLBAR
        ====================================================== */}

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

        {/* ======================================================
            DATASET CARD
        ====================================================== */}

        <div style={styles.datasetCard}>

          {/* DATASET HEADER */}

          <div style={styles.datasetHeader}>

            <div>

              <h2 style={styles.datasetTitle}>
                Patient Research Records
              </h2>

              <p style={styles.datasetSubtitle}>
                Personally identifiable information
                is excluded from this research view.
              </p>

            </div>

            <div style={styles.recordBadge}>
              {filteredPatients.length} records
            </div>

          </div>

          {/* ==================================================
              TABLE
          ================================================== */}

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

                        {/* PATIENT ID */}

                        <td style={styles.td}>

                          <span
                            style={styles.patientId}
                          >
                            {patient.patient_code ??
                              patient.patient_id ??
                              patient.id ??
                              "-"}
                          </span>

                        </td>

                        {/* AGE */}

                        <td style={styles.td}>
                          {patient.age ?? "-"}
                        </td>

                        {/* GENDER */}

                        <td style={styles.td}>

                          <span
                            style={
                              String(
                                patient.gender ?? ""
                              ).toLowerCase() ===
                              "male"
                                ? styles.badgeMale
                                : String(
                                    patient.gender ??
                                      ""
                                  ).toLowerCase() ===
                                  "female"
                                ? styles.badgeFemale
                                : styles.badgeOther
                            }
                          >
                            {patient.gender ?? "-"}
                          </span>

                        </td>

                        {/* RACE */}

                        <td style={styles.td}>
                          {patient.race ?? "-"}
                        </td>

                        {/* MEDICAL HISTORY */}

                        <td style={styles.td}>
                          {patient.medical_history ??
                            "-"}
                        </td>

                        {/* ADMISSION HISTORY */}

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

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div style={styles.footer}>
          HealthForecast AI • Anonymized Research Environment
        </div>

      </div>

    </main>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  main: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "35px 40px",
    fontFamily: "Times New Roman",
    color: "#111827",
  },

  container: {
    maxWidth: "1280px",
    margin: "0 auto",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "38px",
    padding: "0 5px",
    flexWrap: "wrap",
    gap: "20px",
  },

  brand: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "17px",
    fontWeight: "500",
    color: "#1e293b",
    letterSpacing: "0.5px",
    marginBottom: "3px",
  },

  title: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "42px",
    fontWeight: "700",
    color: "#102a43",
    margin: "0 0 8px 0",
    letterSpacing: "-0.8px",
    lineHeight: "1.15",
  },

  subtitle: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "17px",
    fontWeight: "400",
    color: "#607d9b",
    margin: 0,
    lineHeight: "1.6",
  },

  dashboardButton: {
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    padding: "12px 22px",
    borderRadius: "8px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "15px",
    fontWeight: "700",
    boxShadow:
      "0 4px 10px rgba(37,99,235,0.18)",
    display: "inline-block",
  },

  // ==========================================================
  // THREE SUMMARY CARDS
  // ==========================================================

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "28px",
    marginBottom: "38px",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px 32px",
    minHeight: "125px",
    boxShadow:
      "0 7px 22px rgba(15,23,42,0.07)",
    border:
      "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  summaryCardTitle: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "17px",
    fontWeight: "400",
    color: "#334e68",
    marginBottom: "10px",
  },

  summaryCardValue: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "36px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
    lineHeight: "1.1",
  },

  // ==========================================================
  // TOOLBAR
  // ==========================================================

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },

  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  searchIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "15px",
    pointerEvents: "none",
  },

  search: {
    width: "340px",
    padding: "12px 15px 12px 40px",
    borderRadius: "7px",
    border: "1px solid #cbd5e1",
    fontFamily:
      'Georgia, "Times New Roman", serif',
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
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "15px",
    boxShadow:
      "0 3px 8px rgba(22,163,74,0.15)",
  },

  // ==========================================================
  // DATASET CARD
  // ==========================================================

  datasetCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow:
      "0 8px 22px rgba(15,23,42,0.07)",
    border:
      "1px solid rgba(226,232,240,0.7)",
  },

  datasetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },

  datasetTitle: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "25px",
    fontWeight: "700",
    color: "#102a43",
    margin: "0 0 6px 0",
  },

  datasetSubtitle: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.5",
  },

  recordBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "8px 15px",
    borderRadius: "20px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "14px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  // ==========================================================
  // TABLE
  // ==========================================================

  tableWrapper: {
    background: "#ffffff",
    borderRadius: "12px",
    overflowX: "auto",
    border:
      "1px solid #e2e8f0",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily:
      'Georgia, "Times New Roman", serif',
  },

  th: {
    background: "#f8fafc",
    color: "#102a43",
    padding: "15px 18px",
    textAlign: "left",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "15px",
    borderBottom:
      "1px solid #dbe4ee",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 18px",
    borderBottom:
      "1px solid #edf2f7",
    color: "#334e68",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "15px",
    fontWeight: "400",
    whiteSpace: "nowrap",
  },

  tableRow: {
    background: "#ffffff",
  },

  patientId: {
    fontWeight: "700",
    color: "#102a43",
  },

  // ==========================================================
  // GENDER BADGES
  // ==========================================================

  badgeMale: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "5px 12px",
    borderRadius: "14px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-block",
  },

  badgeFemale: {
    background: "#fde2e8",
    color: "#be185d",
    padding: "5px 12px",
    borderRadius: "14px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-block",
  },

  badgeOther: {
    background: "#e5e7eb",
    color: "#374151",
    padding: "5px 12px",
    borderRadius: "14px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-block",
  },

  // ==========================================================
  // NO DATA
  // ==========================================================

  noData: {
    textAlign: "center",
    padding: "35px",
    color: "#64748b",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "16px",
    fontWeight: "400",
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f7fb",
    color: "#102a43",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "22px",
    fontWeight: "600",
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    marginTop: "25px",
    textAlign: "center",
    color: "#64748b",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "14px",
  },

};