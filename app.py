from flask import Flask, render_template, request
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load("notebooks/readmission_model.pkl")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    values = [float(x) for x in request.form.values()]
    features = np.array(values).reshape(1,-1)

    prediction = model.predict(features)

    if prediction[0] == 1:
        result = "Patient is likely to be Readmitted"
    else:
        result = "Patient is Not likely to be Readmitted"

    return render_template('index.html', prediction_text=result)

if __name__ == "__main__":
    app.run(debug=True)