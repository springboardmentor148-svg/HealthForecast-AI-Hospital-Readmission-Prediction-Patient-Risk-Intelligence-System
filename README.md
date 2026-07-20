# HealthForecast AI — Prototype

A working slice of the **HealthForecast AI: Hospital Readmission Prediction &
Patient Risk Intelligence System**, built with exactly the tools listed in
the project's tech stack (Section 7 of the spec): Python/FastAPI backend,
Scikit-learn + XGBoost model, React-less HTML/CSS/JS frontend.

This covers Milestone 1 (auth-free prototype scope), Milestone 2 (Risk
Prediction & Readmission Forecasting), and the read-only pieces of the
Healthcare Analytics Dashboard from Milestone 3.

## What's included

```
healthforecast/
├── data/
│   └── diabetic_data.csv        # Diabetes 130-US Hospitals dataset (your upload)
├── model/
│   ├── train_model.py           # trains & selects the readmission model
│   ├── readmission_model.joblib # trained scikit-learn Pipeline (generated)
│   ├── model_metadata.json      # metrics + feature schema (generated)
│   └── ui_schema.json           # dropdown options for the frontend (generated)
├── backend/
│   └── main.py                  # FastAPI app (serves API + the HTML UI)
├── frontend/
│   └── index.html               # single-file HTML/CSS/JS dashboard
├── requirements.txt
└── README.md
```

## 1. Install dependencies

```bash
pip install -r requirements.txt
```

## 2. Train the model

```bash
python model/train_model.py
```

This loads `data/diabetic_data.csv`, cleans it, engineers a binary target
(`readmitted within 30 days` vs. not), and trains three candidate models:

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 64.7% | 17.0% | 55.8% | 0.261 | 0.649 |
| Random Forest | 65.0% | 17.5% | 57.5% | 0.268 | 0.663 |
| **XGBoost (selected)** | **66.3%** | **18.5%** | **59.2%** | **0.282** | **0.683** |

XGBoost is selected automatically (highest ROC-AUC) and saved to
`model/readmission_model.joblib`. These numbers are in line with published
baselines on this dataset — it's a genuinely hard, imbalanced prediction
problem (only ~11% of encounters are readmitted within 30 days), so treat
the score as a triage/prioritization signal, not a diagnostic tool.

## 3. Run the backend (also serves the UI)

```bash
uvicorn backend.main:app --reload --port 8000
```

Then open **http://localhost:8000** — the FastAPI app serves the HTML
dashboard directly at `/`.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + which model is loaded |
| GET | `/api/schema` | Dropdown options / numeric ranges for the form |
| POST | `/api/predict` | Score a patient encounter → risk %, category, recommendations |
| GET | `/api/model-metrics` | Accuracy/precision/recall/F1/ROC-AUC per candidate model |
| GET | `/api/dataset-summary` | Dataset-level stats for the dashboard |

Example prediction call:

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"age":"[70-80)","number_inpatient":3,"number_emergency":2,"num_medications":25,"A1Cresult":">8","time_in_hospital":9}'
```

## What the prototype covers vs. the full spec

Implemented at prototype scope:
- **Risk Prediction Module** — real model trained on the dataset (`/api/predict`)
- **Readmission forecasting** — same model, framed as 30-day readmission probability
- **Clinical Decision Support** — rule-based care recommendations layered on top of the ML score
- **Healthcare Analytics Dashboard** — model performance + dataset summary views

Not implemented (out of scope for a prototype, called out explicitly rather
than faked):
- Authentication / RBAC for the four user roles (Doctor, Hospital Admin,
  Researcher, System Admin) and the access matrix
- Persistent patient record storage (Postgres/MongoDB) — this prototype is
  stateless; each prediction is scored on the fly and nothing is saved
- Treatment-effectiveness / medication-outcome analysis module
- Docker/cloud deployment packaging
- EHR/lab/pharmacy system integrations

## Notes on the target variable

The raw `readmitted` column has three values: `NO`, `>30`, `<30`. This
prototype collapses it to a binary label (`<30` = 1, else = 0) because
30-day readmission is the standard, clinically actionable target for this
dataset — it's what CMS penalizes hospitals on, and it's the framing implied
by "Readmission Forecasting" in the spec.
