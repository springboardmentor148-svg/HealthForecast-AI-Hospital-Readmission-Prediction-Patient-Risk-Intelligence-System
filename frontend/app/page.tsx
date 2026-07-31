"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const demoAccounts = [
  ["Doctor", "doctor@healthforecast.local"],
  ["Hospital Administrator", "admin@healthforecast.local"],
  ["Healthcare Researcher", "researcher@healthforecast.local"],
  ["System Administrator", "system@healthforecast.local"],
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(demoAccounts[0][1]);
  const [password, setPassword] = useState("Demo123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to sign in");
      localStorage.setItem("hf_token", data.access_token);
      localStorage.setItem("hf_role", data.role);
      localStorage.setItem("hf_name", data.name);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-slate-950 p-5 text-white">
    <div className="mx-auto grid min-h-[92vh] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1.15fr_.85fr]">
      <section className="relative overflow-hidden bg-ink p-8 md:p-14">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal/30 blur-3xl" />
        <div className="relative">
          <div className="mb-20 flex items-center gap-3 text-lg font-bold"><span className="rounded-xl bg-teal px-3 py-2">HF</span> HealthForecast AI</div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-teal-200">Patient risk intelligence</p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">See readmission risk before discharge planning begins.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">A local educational dashboard for analysing hospital encounters, 30-day readmission risk, treatments, and patient outcomes.</p>
          <div className="mt-12 grid grid-cols-3 gap-3 text-center text-sm"><div className="rounded-2xl bg-white/10 p-4"><b className="block text-2xl text-teal-200">4</b>Roles</div><div className="rounded-2xl bg-white/10 p-4"><b className="block text-2xl text-teal-200">30d</b>Risk</div><div className="rounded-2xl bg-white/10 p-4"><b className="block text-2xl text-teal-200">Local</b>Docker</div></div>
        </div>
      </section>
      <section className="p-8 text-ink md:p-14">
        <h2 className="text-3xl font-bold">Welcome back</h2><p className="mt-2 text-slate-500">Sign in with a seeded demo account.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-bold">Email<input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal" /></label>
          <label className="block text-sm font-bold">Password<input value={password} type="password" onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal" /></label>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-teal px-4 py-3 font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="mt-8 border-t border-slate-200 pt-6"><p className="mb-3 text-sm font-bold">Demo roles</p><div className="grid grid-cols-2 gap-2">{demoAccounts.map(([role, account]) => <button type="button" key={role} onClick={() => setEmail(account)} className="rounded-lg border border-slate-200 p-2 text-left text-xs hover:border-teal"><b className="block">{role}</b><span className="text-slate-500">Use Demo123!</span></button>)}</div></div>
      </section>
    </div>
  </main>;
}
