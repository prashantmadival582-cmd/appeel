import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api/api";

export default function LawyerLogin() {
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

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      
const response = await fetch(`${API_BASE_URL}/api/lawyers/login`, {
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
      : data?.message || "Invalid lawyer email or password."
  );
}


// Save the JWT token if the backend returns one
if (data?.token) {
  localStorage.setItem("lawyerToken", data.token);
}

      

      const lawyer = data?.lawyer ?? data;
      const lawyerId = lawyer?.id;

      if (lawyerId == null) {
        throw new Error(
          "Login succeeded, but the lawyer ID was not returned by the server."
        );
      }

      localStorage.setItem(
        "loggedInLawyer",
        JSON.stringify({
          id: lawyerId,
          name: lawyer.name || "",
          email: lawyer.email || formData.email,
        })
      );

      navigate("/lawyer/dashboard", { replace: true });
    } catch (err) {
      console.error("Lawyer login error:", err);
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
          <span className="auth-badge lawyer-badge">Practitioner Workspace</span>
          <h1>Lawyer Portal Login</h1>
          <p className="auth-subtitle">
            Sign in to access assigned legal cases, review documents, and update case progress.
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
            <label htmlFor="email">Practitioner Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="lawyer@firm.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary-block" disabled={loading}>
            {loading ? "Signing In..." : "Access Lawyer Workspace"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Are you a practicing attorney?{" "}
            <Link to="/lawyer/register" className="auth-link">
              Register here
            </Link>
          </p>
          <div className="auth-secondary-links">
            <Link to="/customer/login">Client Sign In</Link>
            <span className="sep">•</span>
            <Link to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
