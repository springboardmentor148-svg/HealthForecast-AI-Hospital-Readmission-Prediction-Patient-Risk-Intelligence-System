import sqlite3

# Connect to SQLite database
conn = sqlite3.connect("hospital.db")

cursor = conn.cursor()

# =====================================
# Patients Table
# =====================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS patients (

    patient_id TEXT PRIMARY KEY,

    patient_name TEXT NOT NULL,

    gender TEXT NOT NULL,

    age TEXT NOT NULL,

    weight TEXT NOT NULL,

    admission_type TEXT NOT NULL,

    diagnosis TEXT NOT NULL,

    treatment TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")

# =====================================
# Prediction History Table
# =====================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS prediction_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    patient_id TEXT,

    patient_name TEXT,

    prediction TEXT,

    confidence TEXT,

    recommendation TEXT,

    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(patient_id) REFERENCES patients(patient_id)

)
""")

conn.commit()
conn.close()

print("✅ hospital.db created successfully!")
print("✅ patients table created successfully!")
print("✅ prediction_history table created successfully!")