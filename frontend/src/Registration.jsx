import { useState } from "react";
import { Link } from "react-router-dom";
import "./styles/Registration.css";
import logo from "./assets/logo.png";

function Registration() {

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "Doctor",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      form.username === "" ||
      form.password === "" ||
      form.role === ""
    ) {
      alert("Please fill all fields");
      return;
    }

    alert("Registration Successful");
  };

  return (
    <div className="register-container">

      <div className="register-card">

        <img src={logo} alt="Logo" className="logo" />

        <h1 className="title">HealthForecast AI</h1>

        <p className="subtitle">
          Hospital Readmission Prediction &
          Patient Risk Intelligence System
        </p>

        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            value={form.username}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={handleChange}
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="Doctor">Doctor</option>
            <option value="Hospital Administrator">Hospital Administrator</option>
            <option value="Healthcare Researcher">Healthcare Researcher</option>
            <option value="System Administrator">System Administrator</option>
          </select>

          <button type="submit">Register</button>

        </form>

        <p className="login-text">
          Already have an account?{" "}
          <Link to="/">Login</Link>
        </p>

      </div>

    </div>
  );
}

export default Registration;