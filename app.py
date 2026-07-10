from flask import Flask, render_template, request, redirect, url_for, session
import pandas as pd
import joblib
import sqlite3
import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import send_file

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

model = joblib.load("random_forest_model.pkl")
label_encoders = joblib.load("label_encoders.pkl")
target_encoder = joblib.load("label_encoder.pkl")

selected_features = [

    "race",
    "gender",
    "age",
    "weight",
    "admission_type_id",
    "time_in_hospital",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_diagnoses",
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
# Login Page
# =====================================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        if username in users and users[username]["password"] == password:

            session["username"] = username
            session["role"] = users[username]["role"]

            return redirect(url_for("dashboard"))

        return render_template(
            "login.html",
            error="Invalid Username or Password"
        )

    return render_template("login.html")


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
        "SELECT COUNT(*) FROM prediction_history WHERE prediction='<30'"
    ).fetchone()[0]

    low_risk = conn.execute(
        "SELECT COUNT(*) FROM prediction_history WHERE prediction='NO'"
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
        low_risk=low_risk,
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

    patient_id = request.form["patient_id"]
    patient_name = request.form["patient_name"]
    gender = request.form["gender"]
    age = request.form["age"]
    weight = request.form["weight"]
    admission_type = request.form["admission_type"]
    diagnosis = request.form["diagnosis"]
    treatment = request.form["treatment"]

    conn = get_db_connection()

    try:

        conn.execute("""

        INSERT INTO patients(

            patient_id,
            patient_name,
            gender,
            age,
            weight,
            admission_type,
            diagnosis,
            treatment

        )

        VALUES(?,?,?,?,?,?,?,?)

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

        ))

        conn.commit()

    except sqlite3.IntegrityError:

        conn.close()

        return "Patient ID already exists."

    conn.close()

    return redirect(url_for("dashboard"))
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

    data = {}

    # Get all form data
    for feature in selected_features:
        data[feature] = request.form.get(feature)

    # Convert to DataFrame
    df = pd.DataFrame([data])

    # Numeric Columns
    numeric_columns = [
        "admission_type_id",
        "time_in_hospital",
        "num_lab_procedures",
        "num_procedures",
        "num_medications",
        "number_diagnoses"
    ]

    for col in numeric_columns:
        df[col] = df[col].astype(int)

    # Encode categorical columns
    for col in df.columns:

        if col in label_encoders:

            df[col] = label_encoders[col].transform(
                df[col].astype(str)
            )

    # Prediction
    prediction = model.predict(df)

    # Prediction Probability
    probability = model.predict_proba(df)

    confidence = max(probability[0]) * 100

    # Decode Prediction
    prediction = target_encoder.inverse_transform(prediction)

    prediction_label = prediction[0]

    # Recommendation

    if prediction_label == "<30":

        risk = "🔴 High Readmission Risk"

        recommendation = (
            "Patient has a high probability of readmission "
            "within 30 days. Immediate follow-up, medication "
            "review, diabetic counselling and continuous "
            "monitoring are recommended."
        )

    elif prediction_label == ">30":

        risk = "🟡 Moderate Readmission Risk"

        recommendation = (
            "Patient may require readmission after 30 days. "
            "Regular follow-up visits, medication adherence "
            "and healthy lifestyle monitoring are recommended."
        )

    else:



        risk = "🟢 Low Readmission Risk"

        recommendation = (
            "Patient is unlikely to be readmitted. "
            "Continue routine medical care, prescribed "
            "medication and healthy lifestyle."
        )

    # Save latest prediction for PDF
    session["patient_id"] = request.form.get("patient_id", "")
    session["patient_name"] = request.form.get("patient_name", "")
    session["prediction"] = prediction_label
    session["confidence"] = f"{confidence:.2f}"
    session["recommendation"] = recommendation

    conn = get_db_connection()
    patient_id = request.form.get("patient_id", "")
    patient_name = request.form.get("patient_name", "")

    conn.execute("""
    INSERT INTO prediction_history(
        patient_id,
        patient_name,
        prediction,
        confidence,
        recommendation
    )
    VALUES(?,?,?,?,?)
    """, (
        patient_id,
        patient_name,
        prediction_label,
        f"{confidence:.2f}",
        recommendation
    ))

    conn.commit()
    conn.close()
    return render_template(

        "result.html",

        prediction_text=risk,

        original_prediction=prediction_label,

        confidence=f"{confidence:.2f}",

        recommendation=recommendation

    )


# =====================================
# View Patients
# =====================================

@app.route("/view_patients")
def view_patients():

    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()

    patients = conn.execute(

        "SELECT * FROM patients ORDER BY patient_id"

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
# Prediction History
# =====================================
@app.route("/prediction_history")
def prediction_history():

    if "username" not in session:
        return redirect(url_for("login"))

    search = request.args.get("search", "")

    conn = get_db_connection()

    if search:

        history = conn.execute("""

        SELECT *
        FROM prediction_history

        WHERE patient_name LIKE ?
        OR patient_id LIKE ?

        ORDER BY id DESC

        """, (f"%{search}%", f"%{search}%")).fetchall()

    else:

        history = conn.execute("""

        SELECT *
        FROM prediction_history
        ORDER BY id DESC

        """).fetchall()

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

    history = conn.execute("""
        SELECT prediction
        FROM prediction_history
    """).fetchall()

    conn.close()

    high = 0
    moderate = 0
    low = 0

    for row in history:

        if row["prediction"] == "<30":
            high += 1

        elif row["prediction"] == ">30":
            moderate += 1

        else:
            low += 1

    total = high + moderate + low

    # -------------------------------
    # Generate Pie Chart
    # -------------------------------

    labels = ["High Risk", "Moderate Risk", "Low Risk"]
    values = [high, moderate, low]

    plt.figure(figsize=(6, 6))

    plt.pie(
        values,
        labels=labels,
        autopct="%1.1f%%",
        startangle=90
    )

    plt.title("Patient Readmission Risk Distribution")

    chart_path = os.path.join("static", "charts", "pie_chart.png")

    plt.savefig(chart_path)

    plt.close()
    # -------------------------------
    # Generate Bar Chart
    # -------------------------------

    plt.figure(figsize=(7, 5))

    categories = ["High", "Moderate", "Low"]
    counts = [high, moderate, low]

    plt.bar(categories, counts)

    plt.title("Patient Risk Count")
    plt.xlabel("Risk Level")
    plt.ylabel("Number of Patients")

    bar_chart_path = os.path.join("static", "charts", "bar_chart.png")

    plt.savefig(bar_chart_path)

    plt.close()
    return render_template(
        "analytics.html",
        total=total,
        high=high,
        moderate=moderate,
        low=low
    )
# =====================================
# Download Patient Report
# =====================================

@app.route("/download_report")
def download_report():

    if "username" not in session:
        return redirect(url_for("login"))

    pdf_name = "Patient_Report.pdf"

    c = canvas.Canvas(pdf_name, pagesize=letter)

    width, height = letter

    c.setFont("Helvetica-Bold", 20)
    c.drawString(150, height-60, "HealthForecast AI")

    c.setFont("Helvetica", 14)
    c.drawString(120, height-90,
                 "Hospital Readmission Prediction Report")

    y = height - 140

    c.drawString(60, y,
                 f"Patient ID : {session.get('patient_id','')}")

    y -= 30

    c.drawString(60, y,
                 f"Patient Name : {session.get('patient_name','')}")

    y -= 30

    c.drawString(60, y,
                 f"Prediction : {session.get('prediction','')}")

    y -= 30

    c.drawString(60, y,
                 f"Confidence : {session.get('confidence','')} %")

    y -= 30

    c.drawString(60, y,
                 "Recommendation :")

    y -= 25

    text = c.beginText(60, y)

    text.textLines(session.get("recommendation",""))

    c.drawText(text)

    c.save()

    return send_file(pdf_name, as_attachment=True)




# =====================================
# Logout
# =====================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("login"))


# =====================================
# Run Application
# =====================================

if __name__ == "__main__":

    app.run(debug=True)