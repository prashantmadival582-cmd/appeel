import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import { FaBalanceScale } from "react-icons/fa";
import API_BASE_URL from "../api/api";

export default function LawyerLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            : data?.message || t("lawyerLogin.errors.invalidCredentials")
        );
      }

      // Save the JWT token if the backend returns one.
      if (data?.token) {
        localStorage.setItem("lawyerToken", data.token);
      }

      const lawyer = data?.lawyer ?? data;
      const lawyerId = lawyer?.id;

      if (lawyerId == null) {
        throw new Error(t("lawyerLogin.errors.missingLawyerId"));
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
        err.message || t("lawyerLogin.errors.connection")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page lawyer-auth">
      <div className="auth-card">
        <div className="auth-header">
          <Link
            to="/"
            className="auth-brand"
            aria-label={t("lawyerLogin.homeAria")}
          >
            <span className="auth-brand-icon"><FaBalanceScale /></span>
            <span className="auth-brand-text">APPEEL</span>
          </Link>

          <span className="auth-badge lawyer-badge">
            {t("lawyerLogin.workspace")}
          </span>

          <h1>{t("lawyerLogin.title")}</h1>

          <p className="auth-subtitle">
            {t("lawyerLogin.subtitle")}
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              {t("lawyerLogin.email")}
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder={t("lawyerLogin.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password">
                {t("lawyerLogin.password")}
              </label>

              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword
                  ? t("lawyerLogin.hidePassword")
                  : t("lawyerLogin.showPassword")}
              </button>
            </div>

            <div className="input-pw-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("lawyerLogin.passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
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
              ? t("lawyerLogin.signingIn")
              : t("lawyerLogin.submit")}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t("lawyerLogin.registerPrompt")}{" "}
            <Link to="/lawyer/register" className="auth-link">
              {t("lawyerLogin.registerHere")}
            </Link>
          </p>

          <div className="auth-secondary-links">
            <Link to="/customer/login">
              {t("lawyerLogin.customerSignIn")}
            </Link>

            <span className="sep">•</span>

            <Link to="/">
              {t("lawyerLogin.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}