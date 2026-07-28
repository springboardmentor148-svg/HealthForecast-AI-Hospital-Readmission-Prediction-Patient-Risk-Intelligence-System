export const RACE_OPTIONS = ["Caucasian", "AfricanAmerican", "Hispanic", "Asian", "Other", "nan"];
export const GENDER_OPTIONS = ["Female", "Male"];
export const AGE_OPTIONS = [
  "[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)",
  "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)",
];

export const ADMISSION_TYPE_OPTIONS = [
  { value: 1, label: "1 · Emergency" },
  { value: 2, label: "2 · Urgent" },
  { value: 3, label: "3 · Elective" },
  { value: 4, label: "4 · Newborn" },
  { value: 5, label: "5 · Not available" },
  { value: 6, label: "6 · NULL" },
  { value: 7, label: "7 · Trauma center" },
  { value: 8, label: "8 · Not mapped" },
];

export const DISCHARGE_DISPOSITION_OPTIONS = [
  { value: 1, label: "1 · Discharged to home" },
  { value: 2, label: "2 · Transferred to another facility" },
  { value: 3, label: "3 · Transferred to SNF" },
  { value: 6, label: "6 · Home health service" },
  { value: 11, label: "11 · Expired" },
  { value: 22, label: "22 · Transferred to rehab facility" },
];

export const ADMISSION_SOURCE_OPTIONS = [
  { value: 1, label: "1 · Physician referral" },
  { value: 2, label: "2 · Clinic referral" },
  { value: 4, label: "4 · Transfer from hospital" },
  { value: 6, label: "6 · Transfer from another facility" },
  { value: 7, label: "7 · Emergency room" },
  { value: 17, label: "17 · Not available" },
];

export const GLU_SERUM_OPTIONS = ["nan", "Norm", ">200", ">300"];
export const A1C_OPTIONS = ["nan", "Norm", ">7", ">8"];
export const DOSAGE_OPTIONS = ["No", "Steady", "Up", "Down"];
export const YES_NO_OPTIONS = ["No", "Yes"];
export const CHANGE_OPTIONS = ["No", "Ch"];

export const SINGLE_MED_FIELDS = [
  "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
  "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
  "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
  "examide", "citoglipton", "insulin",
];

export const COMBO_MED_FIELDS = [
  "glyburide-metformin", "glipizide-metformin", "glimepiride-pioglitazone",
  "metformin-rosiglitazone", "metformin-pioglitazone",
];

export const DEFAULT_FEATURES = {
  race: "Caucasian", gender: "Female", age: "[50-60)",
  admission_type_id: 1, discharge_disposition_id: 1, admission_source_id: 7,
  time_in_hospital: 3, num_lab_procedures: 40, num_procedures: 0, num_medications: 12,
  number_outpatient: 0, number_emergency: 0, number_inpatient: 0,
  diag_1: "250", diag_2: "nan", diag_3: "nan", number_diagnoses: 5,
  max_glu_serum: "nan", A1Cresult: "nan",
  ...Object.fromEntries(SINGLE_MED_FIELDS.map((f) => [f, "No"])),
  ...Object.fromEntries(COMBO_MED_FIELDS.map((f) => [f, "No"])),
  change: "No", diabetesMed: "Yes",
};

export function fieldLabel(key) {
  return key
    .replace(/-/g, " + ")
    .replace(/_/g, " ")
    .replace(/\bid\b/i, "ID")
    .replace(/^./, (c) => c.toUpperCase());
}
