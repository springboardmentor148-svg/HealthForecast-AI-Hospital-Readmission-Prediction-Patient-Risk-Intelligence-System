import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from "../services/authApi.js"
import {
  FaArrowRight,
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaHospital,
  FaBriefcaseMedical,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserDoctor,
  FaUserGear,
  FaFlask,
  FaHeartPulse,
  FaUserGroup,
  FaLocationDot,
  FaBuilding,
  FaCheck,
} from 'react-icons/fa6'
import "../styles/RegisterPage.css";

const roles = [
  { id: 'Doctor', label: 'Doctor', icon: FaUserDoctor },
  { id: 'Hospital Administrator', label: 'Hospital Admin', icon: FaHospital },
  { id: 'Healthcare Researcher', label: 'Researcher', icon: FaFlask },
  { id: 'System Administrator', label: 'System Admin', icon: FaUserGear },
]

const departments = [
  'Cardiology',
  'Endocrinology',
  'General Surgery',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Oncology',
  'Radiology',
  'Emergency Medicine',
  'Internal Medicine',
  'Gynecology & Obstetrics',
  'Psychiatry',
  'Dermatology',
  'ENT (Ear, Nose, Throat)',
  'Urology',
  'Nephrology',
  'Pulmonology',
  'Gastroenterology',
  'Anesthesiology',
  'Pathology',
]

const hospitalTypes = [
  'General Hospital',
  'Multi-Specialty Hospital',
  'Super-Specialty Hospital',
  'Teaching / University Hospital',
  'Specialty Clinic / Hospital',
  'Community Hospital',
  'District / Regional Hospital',
  'Rehabilitation Hospital',
  'Psychiatric Hospital',
  'Critical Access Hospital',
]

const ownershipTypes = [
  'Government / Public Hospital',
  'Private Hospital',
  'Trust / Charitable Hospital',
  'Corporate Chain Hospital',
]

const steps = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Hospital Info' },
  { id: 3, label: 'Role & Department' },
  { id: 4, label: 'Security' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    hospitalName: '',
    hospitalType: '',
    ownershipType: '',
    hospitalContact: '',
    hospitalAddress: '',
    department: '',
    userRole: 'Doctor',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleRoleSelect = (roleId) => {
    setFormData((prev) => ({
      ...prev,
      userRole: roleId,
      department: roleId === 'Doctor' ? prev.department : '',
    }))
  }

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.mobileNumber) {
        setError('Please fill in all personal details.')
        return false
      }
    }

    if (step === 2) {
      if (
        !formData.hospitalName ||
        !formData.hospitalType ||
        !formData.ownershipType ||
        !formData.hospitalContact ||
        !formData.hospitalAddress
      ) {
        setError('Please fill in all hospital details.')
        return false
      }
    }

    if (step === 3) {
      if (formData.userRole === 'Doctor' && !formData.department) {
        setError('Please select a department.')
        return false
      }
    }

    setError('')
    return true
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    const next = Math.min(currentStep + 1, steps.length)
    setCurrentStep(next)
    setMaxStepReached((prev) => Math.max(prev, next))
  }

  const handleBack = () => {
    setError('')
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleStepClick = (stepId) => {
    if (stepId > maxStepReached) return
    setError('')
    setCurrentStep(stepId)
  }

  const handleSubmit = async (event) => {
  event.preventDefault()

  if (!validateStep(4)) return

  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match.')
    return
  }
  if (formData.password.length < 8) {
    setError('Password must be at least 8 characters.')
    return
  }

  setError('')

  try {
    await registerUser({
      fullName: formData.fullName,
      email: formData.email,
      mobileNumber: formData.mobileNumber,
      hospitalName: formData.hospitalName,
      hospitalType: formData.hospitalType,
      ownershipType: formData.ownershipType,
      hospitalContact: formData.hospitalContact,
      hospitalAddress: formData.hospitalAddress,
      department: formData.userRole === 'Doctor' ? formData.department : null,
      userRole: formData.userRole,
      password: formData.password,
    })

    navigate('/login')
  } catch (err) {
    setError(err.message)
  }
}
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-visual-top">
          <div className="auth-logo-row">
            <span className="auth-logo-mark" aria-hidden="true">
              <FaHeartPulse />
            </span>
            <div>
              <div className="auth-logo-name">HealthForecastAI</div>
              <div className="auth-logo-tag">Clinical Decision Support</div>
            </div>
          </div>

          <span className="auth-badge">ROLE-BASED ONBOARDING</span>

          <h1 className="auth-visual-headline">
            Give every clinician the right access, instantly.
          </h1>
          <p className="auth-visual-copy">
            Add doctors, admins, and researchers to your workspace and route
            each one to the right dashboard automatically.
          </p>

          <div className="auth-stat-row">
            <div className="auth-stat">
              <span className="auth-stat-value">4 roles</span>
              <span className="auth-stat-label">access levels</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">&lt; 2 min</span>
              <span className="auth-stat-label">setup per user</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">Real-time</span>
              <span className="auth-stat-label">directory sync</span>
            </div>
          </div>

          <div className="auth-illustration" aria-hidden="true">
            <FaUserGroup />
          </div>
        </div>

        <div className="auth-visual-bottom">
          <div className="auth-live-row">
            <span className="auth-live-dot" />
            <span>Live enrollment</span>
          </div>
          <svg className="auth-chart" viewBox="0 0 400 60" preserveAspectRatio="none">
            <path
              className="auth-chart-line"
              d="M0,45 C40,40 60,20 100,25 C140,30 160,10 200,15 C240,20 260,35 300,28 C340,22 360,8 400,12"
              fill="none"
            />
          </svg>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-inner">
          <span className="auth-eyebrow">NEW ACCOUNT ACCESS</span>
          <h2 className="auth-heading">Create your account</h2>

          <div className="auth-stepper">
            <div className="auth-stepper-track">
              {steps.map((step, index) => (
                <div key={step.id} className="auth-stepper-track-item">
                  <button
                    type="button"
                    className={`auth-stepper-node ${
                      currentStep === step.id
                        ? 'is-active'
                        : currentStep > step.id
                        ? 'is-done'
                        : ''
                    } ${step.id <= maxStepReached ? 'is-clickable' : ''}`}
                    disabled={step.id > maxStepReached}
                    onClick={() => handleStepClick(step.id)}
                  >
                    {currentStep > step.id ? <FaCheck /> : step.id}
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={`auth-stepper-line ${
                        currentStep > step.id ? 'is-done' : ''
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="auth-stepper-labels">
              {steps.map((step) => (
                <span
                  key={step.id}
                  className={`auth-stepper-label ${
                    currentStep === step.id ? 'is-active' : ''
                  }`}
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* STEP 1 - Personal Info */}
            {currentStep === 1 && (
              <div className="auth-grid-2">
                <label className="auth-field">
                  <span>Full Name</span>
                  <div className="auth-input-wrap">
                    <FaUser className="auth-input-icon" aria-hidden="true" />
                    <input value={formData.fullName} onChange={update('fullName')} placeholder="Dr. Ananya Sharma" required />
                  </div>
                </label>

                <label className="auth-field">
                  <span>Email address</span>
                  <div className="auth-input-wrap">
                    <FaEnvelope className="auth-input-icon" aria-hidden="true" />
                    <input type="email" value={formData.email} onChange={update('email')} placeholder="doctor@hospital.org" required />
                  </div>
                </label>

                <label className="auth-field auth-field-full">
                  <span>Mobile Number</span>
                  <div className="auth-input-wrap">
                    <FaPhone className="auth-input-icon" aria-hidden="true" />
                    <input value={formData.mobileNumber} onChange={update('mobileNumber')} placeholder="+91 98765 43210" required />
                  </div>
                </label>
              </div>
            )}

            {/* STEP 2 - Hospital Info */}
            {currentStep === 2 && (
              <div className="auth-grid-2">
                <label className="auth-field">
                  <span>Hospital Name</span>
                  <div className="auth-input-wrap">
                    <FaHospital className="auth-input-icon" aria-hidden="true" />
                    <input value={formData.hospitalName} onChange={update('hospitalName')} placeholder="City Care Hospital" required />
                  </div>
                </label>

                <label className="auth-field">
                  <span>Hospital Type</span>
                  <div className="auth-input-wrap">
                    <FaBuilding className="auth-input-icon" aria-hidden="true" />
                    <select value={formData.hospitalType} onChange={update('hospitalType')} required>
                      <option value="">Select Hospital Type</option>
                      {hospitalTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="auth-field">
                  <span>Ownership Type</span>
                  <div className="auth-input-wrap">
                    <FaHospital className="auth-input-icon" aria-hidden="true" />
                    <select value={formData.ownershipType} onChange={update('ownershipType')} required>
                      <option value="">Select Ownership Type</option>
                      {ownershipTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="auth-field">
                  <span>Hospital Contact Number</span>
                  <div className="auth-input-wrap">
                    <FaPhone className="auth-input-icon" aria-hidden="true" />
                    <input value={formData.hospitalContact} onChange={update('hospitalContact')} placeholder="+91 22 4567 8900" required />
                  </div>
                </label>

                <label className="auth-field auth-field-full">
                  <span>Hospital Address</span>
                  <div className="auth-input-wrap">
                    <FaLocationDot className="auth-input-icon" aria-hidden="true" />
                    <input value={formData.hospitalAddress} onChange={update('hospitalAddress')} placeholder="221 MG Road, Mumbai, Maharashtra" required />
                  </div>
                </label>
              </div>
            )}

            {/* STEP 3 - Role & Department */}
            {currentStep === 3 && (
              <div>
                <div className="auth-role-group">
                  <span className="auth-role-label">User Role</span>
                  <div className="auth-chip-row" role="radiogroup" aria-label="User role">
                    {roles.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={formData.userRole === id}
                        className={`auth-chip${formData.userRole === id ? ' auth-chip-active' : ''}`}
                        onClick={() => handleRoleSelect(id)}
                      >
                        <Icon aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.userRole === 'Doctor' && (
                  <label className="auth-field" style={{ marginTop: '18px' }}>
                    <span>Department</span>
                    <div className="auth-input-wrap">
                      <FaBriefcaseMedical className="auth-input-icon" aria-hidden="true" />
                      <select value={formData.department} onChange={update('department')} required>
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* STEP 4 - Security */}
            {currentStep === 4 && (
              <div className="auth-grid-2">
                <label className="auth-field">
                  <span>Password</span>
                  <div className="auth-input-wrap">
                    <FaLock className="auth-input-icon" aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={update('password')}
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </label>

                <label className="auth-field">
                  <span>Confirm Password</span>
                  <div className="auth-input-wrap">
                    <FaLock className="auth-input-icon" aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={update('confirmPassword')}
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                </label>
              </div>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="auth-step-actions">
              {currentStep > 1 && (
                <button type="button" className="auth-back-button" onClick={handleBack}>
                  <FaArrowLeft aria-hidden="true" /> Back
                </button>
              )}

              {currentStep < steps.length ? (
                <button type="button" className="auth-submit" onClick={handleNext}>
                  Next <FaArrowRight aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className="auth-submit">
                  Create account <FaArrowRight aria-hidden="true" />
                </button>
              )}
            </div>
          </form>

          <p className="auth-footer-note">
            Already have an account? <Link to="/login">Login</Link>
          </p>
          <p className="auth-trust-line">Encrypted access · Enterprise-grade security</p>
        </div>
      </section>
    </main>
  )
}