
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiX,
  FiHome,
  FiGrid,
  FiFolder,
  FiUsers,
  FiFileText,
  FiCreditCard,
  FiLogOut,
} from "react-icons/fi";
import LogoutConfirmDialog from "../LogoutConfirmDialog";
import appeelLogo from "../../assets/appeel-logo.png";

function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { t } = useTranslation();

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navClass = ({ isActive }) =>
    isActive ? "sidebar-item active" : "sidebar-item";

  return (
    <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
    <div className="sidebar-brand-box">
  <Link to="/" className="sidebar-logo" onClick={closeMobileMenu}>
    <div className="sidebar-logo-content">
      <img
        src={appeelLogo}
        alt="APPEEL"
        className="sidebar-brand-logo appeel-logo"
      />
      <span className="sidebar-sub">
        {t("adminSidebar.console")}
      </span>
    </div>
  </Link>

  <button
    type="button"
    className="sidebar-close-btn"
    onClick={closeMobileMenu}
    aria-label={t("adminSidebar.closeSidebar")}
  >
    <FiX />
  </button>
</div>

      <nav className="sidebar-menu">
        <Link
          to="/"
          className="dashboard-home-link"
          onClick={closeMobileMenu}
        >
          <span><FiHome /></span>
          <span>{t("adminSidebar.home")}</span>
        </Link>

        <NavLink
          to="/admin/dashboard"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon"><FiGrid /></span>
          <span>{t("adminSidebar.dashboard")}</span>
        </NavLink>

        <NavLink
          to="/admin/cases"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon"><FiFolder /></span>
          <span>{t("adminSidebar.casesAllocation")}</span>
        </NavLink>

        <NavLink
          to="/admin/lawyers"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon"><FiUsers /></span>
          <span>{t("adminSidebar.lawyerManagement")}</span>
        </NavLink>

        <NavLink
          to="/admin/documents"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon"><FiFileText /></span>
          <span>{t("adminSidebar.documentVault")}</span>
        </NavLink>

        <NavLink
          to="/admin/payments"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon"><FiCreditCard /></span>
          <span>{t("adminSidebar.payments")}</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer-box">
        <div className="admin-user-pill">
          <div className="admin-avatar-circle">A</div>
          <div className="admin-meta">
            <strong>{t("adminSidebar.admin")}</strong>
            <span>{t("adminSidebar.systemController")}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-sidebar-logout"
          onClick={() => setLogoutDialogOpen(true)}
        >
          <FiLogOut /> {t("adminSidebar.signOut")}
        </button>
      </div>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={() => {
          localStorage.removeItem("adminToken");
          setMobileMenuOpen(false);
          window.location.replace("/");
        }}
      />
    </aside>
  );
}

export default AdminSidebar;
