import { NavLink } from 'react-router-dom'
import { FaStethoscope, FaSun, FaMoon } from 'react-icons/fa6'
import { useTheme } from '../theme/ThemeContext.jsx'

export function Navigation({ mode = 'public' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="site-header">
      <nav className="nav-bar" aria-label="Primary navigation">
        <NavLink className="brand" to={mode === 'private' ? '/app/dashboard' : '/'}>
          <span className="brand-mark">HF</span>
          <span className="brand-text">
            <strong>HealthForecastAI</strong>
            <span>Clinical readmission intelligence</span>
          </span>
        </NavLink>

        <div className="nav-utility" aria-label="Platform status">
          <FaStethoscope aria-hidden="true" />
          <span>Live model ready</span>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FaSun /> : <FaMoon />}
          </button>

          {mode === 'public' && (
            <div className="nav-auth-buttons">
              <NavLink to="/login" className="nav-login-button">
                Login
              </NavLink>
              <NavLink to="/register" className="nav-register-button">
                Get Started
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}