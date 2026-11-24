import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import API_BASE_URL from "../api/api";
import appeelLogo from "../assets/appeel-logo.png";

function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        throw new Error(
          data.message ||
          data.error ||
          t("adminLogin.errors.invalidCredentials")
        );
      }

      if (!data.token) {
        throw new Error(t("adminLogin.errors.noToken"));
      }

      // Store the JWT for protected admin API requests.
      localStorage.setItem("adminToken", data.token);

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || t("adminLogin.errors.connection"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth">
      <div className="auth-card">
        <div className="auth-header">
          <NavLink
            to="/"
            className="auth-brand"
            aria-label={t("adminLogin.homeAria")}
          >
            <img
              src={appeelLogo}
              alt="APPEEL"
              className="auth-page-logo"
            />

          </NavLink>

          <span className="auth-badge admin-badge">
            {t("adminLogin.portal")}
          </span>

          <h1>{t("adminLogin.title")}</h1>

          <p className="auth-subtitle">
            {t("adminLogin.subtitle")}
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-email">
              {t("adminLogin.email")}
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder={t("adminLogin.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="admin-password">
                {t("adminLogin.password")}
              </label>

              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword
                  ? t("adminLogin.hidePassword")
                  : t("adminLogin.showPassword")}
              </button>
            </div>

            <div className="input-pw-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("adminLogin.passwordPlaceholder")}
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
            {loading
              ? t("adminLogin.authenticating")
              : t("adminLogin.submit")}
          </button>
        </form>

        <div className="auth-footer">
          <NavLink to="/" className="auth-link">
            ← {t("adminLogin.backHome")}
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
