
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  ArrowUpRight,
  Check,
  ShieldCheck,
  MessageCircle,
  FileCheck2,
} from "lucide-react";

function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="home-about">
      <div className="home-about-container">

        {/* LEFT VISUAL PANEL */}
        <div className="home-about-visual">
          <div className="about-visual-top">
            <span className="about-visual-label">
              {t("about.visualLabel")}
            </span>
            <span className="about-visual-line" />
          </div>

          <div className="about-visual-main">
            <h3>
              {t("about.visualTitle1")}
              <br />
              {t("about.visualTitle2")}
              <br />
              <span>{t("about.visualTitle3")}</span>
            </h3>

            <p>{t("about.visualDescription")}</p>
          </div>

          <div className="about-visual-bottom">
            <div className="about-visual-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>{t("about.clarityTitle")}</strong>
              <span>{t("about.clarityDescription")}</span>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="home-about-content">

          <span className="section-eyebrow">
            {t("about.eyebrow")}
          </span>

          <h2>
            {t("about.heading")}
            <span>{t("about.headingHighlight")}</span>
          </h2>

          <p className="home-about-intro">
            {t("about.intro")}
          </p>

          <p className="home-about-description">
            {t("about.description")}
          </p>

          <div className="home-about-benefits">

            <div className="home-about-benefit">
              <div className="about-benefit-icon">
                <Check size={18} />
              </div>
              <div>
                <strong>{t("about.benefit1Title")}</strong>
                <span>{t("about.benefit1Description")}</span>
              </div>
            </div>

            <div className="home-about-benefit">
              <div className="about-benefit-icon">
                <FileCheck2 size={18} />
              </div>
              <div>
                <strong>{t("about.benefit2Title")}</strong>
                <span>{t("about.benefit2Description")}</span>
              </div>
            </div>

            <div className="home-about-benefit">
              <div className="about-benefit-icon">
                <MessageCircle size={18} />
              </div>
              <div>
                <strong>{t("about.benefit3Title")}</strong>
                <span>{t("about.benefit3Description")}</span>
              </div>
            </div>

          </div>

          <Link to="/contact" className="home-about-button">
            {t("about.contactButton")}
            <ArrowUpRight size={19} />
          </Link>

        </div>
      </div>
    </section>
  );
}

export default AboutSection;
