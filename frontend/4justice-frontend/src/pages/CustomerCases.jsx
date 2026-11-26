import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import LogoutConfirmDialog from "../components/LogoutConfirmDialog";
import DataTable from "../components/Table/DataTable";

import LanguageSwitcher from "../components/LanguageSwitcher";
import { FiGrid } from "react-icons/fi";
import appeelLogo from "../assets/appeel-logo.png";

// =========================================================
// STATUS FORMATTER
// =========================================================

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

// =========================================================
// STATUS CLASS
// =========================================================

export const statusClass = (status) => {
  if (!status) return "status-unknown";

  return `status-${String(status)
    .toLowerCase()
    .replaceAll("_", "-")}`;
};

// =========================================================
// DATE FORMATTER
// =========================================================

export const formatDate = (value, language = "en") => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(
    language.startsWith("sv") ? "sv-SE" : "en-GB"
  );
};

// =========================================================
// CUSTOMER CASES
// =========================================================

export function CustomerCases() {
  const { t, i18n } = useTranslation();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // =========================================
  // FETCH CASES
  // =========================================

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
        requestError.message ||
          t("customerCases.errors.loadCases")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // =========================================
  // TABLE COLUMNS
  // =========================================

  const caseColumns = [
    {
      key: "caseId",
      header: t("customerCases.columns.caseId"),
      accessor: "caseId",
      render: (customerCase) => (
        <span className="case-id-tag">
          {customerCase.caseId || "—"}
        </span>
      ),
    },
    {
      key: "caseType",
      header: t("customerCases.columns.caseType"),
      accessor: "caseType",
      render: (customerCase) => (
        <strong>
          {customerCase.caseType ||
            t("customerCases.generalLegalMatter")}
        </strong>
      ),
    },
    {
      key: "status",
      header: t("customerCases.columns.status"),
      accessor: "status",
      render: (customerCase) => (
        <span
          className={`status-badge ${statusClass(
            customerCase.status
          )}`}
        >
          {formatStatus(customerCase.status, t)}
        </span>
      ),
    },
    {
      key: "lawyerName",
      header: t("customerCases.columns.assignedLawyer"),
      accessor: "lawyerName",
      render: (customerCase) => (
        <span>
          {customerCase.lawyerName ||
            t("customerCases.pendingAllocation")}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: t("customerCases.columns.submitted"),
      accessor: "submittedAt",
      render: (customerCase) => (
        <span>
          {formatDate(
            customerCase.submittedAt,
            i18n.language
          )}
        </span>
      ),
    },
    {
      key: "action",
      header: t("customerCases.columns.action"),
      sortable: false,
      render: (customerCase) => (
        <Link
          to={`/customer/my-cases/${encodeURIComponent(
            customerCase.caseId
          )}`}
          className="admin-view-case-button"
        >
          {t("customerCases.viewDetails")} →
        </Link>
      ),
    },
  ];

  // =========================================
  // TABLE FILTERS
  // =========================================

  const caseFilters = [
    {
      key: "status",
      label: "customerCases.filters.caseStatus",
      options: [
        {
          label: "customerCases.filters.allStatuses",
          value: "ALL",
        },
        {
          label: "customerCases.filters.pending",
          value: "PENDING",
        },
        {
          label: "customerCases.filters.active",
          value: "IN_PROGRESS",
        },
        {
          label: "customerCases.filters.completed",
          value: "COMPLETED",
        },
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

  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="portal-page">
      <CustomerPageHeader />

      <div className="portal-container">
        <div className="portal-page-header">
          <div>
            <h1>{t("customerCases.heading")}</h1>

            <p className="portal-subheading">
              {t("customerCases.description")}
            </p>
          </div>

          <Link
            className="btn-primary-navy"
            to="/customer/start-case"
          >
            + {t("customerCases.startNewCase")}
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
              {t("customerCases.tryAgain")}
            </button>
          </div>
        )}

        {!error && (
          <div className="admin-card customer-cases-table-card">
            <DataTable
              title={t("customerCases.title")}
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
              emptyMessage={t("customerCases.emptyMessage")}
            />
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div className="empty-state-card">
            <h2>{t("customerCases.emptyTitle")}</h2>

            <p>
              {t("customerCases.emptyDescription")}
            </p>

            <Link
              className="btn-primary-navy"
              to="/customer/start-case"
            >
              {t("customerCases.submitFirstCase")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// =========================================================
// SHARED CUSTOMER PAGE HEADER
// =========================================================

export function CustomerPageHeader() {
  const { t } = useTranslation();

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
            {t("customerNavigation.portal")}
          </span>

          {/* Navigation */}

          <div className="customer-portal-actions">
            <Link
              to="/"
              className="customer-home-link"
              aria-label={t("customerNavigation.home")}
            >
              {t("customerNavigation.home")}
            </Link>

            <Link
              to="/customer/dashboard"
              className="customer-nav-card"
            >
              <span className="customer-nav-icon">
                <FiGrid />
              </span>

              <span>
                {t("customerNavigation.dashboard")}
              </span>
            </Link>

            <LanguageSwitcher />

            {/* Sign Out Button */}

            <button
              type="button"
              className="app-signout-btn customer-signout-btn"
              onClick={() => setShowLogoutDialog(true)}
            >
              {t("customerNavigation.signOut")}
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