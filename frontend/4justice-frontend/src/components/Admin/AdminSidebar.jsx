
import { Link, NavLink } from "react-router-dom";

import { useState } from "react";
import LogoutConfirmDialog from "../LogoutConfirmDialog";

function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }) {

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navClass = ({ isActive }) =>
    isActive ? "sidebar-item active" : "sidebar-item";

  return (
    <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
      <div className="sidebar-brand-box">
        <Link to="/" className="sidebar-logo" onClick={closeMobileMenu}>
          <span className="logo-symbol">⚖️</span>
          <div>
            <strong className="sidebar-brand-title">APPEEL</strong>
            <span className="sidebar-sub">Admin Console</span>
          </div>
        </Link>

        <button
          type="button"
          className="sidebar-close-btn"
          onClick={closeMobileMenu}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="sidebar-menu">
        <Link
          to="/"
          className="dashboard-home-link"
          onClick={closeMobileMenu}
        >
          <span>⌂</span>
          <span>Home</span>
        </Link>

        <NavLink
          to="/admin/dashboard"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon">▦</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/cases"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon">📁</span>
          <span>Cases &amp; Allocation</span>
        </NavLink>

        <NavLink
          to="/admin/lawyers"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon">👥</span>
          <span>Lawyer Management</span>
        </NavLink>

        <NavLink
          to="/admin/documents"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon">📄</span>
          <span>Document Vault</span>
        </NavLink>

        <NavLink
          to="/admin/payments"
          className={navClass}
          onClick={closeMobileMenu}
        >
          <span className="item-icon">💳</span>
          <span>Payments</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer-box">
        <div className="admin-user-pill">
          <div className="admin-avatar-circle">A</div>
          <div className="admin-meta">
            <strong>Admin</strong>
            <span>System Controller</span>
          </div>
        </div>

       <button
  type="button"
  className="btn-sidebar-logout"
  onClick={() => setLogoutDialogOpen(true)}
>
  ↪ Sign Out
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
