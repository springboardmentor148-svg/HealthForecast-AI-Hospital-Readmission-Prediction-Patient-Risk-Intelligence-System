import { NavLink, useLocation } from 'react-router-dom'
import { FaArrowRightToBracket, FaChartLine, FaHouseMedical, FaShieldHeart, FaStethoscope, FaSun, FaMoon } from 'react-icons/fa6'
import { useTheme } from '../theme/ThemeContext.jsx'

const publicNavItems = [
  { label: 'Home', href: '/home', icon: FaHouseMedical },
  { label: 'Prediction', href: '/app/prediction', icon: FaChartLine },
  { label: 'About', href: '/home#about', icon: FaShieldHeart },
]

const dashboardNavItems = [
  { label: 'Home', href: '/app/dashboard', icon: FaHouseMedical },
  { label: 'Prediction', href: '/app/prediction', icon: FaChartLine },
  { label: 'About', href: '/home#about', icon: FaShieldHeart },
]

export function Navigation({ mode = 'public' }) {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const navItems = mode === 'private' ? dashboardNavItems : publicNavItems

  return (
    <header className="site-header">
      <nav className="nav-bar" aria-label="Primary navigation">
        <NavLink className="brand" to={mode === 'private' ? '/app/dashboard' : '/home'}>
          <span className="brand-mark">HF</span>
          <span className="brand-text">
            <strong>HealthForecastAI</strong>
            <span>Clinical readmission intelligence</span>
          </span>
        </NavLink>

        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) => (isActive || location.pathname === item.href ? 'is-active' : '')}
            >
              <span className="nav-link-icon" aria-hidden="true">
                <item.icon />
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>

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
        </div>
      </nav>
    </header>
  )
}