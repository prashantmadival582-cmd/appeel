import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../api/api";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setError(t("resetPassword.errors.missingToken"));
        setCheckingToken(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
          { method: "POST" }
        );

        const data = await response.json().catch(() => ({}));

        if (!active) return;

        setTokenValid(response.ok && data.valid === true);

        if (!response.ok || data.valid !== true) {
          setError(
            data.message || t("resetPassword.errors.invalidToken")
          );
        }
      } catch {
        if (!active) return;
        setError(t("resetPassword.errors.verifyFailed"));
      } finally {
        if (active) setCheckingToken(false);
      }
    };

    verifyToken();

    return () => {
      active = false;
    };
  }, [token, t]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8 || newPassword.length > 100) {
      setError(t("resetPassword.errors.passwordLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || t("resetPassword.errors.resetFailed")
        );
      }

      setSuccess(t("resetPassword.success"));
      setTokenValid(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message || t("resetPassword.errors.resetFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <main className="login-selection-page">
        <div className="login-selection-container">
          <section className="universal-login-card">
            <p>{t("resetPassword.verifying")}</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="login-selection-page">
      <div className="login-selection-container">
        <div className="login-selection-heading">
          <span className="login-selection-eyebrow">
            {t("resetPassword.eyebrow")}
          </span>

          <h1>{t("resetPassword.pageTitle")}</h1>

          <p>{t("resetPassword.pageDescription")}</p>
        </div>

        <section className="universal-login-card">
          <div className="universal-login-heading">
            <h2>{t("resetPassword.cardTitle")}</h2>
            <p>{t("resetPassword.cardDescription")}</p>
          </div>

          {error && (
            <div className="alert-banner alert-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert-banner alert-success" role="status">
              {success}
              <p>
                <Link to="/login">
                  {t("resetPassword.continueLogin")} →
                </Link>
              </p>
            </div>
          )}

          {!tokenValid && !success && (
            <div className="auth-form">
              <p>{t("resetPassword.invalidLinkDescription")}</p>

              <Link
                to="/forgot-password"
                className="login-card-button"
              >
                {t("resetPassword.requestNewLink")} →
              </Link>
            </div>
          )}

          {tokenValid && !success && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="new-password">
                  {t("resetPassword.newPassword")}
                </label>

                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("resetPassword.newPasswordPlaceholder")}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">
                  {t("resetPassword.confirmPassword")}
                </label>

                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={100}
                  required
                />
              </div>

              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword
                  ? t("resetPassword.hidePasswords")
                  : t("resetPassword.showPasswords")}
              </button>

              <button
                type="submit"
                className="login-card-button universal-login-button"
                disabled={loading}
              >
                {loading
                  ? t("resetPassword.updating")
                  : t("resetPassword.submit")}

                {!loading && <span>→</span>}
              </button>
            </form>
          )}

          <div className="universal-login-footer">
            <p>
              <Link to="/login">
                ← {t("resetPassword.backToLogin")}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}