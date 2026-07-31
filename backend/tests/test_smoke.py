"""End-to-end role and workflow smoke tests using a disposable SQLite database."""
import os
import tempfile

database_file = tempfile.NamedTemporaryFile(prefix="healthforecast-test-", suffix=".sqlite", delete=False)
database_file.close()
os.unlink(database_file.name)
os.environ["DATABASE_URL"] = f"sqlite:///{database_file.name}"
os.environ["DATA_PATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/diabetic_data.csv"))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import main as seed_database  # noqa: E402


def setup_module():
    seed_database()


def login(client: TestClient, email: str):
    response = client.post("/api/auth/login", json={"email": email, "password": "Demo123!"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_role_scoped_patient_prediction_export_and_administration():
    client = TestClient(app)
    doctor_headers = login(client, "doctor@healthforecast.local")
    patients = client.get("/api/patients", headers=doctor_headers)
    assert patients.status_code == 200
    assert len(patients.json()) == 30

    patient = patients.json()[0]
    detail = client.get(f"/api/patients/{patient['id']}", headers=doctor_headers)
    assert detail.status_code == 200
    encounter_id = detail.json()["encounters"][0]["encounter_id"]
    prediction = client.post(f"/api/predictions/{encounter_id}", headers=doctor_headers)
    assert prediction.status_code == 200
    assert 0 <= prediction.json()["probability"] <= 1
    care_plan = client.post(
        f"/api/patients/{patient['id']}/care-plans",
        headers=doctor_headers,
        json={"recommendation": "Call patient after discharge and review medications.", "follow_up_status": "Scheduled", "notes": "Educational demo"},
    )
    assert care_plan.status_code == 200
    assert client.get(f"/api/patients/{patient['id']}/care-plans", headers=doctor_headers).json()[0]["follow_up_status"] == "Scheduled"
    assert client.get("/api/patients/high-risk", headers=doctor_headers).status_code == 200

    assert client.get("/api/reports/research.csv", headers=doctor_headers).status_code == 403
    researcher_headers = login(client, "researcher@healthforecast.local")
    export = client.get("/api/reports/research.csv", headers=researcher_headers)
    assert export.status_code == 200
    assert "patient_nbr" not in export.text.splitlines()[0]
    assert client.get("/api/analytics/medications", headers=researcher_headers).status_code == 200
    assert client.get("/api/analytics/performance", headers=researcher_headers).status_code == 200

    system_headers = login(client, "system@healthforecast.local")
    assert client.get("/api/users", headers=system_headers).status_code == 200
    models = client.get("/api/models", headers=system_headers)
    assert models.status_code == 200
    assert client.post(f"/api/models/{models.json()[0]['id']}/activate", headers=system_headers).status_code == 200
    assert client.get("/api/assignments", headers=system_headers).status_code == 200

    administrator_headers = login(client, "admin@healthforecast.local")
    assert client.get("/api/reports/operations.csv", headers=administrator_headers).status_code == 200
