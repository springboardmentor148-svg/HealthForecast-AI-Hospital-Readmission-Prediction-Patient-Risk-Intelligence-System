import sqlite3

conn = sqlite3.connect("hospital.db")

cursor = conn.cursor()

cursor.execute("DELETE FROM prediction_history")

conn.commit()

conn.close()

print("✅ Prediction history deleted successfully.")