# 🏥 Prognexa AI – Hospital Readmission Prediction & Patient Risk Intelligence

**Prognexa AI** is an end‑to‑end healthcare analytics platform that uses machine learning (XGBoost) to predict hospital readmission risk. It provides role‑based dashboards for **Doctors**, **Hospital Administrators**, **Healthcare Researchers**, and **System Administrators** – with features for patient management, risk prediction, analytics, and report generation.

---

## ✨ Features

- **🔐 Role‑Based Access Control** – Doctor, Admin, Researcher, SysAdmin with specific permissions.
- **🧠 AI‑Powered Prediction** – XGBoost model trained on the Diabetes 130‑US Hospitals dataset.
- **📋 Patient Management** – Create, view, assign, and delete patient records.
- **📊 Real‑Time Analytics** – Risk distribution charts, monthly trends, and summary stats.
- **📑 Report Generation** – Generate and view reports that list patients with their risk levels and assigned doctors.
- **🔧 Settings** – Change password securely.
- **🗄️ MongoDB Storage** – All data persisted locally via MongoDB.

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| **Backend** | FastAPI (Python)                    |
| **Database**| MongoDB (local)                     |
| **Frontend**| Vanilla HTML + CSS + JavaScript (Chart.js) |
| **ML Model**| XGBoost, scikit‑learn, pandas, numpy |
| **Auth**    | JWT (python‑jose) + passlib (pbkdf2_sha256) |
| **Server**  | Uvicorn (ASGI)                      |

---

## 📋 Prerequisites

- **Python 3.10+** – [Download](https://www.python.org/downloads/)
- **MongoDB Community Edition** – [Installation Guide](https://docs.mongodb.com/manual/installation/)
- **Git** – [Download](https://git-scm.com/)
- **MongoDB Compass** (optional, for visual DB management)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/folder-name.git
cd folder-name
```

### 2. Create and Activate a Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

> **Note:** If you don't have a `requirements.txt`, install the essential packages manually:
> ```bash
> pip install fastapi uvicorn pymongo python-jose[cryptography] passlib[bcrypt] python-multipart pydantic xgboost numpy pandas scikit-learn
> ```

---

## 🗄️ Setting Up MongoDB

You have **two options** to start MongoDB. Choose the one that fits your privileges.

### Option 1 – Start MongoDB as a Windows Service (requires Admin)

- Open **Command Prompt as Administrator**.
- Start the service:
  ```cmd
  net start MongoDB
  ```
- Verify with:
  ```cmd
  mongosh
  ```

### Option 2 – Start `mongod` Manually (no Admin required)

- Open a **normal Command Prompt** (non‑admin).
- Create the default data folder (if it doesn't exist):
  ```cmd
  mkdir C:\data\db
  ```
- Start the MongoDB server:
  ```cmd
  mongod --dbpath C:\data\db
  ```
  Keep this terminal **open** – it will run in the foreground.

- Open a **second terminal** for the next steps (the FastAPI server).

> **Tip:** On macOS/Linux, you can start MongoDB with:
> ```bash
> sudo systemctl start mongod   # Linux
> brew services start mongodb-community   # macOS (Homebrew)
> ```

---

## 🔧 Configure the Application

Open `config.py` and verify the settings (defaults are fine for local development):

```python
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "prognexa_db"
JWT_SECRET_KEY = "your-super-secret-key"   # change in production
ACCESS_TOKEN_EXPIRE_MINUTES = 60
```

---

## 🚀 Run the Backend Server

Make sure your virtual environment is active and you are in the project root.

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
✅ Connected to MongoDB: prognexa_db
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Leave this terminal **open** – the server must stay running.

---

## 🌐 Run the Frontend

You can open `index.html` directly in your browser, but it's better to serve it with a local web server to avoid CORS issues.

- **Option A – Using Python's built‑in HTTP server**:
  ```bash
  cd frontend
  python -m http.server 5500
  ```
  Then open `http://localhost:5500` in your browser.

- **Option B – VS Code Live Server** (if you have the extension): right‑click `index.html` and select *Open with Live Server*.

---

## 👤 Register & Log In

- On the login page, click **"Register here"**.
- Choose a username, password, and **role** (Doctor, Admin, Researcher, SysAdmin).
- After registration, you'll be logged in automatically.

> **Note:** The first user must be registered via the UI – there are no default users.

---

## 👥 User Roles & Permissions

| Role               | Can Predict | Can Generate Reports | Can View Patients         |
|--------------------|-------------|----------------------|---------------------------|
| **Doctor**         | ✅ Yes      | ❌ No                | Only assigned patients    |
| **Administrator**  | ❌ No       | ✅ Yes               | All patients              |
| **Researcher**     | ❌ No       | ✅ Yes               | All (anonymised)          |
| **System Admin**   | ✅ Yes      | ✅ Yes               | All patients              |

---

## 🧪 Testing the Prediction

Fill in the clinical form with realistic values. Example scenarios:

- **High Risk** (probability ≥ 70%):  
  Age `[70-80]`, Time in Hospital `10`, Medications `18`, Diagnoses `12`, Emergency `3`, Inpatient `3`, Insulin `Up`, A1Cresult `>7`, DiabetesMed `Yes`.

- **Medium Risk** (probability 30–70%):  
  Age `[50-60]`, Time in Hospital `6`, Medications `12`, Diagnoses `7`, Insulin `Steady`, A1Cresult `>7`, DiabetesMed `Yes`.

- **Low Risk** (probability < 30%):  
  Age `[30-40]`, Time in Hospital `2`, Medications `5`, Diagnoses `3`, Insulin `No`, A1Cresult `None`, DiabetesMed `No`.

---

## 📚 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` to explore the auto‑generated OpenAPI documentation (Swagger UI).

---

## 🗂️ Project Structure

```
prognexa-ai/
├── app.py                 # FastAPI main application
├── config.py              # Configuration (MongoDB, JWT, model paths)
├── schemas.py             # Pydantic models (request/response)
├── predict.py             # Prediction logic (loads model, runs inference)
├── preprocessor.py        # Data preprocessing and feature engineering
├── requirements.txt       # Python dependencies
├── model/                 # Contains model files (not included in repo)
│   ├── readmission_model.json
│   ├── feature_columns.json
│   └── label_encoders.pkl
└── frontend/
    └── index.html         # Complete single‑page application
```

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.



**Prognexa AI** – *Intelligent healthcare, powered by AI.* 🚀
