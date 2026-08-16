import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyOtp, resendOtp } from '../services/authApi.js'
import { FaEnvelope, FaArrowRight, FaHeartPulse } from 'react-icons/fa6'
import "../styles/RegisterPage.css";

export function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  if (!email) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-card-inner">
            <h2 className="auth-heading">Something went wrong</h2>
            <p>No email found to verify. Please register again.</p>
            <Link to="/register">Go to Register</Link>
          </div>
        </section>
      </main>
    )
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }

    setIsSubmitting(true)
    try {
      await verifyOtp({ email, otp })
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Invalid or expired code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')
    setIsResending(true)
    try {
      await resendOtp({ email })
      setMessage('A new code has been sent to your email.')
    } catch (err) {
      setError(err.message || 'Failed to resend code.')
    } finally {
      setIsResending(false)
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
          <span className="auth-badge">EMAIL VERIFICATION</span>
          <h1 className="auth-visual-headline">Almost there — verify your email.</h1>
          <p className="auth-visual-copy">
            We've sent a 6-digit code to your email address to confirm it's really you.
          </p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-inner">
          <span className="auth-eyebrow">CHECK YOUR INBOX</span>
          <h2 className="auth-heading">Enter verification code</h2>
          <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          <form className="auth-form" onSubmit={handleVerify} noValidate>
            <label className="auth-field">
              <span>Verification Code</span>
              <div className="auth-input-wrap">
                <FaEnvelope className="auth-input-icon" aria-hidden="true" />
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
            </label>

            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-success" role="status">{message}</p>}

            <div className="auth-step-actions">
              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying...' : 'Verify & Continue'} <FaArrowRight aria-hidden="true" />
              </button>
            </div>
          </form>

          <p className="auth-footer-note">
            Didn't get the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}