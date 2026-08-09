import { useState } from 'react'
import { TextInput } from './form/TextInput.jsx'
import { NumberInput } from './form/NumberInput.jsx'
import { SelectInput } from './form/SelectInput.jsx'
import { CheckboxInput } from './form/CheckboxInput.jsx'
import { FormSection } from './form/FormSection.jsx'
import { CATEGORY_OPTIONS } from '../data/categoryOptions.js'

export function PredictionForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState(getInitialFormData())
  const [errors, setErrors] = useState({})

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts editing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const requiredFields = [
      'race',
      'gender',
      'age',
      'admission_type_id',
      'discharge_disposition_id',
      'admission_source_id',
      'time_in_hospital',
      'payer_code',
      'medical_specialty',
      'number_diagnoses',
      'change',
      'diabetesMed',
    ]

    requiredFields.forEach((field) => {
      if (formData[field] === '' || formData[field] === null) {
        newErrors[field] = 'This field is required'
      }
    })

    // Validate numeric ranges
    if (formData.age && (formData.age < 0 || formData.age > 120)) {
      newErrors.age = 'Age must be between 0 and 120'
    }
    if (
      formData.time_in_hospital &&
      (formData.time_in_hospital < 1 || formData.time_in_hospital > 365)
    ) {
      newErrors.time_in_hospital =
        'Time in hospital must be between 1 and 365 days'
    }
    if (formData.num_lab_procedures && formData.num_lab_procedures < 0) {
      newErrors.num_lab_procedures = 'Must be a non-negative number'
    }
    if (formData.num_procedures && formData.num_procedures < 0) {
      newErrors.num_procedures = 'Must be a non-negative number'
    }
    if (formData.num_medications && formData.num_medications < 0) {
      newErrors.num_medications = 'Must be a non-negative number'
    }
    if (formData.number_outpatient && formData.number_outpatient < 0) {
      newErrors.number_outpatient = 'Must be a non-negative number'
    }
    if (formData.number_emergency && formData.number_emergency < 0) {
      newErrors.number_emergency = 'Must be a non-negative number'
    }
    if (formData.number_inpatient && formData.number_inpatient < 0) {
      newErrors.number_inpatient = 'Must be a non-negative number'
    }
    if (formData.number_diagnoses && formData.number_diagnoses < 1) {
      newErrors.number_diagnoses = 'Must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleReset = () => {
    setFormData(getInitialFormData())
    setErrors({})
  }

  return (
    <form className="prediction-form" onSubmit={handleSubmit}>
      {error && <div className="form-error-banner">{error}</div>}

      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <TextInput
          label="Patient Name (optional)"
          name="patientName"
          value={formData.patientName}
          onChange={handleChange}
          placeholder="e.g., Rahul Sharma"
          helpText="For your reference only — not used by the prediction model"
        />
      </div>

      <FormSection title="Patient Information" description="Basic demographics">
        <div className="form-row">
          <SelectInput
            label="Race"
            name="race"
            value={formData.race}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.race}
            error={errors.race}
            required
          />
          <SelectInput
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.gender}
            error={errors.gender}
            required
          />
          <NumberInput
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min={0}
            max={120}
            error={errors.age}
            required
          />
        </div>

        <div className="form-row">
          <NumberInput
            label="Number of Diagnoses"
            name="number_diagnoses"
            value={formData.number_diagnoses}
            onChange={handleChange}
            min={1}
            max={15}
            error={errors.number_diagnoses}
            required
          />
        </div>
      </FormSection>

      <FormSection title="Admission Details" description="Hospital admission information">
        <div className="form-row">
          <SelectInput
            label="Admission Type"
            name="admission_type_id"
            value={formData.admission_type_id}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.admission_type_id}
            error={errors.admission_type_id}
            required
          />
          <SelectInput
            label="Admission Source"
            name="admission_source_id"
            value={formData.admission_source_id}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.admission_source_id}
            error={errors.admission_source_id}
            required
          />
          <NumberInput
            label="Time in Hospital (days)"
            name="time_in_hospital"
            value={formData.time_in_hospital}
            onChange={handleChange}
            min={1}
            max={365}
            error={errors.time_in_hospital}
            required
          />
        </div>

        <div className="form-row">
          <SelectInput
            label="Discharge Disposition"
            name="discharge_disposition_id"
            value={formData.discharge_disposition_id}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.discharge_disposition_id}
            error={errors.discharge_disposition_id}
            required
          />
        </div>
      </FormSection>

      <FormSection title="Hospital Information" description="Hospital and provider details">
        <div className="form-row">
          <SelectInput
            label="Medical Specialty"
            name="medical_specialty"
            value={formData.medical_specialty}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.medical_specialty}
            error={errors.medical_specialty}
            required
          />
          <SelectInput
            label="Payer Code"
            name="payer_code"
            value={formData.payer_code}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.payer_code}
            error={errors.payer_code}
            required
          />
        </div>
      </FormSection>

      <FormSection title="Procedures & Laboratory" description="Clinical procedures and testing">
        <div className="form-row">
          <NumberInput
            label="Lab Procedures"
            name="num_lab_procedures"
            value={formData.num_lab_procedures}
            onChange={handleChange}
            min={0}
            error={errors.num_lab_procedures}
          />
          <NumberInput
            label="Procedures"
            name="num_procedures"
            value={formData.num_procedures}
            onChange={handleChange}
            min={0}
            error={errors.num_procedures}
          />
          <NumberInput
            label="Medications"
            name="num_medications"
            value={formData.num_medications}
            onChange={handleChange}
            min={0}
            error={errors.num_medications}
          />
        </div>

        <div className="form-row">
          <NumberInput
            label="Outpatient Visits (Prior)"
            name="number_outpatient"
            value={formData.number_outpatient}
            onChange={handleChange}
            min={0}
            error={errors.number_outpatient}
          />
          <NumberInput
            label="Emergency Visits (Prior)"
            name="number_emergency"
            value={formData.number_emergency}
            onChange={handleChange}
            min={0}
            error={errors.number_emergency}
          />
          <NumberInput
            label="Inpatient Visits (Prior)"
            name="number_inpatient"
            value={formData.number_inpatient}
            onChange={handleChange}
            min={0}
            error={errors.number_inpatient}
          />
        </div>
      </FormSection>

      <FormSection title="Diagnosis" description="Primary and secondary diagnoses">
        <div className="form-row">
          <TextInput
            label="Primary Diagnosis (ICD-9)"
            name="diag_1"
            value={formData.diag_1}
            onChange={handleChange}
            placeholder="e.g., 250, 284, 401"
            helpText="Numeric diagnosis code"
            error={errors.diag_1}
          />
          <TextInput
            label="Secondary Diagnosis (ICD-9)"
            name="diag_2"
            value={formData.diag_2}
            onChange={handleChange}
            placeholder="e.g., 261, 296, 78"
            helpText="Numeric diagnosis code"
            error={errors.diag_2}
          />
          <TextInput
            label="Tertiary Diagnosis (ICD-9)"
            name="diag_3"
            value={formData.diag_3}
            onChange={handleChange}
            placeholder="e.g., 252, 86, 250"
            helpText="Numeric diagnosis code"
            error={errors.diag_3}
          />
        </div>
      </FormSection>

      <FormSection title="Medication" description="Antidiabetic medications administered">
        <div className="medications-grid">
          <CheckboxInput
            label="Metformin"
            name="metformin"
            value={formData.metformin}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Repaglinide"
            name="repaglinide"
            value={formData.repaglinide}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Nateglinide"
            name="nateglinide"
            value={formData.nateglinide}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Chlorpropamide"
            name="chlorpropamide"
            value={formData.chlorpropamide}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Glimepiride"
            name="glimepiride"
            value={formData.glimepiride}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Glipizide"
            name="glipizide"
            value={formData.glipizide}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Glyburide"
            name="glyburide"
            value={formData.glyburide}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Tolbutamide"
            name="tolbutamide"
            value={formData.tolbutamide}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Pioglitazone"
            name="pioglitazone"
            value={formData.pioglitazone}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Rosiglitazone"
            name="rosiglitazone"
            value={formData.rosiglitazone}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Acarbose"
            name="acarbose"
            value={formData.acarbose}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Miglitol"
            name="miglitol"
            value={formData.miglitol}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Tolazamide"
            name="tolazamide"
            value={formData.tolazamide}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Insulin"
            name="insulin"
            value={formData.insulin}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Glyburide-Metformin"
            name="glyburide-metformin"
            value={formData['glyburide-metformin']}
            onChange={handleChange}
          />
          <CheckboxInput
            label="Glipizide-Metformin"
            name="glipizide-metformin"
            value={formData['glipizide-metformin']}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <SelectInput
            label="Medication Change During Visit"
            name="change"
            value={formData.change}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.change}
            error={errors.change}
            required
          />
          <SelectInput
            label="Diabetes Medication During Visit"
            name="diabetesMed"
            value={formData.diabetesMed}
            onChange={handleChange}
            options={CATEGORY_OPTIONS.diabetesMed}
            error={errors.diabetesMed}
            required
          />
        </div>
      </FormSection>

      <div className="form-actions">
        <button
          type="button"
          className="btn-reset"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset Form
        </button>
        <button
          type="submit"
          className="btn-predict"
          disabled={isLoading}
        >
          {isLoading ? 'Predicting...' : 'Predict Readmission Risk'}
        </button>
      </div>
    </form>
  )
}

function getInitialFormData() {
  return {
    patientName: '',
    race: '',
    gender: '',
    age: '',
    admission_type_id: '',
    discharge_disposition_id: '',
    admission_source_id: '',
    time_in_hospital: '',
    payer_code: '',
    medical_specialty: '',
    num_lab_procedures: '',
    num_procedures: '',
    num_medications: '',
    number_outpatient: '',
    number_emergency: '',
    number_inpatient: '',
    diag_1: '',
    diag_2: '',
    diag_3: '',
    number_diagnoses: '',
    metformin: 0,
    repaglinide: 0,
    nateglinide: 0,
    chlorpropamide: 0,
    glimepiride: 0,
    glipizide: 0,
    glyburide: 0,
    tolbutamide: 0,
    pioglitazone: 0,
    rosiglitazone: 0,
    acarbose: 0,
    miglitol: 0,
    tolazamide: 0,
    insulin: 0,
    'glyburide-metformin': 0,
    'glipizide-metformin': 0,
    change: '',
    diabetesMed: '',
  }
}