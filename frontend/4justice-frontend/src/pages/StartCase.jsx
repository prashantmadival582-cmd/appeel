import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  customerRequest,
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import { CustomerPageHeader } from "./CustomerCases";

export default function StartCase() {
  const navigate = useNavigate();

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

        setError(requestError.message || "Unable to verify your session.");

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
  }, [navigate]);

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
          "The case ID was not returned by the server. Please check your cases before submitting again."
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
        requestError.message || "Unable to submit your case."
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
        <CustomerPageHeader title="Start a New Case" activeTab="" />

        <div className="form-header-bar">
          
        </div>

        <section className="form-card">
          <div className="form-intro">
            <span className="auth-badge">INTAKE FORM</span>
            <h1>Start a New Legal Case</h1>
            <p>
              Complete the details below so our legal team can assess
              your requirements and connect you with the appropriate
              attorney.
            </p>
          </div>

          {error && (
            <div className="alert-banner alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-section-title">
              <h3>1. Client Information</h3>
              <p>Verified from your customer profile</p>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label htmlFor="customerName">Full Name</label>
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
                  Registered Email
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
              <h3>2. Case Information</h3>
              <p>Specify the category and scope of your matter</p>
            </div>

            <div className="form-group">
              <label htmlFor="caseType">
                Legal Case Category
              </label>

              <select
                id="caseType"
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                required
              >
                <option value="">Select a category...</option>
                <option value="Family Law">
                  Family Law (Divorce, Custody, Estates)
                </option>
                <option value="Property Dispute">
                  Property Dispute (Real Estate, Leases, Tenancy)
                </option>
                <option value="Criminal Law">
                  Criminal Law &amp; Defense
                </option>
                <option value="Employment Law">
                  Employment Law (Contracts, Disputes, Severance)
                </option>
                <option value="Business Law">
                  Business &amp; Corporate Law
                </option>
                <option value="Consumer Complaint">
                  Consumer Rights &amp; Claims
                </option>
                <option value="Other">
                  Other Legal Assistance
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Case Description &amp; Background
              </label>

              <textarea
                id="description"
                name="description"
                rows={6}
                placeholder="Describe your situation in detail. Include dates, opposing parties, current status, and the outcome you are seeking..."
                value={formData.description}
                onChange={handleChange}
                required
              />

              <small className="field-hint">
                All communications and case details are securely
                handled under strict confidentiality.
              </small>
            </div>

            <div className="form-actions-row">
              <button
                type="submit"
                className="btn-primary-navy btn-submit-large"
                disabled={loading || checkingSession}
              >
                {checkingSession
                  ? "Checking Session..."
                  : loading
                    ? "Creating Case..."
                    : "Submit Case & Continue to Payment →"}
              </button>

              <Link
                to="/customer/dashboard"
                className="btn-cancel"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
