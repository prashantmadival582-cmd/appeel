
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

import heroImage2 from "../../assets/hero2.png";
import heroImage3 from "../../assets/hero22.jpg";

function HomeHero() {
  const { t } = useTranslation();

  const heroImages = [heroImage2, heroImage3];
  const [currentHero, setCurrentHero] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((previous) => (previous + 1) % heroImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="home-hero-section">
      {/* Background image slider */}
      {heroImages.map((image, index) => (
        <div
          key={image}
          className={`home-hero-background ${
            currentHero === index ? "active" : ""
          }`}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ))}

      {/* Navy overlay */}
      <div className="home-hero-overlay" />

      {/* Hero content */}
      <div className="home-hero-container">
        <div className="home-hero-content">
          <h1>
            {t("hero.title")}
            <br />
            <span>{t("hero.subtitle")}</span>
          </h1>

          <p className="home-hero-description">
            {t("hero.description")}
          </p>

          <div
            className="home-hero-trust"
            aria-label={t("hero.benefitsLabel")}
          >
            <div className="home-hero-trust-item">
              <CheckCircle2 aria-hidden="true" />
              <span>{t("hero.transparentPricing")}</span>
            </div>

            <div className="home-hero-trust-item">
              <BadgeCheck aria-hidden="true" />
              <span>{t("hero.noHiddenFees")}</span>
            </div>

            <div className="home-hero-trust-item">
              <ShieldCheck aria-hidden="true" />
              <span>{t("hero.secureHandling")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
