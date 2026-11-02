
import { useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../api/api";

export default function ForgotPassword() {
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
        throw new Error(data.message || "Unable to process your request.");
      }

      setMessage(
        data.message ||
          "If an account exists for this email, a reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-selection-page">
      <div className="login-selection-container">
        <div className="login-selection-heading">
          <span className="login-selection-eyebrow">ACCOUNT RECOVERY</span>
          <h1>Forgot your password?</h1>
          <p>We'll send you a secure link to reset your password.</p>
        </div>

        <section className="universal-login-card">
          <div className="universal-login-heading">
            <h2>Reset your password</h2>
            <p>Enter the email address registered with APPEEL.</p>
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
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your registered email"
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
              {loading ? "Sending..." : "Send Reset Link"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="universal-login-footer">
            <p>
              Remember your password?{" "}
              <Link to="/login">Back to login</Link>
            </p>
          </div>
        </section>

        <Link to="/" className="login-back-home">
          ← Back to homepage
        </Link>
      </div>
    </main>
  );
}
