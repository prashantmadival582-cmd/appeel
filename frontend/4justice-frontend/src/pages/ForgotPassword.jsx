
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../api/api";

export default function ForgotPassword() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || t("forgotPassword.errors.requestFailed")
        );
      }

      setMessage(
        data.message ||
          t("forgotPassword.success.default")
      );
    } catch (err) {
      setError(
        err.message || t("forgotPassword.errors.connection")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-selection-page">
      <div className="login-selection-container">
        <div className="login-selection-heading">
          <span className="login-selection-eyebrow">
            {t("forgotPassword.eyebrow")}
          </span>

          <h1>{t("forgotPassword.title")}</h1>

          <p>{t("forgotPassword.subtitle")}</p>
        </div>

        <section className="universal-login-card">
          <div className="universal-login-heading">
            <h2>{t("forgotPassword.heading")}</h2>
            <p>{t("forgotPassword.description")}</p>
          </div>

          {message && (
            <div className="alert-banner alert-success" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="alert-banner alert-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">
                {t("forgotPassword.email")}
              </label>

              <input
                id="forgot-email"
                type="email"
                placeholder={t("forgotPassword.emailPlaceholder")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="login-card-button universal-login-button"
              disabled={loading}
            >
              {loading
                ? t("forgotPassword.sending")
                : t("forgotPassword.submit")}

              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="universal-login-footer">
            <p>
              {t("forgotPassword.rememberPassword")}{" "}
              <Link to="/login">
                {t("forgotPassword.backToLogin")}
              </Link>
            </p>
          </div>
        </section>

        <Link to="/" className="login-back-home">
          ← {t("forgotPassword.backHome")}
        </Link>
      </div>
    </main>
  );
}
