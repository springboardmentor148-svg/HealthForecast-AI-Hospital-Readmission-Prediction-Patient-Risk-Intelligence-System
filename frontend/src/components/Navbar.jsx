import "./styles/Navbar.css";
import logo from "./assets/logo.png";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="logo" />
        <h2>HealthForecast AI</h2>
      </div>

      <ul className="nav-links">
        <li>Portal</li>
        <li>Dashboard</li>
        <li>Admin Panel</li>
        <li>Contact</li>
        <li>Feedback</li>
      </ul>
    </nav>
  );
}

export default Navbar;