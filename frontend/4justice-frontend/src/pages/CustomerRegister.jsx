import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCustomerJson } from "../api/customerApi";

export default function CustomerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
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
      const data = await getCustomerJson("/api/customers/register", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        }),
      });
      localStorage.setItem("customerName", data.name || formData.name.trim());
      localStorage.setItem("customerEmail", data.email || formData.email.trim());
      localStorage.setItem("customerPhone", data.phone || formData.phone.trim());
      setError("");
      navigate("/customer/login");
    } catch (err) {
      setError(
        err.message || "Unable to register. Please check your information."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-brand" aria-label="APPEEL Home">
            <span className="auth-brand-icon">⚖️</span>
            <span className="auth-brand-text">APPEEL</span>
          </Link>
          <span className="auth-badge">Customer Onboarding</span>
          <h1>Create Your Account</h1>
          <p className="auth-subtitle">
            Get instant access to legal counsel, case filing, and document management.
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
            <label htmlFor="customer-name">Full Name</label>
            <input
              id="customer-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Erik Lindqvist"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-email">Email Address</label>
            <input
              id="customer-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-phone">Phone Number</label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. +46 70 123 4567"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="customer-password">Create Password</label>
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
                id="customer-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <small className="field-hint">Must contain at least 8 characters</small>
          </div>

          <button type="submit" className="btn-primary-block" disabled={loading}>
            {loading ? "Creating Account..." : "Register Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/customer/login" className="auth-link">
              Sign in
            </Link>
          </p>
          <div className="auth-secondary-links">
            <Link to="/lawyer/register">Register as lawyer</Link>
            <span className="sep">•</span>
            <Link to="/">Back to home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}