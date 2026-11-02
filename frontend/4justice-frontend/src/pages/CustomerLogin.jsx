
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCustomerJson } from "../api/customerApi";

export default function CustomerLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await getCustomerJson("/api/customers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const customer = data?.customer;

      if (!customer || customer.id == null || !customer.email) {
        throw new Error(
          "The server did not return your customer account details."
        );
      }

      // Store customer details
      localStorage.setItem("customerId", String(customer.id));
      localStorage.setItem("customerName", customer.name || "");
      localStorage.setItem("customerEmail", customer.email);
      localStorage.setItem("customerPhone", customer.phone || "");

      // Store JWT token when provided by the backend
      if (data?.token) {
        localStorage.setItem("customerToken", data.token);
      }

      navigate("/customer/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.message || "Unable to sign in. Please check your credentials."
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

          <span className="auth-badge">Customer Portal</span>
          <h1>Welcome Back</h1>

          <p className="auth-subtitle">
            Sign in to access your cases, documents, and legal updates.
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
            <label htmlFor="customer-login-email">Email Address</label>
            <input
              id="customer-login-email"
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
            <div className="form-label-row">
              <label htmlFor="customer-login-password">Password</label>

              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="input-pw-wrapper">
              <input
                id="customer-login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary-block"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In to My Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an APPEEL account?{" "}
            <Link to="/customer/register" className="auth-link">
              Create an account
            </Link>
          </p>

          <div className="auth-secondary-links">
            <Link to="/lawyer/login">Lawyer sign in</Link>
            <span className="sep">•</span>
            <Link to="/">Back to home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
