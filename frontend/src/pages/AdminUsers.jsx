import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card } from "../components/Card";
import api from "../lib/api";
import { ROLE_LABELS, initials } from "../lib/format";

const ROLE_OPTIONS = ["doctor", "hospital_administrator", "healthcare_researcher", "system_admin"];

const emptyForm = { username: "", email: "", full_name: "", password: "", role: "doctor", department: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadUsers() {
    setLoading(true);
    api.get("/users").then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }

  useEffect(loadUsers, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/users", form);
      setForm(emptyForm);
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not create user.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id) {
    await api.patch(`/users/${id}/toggle-active`);
    loadUsers();
  }

  return (
    <DashboardLayout title="User Management" subtitle="Accounts, roles & platform access control">
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          {showForm ? "Cancel" : "+ New user"}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <Field label="Username" value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v }))} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
            <Field label="Full name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} required />
            <Field label="Temporary password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} required />
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--ink-soft)" }}>Role</span>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--line)", background: "var(--paper-raised)", color: "var(--ink)" }}
              >
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </label>
            <Field label="Department" value={form.department} onChange={(v) => setForm((f) => ({ ...f, department: v }))} />

            {error && <p className="sm:col-span-2 text-sm rounded-lg px-3 py-2" style={{ background: "var(--risk-critical-soft)", color: "var(--risk-critical)" }}>{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {saving ? "Creating…" : "Create user"}
            </button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--line-soft)" }} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                {["User", "Role", "Department", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold uppercase tracking-wide text-[11px]" style={{ color: "var(--ink-soft)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold" style={{ background: "var(--primary-soft)", color: "var(--primary-ink)" }}>
                        {initials(u.full_name)}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "var(--ink)" }}>{u.full_name}</p>
                        <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-soft)" }}>{ROLE_LABELS[u.role]}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-soft)" }}>{u.department || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: u.is_active ? "var(--risk-low-soft)" : "var(--line-soft)", color: u.is_active ? "var(--risk-low)" : "var(--ink-soft)" }}
                    >
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => toggleActive(u.id)} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--ink-soft)" }}>{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none"
        style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
      />
    </label>
  );
}
