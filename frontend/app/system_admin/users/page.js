"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUsers } from "../../../lib/api";

export default function UserManagementPage() {

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {

    const value = search.toLowerCase();

    setFilteredUsers(

      users.filter((user) =>

        String(user.name || "")
          .toLowerCase()
          .includes(value)

        ||

        String(user.email || "")
          .toLowerCase()
          .includes(value)

        ||

        String(user.role || "")
          .toLowerCase()
          .includes(value)

      )

    );

  }, [search, users]);

  async function loadUsers() {

    try {

      const response = await getUsers();

      let list = [];

      if (Array.isArray(response))
        list = response;

      else if (Array.isArray(response.data))
        list = response.data;

      else if (Array.isArray(response.users))
        list = response.users;

      setUsers(list);
      setFilteredUsers(list);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (
      <div style={styles.loading}>
        Loading Users...
      </div>
    );

  }
    return (

    <main style={styles.main}>

      <div style={styles.container}>

        {/* ================= HEADER ================= */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>
              User Management
            </h1>

            <p style={styles.subtitle}>
              Create, edit and manage all platform users.
            </p>

          </div>

          <div style={styles.headerButtons}>

            <button style={styles.addButton}>
              + Add User
            </button>

            <Link
              href="/system_admin"
              style={styles.dashboardButton}
            >
              Dashboard
            </Link>

          </div>

        </div>

        {/* ================= STATS ================= */}

        <div style={styles.cardGrid}>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Total Users</div>
            <div style={styles.cardValue}>
              {users.length}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Doctors</div>
            <div style={styles.cardValue}>
              {users.filter(u => u.role === "doctor").length}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Researchers</div>
            <div style={styles.cardValue}>
              {
                users.filter(
                  u =>
                    u.role === "researcher" ||
                    u.role === "healthcare_researcher"
                ).length
              }
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Admins</div>
            <div style={styles.cardValue}>
              {
                users.filter(
                  u =>
                    u.role === "hospital_admin" ||
                    u.role === "system_admin"
                ).length
              }
            </div>
          </div>

        </div>

        {/* ================= SEARCH ================= */}

        <div style={styles.searchBar}>

          <input

            type="text"

            placeholder="Search by name, email or role..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            style={styles.input}

          />

        </div>

        {/* ================= TABLE ================= */}

        <div style={styles.tableContainer}>

          <table style={styles.table}>

            <thead>

              <tr>

                <th>Name</th>

                <th>Email</th>

                <th>Role</th>

                <th>Status</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>
                {filteredUsers.length === 0 ? (

  <tr>

    <td
      colSpan="5"
      style={{
        textAlign: "center",
        padding: "30px",
        color: "#64748b",
      }}
    >
      No users found.
    </td>

  </tr>

) : (

  filteredUsers.map((user, index) => (

    <tr key={user.id || user._id || index}>

      <td>
        {user.name || "-"}
      </td>

      <td>
        {user.email || "-"}
      </td>

      <td>

        <span style={styles.roleBadge}>
          {user.role || "-"}
        </span>

      </td>

      <td>

        <span
          style={
            user.status === "Inactive"
              ? styles.inactiveBadge
              : styles.activeBadge
          }
        >
          {user.status || "Active"}
        </span>

      </td>

      <td>

        <div style={styles.actionButtons}>

          <button style={styles.editBtn}>
            Edit
          </button>

          <button style={styles.deleteBtn}>
            Delete
          </button>

        </div>

      </td>

    </tr>

  ))

)}
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
    fontFamily: "Georgia, 'Times New Roman', serif",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  loading: {
    textAlign: "center",
    paddingTop: "120px",
    fontSize: "28px",
    fontWeight: "600",
    color: "#2563eb",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
  },

  title: {
    fontSize: "46px",
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "18px",
    marginTop: "10px",
  },

  headerButtons: {
    display: "flex",
    gap: "15px",
  },

  dashboardButton: {
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "12px 22px",
    borderRadius: "10px",
    fontWeight: "600",
  },

  addButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "12px 22px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "35px",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    textAlign: "center",
    boxShadow: "0 5px 18px rgba(0,0,0,.08)",
  },

  cardTitle: {
    color: "#6b7280",
    fontSize: "18px",
    marginBottom: "10px",
  },

  cardValue: {
    color: "#2563eb",
    fontSize: "38px",
    fontWeight: "700",
  },

  searchBar: {
    marginBottom: "25px",
  },

  input: {
    width: "360px",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fff",
  },

  tableContainer: {
    background: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 5px 20px rgba(0,0,0,.08)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  roleBadge: {
    background: "#dbeafe",
    color: "#2563eb",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  activeBadge: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  inactiveBadge: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  actionButtons: {
    display: "flex",
    gap: "10px",
  },

  editBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  deleteBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },

};
            