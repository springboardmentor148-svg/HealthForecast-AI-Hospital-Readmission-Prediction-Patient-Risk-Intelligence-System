import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowRight,
  FaEnvelope,
  FaHeartPulse,
  FaShieldHalved,
  FaCircleCheck,
} from 'react-icons/fa6'
import "../styles/RegisterPage.css";

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email) {
      setError('Please enter your email address.')
      return
    }

    setError('')
    setSubmitted(true)
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

          <span className="auth-badge">ACCOUNT RECOVERY</span>

          <h1 className="auth-visual-headline">
            Losing access shouldn't slow down patient care.
          </h1>
          <p className="auth-visual-copy">
            Reset your password in a few seconds and get straight back to
            monitoring risk, outcomes, and reports.
          </p>

          <div className="auth-stat-row">
            <div className="auth-stat">
              <span className="auth-stat-value">Secure</span>
              <span className="auth-stat-label">reset link</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">&lt; 1 min</span>
              <span className="auth-stat-label">to reset</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">24/7</span>
              <span className="auth-stat-label">account access</span>
            </div>
          </div>

          <div className="auth-illustration" aria-hidden="true">
            <FaShieldHalved />
          </div>
        </div>

        <div className="auth-visual-bottom">
          <div className="auth-live-row">
            <span className="auth-live-dot" />
            <span>Encrypted request</span>
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
          <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
          <h2 className="auth-heading">Reset your password</h2>

          {!submitted ? (
            <>
              <p style={{ fontSize: '13.5px', color: 'var(--auth-ink-soft)', margin: '0 0 18px' }}>
                Enter your email and we will show a reset link in this demo flow.
              </p>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <label className="auth-field">
                  <span>Email</span>
                  <div className="auth-input-wrap">
                    <FaEnvelope className="auth-input-icon" aria-hidden="true" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@hospital.org"
                      required
                    />
                  </div>
                </label>

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button type="submit" className="auth-submit">
                  Send Reset Link <FaArrowRight aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(127, 227, 168, 0.15)',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  margin: '0 auto 16px',
                }}
              >
                <FaCircleCheck />
              </div>
              <p style={{ fontSize: '14px', color: 'var(--auth-ink)', margin: '0 0 4px', fontWeight: 600 }}>
                Reset link sent
              </p>
              <p style={{ fontSize: '13.5px', color: 'var(--auth-ink-soft)', margin: '0 0 24px' }}>
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <button
                type="button"
                className="auth-submit"
                onClick={() => navigate('/login')}
              >
                Back to Login <FaArrowRight aria-hidden="true" />
              </button>
            </div>
          )}

          {!submitted && (
            <p className="auth-footer-note">
              Remembered your password? <Link to="/login">Login</Link>
            </p>
          )}
          <p className="auth-trust-line">Encrypted access · Enterprise-grade security</p>
        </div>
      </section>
    </main>
  )
}