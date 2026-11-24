import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
    icon: FileSearch,
    featured: true,
    titleKey: "initialReview.title",
    price: "99 SEK",
    priceNoteKey: "initialReview.priceNote",
    descriptionKey: "initialReview.description",
    detailKey: "initialReview.detail",
    buttonKey: "initialReview.button",
  },
  {
    id: "arn-complaint",
    icon: Scale,
    featured: false,
    titleKey: "arnComplaint.title",
    price: "1,490 SEK",
    priceNoteKey: "arnComplaint.priceNote",
    descriptionKey: "arnComplaint.description",
    detailKey: "arnComplaint.detail",
    buttonKey: "arnComplaint.button",
  },
  {
    id: "district-court",
    icon: Gavel,
    featured: false,
    titleKey: "districtCourt.title",
    price: null,
    priceNoteKey: "districtCourt.priceNote",
    descriptionKey: "districtCourt.description",
    detailKey: "districtCourt.detail",
    buttonKey: "districtCourt.button",
  },
  {
    id: "tenancy-arbitration",
    icon: Home,
    featured: false,
    titleKey: "tenancyArbitration.title",
    price: null,
    priceNoteKey: "tenancyArbitration.priceNote",
    descriptionKey: "tenancyArbitration.description",
    detailKey: "tenancyArbitration.detail",
    buttonKey: "tenancyArbitration.button",
  },
];

function PricingSection() {
  const { t, i18n } = useTranslation();

  return (
    <section id="pricing" className="home-pricing-section">
      <div className="home-pricing-container">
        <header className="home-pricing-heading">
          <h2>{t("pricing.heading")}</h2>

          <p>
            <b>{t("pricing.subtitle")}</b>
          </p>
        </header>

        <div className="home-pricing-grid">
          {services.map((service) => {
            const Icon = service.icon;

            const price =
              service.price ||
              (i18n.resolvedLanguage === "sv"
                ? "Från 2,900 SEK"
                : "From 2,900 SEK");

            return (
              <article
                className={`home-pricing-card ${
                  service.featured ? "featured" : ""
                }`}
                key={service.id}
              >
                {service.featured && (
                  <span className="home-pricing-badge">
                    {t("pricing.startHere")}
                  </span>
                )}

                <div className="home-pricing-icon">
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <p className="home-pricing-detail">
                  {t(`pricing.${service.id === "initial-review"
                    ? "initialReview"
                    : service.id === "arn-complaint"
                    ? "arnComplaint"
                    : service.id === "district-court"
                    ? "districtCourt"
                    : "tenancyArbitration"}.detail`)}
                </p>

                <h3>{t(`pricing.${service.id === "initial-review"
                  ? "initialReview"
                  : service.id === "arn-complaint"
                  ? "arnComplaint"
                  : service.id === "district-court"
                  ? "districtCourt"
                  : "tenancyArbitration"}.title`)}</h3>

                <div className="home-pricing-price">{price}</div>

                <p className="home-pricing-note">
                  {t(`pricing.${service.id === "initial-review"
                    ? "initialReview"
                    : service.id === "arn-complaint"
                    ? "arnComplaint"
                    : service.id === "district-court"
                    ? "districtCourt"
                    : "tenancyArbitration"}.priceNote`)}
                </p>

                <p className="home-pricing-description">
                  {t(`pricing.${service.id === "initial-review"
                    ? "initialReview"
                    : service.id === "arn-complaint"
                    ? "arnComplaint"
                    : service.id === "district-court"
                    ? "districtCourt"
                    : "tenancyArbitration"}.description`)}
                </p>

                <Link
                  to={`/customer/start-case?service=${service.id}`}
                  className={`home-pricing-button ${
                    service.featured ? "primary" : "secondary"
                  }`}
                >
                  <span>
                    {t(`pricing.${service.id === "initial-review"
                      ? "initialReview"
                      : service.id === "arn-complaint"
                      ? "arnComplaint"
                      : service.id === "district-court"
                      ? "districtCourt"
                      : "tenancyArbitration"}.button`)}
                  </span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="home-pricing-footer">
          <CheckCircle2 size={19} aria-hidden="true" />

          <p>
            <b>{t("pricing.footerNote")}</b>
          </p>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;