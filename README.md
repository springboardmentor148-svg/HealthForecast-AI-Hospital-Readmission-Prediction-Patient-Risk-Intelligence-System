# DRIS — Diabetes Readmission Intelligent System — Full Setup Guide

Real accounts, real PostgreSQL storage, real model predictions.

```
backend/     FastAPI + auth + database
frontend/    React (Vite) — login, dashboard, predict, analytics, about
```

---

## 1. Set up PostgreSQL

You need a running PostgreSQL server and an empty database before the
backend can start. Two ways to get one — pick whichever is less friction
for you:

### Option A — Install PostgreSQL locally (Windows)

1. Download from https://www.postgresql.org/download/windows/ and run the installer.
2. During setup, set a password for the `postgres` user — remember it.
3. Leave the default port (5432).
4. After install, open **pgAdmin** (installed alongside Postgres) or `psql`,
   and create a database:
   ```sql
   CREATE DATABASE readmission_db;
   ```

### Option B — Free hosted PostgreSQL (usually less setup friction on Windows)

Services like **Neon** (neon.tech) or **Supabase** (supabase.com) give you
a free PostgreSQL database in about a minute, with no local install —
sign up, create a project, and copy the connection string it gives you.
Given some of the local environment issues you've hit already (PATH,
PowerShell policies), this is worth trying first if local Postgres setup
gives you trouble.

Either way, you end up with a connection string that looks like:
```
postgresql://user:password@host:5432/database_name
```

---

## 2. Backend setup

```powershell
cd backend
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in real values:
```powershell
copy .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/readmission_db
JWT_SECRET_KEY=<generate one below>
```

Generate a real secret key:
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```
Paste the output as `JWT_SECRET_KEY`.

**Add your trained model files** to the `backend/` folder — run
`save_model.py`'s contents as the last cell in your training notebook
(as before), which produces:
```
readmission_model.joblib
feature_columns.json
category_options.json
```
Copy all three into `backend/`.

Start the server:
```powershell
uvicorn main:app --reload --port 8000
```

Tables are created automatically on first run. Confirm it's working:
```
http://localhost:8000/health
```

---

## 3. Frontend setup

In a **second terminal**:
```powershell
cd frontend
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

---

## 4. Using it

1. Go to `/register`, create an account. **The very first account ever
   created automatically becomes an admin** — no manual database edit
   needed. Every account after that is a regular clinician.
2. You're logged in automatically and land on the Dashboard.
3. Go to **Predict risk**, score an encounter — this calls the real
   model and saves the result to your account. The "top contributing
   factors" panel shows real SHAP values from the model, not an
   approximation.
4. **History** lets you search and filter your scored encounters by
   diagnosis and risk band. If you're an admin, a toggle lets you
   switch to "All clinicians" to see everyone's scored encounters.
5. **Settings** lets you change your password while logged in.
6. Forgot your password? Use the link on the login page. Since no
   email service is configured, the reset link is shown directly in
   the app rather than emailed — clearly labeled as a local-testing
   shortcut, not how this would work in production.
7. **About** explains the model and its honest limitations.
8. The 🌙/☀️ toggle in the sidebar (and on the login/register screens)
   switches between light and dark mode — your preference is remembered.
9. **Sign out** in the sidebar clears your session.

## What's new in this version

- **Real model explainability (SHAP)** — every prediction now returns
  the model's actual top contributing features via `shap.TreeExplainer`,
  replacing the earlier hand-written approximation.
- **Admin role** — the first registered account becomes admin
  automatically. Admins can view every clinician's scored encounters
  via `/predictions/all`, not just their own.
- **Search & filter history** — filter by diagnosis text and risk band,
  both for your own encounters and (as admin) everyone's.
- **Password reset & change** — self-service "forgot password" flow
  (token shown in-app, since no email service is set up) and an
  in-app "change password" form under Settings.
- **Rate limiting** — `/auth/login` (5/minute) and `/predict`
  (30/minute) are rate-limited per IP via `slowapi`, to blunt brute-force
  login attempts and endpoint abuse.
- **Dark mode** — a full second color palette, toggleable anywhere in
  the app, persisted across sessions.

## Honest notes on what's simplified

- Password reset tokens are stateless JWTs with a 30-minute expiry —
  simpler than a database-backed token table, at the cost of not being
  individually revocable before they expire. Reasonable at this scale.
- History filtering happens in Python after fetching a user's rows,
  not via database-side JSON queries — this keeps the code portable
  and simple at the row counts a single clinician will realistically
  generate. It would need revisiting if usage scaled to millions of
  predictions per user.
- Rate limits are per-IP via `slowapi`'s in-memory store, which resets
  if the server restarts and won't work correctly if you ever run
  multiple backend instances behind a load balancer — a Redis-backed
  store would be the fix for that, not needed at this stage.

---

## Notes

- The JWT is stored in the browser's localStorage. This is simple and
  fine for a project like this; for a production deployment handling
  real patient data, httpOnly cookies are the more secure option (harder
  to steal via XSS) but need extra coordination between frontend and
  backend — worth a follow-up upgrade, not a day-one requirement.
- Every prediction you make is saved to PostgreSQL under `predictions`,
  linked to your user account. Passwords are hashed with bcrypt — never
  stored in plain text.
- `.env` is already excluded from version control conventions — never
  commit real credentials or your JWT secret.
