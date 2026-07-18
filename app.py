from flask import (
    Flask,
    render_template,
    request,
    request,
    redirect,
    url_for,
    session,
    send_file
)
from flask import send_file
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os
import os
import sqlite3
import joblib
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

app = Flask(__name__)
app.secret_key = "healthforecast_secret_key"

# =====================================
# Database Connection
# =====================================

def get_db_connection():

    conn = sqlite3.connect("hospital.db")
    conn.row_factory = sqlite3.Row

    return conn


# =====================================
# Load Saved Model and Encoders
# =====================================

model = joblib.load("xgboost_model.pkl")

label_encoders = joblib.load("label_encoders.pkl")

print("=" * 60)
print("MODEL AND LABEL ENCODERS LOADED SUCCESSFULLY")
print("=" * 60)

for col, encoder in label_encoders.items():
    print(f"{col} -> {list(encoder.classes_)}")


# =====================================
# Selected Features
# =====================================

selected_features = [

    "race",
    "gender",
    "age",
    "weight",
    "admission_type_id",
    "discharge_disposition_id",
    "admission_source_id",
    "time_in_hospital",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_outpatient",
    "number_emergency",
    "number_inpatient",
    "diag_1",
    "diag_2",
    "diag_3",
    "number_diagnoses",
    "max_glu_serum",
    "A1Cresult",
    "insulin",
    "change",
    "diabetesMed"

]


# =====================================
# Dummy Users
# =====================================

users = {

    "doctor": {
        "password": "doctor123",
        "role": "Doctor"
    },

    "admin": {
        "password": "admin123",
        "role": "Administrator"
    }

}


# =====================================
# Home Page
# =====================================

@app.route("/")
def home():

    return render_template("index.html")


# =====================================
# Login
# =====================================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form.get("username")
        password = request.form.get("password")

        if username in users and users[username]["password"] == password:

            session["username"] = username
            session["role"] = users[username]["role"]

            return redirect(url_for("dashboard"))

        return render_template(
            "login.html",
            error="Invalid Username or Password"
        )

    return render_template("login.html")


# =====================================
# Dashboard
# =====================================

@app.route("/dashboard")
def dashboard():

    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()

    total_patients = conn.execute(
        "SELECT COUNT(*) FROM patients"
    ).fetchone()[0]

    total_predictions = conn.execute(
        "SELECT COUNT(*) FROM prediction_history"
    ).fetchone()[0]

    high_risk = conn.execute(
        "SELECT COUNT(*) FROM prediction_history WHERE prediction='High Risk'"
    ).fetchone()[0]

    not_high_risk = conn.execute(
        "SELECT COUNT(*) FROM prediction_history WHERE prediction='Not High Risk'"
    ).fetchone()[0]

    recent_predictions = conn.execute("""
        SELECT
            patient_name,
            prediction,
            confidence
        FROM prediction_history
        ORDER BY id DESC
        LIMIT 5
    """).fetchall()

    conn.close()

    return render_template(
        "dashboard.html",
        username=session["username"],
        role=session["role"],
        total_patients=total_patients,
        total_predictions=total_predictions,
        high_risk=high_risk,
        not_high_risk=not_high_risk,
        recent_predictions=recent_predictions
    )
# =====================================
# Patient Records Page
# =====================================

@app.route("/patient_records")
def patient_records():

    if "username" not in session:
        return redirect(url_for("login"))

    return render_template("patient_records.html")


# =====================================
# Save Patient
# =====================================

@app.route("/save_patient", methods=["POST"])
def save_patient():

    if "username" not in session:
        return redirect(url_for("login"))

    patient_id = request.form.get("patient_id")
    patient_name = request.form.get("patient_name")
    gender = request.form.get("gender")
    age = request.form.get("age")
    weight = request.form.get("weight")
    admission_type = request.form.get("admission_type")
    diagnosis = request.form.get("diagnosis")
    treatment = request.form.get("treatment")

    conn = get_db_connection()

    try:

        conn.execute(
            """
            INSERT INTO patients
            (
                patient_id,
                patient_name,
                gender,
                age,
                weight,
                admission_type,
                diagnosis,
                treatment
            )
            VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                patient_id,
                patient_name,
                gender,
                age,
                weight,
                admission_type,
                diagnosis,
                treatment
            )
        )

        conn.commit()

    except sqlite3.IntegrityError:

        conn.close()

        return render_template(
            "patient_records.html",
            error="Patient ID already exists."
        )

    conn.close()

    return redirect(url_for("view_patients"))


# =====================================
# View Patients
# =====================================

@app.route("/view_patients")
def view_patients():

    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()

    patients = conn.execute(
        """
        SELECT *
        FROM patients
        ORDER BY patient_id
        """
    ).fetchall()

    conn.close()

    return render_template(
        "view_patients.html",
        patients=patients
    )


# =====================================
# Delete Patient
# =====================================

@app.route("/delete_patient/<patient_id>")
def delete_patient(patient_id):

    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()

    conn.execute(
        "DELETE FROM patients WHERE patient_id=?",
        (patient_id,)
    )

    conn.commit()

    conn.close()

    return redirect(url_for("view_patients"))
# =====================================
# Prediction Page
# =====================================

@app.route("/predict")
def predict():

    if "username" not in session:
        return redirect(url_for("login"))

    return render_template("predict.html")
# =====================================
# Prediction Result
# =====================================

@app.route("/result", methods=["POST"])
def result():

    if "username" not in session:
        return redirect(url_for("login"))

    # ----------------------------
    # Collect Form Data
    # ----------------------------

    data = {}

    for feature in selected_features:
        data[feature] = request.form.get(feature)

    df = pd.DataFrame([data])

    print("\n========== INPUT DATA ==========")
    print(df.T)

    # ----------------------------
    # Numeric Columns
    # ----------------------------

    numeric_columns = [

        "admission_type_id",
        "discharge_disposition_id",
        "admission_source_id",
        "time_in_hospital",
        "num_lab_procedures",
        "num_procedures",
        "num_medications",
        "number_outpatient",
        "number_emergency",
        "number_inpatient",
        "number_diagnoses"

    ]

    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # ----------------------------
    # Encode Categorical Columns
    # ----------------------------

    for col in df.columns:

        if col not in label_encoders:
            continue

        value = str(df.at[0, col]).strip()

        if value not in label_encoders[col].classes_:

            return f"""
            <h2>Encoding Error</h2>

            <b>Column:</b> {col}<br><br>

            <b>Received:</b> {value}<br><br>

            <b>Allowed:</b><br>

            {list(label_encoders[col].classes_)}
            """

        df[col] = label_encoders[col].transform([value])

    # ----------------------------
    # Prediction
    # ----------------------------

    probability = model.predict_proba(df)

    high_probability = probability[0][1]

    threshold = 0.30

    prediction = 1 if high_probability >= threshold else 0

    confidence = round(high_probability * 100, 2)

    high_risk = round(probability[0][1] * 100, 2)

    not_high_risk = round(probability[0][0] * 100, 2)

    if prediction == 1:

        prediction_label = "High Risk"

        risk = "🔴 High Readmission Risk"

        recommendation = (
            "Patient has a HIGH probability of readmission within 30 days. "
            "Immediate follow-up, medication review, diabetic counselling "
            "and continuous monitoring are recommended."
        )

    else:

        prediction_label = "Not High Risk"

        risk = "🟢 Not High Readmission Risk"

        recommendation = (
            "Patient is unlikely to require early readmission. "
            "Continue medication, regular follow-up and healthy lifestyle."
        )

    session["patient_id"] = request.form.get("patient_id", "")
    session["patient_name"] = request.form.get("patient_name", "")
    session["prediction"] = prediction_label
    session["confidence"] = f"{confidence:.2f}"
    session["recommendation"] = recommendation

    conn = get_db_connection()

    conn.execute(
        """
        INSERT INTO prediction_history
        (
            patient_id,
            patient_name,
            prediction,
            confidence,
            recommendation
        )
        VALUES (?,?,?,?,?)
        """,
        (
            request.form.get("patient_id"),
            request.form.get("patient_name"),
            prediction_label,
            f"{confidence:.2f}",
            recommendation
        )
    )

    conn.commit()
    conn.close()

    return render_template(
        "result.html",
        prediction_text=risk,
        original_prediction=prediction_label,
        confidence=f"{confidence:.2f}",
        high_risk=high_risk,
        not_high_risk=not_high_risk,
        recommendation=recommendation
    )
# =====================================
# Prediction History
# =====================================

@app.route("/prediction_history")
def prediction_history():

    if "username" not in session:
        return redirect(url_for("login"))

    search = request.args.get("search", "").strip()

    conn = get_db_connection()

    if search:

        history = conn.execute(
            """
            SELECT *
            FROM prediction_history
            WHERE patient_id LIKE ?
               OR patient_name LIKE ?
            ORDER BY id DESC
            """,
            (f"%{search}%", f"%{search}%")
        ).fetchall()

    else:

        history = conn.execute(
            """
            SELECT *
            FROM prediction_history
            ORDER BY id DESC
            """
        ).fetchall()

    conn.close()

    return render_template(
        "prediction_history.html",
        history=history,
        search=search
    )


# =====================================
# Analytics Dashboard
# =====================================

@app.route("/analytics")
def analytics():

    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()

    total = conn.execute(
        "SELECT COUNT(*) FROM prediction_history"
    ).fetchone()[0]

    high = conn.execute(
        "SELECT COUNT(*) FROM prediction_history WHERE prediction='High Risk'"
    ).fetchone()[0]

    not_high = conn.execute(
        "SELECT COUNT(*) FROM prediction_history WHERE prediction='Not High Risk'"
    ).fetchone()[0]

    conn.close()

    os.makedirs("static/charts", exist_ok=True)

    # Pie Chart
    plt.figure(figsize=(5, 5))
    plt.pie(
        [high, not_high],
        labels=["High Risk", "Not High Risk"],
        autopct="%1.1f%%"
    )
    plt.title("Patient Risk Distribution")
    plt.savefig("static/charts/pie_chart.png")
    plt.close()

    # Bar Chart
    plt.figure(figsize=(5, 5))
    plt.bar(
        ["High Risk", "Not High Risk"],
        [high, not_high]
    )
    plt.title("Patient Risk Distribution")
    plt.savefig("static/charts/bar_chart.png")
    plt.close()

    return render_template(
        "analytics.html",
        total=total,
        high=high,
        not_high=not_high
    )


# =====================================
# Logout
# =====================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("login"))

@app.route("/download_report")
def download_report():

    filename = "HealthForecast_Report.pdf"

    c = canvas.Canvas(filename, pagesize=letter)

    width, height = letter

    # Heading
    c.setFont("Helvetica-Bold", 20)
    c.drawString(160, height - 50, "HealthForecast AI")

    c.setFont("Helvetica-Bold", 15)
    c.drawString(190, height - 75, "Patient Report")

    # Line
    c.line(40, height - 90, width - 40, height - 90)

    # Patient Information
    c.setFont("Helvetica", 12)

    c.drawString(50, height - 130,
                 f"Patient ID : {session.get('patient_id','N/A')}")

    c.drawString(50, height - 155,
                 f"Patient Name : {session.get('patient_name','N/A')}")

    c.drawString(50, height - 180,
                 f"Prediction : {session.get('prediction','N/A')}")

    c.drawString(50, height - 205,
                 f"Confidence : {session.get('confidence','N/A')}%")

    c.drawString(50, height - 230,
                 f"Recommendation : {session.get('recommendation','N/A')}")

    c.save()

    return send_file(
        filename,
        as_attachment=True,
        download_name="HealthForecast_Report.pdf"
    )
# =====================================
# Run Flask Application
# =====================================

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)