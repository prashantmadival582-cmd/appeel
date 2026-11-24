import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiMenu, FiX } from "react-icons/fi";
import enFlag from "../assets/language-switcher-english.png";
import svFlag from "../assets/language-switcher-sweeden.png";

import appeelLogo from "../assets/appeel-logo.png";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.resolvedLanguage || "en";

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("appeelLanguage", language);
  };

  const adminToken = localStorage.getItem("adminToken");
  const lawyerToken = localStorage.getItem("lawyerToken");
  const customerToken = localStorage.getItem("customerToken");

  let dashboardPath = "/";
  let isLoggedIn = false;

  if (adminToken) {
    dashboardPath = "/admin/dashboard";
    isLoggedIn = true;
  } else if (lawyerToken) {
    dashboardPath = "/lawyer/dashboard";
    isLoggedIn = true;
  } else if (customerToken) {
    dashboardPath = "/customer/dashboard";
    isLoggedIn = true;
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isHomePage = location.pathname === "/";

  const sectionLink = (sectionId) =>
    isHomePage ? `#${sectionId}` : `/#${sectionId}`;

  // Smooth scroll with navbar offset
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

    closeMobileMenu();
  };

  // Handle section navigation when arriving from another page
  useEffect(() => {
    if (isHomePage && location.hash) {
      const sectionId = location.hash.substring(1);

      const timer = setTimeout(() => {
        scrollToSection(sectionId);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isHomePage, location.hash]);

  const handleSectionClick = (event, sectionId) => {
    if (isHomePage) {
      event.preventDefault();
      scrollToSection(sectionId);
    } else {
      closeMobileMenu();
    }
  };

  return (
    <header className="home-header">
      <div className="home-header-container">
        <NavLink
          to="/"
          className="home-logo"
          aria-label={t("navbar.home")}
          onClick={closeMobileMenu}
        >
          <img
            src={appeelLogo}
            alt="APPEEL"
            className="navbar-brand-logo"
          />

        </NavLink>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={
            mobileMenuOpen
              ? t("navbar.closeMenu")
              : t("navbar.openMenu")
          }
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen((previous) => !previous)
          }
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>

        <nav
          className={`home-nav-actions ${mobileMenuOpen ? "open" : ""}`}
        >
          <NavLink to="/" onClick={closeMobileMenu}>
            {t("navbar.home")}
          </NavLink>

          <a
            href={sectionLink("about")}
            onClick={(e) => handleSectionClick(e, "about")}
          >
            {t("navbar.about")}
          </a>

          <a
            href={sectionLink("pricing")}
            onClick={(e) => handleSectionClick(e, "pricing")}
          >
            {t("navbar.services")}
          </a>

          <NavLink
            to="/contact"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            {t("navbar.contact")}
          </NavLink>

          <NavLink
            to={isLoggedIn ? dashboardPath : "/login"}
            className="home-login-btn"
            onClick={closeMobileMenu}
          >
            {isLoggedIn
              ? t("navbar.dashboard")
              : t("navbar.login")}
          </NavLink>

          {/* Language selector */}
          <div className="language-switcher">
            <button
              type="button"
              className={currentLanguage === "en" ? "active" : ""}
              onClick={() => changeLanguage("en")}
              aria-pressed={currentLanguage === "en"}
              aria-label="English"
              title="English"
            >
              <img
                src={enFlag}
                alt="English"
                className="lang-flag-img"
              />
            </button>

            <span>|</span>

            <button
              type="button"
              className={currentLanguage === "sv" ? "active" : ""}
              onClick={() => changeLanguage("sv")}
              aria-pressed={currentLanguage === "sv"}
              aria-label="Svenska"
              title="Svenska"
            >
              <img
                src={svFlag}
                alt="Svenska"
                className="lang-flag-img"
              />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
