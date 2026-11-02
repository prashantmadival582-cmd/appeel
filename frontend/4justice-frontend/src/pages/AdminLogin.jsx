
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import API_BASE_URL from "../api/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Invalid admin credentials.");
      }

      if (!data.token) {
        throw new Error("Login succeeded, but the server did not return a token.");
      }

      // Store the JWT for protected admin API requests.
      localStorage.setItem("adminToken", data.token);

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth">
      <div className="auth-card">
        <div className="auth-header">
          <NavLink to="/" className="auth-brand" aria-label="APPEEL Home">
            <span className="auth-brand-icon">⚖️</span>
            <span className="auth-brand-text">APPEEL</span>
          </NavLink>

          <span className="auth-badge admin-badge">
            Administration Portal
          </span>

          <h1>Admin Sign In</h1>

          <p className="auth-subtitle">
            Secure administrative control for lawyer assignment, case
            management, and system metrics.
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email Address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="admin@appeel.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="admin-password">Password</label>

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
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary-block"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Admin Portal"}
          </button>
        </form>

        <div className="auth-footer">
          <NavLink to="/" className="auth-link">
            ← Back to APPEEL Home
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
