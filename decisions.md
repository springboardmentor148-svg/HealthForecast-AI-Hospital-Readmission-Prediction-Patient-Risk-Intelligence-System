# Preprocessing Decisions

- Removed `weight` (~97% missing values).
- Removed `max_glu_serum` (~95% missing values).
- Removed `A1Cresult` (~83% missing values).
- Removed `medical_specialty` (~49% missing values).
- Removed `payer_code` (~40% missing values).
- Converted `readmitted` to binary:
  - `<30` → 1
  - `>30` and `NO` → 0
- Removed identifier columns:
  - `encounter_id`
  - `patient_nbr`