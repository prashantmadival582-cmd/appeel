import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  FileSearch,
  Scale,
  Gavel,
  Home,
} from "lucide-react";

const services = [
  {
    id: "initial-review",
    title: "Initial Case Review",
    price: "99 SEK",
    priceNote: "One-time starting fee",
    description:
      "Share your situation and documents to get an initial assessment of your next steps.",
    detail: "A simple place to start",
    icon: FileSearch,
    featured: true,
    buttonText: "Start with a review",
  },
  {
    id: "arn-complaint",
    title: "ARN Complaint",
    price: "1,490 SEK",
    priceNote: "Fixed price",
    description:
      "Get help reviewing your materials and preparing an ARN complaint.",
    detail: "For consumer disputes",
    icon: Scale,
    featured: false,
    buttonText: "Choose ARN support",
  },
  {
    id: "district-court",
    title: "District Court Defence",
    price: "From 2,900 SEK",
    priceNote: "Based on case scope",
    description:
      "Discuss your case and the support needed to prepare a defence.",
    detail: "Scope confirmed before proceeding",
    icon: Gavel,
    featured: false,
    buttonText: "Discuss your case",
  },
  {
    id: "tenancy-arbitration",
    title: "Tenancy & Arbitration",
    price: "From 2,900 SEK",
    priceNote: "Based on case scope",
    description:
      "Get help understanding your dispute, reviewing evidence, and planning next steps.",
    detail: "Scope confirmed before proceeding",
    icon: Home,
    featured: false,
    buttonText: "Discuss your case",
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="home-pricing-section">
      <div className="home-pricing-container">
        <header className="home-pricing-heading">
          <h2>Legal support, with clear prices.</h2>

          <p><b>Know the cost and support before you proceed.</b>
          </p>
        </header>

        <div className="home-pricing-grid">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                className={`home-pricing-card ${
                  service.featured ? "featured" : ""
                }`}
                key={service.id}
              >
                {service.featured && (
                  <span className="home-pricing-badge">
                    START HERE
                  </span>
                )}

                <div className="home-pricing-icon">
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <p className="home-pricing-detail">
                  {service.detail}
                </p>

                <h3>{service.title}</h3>

                <div className="home-pricing-price">
                  {service.price}
                </div>

                <p className="home-pricing-note">
                  {service.priceNote}
                </p>

                <p className="home-pricing-description">
                  {service.description}
                </p>

                <Link
                  to={`/customer/start-case?service=${service.id}`}
                  className={`home-pricing-button ${
                    service.featured ? "primary" : "secondary"
                  }`}
                >
                  <span>{service.buttonText}</span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="home-pricing-footer">
          <CheckCircle2 size={19} aria-hidden="true" />

          <p>
        <b>    No hidden fees. Any additional work is discussed with you
            and requires your approval before proceeding.</b>
          </p>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;