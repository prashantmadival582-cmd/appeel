
import { NavLink, useLocation } from "react-router-dom";

import {
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
} from "react-icons/fa6";

import { FaArrowUpRightFromSquare } from "react-icons/fa6";

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
  const currentYear = new Date().getFullYear();

  const navigateToSection = (event, sectionId) => {
    event.preventDefault();

    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        window.history.replaceState(null, "", `/#${sectionId}`);
      } else {
        console.warn(`Footer navigation: #${sectionId} was not found.`);
      }
    } else {
      // Navigate to the homepage and its section.
      window.location.href = `/#${sectionId}`;
    }
  };

  const backToTop = (event) => {
    event.preventDefault();

    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.href = "/";
    }
  };

  return (
    <footer className="appeel-footer">
      <div className="footer-main">
        {/* Brand */}
        <div className="footer-brand">
          <NavLink
            to="/"
            className="footer-logo"
            aria-label="APPEEL home"
          >
            APPEEL<span>.</span>
          </NavLink>

          <p className="footer-description">
           “Simple, affordable legal support you can trust.”
          </p>

          {/* Social media icons */}
          <div className="footer-social">
            <h3>Follow APPEEL</h3>

            <div className="footer-social-links">
              {socialLinks.map(({ name, url, Icon }) =>
                url.trim() ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`APPEEL on ${name}`}
                    title={name}
                  >
                    <Icon aria-hidden="true" />
                  </a>
                ) : (
                  <span
                    key={name}
                    className="footer-social-icon-disabled"
                    aria-label={name}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Website navigation */}
        <div className="footer-column">
          <h3>Explore</h3>

          <ul>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>

            <li>
              <a
                href="/#pricing"
                onClick={(event) => navigateToSection(event, "pricing")}
              >
                Services &amp; Pricing
              </a>
            </li>

            <li>
              <a
                href="/#trust"
                onClick={(event) => navigateToSection(event, "trust")}
              >
                Why APPEEL
              </a>
            </li>

            <li>
              <a
                href="/#about"
                onClick={(event) => navigateToSection(event, "about")}
              >
                About Us
              </a>
            </li>


          </ul>
        </div>

        {/* One clear call to action */}
        <div className="footer-cta">
          <h3>Need help with a legal matter?</h3>

          <NavLink to="/customer/register" className="footer-cta-button">
            Start My Case
            <FaArrowUpRightFromSquare aria-hidden="true" />
          </NavLink>


          <NavLink to="/contact" className="footer-contact-link">
            Have a question? Contact us
          </NavLink>
        </div>
      </div>

      {/* Copyright and bottom navigation */}
      <div className="footer-bottom">
        <p>© {currentYear} APPEEL. All rights reserved.</p>

        <div className="footer-bottom-links">
          <NavLink to="/contact">Contact</NavLink>

          <a href="#top" onClick={backToTop}>
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
