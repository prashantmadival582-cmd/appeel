
import { Link } from "react-router-dom";

function AdminDetailLayout({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  status,
  children,
}) {
  return (
    <section className="admin-detail-page">

      <header className="admin-detail-header">
        <div className="admin-detail-heading">
          <Link to={backTo} className="admin-detail-back">
            ← {backLabel}
          </Link>

          <h1>{title}</h1>

          {subtitle && <p>{subtitle}</p>}
        </div>

        {status && (
          <span className="admin-detail-status">
            {status}
          </span>
        )}
      </header>

      <div className="admin-detail-content">
        {children}
      </div>

    </section>
  );
}

export default AdminDetailLayout;
