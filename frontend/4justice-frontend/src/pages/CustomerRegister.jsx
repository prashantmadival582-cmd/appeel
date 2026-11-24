import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import { getCustomerJson } from "../api/customerApi";
import appeelLogo from "../assets/appeel-logo.png";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        err.message || t("customerRegister.errors.registrationFailed")
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
            aria-label={t("customerRegister.homeAria")}
          >
            <img
              src={appeelLogo}
              alt="APPEEL"
              className="auth-page-logo"
            />

          </Link>

          <h1>{t("customerRegister.title")}</h1>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="customer-name">
              {t("customerRegister.fullName")}
            </label>
            <input
              id="customer-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t("customerRegister.fullNamePlaceholder")}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-email">
              {t("customerRegister.email")}
            </label>
            <input
              id="customer-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("customerRegister.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-phone">
              {t("customerRegister.phone")}
            </label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder={t("customerRegister.phonePlaceholder")}
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="customer-password">
                {t("customerRegister.password")}
              </label>
              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword
                  ? t("customerRegister.hidePassword")
                  : t("customerRegister.showPassword")}
              </button>
            </div>

            <div className="input-pw-wrapper">
              <input
                id="customer-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("customerRegister.passwordPlaceholder")}
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <small className="field-hint">
              {t("customerRegister.passwordHint")}
            </small>
          </div>

          <button
            type="submit"
            className="btn-primary-block"
            disabled={loading}
          >
            {loading
              ? t("customerRegister.creatingAccount")
              : t("customerRegister.submit")}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t("customerRegister.alreadyHaveAccount")}{" "}
            <Link to="/customer/login" className="auth-link">
              {t("customerRegister.signIn")}
            </Link>
          </p>

          <div className="auth-secondary-links">
            <Link to="/lawyer/register">
              {t("customerRegister.registerAsLawyer")}
            </Link>
            <span className="sep">•</span>
            <Link to="/">
              {t("customerRegister.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}