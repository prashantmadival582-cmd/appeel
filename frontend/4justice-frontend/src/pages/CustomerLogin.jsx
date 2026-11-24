
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import { getCustomerJson } from "../api/customerApi";
import appeelLogo from "../assets/appeel-logo.png";

export default function CustomerLogin() {
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
        throw new Error(t("customerLogin.errors.noCustomerDetails"));
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
        err.message || t("customerLogin.errors.signInFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link
            to="/"
            className="auth-brand"
            aria-label={t("customerLogin.homeAria")}
          >
            <img
              src={appeelLogo}
              alt="APPEEL"
              className="auth-page-logo"
            />

          </Link>

          <span className="auth-badge">
            {t("customerLogin.portal")}
          </span>

          <h1>{t("customerLogin.title")}</h1>

          <p className="auth-subtitle">
            {t("customerLogin.subtitle")}
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
            <label htmlFor="customer-login-email">
              {t("customerLogin.email")}
            </label>

            <input
              id="customer-login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("customerLogin.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="customer-login-password">
                {t("customerLogin.password")}
              </label>

              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                tabIndex={-1}
              >
                {showPassword
                  ? t("customerLogin.hidePassword")
                  : t("customerLogin.showPassword")}
              </button>
            </div>

            <div className="input-pw-wrapper">
              <input
                id="customer-login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("customerLogin.passwordPlaceholder")}
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
            {loading
              ? t("customerLogin.signingIn")
              : t("customerLogin.submit")}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t("customerLogin.noAccount")}{" "}
            <Link to="/customer/register" className="auth-link">
              {t("customerLogin.createAccount")}
            </Link>
          </p>

          <div className="auth-secondary-links">
            <Link to="/lawyer/login">
              {t("customerLogin.lawyerSignIn")}
            </Link>

            <span className="sep">•</span>

            <Link to="/">
              {t("customerLogin.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
