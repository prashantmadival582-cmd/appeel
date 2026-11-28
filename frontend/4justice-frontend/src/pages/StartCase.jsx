
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  customerRequest,
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import { CustomerPageHeader } from "./CustomerCases";

import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiUser,
  FiMail,
  FiShield,
  FiCreditCard,
  FiFileText,
  FiLock,
} from "react-icons/fi";

const PENDING_SUBMISSION_KEY = "appeelPendingSubmission";
const PENDING_PAYMENT_KEY = "appeelPendingPayment";

const CASE_CATEGORIES = [
  { value: "Family Law", key: "familyLaw", number: "01" },
  { value: "Property Dispute", key: "propertyDispute", number: "02" },
  { value: "Criminal Law", key: "criminalLaw", number: "03" },
  { value: "Employment Law", key: "employmentLaw", number: "04" },
  { value: "Business Law", key: "businessLaw", number: "05" },
  { value: "Consumer Complaint", key: "consumerComplaint", number: "06" },
  { value: "Other", key: "other", number: "07" },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F4F6F9",
    padding: "24px 20px 60px",
    color: "#183047",
    fontFamily: "inherit",
  },
  container: {
    width: "100%",
    maxWidth: "1050px",
    margin: "0 auto",
  },
  shell: {
    background: "#FFFFFF",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #E6EAF0",
    boxShadow: "0 12px 45px rgba(16, 43, 73, 0.07)",
  },
  hero: {
    background: "linear-gradient(120deg, #102B49 0%, #304F70 100%)",
    color: "#FFFFFF",
    padding: "38px 44px 32px",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "30px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#E6EDF5",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
  step: {
    float: "right",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 700,
  },
  heroTitle: {
    fontSize: "clamp(27px, 4vw, 39px)",
    fontWeight: 700,
    letterSpacing: "-1.2px",
    lineHeight: 1.2,
    margin: "23px 0 10px",
    color: "#FFFFFF",
  },
  heroDescription: {
    maxWidth: "590px",
    color: "#DCE6F0",
    fontSize: "15px",
    lineHeight: 1.7,
    margin: 0,
  },
  progress: {
    display: "flex",
    gap: "7px",
    marginTop: "27px",
    maxWidth: "180px",
  },
  progressActive: {
    height: "4px",
    flex: 1,
    background: "#FFFFFF",
    borderRadius: "5px",
  },
  progressInactive: {
    height: "4px",
    flex: 1,
    background: "rgba(255,255,255,0.25)",
    borderRadius: "5px",
  },
  form: {
    padding: "36px 44px 40px",
  },
  section: {
    marginBottom: "35px",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "19px",
  },
  sectionIcon: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    borderRadius: "12px",
    background: "#EDF2F7",
    color: "#294B6C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#183047",
    margin: 0,
  },
  sectionDescription: {
    fontSize: "13px",
    color: "#788797",
    margin: "5px 0 0",
    lineHeight: 1.5,
  },
  verified: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
    color: "#25815C",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  profile: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#F8FAFC",
    border: "1px solid #E8EDF2",
    borderRadius: "13px",
    padding: "19px 21px",
    gap: "20px",
  },
  profileItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  profileIcon: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#E9EFF5",
    color: "#385B7B",
    fontSize: "16px",
  },
  profileLabel: {
    display: "block",
    fontSize: "11px",
    color: "#8592A0",
    marginBottom: "5px",
  },
  profileValue: {
    display: "block",
    fontSize: "13px",
    color: "#263D52",
    fontWeight: 650,
    overflowWrap: "anywhere",
  },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "11px",
  },
  category: {
    minHeight: "64px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "13px 15px",
    border: "1px solid #E2E8EF",
    borderRadius: "11px",
    background: "#FFFFFF",
    cursor: "pointer",
    textAlign: "left",
    color: "#334B61",
    transition: "all 180ms ease",
    fontFamily: "inherit",
    width: "100%",
  },
  categoryNumber: {
    fontSize: "11px",
    color: "#96A3B0",
    fontWeight: 700,
  },
  categoryName: {
    flex: 1,
    fontSize: "13px",
    fontWeight: 650,
  },
  categoryCheck: {
    width: "21px",
    height: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "1px solid #D9E0E8",
    color: "#FFFFFF",
    fontSize: "12px",
  },
  descriptionWrap: {
    border: "1px solid #DDE5ED",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#FFFFFF",
    transition: "border-color 180ms ease",
  },
  textarea: {
    display: "block",
    width: "100%",
    minHeight: "165px",
    resize: "vertical",
    border: "none",
    outline: "none",
    padding: "17px 18px",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: 1.75,
    color: "#263D52",
    background: "transparent",
    boxSizing: "border-box",
  },
  descriptionFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    borderTop: "1px solid #EDF0F4",
    padding: "11px 16px",
    background: "#FAFBFC",
  },
  hint: {
    fontSize: "11px",
    color: "#778696",
    lineHeight: 1.5,
  },
  counter: {
    fontSize: "11px",
    color: "#8996A3",
    whiteSpace: "nowrap",
  },
  payment: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "20px 22px",
    background: "#F2F5F8",
    border: "1px solid #E3E9EF",
    borderRadius: "13px",
  },
  paymentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
  },
  paymentIcon: {
    width: "43px",
    height: "43px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    background: "#FFFFFF",
    color: "#294B6C",
    fontSize: "19px",
  },
  paymentTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#233B52",
    margin: 0,
  },
  paymentSubtitle: {
    fontSize: "12px",
    color: "#788797",
    margin: "5px 0 0",
  },
  price: {
    display: "flex",
    alignItems: "baseline",
    gap: "5px",
    whiteSpace: "nowrap",
  },
  priceAmount: {
    fontSize: "30px",
    fontWeight: 750,
    letterSpacing: "-1px",
    color: "#173B5D",
  },
  priceCurrency: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#64788C",
  },
  actions: {
    marginTop: "23px",
  },
  submit: {
    width: "100%",
    minHeight: "57px",
    border: "none",
    borderRadius: "11px",
    background: "#173B5D",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 700,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "background 180ms ease, transform 180ms ease",
  },
  trust: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "15px",
    color: "#788797",
    fontSize: "11px",
    textAlign: "center",
    lineHeight: 1.6,
  },
  cancel: {
    display: "block",
    width: "fit-content",
    margin: "19px auto 0",
    color: "#65778A",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
  },
  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px 16px",
    marginBottom: "25px",
    border: "1px solid #F0CACA",
    borderRadius: "10px",
    background: "#FFF5F5",
    color: "#A33C3C",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};

function getSubmissionKey(caseType, description) {
  try {
    const saved = sessionStorage.getItem(PENDING_SUBMISSION_KEY);

    if (saved) {
      const previous = JSON.parse(saved);

      if (
        previous.caseType === caseType &&
        previous.description === description
      ) {
        return previous.submissionKey;
      }
    }
  } catch {
    // Generate a new key if stored data cannot be read.
  }

  const submissionKey = window.crypto.randomUUID();

  sessionStorage.setItem(
    PENDING_SUBMISSION_KEY,
    JSON.stringify({ submissionKey, caseType, description })
  );

  return submissionKey;
}

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
        if (active) setCheckingSession(false);
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

  const selectCategory = (value) => {
    setFormData((current) => ({
      ...current,
      caseType: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const caseType = formData.caseType.trim();
      const description = formData.description.trim();

      if (!caseType || !description) {
        throw new Error(
          "Please select a case category and describe your situation."
        );
      }

      if (description.length > 10000) {
        throw new Error("Your description is too long.");
      }

      const submissionKey = getSubmissionKey(caseType, description);

      const response = await customerRequest("/api/payments/create", {
        method: "POST",
        body: JSON.stringify({
          caseType,
          description,
          submissionKey,
        }),
      });

      const paymentData = await response.json();

      if (
        !paymentData.paymentId ||
        !paymentData.paypalOrderId ||
        !paymentData.approvalUrl
      ) {
        throw new Error(t("payment.errors.missingOrderDetails"));
      }

      const pendingPayment = {
        paymentId: paymentData.paymentId,
        paypalOrderId: paymentData.paypalOrderId,
        approvalUrl: paymentData.approvalUrl,
        submissionKey,
        caseType,
        description,
        customerEmail: formData.customerEmail,
      };

      sessionStorage.setItem(
        PENDING_PAYMENT_KEY,
        JSON.stringify(pendingPayment)
      );

      navigate("/payment", {
        state: pendingPayment,
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
    <main style={styles.page}>
      <style>{`
        .appeel-start-category:hover {
          border-color: #8DA5BC !important;
          background: #F7FAFC !important;
          transform: translateY(-2px);
        }

        .appeel-start-category:focus-visible,
        .appeel-start-submit:focus-visible,
        .appeel-start-cancel:focus-visible {
          outline: 3px solid rgba(63, 112, 157, 0.35);
          outline-offset: 3px;
        }

        .appeel-start-submit:hover:not(:disabled) {
          background: #294F73 !important;
          transform: translateY(-1px);
        }

        .appeel-start-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed !important;
        }

        .appeel-start-textarea:focus {
          outline: none;
        }

        .appeel-start-description:focus-within {
          border-color: #7894AE !important;
          box-shadow: 0 0 0 3px rgba(55, 95, 133, 0.08);
        }

        .appeel-start-cancel:hover {
          color: #173B5D !important;
          text-decoration: underline !important;
        }

        @media (max-width: 700px) {
          .appeel-start-page {
            padding: 12px 12px 35px !important;
          }

          .appeel-start-hero {
            padding: 28px 23px 25px !important;
          }

          .appeel-start-form {
            padding: 27px 22px 30px !important;
          }

          .appeel-start-profile {
            grid-template-columns: 1fr !important;
            gap: 17px !important;
          }

          .appeel-start-category-grid {
            grid-template-columns: 1fr !important;
          }

          .appeel-start-section-heading {
            align-items: flex-start !important;
          }

          .appeel-start-verified {
            font-size: 10px !important;
          }
        }

        @media (max-width: 420px) {
          .appeel-start-page {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }

          .appeel-start-hero {
            padding: 24px 18px !important;
          }

          .appeel-start-form {
            padding: 24px 16px !important;
          }

          .appeel-start-payment {
            padding: 16px 13px !important;
          }

          .appeel-start-payment-title {
            font-size: 12px !important;
          }

          .appeel-start-price {
            font-size: 25px !important;
          }
        }
      `}</style>

      <div style={styles.container}>
        <CustomerPageHeader
          title={t("startCase.pageTitle")}
          activeTab=""
        />

        <div style={styles.shell}>
          {/* HERO */}
          <header
            className="appeel-start-hero"
            style={styles.hero}
          >
            <div style={styles.eyebrow}>
              {t("startCase.eyebrow")}
            </div>

            <span style={styles.step}>
              01 <span style={{ opacity: 0.55 }}>/ 02</span>
            </span>

            <h1 style={styles.heroTitle}>
              {t("startCase.heading")}
            </h1>

            <p style={styles.heroDescription}>
              {t("startCase.description")}
            </p>

            <div style={styles.progress}>
              <span style={styles.progressActive} />
              <span style={styles.progressInactive} />
            </div>
          </header>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="appeel-start-form"
            style={styles.form}
          >
            {error && (
              <div style={styles.error} role="alert">
                <FiAlertTriangle
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <span>{error}</span>
              </div>
            )}

            {/* CUSTOMER PROFILE */}
            <section style={styles.section}>
              <div
                className="appeel-start-section-heading"
                style={styles.sectionHeading}
              >
                <div style={styles.sectionIcon}>
                  <FiUser />
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={styles.sectionTitle}>
                    {t("startCase.clientSectionTitle")}
                  </h3>
                  <p style={styles.sectionDescription}>
                    {t("startCase.clientSectionDescription")}
                  </p>
                </div>

                <span
                  className="appeel-start-verified"
                  style={styles.verified}
                >
                  <FiCheck /> {t("startCase.verified", {
                    defaultValue: "Verified",
                  })}
                </span>
              </div>

              <div
                className="appeel-start-profile"
                style={styles.profile}
              >
                <div style={styles.profileItem}>
                  <div style={styles.profileIcon}>
                    <FiUser />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <small style={styles.profileLabel}>
                      {t("startCase.fullName")}
                    </small>
                    <strong style={styles.profileValue}>
                      {checkingSession
                        ? "..."
                        : formData.customerName || "—"}
                    </strong>
                  </div>
                </div>

                <div style={styles.profileItem}>
                  <div style={styles.profileIcon}>
                    <FiMail />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <small style={styles.profileLabel}>
                      {t("startCase.registeredEmail")}
                    </small>
                    <strong style={styles.profileValue}>
                      {checkingSession
                        ? "..."
                        : formData.customerEmail || "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* CATEGORY */}
            <section style={styles.section}>
              <div
                className="appeel-start-section-heading"
                style={styles.sectionHeading}
              >
                <div style={styles.sectionIcon}>
                  <FiFileText />
                </div>

                <div>
                  <h3 style={styles.sectionTitle}>
                    {t("startCase.caseSectionTitle")}
                  </h3>
                  <p style={styles.sectionDescription}>
                    {t("startCase.caseSectionDescription")}
                  </p>
                </div>
              </div>

              <div
                className="appeel-start-category-grid"
                style={styles.categoryGrid}
              >
                {CASE_CATEGORIES.map((category) => {
                  const selected =
                    formData.caseType === category.value;

                  return (
                    <button
                      key={category.value}
                      type="button"
                      className="appeel-start-category"
                      onClick={() => selectCategory(category.value)}
                      aria-pressed={selected}
                      style={{
                        ...styles.category,
                        borderColor: selected
                          ? "#557B9E"
                          : "#E2E8EF",
                        background: selected
                          ? "#F0F5F9"
                          : "#FFFFFF",
                        boxShadow: selected
                          ? "0 0 0 2px rgba(67, 105, 141, 0.09)"
                          : "none",
                      }}
                    >
                      <span style={styles.categoryNumber}>
                        {category.number}
                      </span>

                      <span style={styles.categoryName}>
                        {t(
                          `startCase.categories.${category.key}`
                        )}
                      </span>

                      <span
                        style={{
                          ...styles.categoryCheck,
                          background: selected
                            ? "#315B7F"
                            : "transparent",
                          borderColor: selected
                            ? "#315B7F"
                            : "#D9E0E8",
                        }}
                      >
                        {selected && <FiCheck />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* DESCRIPTION */}
            <section style={styles.section}>
              <div style={styles.sectionHeading}>
                <div style={styles.sectionIcon}>
                  <FiFileText />
                </div>

                <div>
                  <h3 style={styles.sectionTitle}>
                    {t("startCase.caseDescription")}
                  </h3>
                  <p style={styles.sectionDescription}>
                    {t("startCase.descriptionGuidance", {
                      defaultValue:
                        "Tell us what happened and how we can help.",
                    })}
                  </p>
                </div>
              </div>

              <div
                className="appeel-start-description"
                style={styles.descriptionWrap}
              >
                <textarea
                  id="description"
                  name="description"
                  className="appeel-start-textarea"
                  rows={6}
                  maxLength={10000}
                  placeholder={t(
                    "startCase.descriptionPlaceholder"
                  )}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={styles.textarea}
                />

                <div style={styles.descriptionFooter}>
                  <small style={styles.hint}>
                    {t("startCase.confidentialityNote")}
                  </small>

                  <span style={styles.counter}>
                    {formData.description.length}/10000
                  </span>
                </div>
              </div>
            </section>

            {/* PAYMENT SUMMARY */}
            <section
              className="appeel-start-payment"
              style={styles.payment}
            >
              <div style={styles.paymentInfo}>
                <div style={styles.paymentIcon}>
                  <FiCreditCard />
                </div>

                <div>
                  <h4
                    className="appeel-start-payment-title"
                    style={styles.paymentTitle}
                  >
                    {t("startCase.paymentTitle", {
                      defaultValue: "One-time consultation fee",
                    })}
                  </h4>

                  <p style={styles.paymentSubtitle}>
                    {t("startCase.paymentSubtitle", {
                      defaultValue: "Secure payment through PayPal",
                    })}
                  </p>
                </div>
              </div>

              <div style={styles.price}>
                <strong
                  className="appeel-start-price"
                  style={styles.priceAmount}
                >
                  99
                </strong>
                <span style={styles.priceCurrency}>SEK</span>
              </div>
            </section>

            {/* CHECKOUT */}
            <div style={styles.actions}>
              <button
                type="submit"
                className="appeel-start-submit"
                style={styles.submit}
                disabled={
                  loading ||
                  checkingSession ||
                  !formData.customerName ||
                  !formData.customerEmail
                }
              >
                <span>
                  {checkingSession
                    ? t("startCase.checkingSession")
                    : loading
                      ? t("startCase.creatingCase")
                      : t("startCase.continueToPayment", {
                          defaultValue: "Continue to secure payment",
                        })}
                </span>

                {!loading && <FiArrowRight />}
              </button>

              <div style={styles.trust}>
                <FiLock />
                <span>
                  {t("startCase.paymentTrust", {
                    defaultValue:
                      "Your case is created only after successful payment verification.",
                  })}
                </span>
              </div>

              <Link
                to="/customer/dashboard"
                className="appeel-start-cancel"
                style={styles.cancel}
              >
                {t("startCase.cancel")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
