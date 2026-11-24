import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import API_BASE_URL from "../api/api";
import appeelLogo from "../assets/appeel-logo.png";

export default function LawyerRegister() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            : data?.message || t("lawyerRegister.errors.registrationFailed")
        );
      }

      alert(t("lawyerRegister.success"));
      navigate("/lawyer/login");
    } catch (err) {
      setError(
        err.message || t("lawyerRegister.errors.connection")
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
            aria-label={t("lawyerRegister.homeAria")}
          >
            <img
              src={appeelLogo}
              alt="APPEEL"
              className="auth-page-logo"
            />

          </Link>

          <h1>{t("lawyerRegister.title")}</h1>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">
              {t("lawyerRegister.fullName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder={t("lawyerRegister.fullNamePlaceholder")}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t("lawyerRegister.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t("lawyerRegister.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialization">
              {t("lawyerRegister.specialization")}
            </label>
            <input
              id="specialization"
              name="specialization"
              type="text"
              placeholder={t("lawyerRegister.specializationPlaceholder")}
              value={formData.specialization}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t("lawyerRegister.phone")}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder={t("lawyerRegister.phonePlaceholder")}
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password">
                {t("lawyerRegister.password")}
              </label>
              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword
                  ? t("lawyerRegister.hidePassword")
                  : t("lawyerRegister.showPassword")}
              </button>
            </div>

            <div className="input-pw-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("lawyerRegister.passwordPlaceholder")}
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <small className="field-hint">
              {t("lawyerRegister.passwordHint")}
            </small>
          </div>

          <button
            type="submit"
            className="btn-primary-block"
            disabled={loading}
          >
            {loading
              ? t("lawyerRegister.registering")
              : t("lawyerRegister.submit")}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t("lawyerRegister.alreadyRegistered")}{" "}
            <Link to="/lawyer/login" className="auth-link">
              {t("lawyerRegister.signIn")}
            </Link>
          </p>

          <div className="auth-secondary-links">
            <Link to="/">
              {t("lawyerRegister.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}