import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api/api";

export default function LawyerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/lawyers/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.message || "Registration failed. Please try again."
        );
      }

      alert("Registration successful! Please log in.");
      navigate("/lawyer/login");
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page lawyer-auth">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-brand" aria-label="APPEEL Home">
            <span className="auth-brand-icon">⚖️</span>
            <span className="auth-brand-text">APPEEL</span>
          </Link>
          <span className="auth-badge lawyer-badge">Practitioner Enrollment</span>
          <h1>Lawyer Registration</h1>
          <p className="auth-subtitle">
            Join the APPEEL verified legal network to receive qualified client allocations.
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Counsel Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Adv. Sofia Berg"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Official Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="sofia.berg@lawfirm.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Primary Practice Area / Specialization</label>
            <input
              id="specialization"
              name="specialization"
              type="text"
              placeholder="e.g. Commercial & Contract Law, Family Law"
              value={formData.specialization}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Direct Contact Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+46 8 123 4567"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="input-pw-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <small className="field-hint">Minimum 8 characters with a mix of letters and numbers</small>
          </div>

          <button type="submit" className="btn-primary-block" disabled={loading}>
            {loading ? "Registering Practitioner..." : "Complete Registration"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already enrolled as a lawyer?{" "}
            <Link to="/lawyer/login" className="auth-link">
              Sign in here
            </Link>
          </p>
          <div className="auth-secondary-links">
            <Link to="/">Back to APPEEL Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
