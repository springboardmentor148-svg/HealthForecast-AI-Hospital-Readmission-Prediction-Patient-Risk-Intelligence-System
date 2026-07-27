import React, { useState } from 'react';
import {
  Brain,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Building2,
  Stethoscope,
  ShieldCheck,
  FlaskConical,
  Settings,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import type { UserRole, RegisterRequest } from '../types/api';

/* ── Role config ──────────────────────────────────────────────────── */
interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}

const ROLES: RoleOption[] = [
  {
    value: 'doctor',
    label: 'Doctor',
    description: 'Clinical staff managing patient care',
    Icon: Stethoscope,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    value: 'hospital_administrator',
    label: 'Hospital Administrator',
    description: 'Operations & administrative oversight',
    Icon: Building2,
    color: '#14B8A6',
    bg: 'rgba(20,184,166,0.08)',
  },
  {
    value: 'healthcare_researcher',
    label: 'Healthcare Researcher',
    description: 'Clinical research & data analysis',
    Icon: FlaskConical,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    value: 'system_administrator',
    label: 'System Administrator',
    description: 'Platform configuration & user management',
    Icon: Settings,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
  },
];

/* ── Form state ──────────────────────────────────────────────────── */
interface FormState {
  full_name: string;
  email: string;
  role: UserRole | '';
  hospital_name: string;
  department: string;
  phone: string;
  password: string;
  confirm_password: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  role?: string;
  password?: string;
  confirm_password?: string;
}

/* ── Helpers ──────────────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
  if (!form.email.trim()) {
    errs.email = 'Email address is required.';
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errs.email = 'Please enter a valid email address.';
  }
  if (!form.role) errs.role = 'Please select your role.';
  if (!form.password) {
    errs.password = 'Password is required.';
  } else if (form.password.length < 8) {
    errs.password = 'Password must be at least 8 characters.';
  }
  if (!form.confirm_password) {
    errs.confirm_password = 'Please confirm your password.';
  } else if (form.password !== form.confirm_password) {
    errs.confirm_password = 'Passwords do not match.';
  }
  return errs;
}

/* ── Component ────────────────────────────────────────────────────── */
const Register: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    full_name: '',
    email: '',
    role: '',
    hospital_name: '',
    department: '',
    phone: '',
    password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ── Handlers ─────────────────────────────────────────────────── */
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    // clear field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const selectRole = (role: UserRole) => {
    setForm((prev) => ({ ...prev, role }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterRequest = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role as UserRole,
        ...(form.hospital_name.trim() && { hospital_name: form.hospital_name.trim() }),
        ...(form.department.trim() && { department: form.department.trim() }),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      };

      await authApi.register(payload);
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Account created successfully! Please sign in.' },
      });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      const message =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.detail ||
        apiErr?.message ||
        'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Derived ──────────────────────────────────────────────────── */
  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { level: 'Weak', color: '#EF4444', width: '33%' };
    if (score <= 3) return { level: 'Fair', color: '#F59E0B', width: '60%' };
    return { level: 'Strong', color: '#10B981', width: '100%' };
  })();

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-body)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--bg-card)',
          borderRadius: 20,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* ── Card Header ─────────────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #1E40AF 50%, var(--color-secondary) 100%)',
            padding: '32px 40px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Pattern overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Brain size={22} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700 }}>HealthForecast AI</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Create your account</h1>
            <p style={{ fontSize: 14, opacity: 0.82 }}>
              Join thousands of healthcare professionals using AI-powered insights.
            </p>
          </div>
        </div>

        {/* ── Card Body ────────────────────────────────────────────── */}
        <div style={{ padding: '36px 40px 40px' }}>
          {/* API error */}
          {apiError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 24,
                color: 'var(--color-danger)',
                fontSize: 14,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Full Name ──────────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Name <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Dr. Jane Smith"
                  value={form.full_name}
                  onChange={set('full_name')}
                  disabled={isLoading}
                  style={{ paddingLeft: 40 }}
                />
              </div>
              {errors.full_name && <span className="form-error">{errors.full_name}</span>}
            </div>

            {/* ── Email ─────────────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email Address <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="jane@hospital.org"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  disabled={isLoading}
                  style={{ paddingLeft: 40 }}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* ── Role Selector ─────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label">
                Role <span className="form-required">*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ROLES.map(({ value, label, description, Icon, color, bg }) => {
                  const isSelected = form.role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectRole(value)}
                      disabled={isLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: isSelected ? `1.5px solid ${color}` : '1.5px solid var(--border-color)',
                        background: isSelected ? bg : 'var(--bg-input)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isSelected ? bg : 'var(--bg-hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: isSelected ? `1px solid ${color}30` : '1px solid var(--border-color)',
                        }}
                      >
                        <Icon size={16} color={isSelected ? color : 'var(--text-muted)'} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isSelected ? color : 'var(--text-primary)',
                            lineHeight: 1.3,
                          }}
                        >
                          {label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                          {description}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          size={16}
                          color={color}
                          style={{ marginLeft: 'auto', flexShrink: 0 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.role && <span className="form-error">{errors.role}</span>}
            </div>

            {/* ── Hospital & Department (row) ───────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-hospital">Hospital Name</label>
                <div style={{ position: 'relative' }}>
                  <Building2
                    size={16}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                  />
                  <input
                    id="reg-hospital"
                    type="text"
                    className="form-input"
                    placeholder="City General"
                    value={form.hospital_name}
                    onChange={set('hospital_name')}
                    disabled={isLoading}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-dept">Department</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck
                    size={16}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                  />
                  <input
                    id="reg-dept"
                    type="text"
                    className="form-input"
                    placeholder="Cardiology"
                    value={form.department}
                    onChange={set('department')}
                    disabled={isLoading}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
            </div>

            {/* ── Phone ─────────────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={set('phone')}
                  disabled={isLoading}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* ── Password ──────────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  disabled={isLoading}
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength meter */}
              {form.password && passwordStrength && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, background: 'var(--border-color)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: passwordStrength.width,
                        background: passwordStrength.color,
                        borderRadius: 9999,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 500, marginTop: 4, display: 'block' }}>
                    {passwordStrength.level} password
                  </span>
                </div>
              )}

              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {/* ── Confirm Password ──────────────────────────────── */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                Confirm Password <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={set('confirm_password')}
                  autoComplete="new-password"
                  disabled={isLoading}
                  style={{
                    paddingLeft: 40,
                    paddingRight: 44,
                    borderColor:
                      form.confirm_password && form.password === form.confirm_password
                        ? '#10B981'
                        : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

                {/* Match indicator */}
                {form.confirm_password && form.password === form.confirm_password && (
                  <CheckCircle2
                    size={16}
                    color="#10B981"
                    style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                )}
              </div>
              {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
            </div>

            {/* ── Submit ────────────────────────────────────────── */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner"
                    style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* ── Footer ────────────────────────────────────────────── */}
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
