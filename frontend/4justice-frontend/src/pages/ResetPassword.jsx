
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../api/api";

export default function ResetPassword() {
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
        setCheckingToken(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
          { method: "POST" }
        );

        const data = await response.json();

        if (!active) return;

        setTokenValid(response.ok && data.valid === true);

        if (!response.ok || data.valid !== true) {
          setError(
            data.message || "This password reset link is invalid or expired."
          );
        }
      } catch {
        if (!active) return;
        setError("Unable to verify the reset link. Please try again.");
      } finally {
        if (active) setCheckingToken(false);
      }
    };

    verifyToken();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8 || newPassword.length > 100) {
      setError("Password must contain between 8 and 100 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reset your password."
        );
      }

      setSuccess("Your password has been reset successfully.");
      setTokenValid(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <main className="login-selection-page">
        <div className="login-selection-container">
          <section className="universal-login-card">
            <p>Verifying your password reset link...</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="login-selection-page">
      <div className="login-selection-container">
        <div className="login-selection-heading">
          <span className="login-selection-eyebrow">ACCOUNT SECURITY</span>
          <h1>Create a new password</h1>
          <p>Choose a new password for your APPEEL account.</p>
        </div>

        <section className="universal-login-card">
          <div className="universal-login-heading">
            <h2>Reset your password</h2>
            <p>Enter your new password below.</p>
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
                <Link to="/login">Continue to login →</Link>
              </p>
            </div>
          )}

          {!tokenValid && !success && (
            <div className="auth-form">
              <p>
                This reset link is missing, invalid, expired, or already used.
                Please request a new password reset link.
              </p>
              <Link to="/forgot-password" className="login-card-button">
                Request a new link →
              </Link>
            </div>
          )}

          {tokenValid && !success && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
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
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>

              <button
                type="submit"
                className="login-card-button universal-login-button"
                disabled={loading}
              >
                {loading ? "Updating password..." : "Reset Password"}
                {!loading && <span>→</span>}
              </button>
            </form>
          )}

          <div className="universal-login-footer">
            <p>
              <Link to="/login">← Back to login</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

