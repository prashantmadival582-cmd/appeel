
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Mail,
  MessageCircle,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import API_BASE_URL from "../../api/api";

const API_URL = `${API_BASE_URL}/api/contact`;

function ContactSection() {
  const { t } = useTranslation();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const contactData = {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      subject: formData.get("subject").trim(),
      message: formData.get("message").trim(),
    };

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || t("contact.errors.sendFailed")
        );
      }

      form.reset();
      setSubmitted(true);
    } catch (err) {
      console.error("Contact form error:", err);

      setError(
        err.message || t("contact.errors.general")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="home-contact">
      <div className="home-contact-container">

        {/* LEFT CONTACT CONTENT */}
        <div className="home-contact-intro">
          <span className="section-eyebrow">
            {t("contact.eyebrow")}
          </span>

          <h2>
            {t("contact.heading")}
            <span>{t("contact.headingHighlight")}</span>
          </h2>

          <p className="home-contact-description">
            {t("contact.description")}
          </p>

          <div className="home-contact-highlights">
            <div className="home-contact-highlight">
              <div className="contact-highlight-icon">
                <MessageCircle size={21} />
              </div>

              <div>
                <h4>{t("contact.highlight1Title")}</h4>
                <p>{t("contact.highlight1Description")}</p>
              </div>
            </div>

            <div className="home-contact-highlight">
              <div className="contact-highlight-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h4>{t("contact.highlight2Title")}</h4>
                <p>{t("contact.highlight2Description")}</p>
              </div>
            </div>
          </div>

          <div className="home-contact-direct">
            <div className="contact-direct-icon">
              <Mail size={20} />
            </div>

            <div>
              <span>{t("contact.generalEnquiries")}</span>
              <p>{t("contact.generalEnquiriesDescription")}</p>
            </div>
          </div>
        </div>

        {/* RIGHT CONTACT FORM */}
        <div className="home-contact-form-card">
          <div className="home-contact-form-heading">
            <span>{t("contact.formEyebrow")}</span>
            <h3>{t("contact.formTitle")}</h3>
            <p>{t("contact.formDescription")}</p>
          </div>

          {submitted ? (
            <div className="home-contact-success" role="status">
              <div className="contact-success-icon">
                <CheckCircle2 size={34} />
              </div>

              <h3>{t("contact.successTitle")}</h3>

              <p>{t("contact.successDescription")}</p>

              <button
                type="button"
                className="home-contact-submit"
                onClick={() => {
                  setSubmitted(false);
                  setError("");
                }}
              >
                {t("contact.sendAnother")}
                <ArrowUpRight size={18} />
              </button>
            </div>
          ) : (
            <form className="home-contact-form" onSubmit={handleSubmit}>
              <div className="home-contact-form-row">
                <div className="contact-form-field">
                  <label htmlFor="contact-name">
                    {t("contact.fullName")}
                  </label>

                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder={t("contact.fullNamePlaceholder")}
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="contact-form-field">
                  <label htmlFor="contact-email">
                    {t("contact.email")}
                  </label>

                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder={t("contact.emailPlaceholder")}
                    autoComplete="email"
                    maxLength={150}
                    required
                  />
                </div>
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-subject">
                  {t("contact.subject")}
                </label>

                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder={t("contact.subjectPlaceholder")}
                  maxLength={150}
                  required
                />
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-message">
                  {t("contact.message")}
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  placeholder={t("contact.messagePlaceholder")}
                  maxLength={5000}
                  required
                />
              </div>

              {error && (
                <p className="contact-form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="home-contact-submit"
                disabled={loading}
              >
                {loading
                  ? t("contact.sending")
                  : t("contact.sendEnquiry")}

                {!loading && <ArrowUpRight size={19} />}
              </button>

              <div className="home-contact-form-note">
                <ShieldCheck size={15} />
                <span>{t("contact.formNote")}</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
