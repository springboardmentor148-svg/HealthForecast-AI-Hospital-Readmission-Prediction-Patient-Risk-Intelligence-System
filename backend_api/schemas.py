from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    fullName: str
    email: EmailStr
    mobileNumber: str
    hospitalName: str
    hospitalType: str
    ownershipType: str
    hospitalContact: str
    hospitalAddress: str
    department: Optional[str] = None
    userRole: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    fullName: str
    email: str
    mobileNumber: str
    hospitalName: str
    hospitalType: str
    ownershipType: str
    hospitalContact: str
    hospitalAddress: str
    department: Optional[str]
    userRole: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PredictionCreate(BaseModel):
    patientName: Optional[str] = None
    prediction: int
    result: str
    confidence: str
    riskLevel: str
    message: Optional[str] = None

class PredictionResponse(BaseModel):
    id: int
    patientName: Optional[str]
    prediction: int
    result: str
    confidence: str
    riskLevel: str
    message: Optional[str]
    createdAt: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    email: Optional[EmailStr] = None
    mobileNumber: Optional[str] = None
    department: Optional[str] = None
    hospitalName: Optional[str] = None
    hospitalType: Optional[str] = None
    ownershipType: Optional[str] = None
    hospitalContact: Optional[str] = None
    hospitalAddress: Optional[str] = None

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    condition: str
    admissionDate: Optional[str] = None
    dischargeDate: Optional[str] = None
    lastVisit: Optional[str] = None
    riskLevel: str
    readmissionProbability: Optional[str] = None
    confidence: Optional[str] = None
    medicalHistory: Optional[List[str]] = None
    contactNumber: Optional[str] = None
    address: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactNumber: Optional[str] = None
    bloodGroup: Optional[str] = None
    admittingDepartment: Optional[str] = None
    allergies: Optional[str] = None
    currentMedications: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    patientId: str
    name: str
    age: int
    gender: str
    condition: str
    admissionDate: Optional[str]
    dischargeDate: Optional[str]
    lastVisit: Optional[str]
    riskLevel: str
    readmissionProbability: Optional[str]
    confidence: Optional[str]
    medicalHistory: List[str] = []
    contactNumber: Optional[str]
    address: Optional[str]
    emergencyContactName: Optional[str]
    emergencyContactNumber: Optional[str]
    bloodGroup: Optional[str]
    admittingDepartment: Optional[str]
    allergies: Optional[str]
    currentMedications: Optional[str]

    class Config:
        from_attributes = True


class TreatmentCreate(BaseModel):
    patientId: str
    treatmentPlan: str
    startDate: Optional[str] = None
    effectiveness: str
    recoveryTrend: str
    adherence: Optional[str] = None

class TreatmentResponse(BaseModel):
    id: int
    patientId: str
    name: str
    treatment: str
    startDate: Optional[str]
    effectiveness: str
    recoveryTrend: str
    adherence: Optional[str]

    class Config:
        from_attributes = True


class CareRecommendationResponse(BaseModel):
    id: str
    name: str
    riskLevel: str
    recommendation: Optional[str]
    followUp: Optional[str]
    status: str

class CareRecommendationGenerate(BaseModel):
    patientId: str


# ================= System Admin: User Management =================

class AdminUserResponse(BaseModel):
    id: int
    fullName: str
    email: str
    mobileNumber: str
    hospitalName: str
    userRole: str
    department: Optional[str] = None
    isActive: bool
    createdAt: datetime

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    users: List[AdminUserResponse]
    total: int


class InviteUserRequest(BaseModel):
    fullName: str
    email: EmailStr
    mobileNumber: str
    hospitalName: str
    hospitalType: str
    ownershipType: str
    hospitalContact: str
    hospitalAddress: str
    department: Optional[str] = None
    userRole: str
    password: str


class UpdateUserRoleRequest(BaseModel):
    userRole: str


class ActivateDeactivateResponse(BaseModel):
    id: int
    isActive: bool
    message: str


class AdminUserUpdateRequest(BaseModel):
    fullName: str
    email: EmailStr
    mobileNumber: str


# ================= System Admin: Datasets =================

class DatasetResponse(BaseModel):
    id: int
    name: str
    records: int
    sizeLabel: str
    status: str
    notes: Optional[str] = None
    uploadedBy: str
    lastUpdated: str


class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    totalDatasets: int
    totalStorageBytes: int
    activeDatasets: int


# ================= System Admin: AI Models =================

class ModelVersionResponse(BaseModel):
    id: int
    version: str
    trainedOn: str
    accuracy: str
    precision: str
    recall: str
    rocAuc: str
    status: str
    date: str


class ModelOverviewResponse(BaseModel):
    versions: List[ModelVersionResponse]
    latestAccuracy: str
    latestPrecision: str
    latestRecall: str
    latestRocAuc: str
    deployedVersion: str


class RetrainRequest(BaseModel):
    trainedOn: Optional[str] = None


# ================= System Admin: Settings =================

class PlatformConfigRequest(BaseModel):
    platformName: str
    supportEmail: EmailStr
    environment: str
    maintenanceMode: bool
    apiRateLimit: int


class PlatformConfigResponse(PlatformConfigRequest):
    pass


class AlertThresholdsRequest(BaseModel):
    uptimeThreshold: float
    failedLoginThreshold: int
    errorRateThreshold: float
    criticalAlertEmail: bool


class AlertThresholdsResponse(AlertThresholdsRequest):
    pass


class NotificationPrefsRequest(BaseModel):
    notifyNewUser: bool
    notifySecurityEvent: bool
    notifySystemHealth: bool
    notifyWeeklyDigest: bool


class NotificationPrefsResponse(NotificationPrefsRequest):
    pass


class AuditReportConfigRequest(BaseModel):
    auditExportFormat: str
    auditRetention: str
    autoExportMonthly: bool


class AuditReportConfigResponse(AuditReportConfigRequest):
    pass


class PrivacyConfigRequest(BaseModel):
    dataRetention: str
    allowDataExportRequests: bool


class PrivacyConfigResponse(PrivacyConfigRequest):
    pass


class AppearanceConfigRequest(BaseModel):
    defaultTheme: str
    compactLayout: bool


class AppearanceConfigResponse(AppearanceConfigRequest):
    pass


class RolePermissionsRequest(BaseModel):
    permissions: dict  # { "Doctor": { "View Predictions": true, ... }, ... }


class RolePermissionsResponse(BaseModel):
    permissions: dict


class TwoFactorRequest(BaseModel):
    enabled: bool


class TwoFactorResponse(BaseModel):
    enabled: bool


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


class ChangePasswordResponse(BaseModel):
    message: str


# ================= System Admin: Overview =================

class RecentUserItem(BaseModel):
    id: int
    fullName: str
    userRole: str
    isActive: bool
    createdAt: datetime


class RecentPredictionItem(BaseModel):
    id: int
    patientName: Optional[str] = None
    result: str
    riskLevel: str
    createdAt: datetime


class AdminOverviewResponse(BaseModel):
    totalUsers: int
    activeDoctors: int
    predictionsThisWeek: int
    totalPatients: int
    recentUsers: List[RecentUserItem]
    recentPredictions: List[RecentPredictionItem]


# ================= Hospital Administrator =================

class DepartmentCreate(BaseModel):
    name: str
    head_doctor_id: Optional[int] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    head_doctor_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    headDoctorName: Optional[str] = None
    isActive: bool

    class Config:
        from_attributes = True


class HospitalProfileResponse(BaseModel):
    hospitalName: str
    hospitalType: str
    ownershipType: str
    hospitalContact: str
    hospitalAddress: str


class HospitalProfileUpdate(BaseModel):
    hospitalName: Optional[str] = None
    hospitalType: Optional[str] = None
    ownershipType: Optional[str] = None
    hospitalContact: Optional[str] = None
    hospitalAddress: Optional[str] = None


# ================= Hospital Admin: Overview =================

class DepartmentPerformanceItem(BaseModel):
    name: str
    readmissionRate: str
    outcome: str
    status: str


class OverviewAlertItem(BaseModel):
    text: str
    tone: str


class HospitalOverviewResponse(BaseModel):
    totalPatients: int
    readmissionRate: str
    bedOccupancy: str
    departmentsMonitored: int
    departmentPerformance: List[DepartmentPerformanceItem]
    alerts: List[OverviewAlertItem]


# ================= Hospital Admin: Doctors (for department head dropdown) =================

class DoctorOption(BaseModel):
    id: int
    fullName: str


# ================= Hospital Admin: Patient Outcomes =================

class OutcomeSummaryItem(BaseModel):
    label: str
    value: int
    tone: str


class PatientOutcomeItem(BaseModel):
    patientId: str
    name: str
    department: Optional[str] = None
    admitted: Optional[str] = None
    outcome: str
    trend: str
    readmissionRisk: str


class HospitalOutcomesResponse(BaseModel):
    summary: List[OutcomeSummaryItem]
    patients: List[PatientOutcomeItem]


# ================= Hospital Admin: Risk & Readmission Forecast =================

class RiskSummaryItem(BaseModel):
    label: str
    value: str


class DepartmentForecastItem(BaseModel):
    department: str
    patientsScored: int
    highRisk: int
    forecastedReadmission: str
    trend: str


class HospitalRiskForecastResponse(BaseModel):
    summary: List[RiskSummaryItem]
    departmentForecast: List[DepartmentForecastItem]


# ================= Hospital Admin: Treatment Effectiveness =================

class EffectivenessSummaryItem(BaseModel):
    label: str
    value: str
    tone: str


class DepartmentEffectivenessItem(BaseModel):
    department: str
    treatmentsReviewed: int
    goodResponse: str
    avgAdherence: str
    status: str


class HospitalTreatmentEffectivenessResponse(BaseModel):
    summary: List[EffectivenessSummaryItem]
    departmentEffectiveness: List[DepartmentEffectivenessItem]


# ================= Hospital Admin: Population Health =================

class PopulationStatItem(BaseModel):
    label: str
    value: str


class ConditionBreakdownItem(BaseModel):
    condition: str
    patients: int
    avgReadmission: str


class HospitalPopulationHealthResponse(BaseModel):
    stats: List[PopulationStatItem]
    conditionBreakdown: List[ConditionBreakdownItem]


# ================= Hospital Admin: Reports =================

class ReportItem(BaseModel):
    id: int
    title: str
    type: str
    period: str
    generatedBy: str
    status: str
    createdAt: datetime

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    reports: List[ReportItem]
    total: int


class GenerateReportRequest(BaseModel):
    type: Optional[str] = "Performance"


# ================= Generic: User Preferences (key-value, per user) =================

class PreferenceUpdateRequest(BaseModel):
    value: dict


class PreferenceResponse(BaseModel):
    key: str
    value: Optional[dict] = None


# ================= Healthcare Researcher: Dataset Export =================

class ExportLogItem(BaseModel):
    id: int
    datasetKey: str
    datasetName: str
    format: str
    recordCount: int
    createdAt: datetime

    class Config:
        from_attributes = True