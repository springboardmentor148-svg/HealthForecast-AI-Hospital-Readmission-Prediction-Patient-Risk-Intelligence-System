from __future__ import annotations

import re
from decimal import Decimal
from decimal import InvalidOperation
from typing import Any

import pandas as pd

from ..extensions import db
from ..models import AdmissionType, Gender, Patient, RiskBand


class PatientCSVImporter:
    """
    Importer class that handles CSV reading, validation, previewing, and database insertion.
    Matches the schema of the HealthForecast Patient Import Template.
    """

    REQUIRED_COLUMNS = {
        "patient_identifier",
        "first_name",
        "last_name",
        "gender",
        "admission_type",
        "primary_diagnosis",
    }

    OPTIONAL_COLUMNS = {
        "age_at_admission",
        "secondary_diagnosis",
        "time_in_hospital",
        "lab_procedures_count",
        "prior_diagnoses_count",
        "admission_source_id",
        "discharge_disposition_id",
        "medications",
        "number_inpatient",
        "number_emergency",
        "number_outpatient",
        "num_procedures",
        "num_medications",
        "diag_3",
        "additional_diagnosis",
        "diagnosis_3",
        "a1c_result",
        "A1Cresult",
        "max_glu_serum",
        "insulin_usage",
        "insulin",
    }

    ALL_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS

    def __init__(self, batch_size: int = 500):
        self.batch_size = batch_size

    @staticmethod
    def _canonicalize_diag_3(value: Any) -> str | None:
        if value is None or value == "":
            return None
        cleaned = str(value).strip()
        if not cleaned:
            return None
        if re.fullmatch(r"\d+(?:\.\d+)?", cleaned):
            try:
                normalized = Decimal(cleaned).normalize()
            except InvalidOperation:
                return cleaned
            text = format(normalized, "f")
            return text.rstrip("0").rstrip(".") if "." in text else text
        return cleaned

    @staticmethod
    def _parse_nonnegative_int(value: Any, field_name: str, row_num: int, validation_errors: list[dict[str, Any]]) -> int | None | str:
        if value is None or str(value).strip() == "":
            return None
        try:
            parsed = int(float(str(value).strip()))
        except ValueError:
            validation_errors.append({
                "row": row_num,
                "reason": f"Invalid {field_name} '{value}'. Must be a non-negative integer.",
            })
            return "__invalid__"
        if parsed < 0:
            validation_errors.append({
                "row": row_num,
                "reason": f"Invalid {field_name} '{value}'. Must be a non-negative integer.",
            })
            return "__invalid__"
        return parsed

    def validate_csv(self, file_stream) -> dict[str, Any]:
        """
        Parses and validates the CSV file without committing any changes to the database.
        Returns preview statistics, validation errors, and a list of valid rows for UI display.
        """
        try:
            # Load CSV using pandas
            df = pd.read_csv(file_stream)
        except Exception as exc:
            return {
                "success": False,
                "error": f"Invalid CSV file format: {exc!s}",
            }

        if df.empty:
            return {
                "success": False,
                "error": "Empty CSV",
            }

        # Check required columns
        missing_cols = self.REQUIRED_COLUMNS - set(df.columns)
        if missing_cols:
            return {
                "success": False,
                "error": f"Missing required columns: {sorted(list(missing_cols))}",
            }

        total_rows = len(df)
        valid_rows = []
        validation_errors = []
        duplicate_rows_count = 0
        csv_identifiers = set()

        # Load all existing patient identifiers from the database for fast duplication checks
        existing_identifiers = {
            r[0] for r in db.session.query(Patient.patient_identifier).all()
        }

        for idx, row_series in df.iterrows():
            row_num = idx + 1
            row_dict = {
                k: (None if pd.isna(v) else v)
                for k, v in row_series.to_dict().items()
            }

            # 1. Check patient_identifier presence and format
            identifier_raw = row_dict.get("patient_identifier")
            if identifier_raw is None or str(identifier_raw).strip() == "":
                validation_errors.append({
                    "row": row_num,
                    "reason": "patient_identifier is required",
                })
                continue

            identifier = str(identifier_raw).strip()

            # 2. Check duplicates
            if identifier in existing_identifiers or identifier in csv_identifiers:
                duplicate_rows_count += 1
                continue

            # 3. Check other required fields
            first_name = row_dict.get("first_name")
            if first_name is None or str(first_name).strip() == "":
                validation_errors.append({
                    "row": row_num,
                    "reason": "first_name is required",
                })
                continue

            last_name = row_dict.get("last_name")
            if last_name is None or str(last_name).strip() == "":
                validation_errors.append({
                    "row": row_num,
                    "reason": "last_name is required",
                })
                continue

            primary_diag = row_dict.get("primary_diagnosis")
            if primary_diag is None or str(primary_diag).strip() == "":
                validation_errors.append({
                    "row": row_num,
                    "reason": "primary_diagnosis is required",
                })
                continue

            gender_raw = row_dict.get("gender")
            if gender_raw is None or str(gender_raw).strip() == "":
                validation_errors.append({
                    "row": row_num,
                    "reason": "gender is required",
                })
                continue

            gender_str = str(gender_raw).strip().lower()
            if gender_str in {"male", "m"}:
                gender = Gender.male
            elif gender_str in {"female", "f"}:
                gender = Gender.female
            elif gender_str in {"other", "o"}:
                gender = Gender.other
            elif gender_str in {"unknown", "u"}:
                gender = Gender.unknown
            else:
                validation_errors.append({
                    "row": row_num,
                    "reason": f"Invalid gender value '{gender_raw}'. Must be male, female, other, or unknown.",
                })
                continue

            adm_raw = row_dict.get("admission_type")
            if adm_raw is None or str(adm_raw).strip() == "":
                validation_errors.append({
                    "row": row_num,
                    "reason": "admission_type is required",
                })
                continue

            adm_str = str(adm_raw).strip().lower()
            try:
                # Direct lookup
                adm_type = AdmissionType(adm_str)
            except ValueError:
                validation_errors.append({
                    "row": row_num,
                    "reason": f"Invalid admission_type '{adm_raw}'. Must be emergency, urgent, elective, newborn, trauma, or other.",
                })
                continue

            # Validate optional integer fields
            age = row_dict.get("age_at_admission")
            if age is not None:
                try:
                    age_val = int(float(str(age).strip()))
                    if age_val < 0:
                        raise ValueError
                    age = age_val
                except ValueError:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid age_at_admission '{age}'. Must be a non-negative integer.",
                    })
                    continue

            time_in_hosp = row_dict.get("time_in_hospital")
            if time_in_hosp is not None:
                try:
                    time_val = int(float(str(time_in_hosp).strip()))
                    if time_val < 0:
                        raise ValueError
                    time_in_hosp = time_val
                except ValueError:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid time_in_hospital '{time_in_hosp}'. Must be a non-negative integer.",
                    })
                    continue
            else:
                time_in_hosp = 0

            lab_proc = row_dict.get("lab_procedures_count")
            if lab_proc is not None:
                try:
                    lab_val = int(float(str(lab_proc).strip()))
                    if lab_val < 0:
                        raise ValueError
                    lab_proc = lab_val
                except ValueError:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid lab_procedures_count '{lab_proc}'. Must be a non-negative integer.",
                    })
                    continue
            else:
                lab_proc = 0

            prior_diag = row_dict.get("prior_diagnoses_count")
            if prior_diag is not None:
                try:
                    prior_val = int(float(str(prior_diag).strip()))
                    if prior_val < 0:
                        raise ValueError
                    prior_diag = prior_val
                except ValueError:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid prior_diagnoses_count '{prior_diag}'. Must be a non-negative integer.",
                    })
                    continue
            else:
                prior_diag = 0

            admission_source_id = self._parse_nonnegative_int(row_dict.get("admission_source_id"), "admission_source_id", row_num, validation_errors)
            if admission_source_id == "__invalid__":
                continue

            discharge_disposition_id = self._parse_nonnegative_int(row_dict.get("discharge_disposition_id"), "discharge_disposition_id", row_num, validation_errors)
            if discharge_disposition_id == "__invalid__":
                continue

            number_inpatient = self._parse_nonnegative_int(row_dict.get("number_inpatient"), "number_inpatient", row_num, validation_errors)
            if number_inpatient is None:
                number_inpatient = self._parse_nonnegative_int(row_dict.get("prior_inpatient"), "prior_inpatient", row_num, validation_errors)
            if number_inpatient == "__invalid__":
                continue

            number_emergency = self._parse_nonnegative_int(row_dict.get("number_emergency"), "number_emergency", row_num, validation_errors)
            if number_emergency is None:
                number_emergency = self._parse_nonnegative_int(row_dict.get("prior_emergency"), "prior_emergency", row_num, validation_errors)
            if number_emergency == "__invalid__":
                continue

            number_outpatient = self._parse_nonnegative_int(row_dict.get("number_outpatient"), "number_outpatient", row_num, validation_errors)
            if number_outpatient == "__invalid__":
                continue
            num_procedures = self._parse_nonnegative_int(row_dict.get("num_procedures"), "num_procedures", row_num, validation_errors)
            if num_procedures == "__invalid__":
                continue

            num_medications = self._parse_nonnegative_int(row_dict.get("num_medications", row_dict.get("medications_count")), "num_medications", row_num, validation_errors)
            if num_medications == "__invalid__":
                continue

            diag_3 = self._canonicalize_diag_3(row_dict.get("diag_3", row_dict.get("additional_diagnosis", row_dict.get("diagnosis_3"))))

            a1c_result = row_dict.get("a1c_result", row_dict.get("A1Cresult"))
            if a1c_result is not None:
                a1c_result = str(a1c_result).strip()
                if a1c_result not in {"None", "Normal", "Norm", ">7", ">8"}:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid a1c_result '{a1c_result}'. Must be None, Normal, Norm, >7, or >8.",
                    })
                    continue

            max_glu_serum = row_dict.get("max_glu_serum")
            if max_glu_serum is not None:
                max_glu_serum = str(max_glu_serum).strip()
                if max_glu_serum not in {"None", "Norm", ">200", ">300"}:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid max_glu_serum '{max_glu_serum}'. Must be None, Norm, >200, or >300.",
                    })
                    continue

            insulin_usage = row_dict.get("insulin_usage", row_dict.get("insulin"))
            if insulin_usage is not None:
                insulin_usage = str(insulin_usage).strip()
                if insulin_usage not in {"No", "Steady", "Up", "Down", "Normal"}:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid insulin_usage '{insulin_usage}'. Must be No, Steady, Up, Down, or Normal.",
                    })
                    continue

            # Medications parsing
            meds_raw = row_dict.get("medications")
            meds_list = []
            if meds_raw is not None and str(meds_raw).strip() != "":
                meds_list = [
                    m.strip()
                    for m in str(meds_raw).split(",")
                    if m.strip()
                ]

            csv_identifiers.add(identifier)
            valid_rows.append({
                "patient_identifier": identifier,
                "first_name": str(first_name).strip(),
                "last_name": str(last_name).strip(),
                "gender": gender.value,
                "admission_type": adm_type.value,
                "primary_diagnosis": str(primary_diag).strip(),
                "secondary_diagnosis": (
                    str(row_dict.get("secondary_diagnosis")).strip()
                    if row_dict.get("secondary_diagnosis") is not None
                    else None
                ),
                "age_at_admission": age,
                "time_in_hospital": time_in_hosp,
                "lab_procedures_count": lab_proc,
                "prior_diagnoses_count": prior_diag,
                "admission_source_id": admission_source_id,
                "discharge_disposition_id": discharge_disposition_id,
                "number_inpatient": number_inpatient,
                "number_emergency": number_emergency,
                "number_outpatient": number_outpatient,
                "num_procedures": num_procedures,
                "num_medications": num_medications,
                "diag_3": diag_3,
                "a1c_result": a1c_result,
                "max_glu_serum": max_glu_serum,
                "insulin_usage": insulin_usage,
                "medications": meds_list,
                "row_num": row_num,
            })

        # Calculate invalid rows count
        invalid_rows_count = len(validation_errors)

        # Get preview list (first 5 valid rows)
        preview_list = []
        for r in valid_rows[:5]:
            preview_list.append({
                "patient_identifier": r["patient_identifier"],
                "name": f"{r['first_name']} {r['last_name']}",
                "gender": r["gender"],
                "age": r["age_at_admission"] or "—",
                "admission_type": r["admission_type"],
                "primary_diagnosis": r["primary_diagnosis"],
            })

        return {
            "success": True,
            "total_rows": total_rows,
            "valid_rows_count": len(valid_rows),
            "invalid_rows_count": invalid_rows_count,
            "duplicate_rows_count": duplicate_rows_count,
            "preview_rows": preview_list,
            "validation_errors": validation_errors,
        }

    def import_csv(self, file_stream, assigned_doctor_id: int | None = None) -> dict[str, Any]:
        """
        Validates the CSV and inserts all valid records into the database in batches.
        Resilient: if a batch fails, retries row-by-row for that batch.
        """
        validation_res = self.validate_csv(file_stream)
        if not validation_res.get("success", False):
            return validation_res

        # If there are no valid rows to insert
        total_rows = validation_res["total_rows"]
        duplicate_rows_count = validation_res["duplicate_rows_count"]
        validation_errors = validation_res["validation_errors"]
        
        # Reset stream position and parse using pandas again to map to patient objects
        file_stream.seek(0)
        df = pd.read_csv(file_stream)

        # Build list of Patient models to insert
        # Re-run same parsing to construct active SQLAlchemy Patient objects for valid rows
        existing_identifiers = {
            r[0] for r in db.session.query(Patient.patient_identifier).all()
        }
        patients_to_insert = []
        csv_identifiers = set()

        imported = 0
        failed = 0
        skipped = 0

        for idx, row_series in df.iterrows():
            row_num = idx + 1
            row_dict = {
                k: (None if pd.isna(v) else v)
                for k, v in row_series.to_dict().items()
            }

            identifier_raw = row_dict.get("patient_identifier")
            if identifier_raw is None or str(identifier_raw).strip() == "":
                # already reported in validation_errors
                continue

            identifier = str(identifier_raw).strip()
            if identifier in existing_identifiers or identifier in csv_identifiers:
                skipped += 1
                continue

            # Extract fields (we assume they are valid because validate_csv passed)
            first_name = row_dict.get("first_name")
            last_name = row_dict.get("last_name")
            primary_diag = row_dict.get("primary_diagnosis")
            gender_raw = row_dict.get("gender")
            adm_raw = row_dict.get("admission_type")

            if (
                not first_name
                or not last_name
                or not primary_diag
                or not gender_raw
                or not adm_raw
            ):
                # Skip since it failed mandatory fields check
                failed += 1
                continue

            gender_str = str(gender_raw).strip().lower()
            if gender_str in {"male", "m"}:
                gender = Gender.male
            elif gender_str in {"female", "f"}:
                gender = Gender.female
            elif gender_str in {"other", "o"}:
                gender = Gender.other
            else:
                gender = Gender.unknown

            adm_str = str(adm_raw).strip().lower()
            try:
                adm_type = AdmissionType(adm_str)
            except ValueError:
                adm_type = AdmissionType.other

            # Parse age & numeric counters safely
            def _reject_negative_or_parse(raw_value: Any, field_name: str):
                if raw_value is None or str(raw_value).strip() == "":
                    return None
                try:
                    parsed = int(float(str(raw_value).strip()))
                except ValueError:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid {field_name} '{raw_value}'. Must be a non-negative integer.",
                    })
                    return "__invalid__"
                if parsed < 0:
                    validation_errors.append({
                        "row": row_num,
                        "reason": f"Invalid {field_name} '{raw_value}'. Must be a non-negative integer.",
                    })
                    return "__invalid__"
                return parsed

            age = _reject_negative_or_parse(row_dict.get("age_at_admission"), "age_at_admission")
            if age == "__invalid__":
                failed += 1
                continue

            time_in_hosp = _reject_negative_or_parse(row_dict.get("time_in_hospital"), "time_in_hospital")
            if time_in_hosp == "__invalid__":
                failed += 1
                continue

            lab_proc = _reject_negative_or_parse(row_dict.get("lab_procedures_count"), "lab_procedures_count")
            if lab_proc == "__invalid__":
                failed += 1
                continue

            prior_diag = _reject_negative_or_parse(row_dict.get("prior_diagnoses_count"), "prior_diagnoses_count")
            if prior_diag == "__invalid__":
                failed += 1
                continue

            admission_source_id = _reject_negative_or_parse(row_dict.get("admission_source_id"), "admission_source_id")
            if admission_source_id == "__invalid__":
                failed += 1
                continue

            discharge_disposition_id = _reject_negative_or_parse(row_dict.get("discharge_disposition_id"), "discharge_disposition_id")
            if discharge_disposition_id == "__invalid__":
                failed += 1
                continue

            number_inpatient = _reject_negative_or_parse(row_dict.get("number_inpatient", row_dict.get("prior_inpatient")), "number_inpatient")
            if number_inpatient == "__invalid__":
                failed += 1
                continue

            number_emergency = _reject_negative_or_parse(row_dict.get("number_emergency", row_dict.get("prior_emergency")), "number_emergency")
            if number_emergency == "__invalid__":
                failed += 1
                continue

            number_outpatient = _reject_negative_or_parse(row_dict.get("number_outpatient"), "number_outpatient")
            if number_outpatient == "__invalid__":
                failed += 1
                continue

            num_procedures = _reject_negative_or_parse(row_dict.get("num_procedures"), "num_procedures")
            if num_procedures == "__invalid__":
                failed += 1
                continue

            num_medications = _reject_negative_or_parse(row_dict.get("num_medications", row_dict.get("medications_count")), "num_medications")
            if num_medications == "__invalid__":
                failed += 1
                continue

            diag_3 = self._canonicalize_diag_3(row_dict.get("diag_3", row_dict.get("additional_diagnosis", row_dict.get("diagnosis_3"))))

            a1c_result = row_dict.get("a1c_result", row_dict.get("A1Cresult"))
            if a1c_result is not None:
                a1c_result = str(a1c_result).strip()
                if a1c_result == "":
                    a1c_result = None

            max_glu_serum = row_dict.get("max_glu_serum")
            if max_glu_serum is not None:
                max_glu_serum = str(max_glu_serum).strip()
                if max_glu_serum == "":
                    max_glu_serum = None

            insulin_usage = row_dict.get("insulin_usage", row_dict.get("insulin"))
            if insulin_usage is not None:
                insulin_usage = str(insulin_usage).strip()
                if insulin_usage == "":
                    insulin_usage = None

            meds_raw = row_dict.get("medications")
            meds_list = []
            if meds_raw is not None and str(meds_raw).strip() != "":
                meds_list = [
                    m.strip()
                    for m in str(meds_raw).split(",")
                    if m.strip()
                ]

            try:
                patient = Patient(
                    patient_identifier=identifier,
                    first_name=str(first_name).strip(),
                    last_name=str(last_name).strip(),
                    age_at_admission=age,
                    gender=gender,
                    admission_type=adm_type,
                    primary_diagnosis=str(primary_diag).strip(),
                    secondary_diagnosis=(
                        str(row_dict.get("secondary_diagnosis")).strip()
                        if row_dict.get("secondary_diagnosis") is not None
                        else None
                    ),
                    time_in_hospital=time_in_hosp,
                    lab_procedures_count=lab_proc,
                    prior_diagnoses_count=prior_diag,
                    admission_source_id=admission_source_id,
                    discharge_disposition_id=discharge_disposition_id,
                    number_inpatient=number_inpatient,
                    number_emergency=number_emergency,
                    number_outpatient=number_outpatient,
                    num_procedures=num_procedures,
                    num_medications=num_medications,
                    diag_3=diag_3,
                    a1c_result=a1c_result,
                    max_glu_serum=max_glu_serum,
                    insulin_usage=insulin_usage,
                    medications=meds_list,
                    risk_band=RiskBand.low,
                    readmission_probability=Decimal("0.0"),
                    is_active=True,
                    assigned_doctor_id=assigned_doctor_id,
                )
                patients_to_insert.append((row_num, patient))
                csv_identifiers.add(identifier)
            except Exception as exc:
                failed += 1
                validation_errors.append({
                    "row": row_num,
                    "reason": f"System error mapping row: {exc!s}",
                })

        # Insert in batches of size self.batch_size
        for i in range(0, len(patients_to_insert), self.batch_size):
            batch = patients_to_insert[i : i + self.batch_size]
            batch_objs = [p[1] for p in batch]

            try:
                db.session.bulk_save_objects(batch_objs)
                db.session.commit()
                imported += len(batch)
            except Exception:
                db.session.rollback()
                # Retry row by row in case of db constraint failures
                for row_num, p_obj in batch:
                    try:
                        db.session.add(p_obj)
                        db.session.commit()
                        imported += 1
                    except Exception as row_exc:
                        db.session.rollback()
                        failed += 1
                        validation_errors.append({
                            "row": row_num,
                            "reason": f"Database insertion failure: {row_exc!s}",
                        })

        if imported > 0:
            from .notification_service import broadcast_notification
            broadcast_notification(
                title="📥 Patients Imported",
                message=f"Successfully imported {imported} patients from CSV registry file.",
                notification_type="CSV_IMPORT_COMPLETED",
                related_entity=None,
                related_entity_id=None
            )

        return {
            "success": True,
            "total_rows": total_rows,
            "imported": imported,
            "skipped": skipped,
            "failed": failed,
            "errors": validation_errors,
        }
