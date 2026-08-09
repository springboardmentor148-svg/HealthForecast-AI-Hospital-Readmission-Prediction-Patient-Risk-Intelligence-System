// Category options extracted from the training dataset
// Format: { value, label } — value backend/model ko jata hai, label UI me dikhta hai

export const CATEGORY_OPTIONS = {
  // Alphabetical encoding assumption (common with sklearn LabelEncoder)
  race: [
    { value: '0', label: '? (Unknown)' },
    { value: '1', label: 'African American' },
    { value: '2', label: 'Asian' },
    { value: '3', label: 'Caucasian' },
    { value: '4', label: 'Hispanic' },
  ],

  gender: [
    { value: '0', label: 'Female' },
    { value: '1', label: 'Male' },
    { value: '2', label: 'Unknown/Invalid' },
  ],

  // Official Diabetes 130-US Hospitals dataset IDs (documented, reliable)
  admission_type_id: [
    { value: '1', label: 'Emergency' },
    { value: '2', label: 'Urgent' },
    { value: '3', label: 'Elective' },
    { value: '5', label: 'Not Available' },
    { value: '6', label: 'NULL' },
    { value: '7', label: 'Trauma Center' },
    { value: '8', label: 'Not Mapped' },
  ],

  admission_source_id: [
    { value: '1', label: 'Physician Referral' },
    { value: '2', label: 'Clinic Referral' },
    { value: '3', label: 'HMO Referral' },
    { value: '4', label: 'Transfer from a hospital' },
    { value: '5', label: 'Transfer from a Skilled Nursing Facility (SNF)' },
    { value: '6', label: 'Transfer from another health care facility' },
    { value: '7', label: 'Emergency Room' },
    { value: '8', label: 'Court/Law Enforcement' },
    { value: '9', label: 'Not Available' },
    { value: '10', label: 'Transfer from critical access hospital' },
    { value: '11', label: 'Normal Delivery' },
    { value: '12', label: 'Premature Delivery' },
    { value: '13', label: 'Sick Baby' },
    { value: '14', label: 'Extramural Birth' },
    { value: '15', label: 'Not Available' },
    { value: '17', label: 'NULL' },
    { value: '25', label: 'Transfer from Ambulatory Surgery Center' },
  ],

  discharge_disposition_id: [
    { value: '1', label: 'Discharged to home' },
    { value: '2', label: 'Discharged/transferred to another short term hospital' },
    { value: '3', label: 'Discharged/transferred to SNF' },
    { value: '4', label: 'Discharged/transferred to ICF' },
    { value: '5', label: 'Discharged/transferred to another type of inpatient care institution' },
    { value: '6', label: 'Discharged/transferred to home with home health service' },
    { value: '8', label: 'Discharged/transferred to home under care of Home IV provider' },
    { value: '13', label: 'Hospice / home' },
    { value: '14', label: 'Hospice / medical facility' },
    { value: '15', label: 'Discharged/transferred within this institution to Medicare approved swing bed' },
    { value: '16', label: 'Discharged/transferred/referred another institution for outpatient services' },
    { value: '17', label: 'Discharged/transferred/referred to this institution for outpatient services' },
    { value: '18', label: 'NULL' },
    { value: '19', label: 'Expired at home. Medicaid only, hospice' },
    { value: '20', label: 'Expired in a medical facility. Medicaid only, hospice' },
    { value: '21', label: 'Expired, place unknown. Medicaid only, hospice' },
    { value: '22', label: 'Discharged/transferred to another rehab facility' },
    { value: '24', label: 'Discharged/transferred to a nursing facility certified for Medicaid' },
    { value: '25', label: 'Not Mapped' },
    { value: '26', label: 'Unknown/Invalid' },
    { value: '27', label: 'Discharged/transferred to federal health care facility' },
    { value: '28', label: 'Discharged/transferred/referred to a psychiatric hospital' },
    { value: '29', label: 'Discharged/transferred to a Critical Access Hospital (CAH)' },
    { value: '30', label: 'Discharged/transferred to another Type of Health Care Institution' },
    { value: '31', label: 'Discharged/transferred to a long term care hospital' },
    { value: '32', label: 'Discharged/transferred to a nursing facility not certified' },
    { value: '33', label: 'Discharged/transferred to a psychiatric hospital' },
  ],

  // ⚠️ Ye 2 fields verify karna padega backend/training script se —
  // abhi placeholder labels hain, exact order guarantee nahi hai.
  payer_code: [
    { value: '0', label: 'Payer Code 0 (verify from backend)' },
    { value: '1', label: 'Payer Code 1 (verify from backend)' },
    { value: '2', label: 'Payer Code 2 (verify from backend)' },
    { value: '3', label: 'Payer Code 3 (verify from backend)' },
    { value: '4', label: 'Payer Code 4 (verify from backend)' },
    { value: '5', label: 'Payer Code 5 (verify from backend)' },
    { value: '6', label: 'Payer Code 6 (verify from backend)' },
    { value: '7', label: 'Payer Code 7 (verify from backend)' },
    { value: '8', label: 'Payer Code 8 (verify from backend)' },
    { value: '9', label: 'Payer Code 9 (verify from backend)' },
    { value: '10', label: 'Payer Code 10 (verify from backend)' },
    { value: '11', label: 'Payer Code 11 (verify from backend)' },
    { value: '12', label: 'Payer Code 12 (verify from backend)' },
    { value: '14', label: 'Payer Code 14 (verify from backend)' },
    { value: '15', label: 'Payer Code 15 (verify from backend)' },
    { value: '16', label: 'Payer Code 16 (verify from backend)' },
    { value: '17', label: 'Payer Code 17 (verify from backend)' },
  ],

  medical_specialty: Array.from({ length: 72 }, (_, i) => ({
    value: String(i + 1),
    label: `Specialty ${i + 1} (verify from backend)`,
  })),

  change: [
    { value: '0', label: 'No Change' },
    { value: '1', label: 'Changed' },
  ],

  diabetesMed: [
    { value: '0', label: 'No' },
    { value: '1', label: 'Yes' },
  ],
}