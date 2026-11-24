
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function HomeAccess() {
  const { t } = useTranslation();

  const adminToken = localStorage.getItem("adminToken");
  const lawyerToken = localStorage.getItem("lawyerToken");
  const customerToken = localStorage.getItem("customerToken");

  const dashboardPath = adminToken
    ? "/admin/dashboard"
    : lawyerToken
      ? "/lawyer/dashboard"
      : customerToken
        ? "/customer/dashboard"
        : null;

  const isLoggedIn = Boolean(dashboardPath);

  const primaryPath = customerToken
    ? "/customer/start-case"
    : isLoggedIn
      ? dashboardPath
      : "/customer/register";

  return (
    <section className="home-access-section">
      <div className="home-access-container">
        <div className="home-access-glow" aria-hidden="true" />

        <div className="home-access-content">
          <span className="home-access-eyebrow">
            {t("homeAccess.eyebrow")}
          </span>

          <h2>
            {t("homeAccess.heading")}
            <br />
            <span>{t("homeAccess.headingHighlight")}</span>
          </h2>

          <p className="home-access-description">
            {t("homeAccess.description")}
          </p>

          <div className="home-access-actions">
            <Link to={primaryPath} className="home-access-primary">
              {customerToken
                ? t("homeAccess.continueCase")
                : isLoggedIn
                  ? t("homeAccess.dashboard")
                  : t("homeAccess.startCase")}

              <span aria-hidden="true">↗</span>
            </Link>

            {!isLoggedIn && (
              <Link
                to="/customer/login"
                className="home-access-secondary"
              >
                {t("homeAccess.existingAccount")}{" "}
                <strong>{t("homeAccess.signIn")}</strong>
              </Link>
            )}
          </div>

          <div className="home-access-trust">
            <span>
              <span className="home-access-check">€</span>
              {t("homeAccess.transparentPricing")}
            </span>

            <span className="home-access-divider" aria-hidden="true" />

            <span>
              <span className="home-access-check">◇</span>
              {t("homeAccess.noObligation")}
            </span>

            <span className="home-access-divider" aria-hidden="true" />

            <span>
              <span className="home-access-check">♧</span>
              {t("homeAccess.secureHandling")}
            </span>
          </div>
        </div>

        <div className="home-access-visual" aria-hidden="true">
          <div className="home-access-orbit home-access-orbit-one" />
          <div className="home-access-orbit home-access-orbit-two" />

          <div className="home-access-symbol">
            <span>§</span>
          </div>

          <div className="home-access-floating-card">
            <span className="home-access-card-icon">✓</span>
            <div>
              <strong>{t("homeAccess.visualMessage")}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeAccess;
