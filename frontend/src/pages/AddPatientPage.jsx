import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";
import { createPatient } from "../services/patientsApi.js";
import { TextInput } from "../components/form/TextInput.jsx";
import { NumberInput } from "../components/form/NumberInput.jsx";
import { SelectInput } from "../components/form/SelectInput.jsx";
import { FormSection } from "../components/form/FormSection.jsx";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const RISK_OPTIONS = [
  { value: "High", label: "High" },
  { value: "Low", label: "Low" },
];

const initialFormData = {
  name: "",
  age: "",
  gender: "Male",
  condition: "",
  admissionDate: "",
  dischargeDate: "",
  lastVisit: "",
  riskLevel: "Low",
  readmissionProbability: "",
  confidence: "",
  medicalHistory: "",
  contactNumber: "",
  address: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  bloodGroup: "",
  admittingDepartment: "",
  allergies: "",
  currentMedications: "",
};

export function AddPatientPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.age || !formData.condition) {
      setError("Please fill in name, age, and condition.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        condition: formData.condition,
        admissionDate: formData.admissionDate,
        dischargeDate: formData.dischargeDate,
        lastVisit: formData.lastVisit,
        riskLevel: formData.riskLevel,
        readmissionProbability: formData.readmissionProbability,
        confidence: formData.confidence,
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split("\n").filter(Boolean)
          : [],
        contactNumber: formData.contactNumber,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        bloodGroup: formData.bloodGroup,
        admittingDepartment: formData.admittingDepartment,
        allergies: formData.allergies,
        currentMedications: formData.currentMedications,
      };

      await createPatient(payload);
      navigate("/app/doctor/patients");
    } catch (err) {
      setError(err?.message || "Failed to add patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <button
        type="button"
        className="secondary-button"
        style={{ marginBottom: "16px" }}
        onClick={() => navigate("/app/doctor/patients")}
      >
        <FaArrowLeft /> Back to My Patients
      </button>

      <h2>Add New Patient</h2>
      <p>Enter patient details to add them to your care list</p>

      <form className="prediction-form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        <FormSection title="Patient Information" description="Basic demographics and condition">
          <div className="form-row">
            <TextInput
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., A. Johnson"
              required
            />
            <NumberInput
              label="Age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min={0}
              max={120}
              required
            />
            <SelectInput
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={GENDER_OPTIONS}
              required
            />
          </div>

          <div className="form-row">
            <TextInput
              label="Condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              placeholder="e.g., Type 2 Diabetes"
              required
            />
            <SelectInput
              label="Risk Level"
              name="riskLevel"
              value={formData.riskLevel}
              onChange={handleChange}
              options={RISK_OPTIONS}
              required
            />
          </div>
        </FormSection>

        <FormSection title="Visit Details" description="Admission and follow-up dates">
          <div className="form-row">
            <TextInput
              label="Admission Date"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleChange}
              placeholder="e.g., 18 Jul 2026"
            />
            <TextInput
              label="Discharge Date"
              name="dischargeDate"
              value={formData.dischargeDate}
              onChange={handleChange}
              placeholder="e.g., 24 Jul 2026"
            />
            <TextInput
              label="Last Visit"
              name="lastVisit"
              value={formData.lastVisit}
              onChange={handleChange}
              placeholder="e.g., 24 Jul 2026"
            />
          </div>
        </FormSection>

        <FormSection title="Contact & Emergency Info" description="How to reach the patient or their contact">
          <div className="form-row">
            <TextInput
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="e.g., 9876543210"
            />
            <TextInput
              label="Blood Group"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              placeholder="e.g., O+"
            />
          </div>
          <div className="form-row">
            <TextInput
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 MG Road, Pune"
            />
          </div>
          <div className="form-row">
            <TextInput
              label="Emergency Contact Name"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
              placeholder="e.g., Sunita Johnson"
            />
            <TextInput
              label="Emergency Contact Number"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              placeholder="e.g., 9876500000"
            />
          </div>
        </FormSection>

        <FormSection title="Clinical Details" description="Department, allergies, and current medications">
          <div className="form-row">
            <TextInput
              label="Admitting Department"
              name="admittingDepartment"
              value={formData.admittingDepartment}
              onChange={handleChange}
              placeholder="e.g., Cardiology"
            />
          </div>
          <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
            <label className="access-field">
              <span>Allergies</span>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={(e) => handleChange("allergies", e.target.value)}
                rows={2}
                placeholder="e.g., Penicillin, Peanuts"
                style={{ width: "100%", padding: "10px 12px", fontFamily: "inherit" }}
              />
            </label>
          </div>
          <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
            <label className="access-field">
              <span>Current Medications</span>
              <textarea
                name="currentMedications"
                value={formData.currentMedications}
                onChange={(e) => handleChange("currentMedications", e.target.value)}
                rows={2}
                placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
                style={{ width: "100%", padding: "10px 12px", fontFamily: "inherit" }}
              />
            </label>
          </div>
        </FormSection>

        <FormSection title="Risk Metrics" description="Model output for this patient">
          <div className="form-row">
            <TextInput
              label="Readmission Probability"
              name="readmissionProbability"
              value={formData.readmissionProbability}
              onChange={handleChange}
              placeholder="e.g., 78%"
            />
            <TextInput
              label="Confidence"
              name="confidence"
              value={formData.confidence}
              onChange={handleChange}
              placeholder="e.g., 91%"
            />
          </div>
        </FormSection>

        <FormSection title="Medical History" description="One entry per line">
          <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
            <label className="access-field">
              <span>Medical History</span>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) => handleChange("medicalHistory", e.target.value)}
                rows={4}
                placeholder={"Diagnosed with Type 2 Diabetes in 2019\nHospitalized for hyperglycemia in March 2026"}
                style={{ width: "100%", padding: "10px 12px", fontFamily: "inherit" }}
              />
            </label>
          </div>
        </FormSection>

        <div className="form-actions">
          <button
            type="button"
            className="btn-reset"
            onClick={() => navigate("/app/doctor/patients")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn-predict" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add Patient"}
          </button>
        </div>
      </form>
    </section>
  );
}