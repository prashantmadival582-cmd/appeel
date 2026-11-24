
import React from "react";
import { useTranslation } from "react-i18next";

import benefitCard1 from "../../assets/home-benefit-card1.png";
import benefitCard2 from "../../assets/home-benefit-card 2.png";
import benefitCard3 from "../../assets/home-benefit-card3.png";
import benefitCard4 from "../../assets/home-benefit-card 4.png";

const benefits = [
  {
    number: "01",
    titleKey: "benefits.card1Title",
    descriptionKey: "benefits.card1Description",
    image: benefitCard1,
  },
  {
    number: "02",
    titleKey: "benefits.card2Title",
    descriptionKey: "benefits.card2Description",
    image: benefitCard2,
  },
  {
    number: "03",
    titleKey: "benefits.card3Title",
    descriptionKey: "benefits.card3Description",
    image: benefitCard3,
  },
  {
    number: "04",
    titleKey: "benefits.card4Title",
    descriptionKey: "benefits.card4Description",
    image: benefitCard4,
  },
];

function BenefitsSection() {
  const { t } = useTranslation();

  return (
    <section id="trust" className="benefits-modern-section">
      <div className="benefits-modern-container">

        <header className="benefits-modern-heading">
          <span className="benefits-modern-eyebrow">
            <span className="benefits-modern-eyebrow-line" />
            {t("benefits.eyebrow")}
          </span>

          <h2>{t("benefits.heading")}</h2>

          <p>{t("benefits.subtitle")}</p>
        </header>

        <div className="benefits-modern-grid">
          {benefits.map((benefit) => (
            <article
              className="benefits-modern-card"
              key={benefit.titleKey}
            >
              <div className="benefits-modern-image-wrap">
                <img
                  src={benefit.image}
                  alt=""
                  className="benefits-modern-image"
                  loading="lazy"
                  decoding="async"
                />

                <span className="benefits-modern-number">
                  {benefit.number}
                </span>
              </div>

              <div className="benefits-modern-content">
                <h3>{t(benefit.titleKey)}</h3>

                <p>{t(benefit.descriptionKey)}</p>

                <span
                  className="benefits-modern-card-line"
                  aria-hidden="true"
                />
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

export default BenefitsSection;
