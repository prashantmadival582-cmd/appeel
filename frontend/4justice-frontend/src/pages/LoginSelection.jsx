import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import API_BASE_URL from "../api/api";
import appeelLogo from "../assets/appeel-logo.png";

export default function LoginSelection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          continue;
        }

        if (!data?.token) {
          throw new Error(t("login.errors.noToken"));
        }

        localStorage.setItem(endpoint.tokenKey, data.token);

        if (endpoint.role === "CUSTOMER") {
          const customer = data.customer;

          if (!customer?.id) {
            throw new Error(t("login.errors.customerDetails"));
          }

          localStorage.setItem("customerId", String(customer.id));
          localStorage.setItem("customerName", customer.name || "");
          localStorage.setItem("customerEmail", customer.email || "");
          localStorage.setItem("customerPhone", customer.phone || "");
        }

        if (endpoint.role === "LAWYER") {
          const lawyer = data.lawyer ?? data;

          if (lawyer?.id == null) {
            throw new Error(t("login.errors.lawyerDetails"));
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

        const otherTokenKeys = [
          "customerToken",
          "lawyerToken",
          "adminToken",
        ].filter((key) => key !== endpoint.tokenKey);

        otherTokenKeys.forEach((key) =>
          localStorage.removeItem(key)
        );

        navigate(endpoint.dashboard, { replace: true });
        authenticated = true;
        break;
      }

      if (!authenticated) {
        throw new Error(t("login.errors.invalidCredentials"));
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || t("login.errors.connection")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-selection-page">
      <div className="login-selection-container">

        <div className="login-selection-heading">
          <h1>{t("login.title")}</h1>

          <p>{t("login.subtitle")}</p>
        </div>

        <section className="universal-login-card">
          <div className="auth-brand-wrapper">
            <Link to="/" className="auth-brand-logo-link" aria-label="APPEEL Home">
              <img
                src={appeelLogo}
                alt="APPEEL"
                className="auth-page-logo appeel-logo"
              />

            </Link>
          </div>

          <div className="universal-login-heading">
            <h2>{t("login.accountTitle")}</h2>
            <p>{t("login.accountSubtitle")}</p>
          </div>

          {error && (
            <div className="alert-banner alert-error" role="alert">
              <span className="alert-icon"><FiAlertTriangle /></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="universal-email">
                {t("login.email")}
              </label>

              <input
                id="universal-email"
                name="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="universal-password">
                  {t("login.password")}
                </label>

                <button
                  type="button"
                  className="btn-toggle-pw"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                >
                  {showPassword
                    ? t("login.hidePassword")
                    : t("login.showPassword")}
                </button>
              </div>

              <input
                id="universal-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("login.passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="forgot-password-link">
              <Link to="/forgot-password">
                {t("login.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              className="login-card-button universal-login-button"
              disabled={loading}
            >
              {loading
                ? t("login.signingIn")
                : t("login.signIn")}

              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="universal-login-note">
            {t("login.secureAccess")}
          </p>

          <div className="universal-login-footer">
            <p>
              {t("login.newCustomer")}{" "}
              <Link to="/customer/register">
                {t("login.createAccount")}
              </Link>
            </p>

            <p>
              {t("login.areYouLawyer")}{" "}
              <Link to="/lawyer/register">
                {t("login.registerHere")}
              </Link>
            </p>
          </div>
        </section>

        <Link to="/" className="login-back-home">
          ← {t("login.backHome")}
        </Link>
      </div>
    </main>
  );
}