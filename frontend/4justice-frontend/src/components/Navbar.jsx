
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const adminToken = localStorage.getItem("adminToken");
  const lawyerToken = localStorage.getItem("lawyerToken");
  const customerToken = localStorage.getItem("customerToken");

  let dashboardPath = "/";
  let loginPath = "/login";
  let isLoggedIn = false;

  if (adminToken) {
    dashboardPath = "/admin/dashboard";
    loginPath = "/admin/login";
    isLoggedIn = true;
  } else if (lawyerToken) {
    dashboardPath = "/lawyer/dashboard";
    loginPath = "/lawyer/login";
    isLoggedIn = true;
  } else if (customerToken) {
    dashboardPath = "/customer/dashboard";
    loginPath = "/customer/login";
    isLoggedIn = true;
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isHomePage = location.pathname === "/";

  const sectionLink = (sectionId) =>
    isHomePage ? `#${sectionId}` : `/#${sectionId}`;

  return (
    <header className="home-header">
      <div className="home-header-container">
        <NavLink
          to="/"
          className="home-logo"
          aria-label="APPEEL Home"
          onClick={closeMobileMenu}
        >
          <span className="logo-symbol" aria-hidden="true">
            ⚖️
          </span>

          <span className="logo-brand">
            <span className="brand-name">APPEEL</span>
            <span className="brand-tag">
              Legal support, made simpler
            </span>
          </span>
        </NavLink>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen((previous) => !previous)
          }
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <nav
          className={`home-nav-actions ${
            mobileMenuOpen ? "open" : ""
          }`}
        >
          <NavLink to="/" onClick={closeMobileMenu}>
            Home
          </NavLink>

          <a
            href={sectionLink("pricing")}
            onClick={closeMobileMenu}
          >
            Services &amp; Pricing
          </a>

          <a
            href={sectionLink("trust")}
            onClick={closeMobileMenu}
          >
            Why APPEEL
          </a>

          <a href="#journey">Your Journey</a>

          <a
            href={sectionLink("about")}
            onClick={closeMobileMenu}
          >
            About Us
          </a>

          <NavLink
            to="/contact"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            Contact Us
          </NavLink>

          <NavLink
            to={isLoggedIn ? dashboardPath : loginPath}
            className="home-login-btn"
            onClick={closeMobileMenu}
          >
            {isLoggedIn ? "Dashboard" : "Sign in"}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
