
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import LogoutConfirmDialog from "../components/LogoutConfirmDialog";
import DataTable from "../components/Table/DataTable";

import LanguageSwitcher from "../components/LanguageSwitcher";
import { FiGrid } from "react-icons/fi";
import appeelLogo from "../assets/appeel-logo.png";

export const formatStatus = (status, t) => {
  if (!status) {
    return t
      ? t("customerUpdates.statuses.UNKNOWN")
      : "Unknown";
  }

  const normalizedStatus = String(status).toUpperCase();

  const fallback = String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return t
    ? t(`customerUpdates.statuses.${normalizedStatus}`, {
        defaultValue: fallback,
      })
    : fallback;
};

export const statusClass = (status) => {
  if (!status) return "status-unknown";

  return `status-${String(status)
    .toLowerCase()
    .replaceAll("_", "-")}`;
};

export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
};

export function CustomerCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const fetchCases = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCustomerJson("/api/cases/mine");
      setCases(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        requestError.message || "Unable to load your cases."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const caseColumns = [
    {
      key: "caseId",
      header: "Case ID",
      accessor: "caseId",
      render: (customerCase) => (
        <span className="case-id-tag">
          {customerCase.caseId || "—"}
        </span>
      ),
    },
    {
      key: "caseType",
      header: "Case Type",
      accessor: "caseType",
      render: (customerCase) => (
        <strong>
          {customerCase.caseType || "General Legal Matter"}
        </strong>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      render: (customerCase) => (
        <span
          className={`status-badge ${statusClass(
            customerCase.status
          )}`}
        >
          {formatStatus(customerCase.status)}
        </span>
      ),
    },
    {
      key: "lawyerName",
      header: "Assigned Lawyer",
      accessor: "lawyerName",
      render: (customerCase) => (
        <span>
          {customerCase.lawyerName || "Pending Allocation"}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "Submitted",
      accessor: "submittedAt",
      render: (customerCase) => (
        <span>{formatDate(customerCase.submittedAt)}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortable: false,
      render: (customerCase) => (
        <Link
          to={`/customer/my-cases/${encodeURIComponent(
            customerCase.caseId
          )}`}
          className="admin-view-case-button"
        >
          View Details →
        </Link>
      ),
    },
  ];

  const caseFilters = [
    {
      key: "status",
      label: "Case Status",
      options: [
        { label: "All Statuses", value: "ALL" },
        { label: "Pending", value: "PENDING" },
        { label: "Active", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" },
      ],
      predicate: (customerCase, selectedValue) => {
        const status = String(
          customerCase.status || ""
        ).toUpperCase();

        if (selectedValue === "ALL") return true;

        if (selectedValue === "PENDING") {
          return ["PENDING", "SUBMITTED"].includes(status);
        }

        if (selectedValue === "IN_PROGRESS") {
          return ["IN_PROGRESS", "UNDER_REVIEW"].includes(status);
        }

        if (selectedValue === "COMPLETED") {
          return status === "COMPLETED";
        }

        return true;
      },
    },
  ];

  return (
    <main className="portal-page">
      <CustomerPageHeader />

      <div className="portal-container">
        <div className="portal-page-header">
          <div>
            <h1>Your Legal Cases</h1>
            <p className="portal-subheading">
              View your legal matters and track their progress.
            </p>
          </div>

          <Link
            className="btn-primary-navy"
            to="/customer/start-case"
          >
            + Start a New Case
          </Link>
        </div>

        {error && (
          <div
            className="alert-banner alert-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              className="btn-download-sm"
              onClick={fetchCases}
              disabled={loading}
            >
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <div className="admin-card customer-cases-table-card">
            <DataTable
              title="My Cases"
              showHeading={true}
              columns={caseColumns}
              data={cases}
              rowKey="caseId"
              searchFields={[
                "caseId",
                "submittedAt",
                "status",
              ]}
              filters={caseFilters}
              searchable={true}
              exportable={false}
              pagination={true}
              pageSize={10}
              loading={loading}
              onRefresh={fetchCases}
              refreshing={loading}
              emptyMessage="You have not submitted any cases yet."
            />
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div className="empty-state-card">
            <h2>No cases submitted yet</h2>

            <p>
              Once you submit a legal request, your case will appear here.
            </p>

            <Link
              className="btn-primary-navy"
              to="/customer/start-case"
            >
              Submit Your First Case
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// =========================================================


export function CustomerPageHeader() {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerName");
    localStorage.removeItem("customerEmail");
    localStorage.removeItem("customerPhone");

    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="customer-portal-navbar customer-dashboard-navbar">
        <div className="customer-portal-navbar-inner">

          {/* Brand */}
          <Link
            to="/customer/dashboard"
            className="customer-portal-brand"
          >
            <img
              src={appeelLogo}
              alt="APPEEL"
              className="portal-brand-logo appeel-logo"
            />

          </Link>

          {/* Customer Portal Badge */}
          <span className="customer-portal-badge">
            CUSTOMER PORTAL
          </span>

          {/* Navigation */}
          <div className="customer-portal-actions">
            <Link
              to="/"
              className="customer-home-link"
              aria-label="Home"
            >
              Home
            </Link>

            <Link
              to="/customer/dashboard"
              className="customer-nav-card"
            >
              <span className="customer-nav-icon"><FiGrid /></span>
              <span>Dashboard</span>
            </Link>
            <LanguageSwitcher />

            {/* Sign Out Button */}
            <button
              type="button"
              className="app-signout-btn customer-signout-btn"
              onClick={() => setShowLogoutDialog(true)}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Shared Sign Out Confirmation Dialog */}
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
