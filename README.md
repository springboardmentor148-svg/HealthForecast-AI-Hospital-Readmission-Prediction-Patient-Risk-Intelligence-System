# 🏥 Prognexa AI – Hospital Readmission Prediction & Patient Risk Intelligence System

**Prognexa AI** is an end‑to‑end healthcare analytics platform that uses machine learning (XGBoost) to predict hospital readmission risk. It provides role‑based dashboards for **Doctors**, **Hospital Administrators**, **Healthcare Researchers**, and **System Administrators** – with features for patient management, risk prediction, analytics, and report generation.

---

## ✨ Features

- **🔐 Role‑Based Access Control** – Doctor, Admin, Researcher, SysAdmin with specific permissions.
- **🧠 AI‑Powered Prediction** – XGBoost model trained on the Diabetes 130‑US Hospitals dataset.
- **📋 Patient Management** – Create, view, assign, and delete patient records.
- **📊 Real‑Time Analytics** – Risk distribution charts, monthly trends, and summary stats.
- **📑 Report Generation** – Generate and view reports that list patients with their risk levels and assigned doctors.
- **📝 Notes & Appointments** – Doctors can add clinical notes and manage appointments.
- **📅 Task Management** – Admins can assign tasks to doctors; doctors can view their assigned tasks.
- **📄 Research Summaries** – Researchers can post and view research findings.
- **🏥 Hospital Population Dashboard** – Admins/SysAdmins can view hospital occupancy and high‑risk patient priority lists.
- **🔧 Settings** – Change password securely.
- **🗄️ MongoDB Storage** – All data persisted locally via MongoDB.
- **📊 Chart.js Visualizations** – Interactive charts for risk distribution, trends, and hospital population.

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
| **Styling** | Glassmorphism UI with Inter font    |

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
git clone https://github.com/your-username/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System.git
cd HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System
git checkout pragathi
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

### 4. Create `requirements.txt`

```txt
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
xgboost==2.0.3
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
```

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

## 🌱 Seed the Database (Optional)

To populate the database with sample patients, predictions, and research summaries:

```bash
python seed.py
```

This will create:
- 4 users (doctor, admin, researcher, sysadmin)
- 15 patients with varying risk trajectories
- Prediction history for each patient
- Research summaries
- Sample reports

> **Note:** Seed data does NOT include notes or schedules – these can be added through the UI.

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

Open `index.html` directly in your browser, or serve it with a local web server:

### Option A – Using Python's built‑in HTTP server:
```bash
cd frontend
python -m http.server 5500
```
Then open `http://localhost:5500` in your browser.

### Option B – VS Code Live Server:
Right‑click `index.html` and select *Open with Live Server*.

---

## 👤 Register & Log In

1. On the login page, click **"Get Started"** then **"Sign up"**.
2. Choose a username, password, and **role** (Doctor, Admin, Researcher, SysAdmin).
3. After registration, you'll be redirected to login.
4. Use your credentials to access the platform.

> **Note:** The first user must be registered via the UI – there are no default users.

---

## 👥 User Roles & Permissions

| Feature                | Doctor | Admin | Researcher | SysAdmin |
|------------------------|--------|-------|------------|----------|
| **Predict Readmission**| ✅ Yes | ❌ No | ❌ No      | ✅ Yes   |
| **Generate Reports**   | ❌ No  | ✅ Yes| ✅ Yes     | ✅ Yes   |
| **View Patients**      | ✅ Own | ✅ All| ✅ Anonymized | ✅ All |
| **Add Notes**          | ✅ Yes | ❌ No | ❌ No      | ❌ No    |
| **View Appointments**  | ✅ Yes | ❌ No | ❌ No      | ❌ No    |
| **Assign Tasks**       | ❌ No  | ✅ Yes| ❌ No      | ❌ No    |
| **View Tasks**         | ✅ Yes | ❌ No | ❌ No      | ❌ No    |
| **Research Summaries** | ❌ No  | ✅ View| ✅ Post & View | ✅ View |
| **User Management**    | ❌ No  | ❌ No | ❌ No      | ✅ Yes   |
| **Model Management**   | ❌ No  | ❌ No | ❌ No      | ✅ Yes   |
| **Hospital Population**| ❌ No  | ✅ Yes| ❌ No      | ✅ Yes   |

---

## 📚 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` to explore the auto‑generated OpenAPI documentation (Swagger UI).

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and get JWT token |
| GET | `/me` | Get current user info |
| GET | `/patients` | Get patients (role‑based) |
| POST | `/predict` | Run prediction on patient data |
| GET | `/analytics/overview` | Get dashboard statistics |
| POST | `/reports/generate` | Generate a new report |
| GET | `/reports` | Get all reports |
| POST | `/notes` | Add a note (doctor only) |
| GET | `/notes` | Get notes for current user |
| POST | `/admin/schedule` | Create a task (admin only) |
| GET | `/admin/schedules` | Get all schedules |
| POST | `/research/summary` | Post research summary (researcher only) |
| GET | `/research/summaries` | Get all research summaries |
| GET | `/model/status` | Get model status (sysadmin only) |

---

## 🗂️ Project Structure

```
HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/
├── app.py                 # FastAPI main application
├── config.py              # Configuration (MongoDB, JWT, model paths)
├── schemas.py             # Pydantic models (request/response)
├── predict.py             # Prediction logic (loads model, runs inference)
├── preprocessor.py        # Data preprocessing and feature engineering
├── seed.py                # Database seeding script
├── requirements.txt       # Python dependencies
├── model/                 # Contains model files
│   ├── readmission_model.json
│   ├── feature_columns.json
│   └── label_encoders.pkl
└── frontend/
    └── index.html         # Complete single‑page application
```

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

**Prognexa AI** – *Intelligent healthcare, powered by AI.* 🚀
