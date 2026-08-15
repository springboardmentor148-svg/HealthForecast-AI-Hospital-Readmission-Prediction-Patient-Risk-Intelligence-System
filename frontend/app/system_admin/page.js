"use client";

import { useEffect, useState } from "react";
import { getUsers, getPredictions } from "../../lib/api";


export default function SystemAdminPage() {
  useEffect(() => {
  loadSystemAdminData();
}, []);

async function loadSystemAdminData() {
  try {
    const data = await getSystemAdminOverview();

    setStats(data);
  } catch (error) {
    console.error("Failed to load system admin data:", error);
  }
}

  // ============================================================
  // STATE
  // ============================================================

  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  useEffect(() => {

    loadDashboardData();

  }, []);


  async function loadDashboardData() {

    try {

      setLoading(true);
      setError("");


      // ========================================================
      // GET USERS + PREDICTIONS
      // ========================================================

      const [
        usersResponse,
        predictionsResponse
      ] = await Promise.all([

        getUsers(),

        getPredictions()

      ]);


      // ========================================================
      // PROCESS USERS RESPONSE
      // ========================================================

      let userList = [];


      if (Array.isArray(usersResponse)) {

        userList = usersResponse;

      }

      else if (
        Array.isArray(
          usersResponse?.users
        )
      ) {

        userList =
          usersResponse.users;

      }

      else if (
        Array.isArray(
          usersResponse?.data
        )
      ) {

        userList =
          usersResponse.data;

      }


      // ========================================================
      // PROCESS PREDICTIONS RESPONSE
      // ========================================================

      let predictionList = [];


      if (Array.isArray(predictionsResponse)) {

        predictionList =
          predictionsResponse;

      }

      else if (
        Array.isArray(
          predictionsResponse?.predictions
        )
      ) {

        predictionList =
          predictionsResponse.predictions;

      }

      else if (
        Array.isArray(
          predictionsResponse?.data
        )
      ) {

        predictionList =
          predictionsResponse.data;

      }


      // ========================================================
      // SAVE DATA
      // ========================================================

      setUsers(userList);

      setPredictions(
        predictionList
      );


      // ========================================================
      // DEBUG
      // ========================================================

      console.log(
        "Users API response:",
        usersResponse
      );

      console.log(
        "Processed users:",
        userList
      );

      console.log(
        "Predictions API response:",
        predictionsResponse
      );

      console.log(
        "Processed predictions:",
        predictionList
      );


    }

    catch (err) {

      console.error(
        "Dashboard data loading failed:",
        err
      );

      setError(
        err?.message ||
        "Unable to load dashboard data."
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ============================================================
  // USER STATISTICS
  // ============================================================

  const totalUsers =
    users.length;


  const doctors =
    users.filter(

      (user) =>

        String(
          user.role ?? ""
        )
        .toLowerCase()
        .trim()
        === "doctor"

    ).length;


  const hospitalAdmins =
    users.filter(

      (user) =>

        String(
          user.role ?? ""
        )
        .toLowerCase()
        .trim()
        === "hospital_admin"

    ).length;


  const researchers =
    users.filter(

      (user) =>

        String(
          user.role ?? ""
        )
        .toLowerCase()
        .trim()
        === "researcher"

    ).length;


  const systemAdmins =
    users.filter(

      (user) =>

        String(
          user.role ?? ""
        )
        .toLowerCase()
        .trim()
        === "system_admin"

    ).length;


  // ============================================================
  // PREDICTION STATISTICS
  // ============================================================

  const totalPredictions =
    predictions.length;


  // ============================================================
  // CURRENT STATIC VALUES
  // ============================================================
  // We will connect these to backend later.

  const hospitals = 12;

  const activeSessions = 18;


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <main style={styles.main}>

        <div style={styles.loadingContainer}>

          <div style={styles.loadingText}>

            Loading System Overview...

          </div>

        </div>

      </main>

    );

  }


  // ============================================================
  // DASHBOARD
  // ============================================================

  return (

    <main style={styles.main}>

      <div style={styles.container}>


        {/* ======================================================
            HEADER
        ====================================================== */}

        <header style={styles.header}>

          <div>

            <h1 style={styles.title}>
              System Overview
            </h1>

            <p style={styles.subtitle}>
              Platform administration, user management,
              healthcare infrastructure, and AI activity.
            </p>

          </div>


          <div style={styles.headerStatus}>

            <span style={styles.statusDot}></span>

            System Active

          </div>

        </header>


        {/* ======================================================
            ERROR MESSAGE
        ====================================================== */}

        {error && (

          <div style={styles.errorBox}>

            <strong>
              Unable to load some dashboard data
            </strong>

            <p style={styles.errorText}>
              {error}
            </p>

          </div>

        )}


        {/* ======================================================
            SYSTEM OVERVIEW
        ====================================================== */}

        <section>

          <h2 style={styles.sectionTitle}>
            System Overview
          </h2>


          <div style={styles.cardGrid}>


            {/* TOTAL USERS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                Total Users
              </p>

              <h3 style={styles.cardValue}>
                {totalUsers}
              </h3>

              <p style={styles.cardDescription}>
                Registered platform users.
              </p>

            </div>


            {/* DOCTORS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                Doctors
              </p>

              <h3 style={styles.cardValue}>
                {doctors}
              </h3>

              <p style={styles.cardDescription}>
                Registered healthcare professionals.
              </p>

            </div>


            {/* HOSPITAL ADMINS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                Hospital Admins
              </p>

              <h3 style={styles.cardValue}>
                {hospitalAdmins}
              </h3>

              <p style={styles.cardDescription}>
                Hospital administration accounts.
              </p>

            </div>


            {/* RESEARCHERS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                Researchers
              </p>

              <h3 style={styles.cardValue}>
                {researchers}
              </h3>

              <p style={styles.cardDescription}>
                Healthcare research accounts.
              </p>

            </div>


            {/* SYSTEM ADMINS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                System Admins
              </p>

              <h3 style={styles.cardValue}>
                {systemAdmins}
              </h3>

              <p style={styles.cardDescription}>
                Platform administration accounts.
              </p>

            </div>


            {/* AI PREDICTIONS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                AI Predictions
              </p>

              <h3 style={styles.cardValue}>
                {totalPredictions}
              </h3>

              <p style={styles.cardDescription}>
                Total AI risk predictions generated.
              </p>

            </div>


            {/* HOSPITALS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                Hospitals
              </p>

              <h3 style={styles.cardValue}>
                {hospitals}
              </h3>

              <p style={styles.cardDescription}>
                Connected healthcare facilities.
              </p>

            </div>


            {/* ACTIVE SESSIONS */}

            <div style={styles.card}>

              <p style={styles.cardTitle}>
                Active Sessions
              </p>

              <h3
                style={{
                  ...styles.cardValue,
                  color: "#16a34a"
                }}
              >
                {activeSessions}
              </h3>

              <p style={styles.cardDescription}>
                Currently active platform sessions.
              </p>

            </div>


          </div>

        </section>


        {/* ======================================================
            USER ROLE DISTRIBUTION
        ====================================================== */}

        <section style={styles.roleSection}>

          <h2 style={styles.sectionTitle}>
            User Role Distribution
          </h2>


          <div style={styles.roleGrid}>


            <div style={styles.roleCard}>

              <span style={styles.roleNumber}>
                {doctors}
              </span>

              <span style={styles.roleName}>
                Doctors
              </span>

            </div>


            <div style={styles.roleCard}>

              <span style={styles.roleNumber}>
                {hospitalAdmins}
              </span>

              <span style={styles.roleName}>
                Hospital Admins
              </span>

            </div>


            <div style={styles.roleCard}>

              <span style={styles.roleNumber}>
                {researchers}
              </span>

              <span style={styles.roleName}>
                Researchers
              </span>

            </div>


            <div style={styles.roleCard}>

              <span style={styles.roleNumber}>
                {systemAdmins}
              </span>

              <span style={styles.roleName}>
                System Admins
              </span>

            </div>


          </div>

        </section>


      </div>

    </main>

  );

}


// ============================================================
// STYLES
// ============================================================

const styles = {

  // ----------------------------------------------------------
  // MAIN
  // ----------------------------------------------------------

  main: {

    minHeight: "100vh",

    background:
      "#f4f7fb",

    padding:
      "40px 55px",

    fontFamily:
      "Georgia, 'Times New Roman', serif",

    color:
      "#0f172a",

  },


  // ----------------------------------------------------------
  // CONTAINER
  // ----------------------------------------------------------

  container: {

    maxWidth:
      "1440px",

    margin:
      "0 auto",

  },


  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    marginBottom:
      "45px",

    gap:
      "30px",

    flexWrap:
      "wrap",

  },


  title: {

    margin:
      "0 0 10px 0",

    fontSize:
      "38px",

    fontWeight:
      "700",

    color:
      "#0b1f3a",

    letterSpacing:
      "-0.5px",

  },


  subtitle: {

    margin:
      "0",

    fontSize:
      "17px",

    lineHeight:
      "1.6",

    color:
      "#64748b",

  },


  headerStatus: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "8px",

    color:
      "#15803d",

    fontSize:
      "16px",

    fontWeight:
      "600",

    paddingTop:
      "10px",

  },


  statusDot: {

    width:
      "9px",

    height:
      "9px",

    borderRadius:
      "50%",

    background:
      "#16a34a",

    display:
      "inline-block",

  },


  // ----------------------------------------------------------
  // SECTION
  // ----------------------------------------------------------

  sectionTitle: {

    margin:
      "0 0 25px 0",

    fontSize:
      "27px",

    fontWeight:
      "700",

    color:
      "#0b1f3a",

  },


  // ----------------------------------------------------------
  // CARD GRID
  // ----------------------------------------------------------

  cardGrid: {

    display:
      "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",

    gap:
      "30px",

  },


  // ----------------------------------------------------------
  // CARD
  // ----------------------------------------------------------

  card: {

    background:
      "#ffffff",

    borderRadius:
      "17px",

    padding:
      "32px 34px",

    minHeight:
      "195px",

    boxShadow:
      "0 8px 25px rgba(15,23,42,0.07)",

    border:
      "1px solid #edf1f5",

  },


  cardTitle: {

    margin:
      "0",

    fontSize:
      "18px",

    color:
      "#58708f",

    fontWeight:
      "400",

  },


  cardValue: {

    margin:
      "25px 0 22px 0",

    fontSize:
      "42px",

    lineHeight:
      "1",

    fontWeight:
      "700",

    color:
      "#2563eb",

  },


  cardDescription: {

    margin:
      "0",

    fontSize:
      "16px",

    lineHeight:
      "1.5",

    color:
      "#58708f",

  },


  // ----------------------------------------------------------
  // ROLE SECTION
  // ----------------------------------------------------------

  roleSection: {

    marginTop:
      "55px",

  },


  roleGrid: {

    display:
      "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",

    gap:
      "30px",

  },


  roleCard: {

    background:
      "#ffffff",

    borderRadius:
      "17px",

    padding:
      "28px 30px",

    boxShadow:
      "0 8px 25px rgba(15,23,42,0.07)",

    border:
      "1px solid #edf1f5",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "8px",

  },


  roleNumber: {

    fontSize:
      "30px",

    fontWeight:
      "700",

    color:
      "#2563eb",

  },


  roleName: {

    fontSize:
      "16px",

    color:
      "#64748b",

  },


  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  loadingContainer: {

    minHeight:
      "80vh",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

  },


  loadingText: {

    fontSize:
      "22px",

    fontWeight:
      "600",

    color:
      "#2563eb",

  },


  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  errorBox: {

    background:
      "#fff7ed",

    border:
      "1px solid #fed7aa",

    borderRadius:
      "12px",

    padding:
      "18px 22px",

    marginBottom:
      "30px",

    color:
      "#9a3412",

    fontSize:
      "15px",

  },


  errorText: {

    margin:
      "7px 0 0 0",

  },


  // ----------------------------------------------------------
  // RESPONSIVE
  // ----------------------------------------------------------

};