
import React, { useState } from "react";
import {
  Mail,
  MessageCircle,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

const API_URL = "http://localhost:8081/api/contact";

function ContactSection() {
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
          result.message || "Unable to send your enquiry. Please try again."
        );
      }

      form.reset();
      setSubmitted(true);
    } catch (err) {
      console.error("Contact form error:", err);
      setError(
        err.message || "Something went wrong. Please try again later."
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
          <span className="section-eyebrow">GET IN TOUCH</span>

          <h2>
            Let's make your next step
            <span> clearer.</span>
          </h2>

          <p className="home-contact-description">
            Legal questions can be difficult to navigate.
            Start by telling us what's on your mind.
            We're here to help you understand your options.
          </p>

          <div className="home-contact-highlights">
            <div className="home-contact-highlight">
              <div className="contact-highlight-icon">
                <MessageCircle size={21} />
              </div>

              <div>
                <h4>Start with a conversation</h4>
                <p>
                  You don't need to know which service you need before contacting us.
                </p>
              </div>
            </div>

            <div className="home-contact-highlight">
              <div className="contact-highlight-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h4>Share only what is necessary</h4>
                <p>
                  Avoid including sensitive personal or confidential case information
                  in this general enquiry form.
                </p>
              </div>
            </div>
          </div>

          <div className="home-contact-direct">
            <div className="contact-direct-icon">
              <Mail size={20} />
            </div>

            <div>
              <span>GENERAL ENQUIRIES</span>
              <p>Use the form to send us your question.</p>
            </div>
          </div>
        </div>

        {/* RIGHT CONTACT FORM */}
        <div className="home-contact-form-card">
          <div className="home-contact-form-heading">
            <span>WE'RE HERE TO LISTEN</span>
            <h3>Send us a message</h3>
            <p>
              Fill in the details below and tell us how we can help.
            </p>
          </div>

          {submitted ? (
            <div className="home-contact-success" role="status">
              <div className="contact-success-icon">
                <CheckCircle2 size={34} />
              </div>

              <h3>Thank you for your enquiry.</h3>

              <p>
                Your enquiry has been sent successfully.
                Our team will review your message.
              </p>

              <button
                type="button"
                className="home-contact-submit"
                onClick={() => {
                  setSubmitted(false);
                  setError("");
                }}
              >
                Send another enquiry
                <ArrowUpRight size={18} />
              </button>
            </div>
          ) : (
            <form className="home-contact-form" onSubmit={handleSubmit}>
              <div className="home-contact-form-row">
                <div className="contact-form-field">
                  <label htmlFor="contact-name">Full name</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="contact-form-field">
                  <label htmlFor="contact-email">Email address</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={150}
                    required
                  />
                </div>
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-subject">
                  What is your enquiry about?
                </label>

                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder="Enter a short subject"
                  maxLength={150}
                  required
                />
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-message">Your message</label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  placeholder="Tell us how we can help..."
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
                {loading ? "Sending..." : "Send enquiry"}
                {!loading && <ArrowUpRight size={19} />}
              </button>

              <div className="home-contact-form-note">
                <ShieldCheck size={15} />
                <span>
                  Please don't include confidential case documents or sensitive details.
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
