
import { Link } from "react-router-dom";

function HomeAccess() {
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
            YOUR NEXT STEP STARTS HERE
          </span>

          <h2>
            Your legal matter.
            <br />
            <span>Your next move.</span>
          </h2>

          <p className="home-access-description">
            Get clear on your options and move forward with
            straightforward, affordable legal support.
          </p>

          <div className="home-access-actions">
            <Link to={primaryPath} className="home-access-primary">
              {customerToken
                ? "Continue My Case"
                : isLoggedIn
                  ? "Go to Dashboard"
                  : "Start My Case"}

              <span aria-hidden="true">↗</span>
            </Link>

            {!isLoggedIn && (
              <Link
                to="/customer/login"
                className="home-access-secondary"
              >
                Already have an account? <strong>Sign in</strong>
              </Link>
            )}
          </div>

          
<div className="home-access-trust">
  <span>
    <span className="home-access-check">€</span>
    Transparent pricing
  </span>

  <span className="home-access-divider" aria-hidden="true" />

  <span>
    <span className="home-access-check">◇</span>
    No obligation
  </span>

  <span className="home-access-divider" aria-hidden="true" />

  <span>
    <span className="home-access-check">♧</span>
    Secure case handling
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
              <strong>A clearer way forward</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeAccess;
