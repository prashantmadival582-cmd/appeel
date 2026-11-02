
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api/api";

export default function LoginSelection() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const loginEndpoints = [
      {
        role: "CUSTOMER",
        url: "/api/customers/login",
        tokenKey: "customerToken",
        dashboard: "/customer/dashboard",
      },
      {
        role: "LAWYER",
        url: "/api/lawyers/login",
        tokenKey: "lawyerToken",
        dashboard: "/lawyer/dashboard",
      },
      {
        role: "ADMIN",
        url: "/api/admin/login",
        tokenKey: "adminToken",
        dashboard: "/admin/dashboard",
      },
    ];

    try {
      let authenticated = false;

      for (const endpoint of loginEndpoints) {
        const response = await fetch(
          `${API_BASE_URL}${endpoint.url}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email.trim(),
              password: formData.password,
            }),
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          // Try the next role's login endpoint.
          continue;
        }

        // Never accept a successful response without a token.
        if (!data?.token) {
          throw new Error(
            "The server did not return an authentication token."
          );
        }

        // Save the authenticated user's token.
        localStorage.setItem(endpoint.tokenKey, data.token);

        // Save the customer profile used by the existing dashboard.
        if (endpoint.role === "CUSTOMER") {
          const customer = data.customer;

          if (!customer?.id) {
            throw new Error("Customer account details were not returned.");
          }

          localStorage.setItem("customerId", String(customer.id));
          localStorage.setItem("customerName", customer.name || "");
          localStorage.setItem("customerEmail", customer.email || "");
          localStorage.setItem("customerPhone", customer.phone || "");
        }

        // Save the lawyer profile used by the existing dashboard.
        if (endpoint.role === "LAWYER") {
          const lawyer = data.lawyer ?? data;

          if (lawyer?.id == null) {
            throw new Error("Lawyer account details were not returned.");
          }

          localStorage.setItem(
            "loggedInLawyer",
            JSON.stringify({
              id: lawyer.id,
              name: lawyer.name || "",
              email: lawyer.email || formData.email.trim(),
            })
          );
        }

        // Clear tokens from other roles to avoid stale sessions.
        const otherTokenKeys = [
          "customerToken",
          "lawyerToken",
          "adminToken",
        ].filter((key) => key !== endpoint.tokenKey);

        otherTokenKeys.forEach((key) => localStorage.removeItem(key));

        // Navigate to the matching dashboard.
        navigate(endpoint.dashboard, { replace: true });
        authenticated = true;
        break;
      }

      if (!authenticated) {
        throw new Error(
          "Invalid email or password. Please check your credentials and try again."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message || "Unable to connect to the server. Please try again."
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
            WELCOME BACK
          </span>

          <h1>Sign in to APPEEL</h1>

          <p>
            Access your legal workspace securely.
          </p>
        </div>

        <section className="universal-login-card">
          <div className="universal-login-heading">
            <h2>Login to your account</h2>
            <p>Enter your registered email and password.</p>
          </div>

          {error && (
            <div className="alert-banner alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="universal-email">Email address</label>
              <input
                id="universal-email"
                name="email"
                type="email"
                placeholder="Enter your registered email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="universal-password">Password</label>

                <button
                  type="button"
                  className="btn-toggle-pw"
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                id="universal-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>



             <div className="forgot-password-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>



            <button
              type="submit"
              className="login-card-button universal-login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="universal-login-note">
            Secure access for customers, lawyers and administrators.
          </p>

          <div className="universal-login-footer">
            <p>
              New customer?{" "}
              <Link to="/customer/register">Create an account</Link>
            </p>

            <p>
              Are you a lawyer?{" "}
              <Link to="/lawyer/register">Register here</Link>
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
