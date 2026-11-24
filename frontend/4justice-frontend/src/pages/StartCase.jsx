import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  customerRequest,
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import { CustomerPageHeader } from "./CustomerCases";
import { FiAlertTriangle } from "react-icons/fi";

export default function StartCase() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    caseType: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getCustomerJson("/api/customers/me")
      .then((customer) => {
        if (!active) return;

        setFormData((current) => ({
          ...current,
          customerName: customer.name || "",
          customerEmail: customer.email || "",
        }));
      })
      .catch((requestError) => {
        if (!active) return;

        setError(
          requestError.message ||
            t("startCase.errors.verifySession")
        );

        if (isCustomerAuthError(requestError)) {
          navigate("/customer/login", { replace: true });
        }
      })
      .finally(() => {
        if (active) {
          setCheckingSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate, t]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await customerRequest("/api/cases", {
        method: "POST",
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          caseType: formData.caseType,
          description: formData.description,
        }),
      });

      const caseData = await response.json();

      if (!caseData.caseId) {
        throw new Error(
          t("startCase.errors.missingCaseId")
        );
      }

      // Navigate to payment only after the case is created successfully.
      navigate("/payment", {
        state: {
          caseId: caseData.caseId,
          customerEmail: formData.customerEmail,
        },
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          t("startCase.errors.submitFailed")
      );

      if (isCustomerAuthError(requestError)) {
        navigate("/customer/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="form-page-layout">
      <div className="form-card-container">
        <CustomerPageHeader
          title={t("startCase.pageTitle")}
          activeTab=""
        />

        <div className="form-header-bar"></div>

        <section className="form-card">
          <div className="form-intro">
            <span className="auth-badge">
              {t("startCase.eyebrow")}
            </span>

            <h1>{t("startCase.heading")}</h1>

            <p>{t("startCase.description")}</p>
          </div>

          {error && (
            <div className="alert-banner alert-error" role="alert">
              <span className="alert-icon"><FiAlertTriangle /></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-section-title">
              <h3>{t("startCase.clientSectionTitle")}</h3>
              <p>{t("startCase.clientSectionDescription")}</p>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label htmlFor="customerName">
                  {t("startCase.fullName")}
                </label>

                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  autoComplete="name"
                  value={formData.customerName}
                  onChange={handleChange}
                  readOnly
                  className="input-readonly"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerEmail">
                  {t("startCase.registeredEmail")}
                </label>

                <input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  readOnly
                  className="input-readonly"
                  required
                />
              </div>
            </div>

            <div className="form-section-title">
              <h3>{t("startCase.caseSectionTitle")}</h3>
              <p>{t("startCase.caseSectionDescription")}</p>
            </div>

            <div className="form-group">
              <label htmlFor="caseType">
                {t("startCase.caseCategory")}
              </label>

              <select
                id="caseType"
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                required
              >
                <option value="">
                  {t("startCase.selectCategory")}
                </option>

                <option value="Family Law">
                  {t("startCase.categories.familyLaw")}
                </option>

                <option value="Property Dispute">
                  {t("startCase.categories.propertyDispute")}
                </option>

                <option value="Criminal Law">
                  {t("startCase.categories.criminalLaw")}
                </option>

                <option value="Employment Law">
                  {t("startCase.categories.employmentLaw")}
                </option>

                <option value="Business Law">
                  {t("startCase.categories.businessLaw")}
                </option>

                <option value="Consumer Complaint">
                  {t("startCase.categories.consumerComplaint")}
                </option>

                <option value="Other">
                  {t("startCase.categories.other")}
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                {t("startCase.caseDescription")}
              </label>

              <textarea
                id="description"
                name="description"
                rows={6}
                placeholder={t("startCase.descriptionPlaceholder")}
                value={formData.description}
                onChange={handleChange}
                required
              />

              <small className="field-hint">
                {t("startCase.confidentialityNote")}
              </small>
            </div>

            <div className="form-actions-row">
              <button
                type="submit"
                className="btn-primary-navy btn-submit-large"
                disabled={loading || checkingSession}
              >
                {checkingSession
                  ? t("startCase.checkingSession")
                  : loading
                    ? t("startCase.creatingCase")
                    : t("startCase.submit")}
              </button>

              <Link
                to="/customer/dashboard"
                className="btn-cancel"
              >
                {t("startCase.cancel")}
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}