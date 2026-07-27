import React, { useState } from 'react';
import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle, CheckSquare, Square, BarChart3, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const tokenResponse = await authApi.login({ email: email.trim(), password });
      await login(tokenResponse.access_token, tokenResponse.refresh_token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      const message =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.detail ||
        apiErr?.message ||
        'Invalid email or password. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Left Panel ───────────────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-content">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Brain size={28} color="white" />
            </div>
            <span className="auth-logo-text">HealthForecast AI</span>
          </div>

          {/* Headline */}
          <h1 className="auth-headline">
            Predict.<br />Prevent.<br />Protect.
          </h1>
          <p className="auth-subline">
            AI-powered 30-day hospital readmission prediction built for modern healthcare teams.
            Identify high-risk patients before they leave the building.
          </p>

          {/* Feature pills */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            {[
              { Icon: Brain,        text: 'Machine-learning risk scoring' },
              { Icon: BarChart3,    text: 'Real-time analytics dashboard' },
              { Icon: ShieldCheck,  text: 'HIPAA-compliant & secure' },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '10px 18px',
                  backdropFilter: 'blur(8px)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <Icon size={17} color="rgba(255,255,255,0.9)" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Right Panel ──────────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-form-container">
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 20,
                color: 'var(--color-danger)',
                fontSize: 14,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email address <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="you@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setRememberMe((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                {rememberMe ? (
                  <CheckSquare size={17} color="var(--color-primary)" />
                ) : (
                  <Square size={17} color="var(--text-muted)" />
                )}
                Remember me
              </button>

              <Link
                to="/forgot-password"
                className="auth-link"
                style={{ fontSize: 13 }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider" style={{ marginTop: 28, marginBottom: 20 }}>or</div>

          {/* Register link */}
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>

          {/* Footer note */}
          <p
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 32,
              lineHeight: 1.6,
            }}
          >
            By signing in you agree to our{' '}
            <span className="auth-link" style={{ fontSize: 12 }}>Terms of Service</span>{' '}
            and{' '}
            <span className="auth-link" style={{ fontSize: 12 }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
