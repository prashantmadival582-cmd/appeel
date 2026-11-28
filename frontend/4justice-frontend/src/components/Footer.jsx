
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import appeelLogo from "../assets/appeel-logo.png";

import {
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
} from "react-icons/fa6";

import { FiArrowUp } from "react-icons/fi";

const socialLinks = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/",
    Icon: FaLinkedinIn,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/",
    Icon: FaInstagram,
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/",
    Icon: FaFacebookF,
  },
  {
    name: "X",
    url: "https://x.com/",
    Icon: FaXTwitter,
  },
];

function Footer() {
  const location = useLocation();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (!section) return;

    const navbarHeight =
      document.querySelector(".home-header")?.offsetHeight || 80;

    const sectionPosition =
      section.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: sectionPosition - navbarHeight - 20,
      behavior: "smooth",
    });
  };

  const navigateToSection = (event, sectionId) => {
    event.preventDefault();

    if (location.pathname === "/") {
      scrollToSection(sectionId);
      window.history.replaceState(null, "", `/#${sectionId}`);
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  const backToTop = () => {
    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.location.href = "/";
    }
  };

  return (
    <footer className="appeel-footer">
      <div className="footer-main">

        {/* LEFT: BRAND */}
        <div className="footer-brand">
          <NavLink
            to="/"
            className="footer-logo"
            aria-label={t("footer.homeAria")}
          >
            <img
              src={appeelLogo}
              alt="APPEEL"
              className="footer-brand-logo appeel-logo"
            />
          </NavLink>

          <p className="footer-description">
            Legal issues can feel complicated. Getting clear
            information about your options shouldn't.
          </p>
        </div>

        {/* CENTRE: EXPLORE */}
        <div className="footer-column">
          <h3>{t("footer.explore")}</h3>

          <ul>
            <li>
              <NavLink to="/">
                {t("footer.home")}
              </NavLink>
            </li>

            <li>
              <a
                href="/#about"
                onClick={(event) =>
                  navigateToSection(event, "about")
                }
              >
                {t("footer.about")}
              </a>
            </li>

            <li>
              <a
                href="/#pricing"
                onClick={(event) =>
                  navigateToSection(event, "pricing")
                }
              >
                {t("footer.services")}
              </a>
            </li>

            <li>
              <NavLink to="/contact">
                {t("footer.contact")}
              </NavLink>
            </li>
          </ul>
        </div>

        {/* RIGHT: FOLLOW APPEEL */}
        <div className="footer-social">
          <h3>{t("footer.followUs")}</h3>

          <div className="footer-social-links">
            {socialLinks.map(({ name, url, Icon }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.socialAria", {
                  platform: name,
                })}
                title={name}
              >
                <Icon aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>
          © {currentYear} APPEEL. {t("footer.rights")}
        </p>

        <div className="footer-bottom-links">
          <span>
            {t("footer.developedBy")}{" "}
            <a
              href="https://austratech.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-company-link"
            >
              <strong>Austratech</strong>
            </a>
          </span>
        </div>

        <button
          type="button"
          className="footer-back-to-top"
          onClick={backToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <FiArrowUp aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}

export default Footer;
