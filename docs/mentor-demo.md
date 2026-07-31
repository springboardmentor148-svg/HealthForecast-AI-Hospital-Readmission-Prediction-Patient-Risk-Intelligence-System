# Mentor Demo Script

## 1. Start and explain the system

Run `docker compose up --build`, open `http://localhost:3001`, and explain that the system predicts 30-day hospital readmission using the supplied Diabetes 130-US Hospitals dataset.

## 2. Doctor workflow

1. Sign in as `doctor@healthforecast.local` with `Demo123!`.
2. Open **Patients** and select an assigned patient.
3. Show admission history, medication details, HbA1c information, and prior visit counts.
4. Select **Generate risk prediction** to show readmission probability, risk category, and risk signals.
5. Open **High-risk queue**, then save a care plan and follow-up status from a patient record.

## 3. Hospital Administrator workflow

1. Sign in as `admin@healthforecast.local`.
2. Show overall encounter count, patient count, 30-day readmission rate, and high-risk count.
3. Show age-group outcome analytics, medication/HbA1c treatment patterns, and the department-proxy/utilization performance tables.
4. Open **Reports** and download the hospital operations CSV.

## 4. Healthcare Researcher workflow

1. Sign in as `researcher@healthforecast.local`.
2. Show aggregate analytics.
3. Open **Reports** and download the anonymized research CSV.
4. Explain that patient and encounter identifiers are excluded from this export.

## 5. System Administrator workflow

1. Sign in as `system@healthforecast.local`.
2. Open **Model management** to show evaluation metrics and the active model.
3. Create a new user with one of the four permitted roles.
4. Assign an unassigned patient to a doctor, then show the model activation and local retraining controls.

## 6. Close with limitations

Explain that the project is a college demonstration. The dataset has no hospital ID or dates, so its treatment and trend views describe observed encounter patterns rather than causal medical findings or calendar trends.
