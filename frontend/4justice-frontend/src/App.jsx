
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiFolder,
  FiClock,
  FiUsers,
  FiCreditCard,
  FiZap,
  FiFileText,
  FiAlertTriangle,
  FiMenu,
  FiRefreshCw,
  FiCheckCircle,
} from "react-icons/fi";

import LanguageSwitcher from "./components/LanguageSwitcher";

import DataTable from "./components/Table/DataTable";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import AdminSidebar from "./components/Admin/AdminSidebar";
import ExternalInvoicePayment from "./pages/ExternalInvoicePayment";

import LandingPage from "./components/home/LandingPage";
import ContactPage from "./components/home/ContactPage";
import ScrollTop from "./components/ScrollTop";

import AdminCases from "./pages/AdminCases";
import CaseDetails from "./pages/CaseDetails";
import LawyerRegister from "./pages/LawyerRegister";
import LawyerDashboard from "./pages/LawyerDashboard";
import LoginSelection from "./pages/LoginSelection";
import AdminLawyerDetails from "./pages/AdminLawyerDetails";

import CustomerRegister from "./pages/CustomerRegister";
import CustomerCaseDetails from "./pages/CustomerCaseDetails";
import StartCase from "./pages/StartCase";
import Payment from "./pages/Payment";
import {
  CustomerCases,
  CustomerPageHeader,
  statusClass,
} from "./pages/CustomerCases";
import CustomerDocuments from "./pages/CustomerDocuments";
import CustomerUpdates from "./pages/CustomerUpdates";

import API_BASE_URL from "./api/api";
import { getCustomerJson } from "./api/customerApi";

import "./App.css";

// ===============================
// Admin Dashboard
// ===============================

function Dashboard() {
  const { t } = useTranslation();

  const [dashboardData, setDashboardData] = useState({
    totalCases: 0,
    pendingCases: 0,
    totalLawyers: 0,
    totalPayments: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard data error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <section className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            <b>{t("adminDashboard.eyebrow")}</b>
          </span>
          <p>{t("adminDashboard.description")}</p>
        </div>
      </div>

      <div className="stats-metric-grid">
        <div className="metric-card">
          <div className="metric-icon total"><FiFolder /></div>
          <div className="metric-info">
            <span className="metric-label">
              {t("adminDashboard.totalCases")}
            </span>
            <strong className="metric-value">
              {loading ? "..." : dashboardData.totalCases}
            </strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon active"><FiClock /></div>
          <div className="metric-info">
            <span className="metric-label">
              {t("adminDashboard.pendingCases")}
            </span>
            <strong className="metric-value">
              {loading ? "..." : dashboardData.pendingCases}
            </strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon completed"><FiUsers /></div>
          <div className="metric-info">
            <span className="metric-label">
              {t("adminDashboard.lawyers")}
            </span>
            <strong className="metric-value">
              {loading ? "..." : dashboardData.totalLawyers}
            </strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon status-icon"><FiCreditCard /></div>
          <div className="metric-info">
            <span className="metric-label">
              {t("adminDashboard.payments")}
            </span>
            <strong className="metric-value">
              {loading ? "..." : dashboardData.totalPayments}
            </strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header-simple">
          <div className="header-icon-title">
            <span className="header-icon"><FiZap /></span>
            <div>
              <h3>{t("adminDashboard.quickNavigationTitle")}</h3>
              <p>{t("adminDashboard.quickNavigationDescription")}</p>
            </div>
          </div>

          <NavLink to="/admin/cases" className="btn-primary-navy">
            {t("adminDashboard.manageAllCases")} →
          </NavLink>
        </div>

        <div className="admin-quick-actions-grid">
          {/* Cases */}
          <NavLink to="/admin/cases" className="admin-quick-card">
            <span className="quick-icon"><FiFolder /></span>
            <h4>{t("adminDashboard.reviewCasesTitle")}</h4>
            <p>{t("adminDashboard.reviewCasesDescription")}</p>
            <span className="quick-card-link">
              {t("adminDashboard.manageCases")} →
            </span>
          </NavLink>

          {/* Lawyers */}
          <NavLink to="/admin/lawyers" className="admin-quick-card">
            <span className="quick-icon"><FiUsers /></span>
            <h4>{t("adminDashboard.lawyerAvailabilityTitle")}</h4>
            <p>{t("adminDashboard.lawyerAvailabilityDescription")}</p>
            <span className="quick-card-link">
              {t("adminDashboard.manageLawyers")} →
            </span>
          </NavLink>

          {/* Documents */}
          <NavLink to="/admin/documents" className="admin-quick-card">
            <span className="quick-icon"><FiFileText /></span>
            <h4>{t("adminDashboard.documentRepositoryTitle")}</h4>
            <p>{t("adminDashboard.documentRepositoryDescription")}</p>
            <span className="quick-card-link">
              {t("adminDashboard.manageDocuments")} →
            </span>
          </NavLink>

          {/* Payments */}
          <NavLink to="/admin/payments" className="admin-quick-card">
            <span className="quick-icon"><FiCreditCard /></span>
            <h4>{t("adminDashboard.paymentManagementTitle")}</h4>
            <p>{t("adminDashboard.paymentManagementDescription")}</p>
            <span className="quick-card-link">
              {t("adminDashboard.viewPayments")} →
            </span>
          </NavLink>
        </div>
      </div>
    </section>
  );
}

// ===============================
// Admin Lawyers Page
// ===============================

function Lawyers() {
  const { t } = useTranslation();

  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchLawyers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/lawyers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(t("adminLawyers.errors.loadFailed"));
      }

      const data = await response.json();
      setLawyers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t("adminLawyers.errors.connection"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLawyers();
  }, []);

  const lawyerColumns = [
    {
      key: "name",
      header: t("adminLawyers.columns.name"),
      accessor: "name",
      render: (lawyer) => (
        <div className="admin-lawyer-name-cell">
          <span className="admin-lawyer-avatar">
            {lawyer.name?.charAt(0).toUpperCase() || "L"}
          </span>
          <span className="admin-lawyer-name">
            {lawyer.name || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      header: t("adminLawyers.columns.email"),
      accessor: "email",
    },
    {
      key: "specialization",
      header: t("adminLawyers.columns.specialization"),
      accessor: "specialization",
      render: (lawyer) => (
        <span className="table-type-badge">
          {lawyer.specialization || t("adminLawyers.notSpecified")}
        </span>
      ),
    },
    {
      key: "availability",
      header: t("adminLawyers.columns.availability"),
      accessor: "availability",
      render: (lawyer) => {
        const availability = lawyer.availability?.toUpperCase() || "BUSY";

        return (
          <span
            className={`admin-lawyer-availability ${availability === "AVAILABLE" ? "is-available" : "is-busy"
              }`}
          >
            {t(`adminLawyers.availability.${availability}`, {
              defaultValue: lawyer.availability || availability,
            })}
          </span>
        );
      },
    },
    {
      key: "action",
      header: t("adminLawyers.columns.action"),
      sortable: false,
      render: (lawyer) => (
        <Link
          to={`/admin/lawyers/${lawyer.id}`}
          className="admin-view-case-button"
        >
          {t("adminLawyerDetails.view")}
        </Link>
      ),
    },
  ];

  const lawyerFilters = [
    {
      key: "availability",
      label: t("adminLawyers.filters.availability"),
      options: [
        {
          label: t("adminLawyers.availability.AVAILABLE"),
          value: "AVAILABLE",
        },
        {
          label: t("adminLawyers.availability.BUSY"),
          value: "BUSY",
        },
      ],
    },
  ];

  return (
    <section className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            {t("adminLawyers.eyebrow", {
              defaultValue: "LAWYERS NETWORK",
            })}
          </span>
        </div>
      </div>

      <div className="admin-card">
        {error ? (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>

            <button
              type="button"
              className="btn-download-sm"
              onClick={fetchLawyers}
              disabled={loading}
            >
              {loading
                ? t("adminLawyers.refreshing")
                : t("adminLawyers.tryAgain")}
            </button>
          </div>
        ) : (
          <DataTable
            title={t("adminLawyers.tableTitle")}
            showHeading={false}
            columns={lawyerColumns}
            data={lawyers}
            rowKey="id"
            searchFields={[
              "name",
              "email",
              "specialization",
              "availability",
            ]}
            filters={lawyerFilters}
            searchable={true}
            exportable={true}
            pagination={true}
            pageSize={10}
            loading={loading}
            onRefresh={fetchLawyers}
            refreshing={loading}
            emptyMessage={t("adminLawyers.emptyMessage")}
          />
        )}
      </div>
    </section>
  );
}

// ===============================
// Admin Documents Page
// ===============================

function Documents() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  async function fetchDocuments() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/documents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error(t("adminDocuments.errors.sessionRequired"));
        }

        throw new Error(t("adminDocuments.errors.loadFailed"));
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t("adminDocuments.errors.connection"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function downloadDocument(documentId, fileName) {
    try {
      setDownloadingId(documentId);

      const response = await fetch(
        `${API_BASE_URL}/api/cases/documents/${documentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            t("adminDocuments.errors.unauthorizedDownload")
          );
        }

        throw new Error(t("adminDocuments.errors.downloadFailed"));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      window.alert(
        err.message || t("adminDocuments.errors.downloadFailed")
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function viewDocument(documentId) {
    // Open a new tab immediately to avoid popup blocking.
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      window.alert(t("adminDocuments.errors.allowPopups"));
      return;
    }

    try {
      setDownloadingId(documentId);

      const response = await fetch(
        `${API_BASE_URL}/api/cases/documents/${documentId}/view`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(t("adminDocuments.errors.previewFailed"));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      newTab.location.href = url;
    } catch (err) {
      if (!newTab.closed) {
        newTab.close();
      }

      window.alert(err.message || t("adminDocuments.errors.viewFailed"));
    } finally {
      setDownloadingId(null);
    }
  }

  const documentColumns = [
    {
      key: "caseId",
      header: t("adminDocuments.columns.caseId"),
      accessor: "caseId",
      render: (doc) => (
        <span className="case-id-tag">
          {doc.caseId || "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: t("adminDocuments.columns.action"),
      sortable: false,
      render: (doc) => (
        <div className="document-actions">
          <button
            type="button"
            className="btn-table-action"
            disabled={downloadingId === doc.id}
            onClick={() => viewDocument(doc.id)}
          >
            {downloadingId === doc.id
              ? t("adminDocuments.opening")
              : t("adminDocuments.view")}
          </button>

          <button
            type="button"
            className="btn-download-sm"
            disabled={downloadingId === doc.id}
            onClick={() => downloadDocument(doc.id, doc.fileName)}
          >
            {downloadingId === doc.id
              ? t("adminDocuments.processing")
              : `↓ ${t("adminDocuments.download")}`}
          </button>
        </div>
      ),
    },
  ];

  // Get the document file format.
  const getDocumentFormat = (doc) => {
    const fileType = doc.fileType || "";
    const fileName = doc.fileName || "";

    const normalizedType = fileType
      .split("/")
      .pop()
      .split(".")
      .pop()
      .toUpperCase();

    if (
      ["PDF", "DOC", "DOCX", "JPG", "JPEG", "PNG"].includes(
        normalizedType
      )
    ) {
      return normalizedType;
    }

    const extension = fileName.split(".").pop().toUpperCase();

    return extension && extension !== fileName.toUpperCase()
      ? extension
      : "UNKNOWN";
  };

  const documentFilters = [
    {
      key: "fileFormat",
      label: t("adminDocuments.filters.fileFormat"),
      options: [
        {
          label: t("adminDocuments.filters.allFormats"),
          value: "ALL",
        },
        ...[...new Set(documents.map((doc) => getDocumentFormat(doc)))]
          .sort()
          .map((format) => ({
            label: format,
            value: format,
          })),
      ],
      predicate: (doc, selectedValue) =>
        selectedValue === "ALL" ||
        getDocumentFormat(doc) === selectedValue,
    },
    {
      key: "caseReference",
      label: t("adminDocuments.filters.caseReference"),
      options: [
        {
          label: t("adminDocuments.filters.allCases"),
          value: "ALL",
        },
        ...[
          ...new Set(
            documents.map((doc) => doc.caseId).filter(Boolean)
          ),
        ]
          .sort()
          .map((caseId) => ({
            label: caseId,
            value: caseId,
          })),
      ],
      predicate: (doc, selectedValue) =>
        selectedValue === "ALL" || doc.caseId === selectedValue,
    },
  ];

  return (
    <section className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            {t("adminDocuments.eyebrow", {
              defaultValue: "Document Vault Repository",
            })}
          </span>
        </div>
      </div>

      <div className="admin-card">
        {error ? (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>

            <button
              type="button"
              className="btn-download-sm"
              onClick={fetchDocuments}
              disabled={loading}
            >
              {loading
                ? t("adminDocuments.refreshing", {
                  defaultValue: "Refreshing...",
                })
                : t("adminDocuments.tryAgain", {
                  defaultValue: "Try Again",
                })}
            </button>
          </div>
        ) : (
          <DataTable
            title={t("adminDocuments.tableTitle")}
            showHeading={false}
            columns={documentColumns}
            data={documents}
            rowKey="id"
            searchFields={["id", "caseId", "fileName", "fileType"]}
            filters={documentFilters}
            searchable={true}
            exportable={true}
            pagination={true}
            pageSize={10}
            loading={loading}
            onRefresh={fetchDocuments}
            refreshing={loading}
            emptyMessage={t("adminDocuments.emptyMessage")}
          />
        )}
      </div>
    </section>
  );
}

// ===============================
// Admin Payments Page
// ===============================

function Payments() {
  const { t } = useTranslation();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchPayments() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error(t("adminPayments.errors.sessionMissing"));
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/payments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          t("adminPayments.errors.authorizationFailed")
        );
      }

      if (!response.ok) {
        throw new Error(t("adminPayments.errors.loadFailed"));
      }

      const data = await response.json();

      const sortedPayments = (Array.isArray(data) ? [...data] : []).sort(
        (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)
      );

      setPayments(sortedPayments);
    } catch (err) {
      setError(err.message || t("adminPayments.errors.connection"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  function formatAmount(payment) {
    const amount = Number(payment.amount);

    if (!Number.isFinite(amount)) return "—";

    const currency = String(payment.currency || "").trim();

    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency || t("adminPayments.currencyNotSet")}`;
  }

  function getStatusClass(status) {
    const value = String(status || "").toUpperCase();

    if (value === "SUCCESS") return "available";
    if (value === "PENDING") return "pending";

    return "busy";
  }

  const paymentColumns = [
    {
      key: "paymentId",
      header: t("adminPayments.columns.paymentReference"),
      accessor: "paymentId",
      render: (payment) => (
        <div className="file-text-meta">
          <strong>{payment.paymentId || "—"}</strong>
        </div>
      ),
    },
    {
      key: "caseId",
      header: t("adminPayments.columns.caseId"),
      accessor: "caseId",
      render: (payment) => (
        <span className="case-id-tag">
          {payment.caseId || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("adminPayments.columns.amount"),
      accessor: "amount",
      render: (payment) => (
        <strong>{formatAmount(payment)}</strong>
      ),
    },
    {
      key: "provider",
      header: t("adminPayments.columns.provider"),
      accessor: "provider",
      render: (payment) => (
        <span className="table-type-badge">
          {payment.provider ||
            (payment.paypalOrderId
              ? "PAYPAL"
              : payment.razorpayOrderId
                ? "RAZORPAY"
                : t("adminPayments.notRecorded"))}
        </span>
      ),
    },
    {
      key: "gatewayOrderId",
      header: t("adminPayments.columns.gatewayOrderId"),
      sortable: false,
      accessor: (payment) =>
        payment.paypalOrderId || payment.razorpayOrderId || "—",
    },
    {
      key: "status",
      header: t("adminPayments.columns.status"),
      accessor: "status",
      render: (payment) => {
        const status = payment.status?.toUpperCase() || "UNKNOWN";

        return (
          <span className={`status-badge ${getStatusClass(payment.status)}`}>
            ●{" "}
            {t(`adminPayments.statuses.${status}`, {
              defaultValue: payment.status || status,
            })}
          </span>
        );
      },
    },
  ];

  const paymentFilters = [
    {
      key: "status",
      label: t("adminPayments.filters.paymentStatus"),
      options: [
        {
          label: t("adminPayments.statuses.SUCCESS"),
          value: "SUCCESS",
        },
        {
          label: t("adminPayments.statuses.PENDING"),
          value: "PENDING",
        },
        {
          label: t("adminPayments.statuses.FAILED"),
          value: "FAILED",
        },
      ],
    },
  ];

  return (
    <section className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            {t("adminPayments.eyebrow", {
              defaultValue: "Payments & Billing",
            })}
          </span>
        </div>
      </div>

      <div className="admin-card">
        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>

            <button
              type="button"
              className="btn-download-sm"
              onClick={fetchPayments}
              disabled={loading}
            >
              {loading
                ? t("adminPayments.refreshing")
                : t("adminPayments.tryAgain")}
            </button>
          </div>
        )}

        {!error && (
          <DataTable
            title={t("adminPayments.tableTitle")}
            showHeading={false}
            columns={paymentColumns}
            data={payments}
            rowKey="id"
            searchFields={[
              "paymentId",
              "caseId",
              "provider",
              "paypalOrderId",
              "razorpayOrderId",
            ]}
            filters={paymentFilters}
            searchable={true}
            exportable={true}
            pagination={true}
            pageSize={10}
            loading={loading}
            onRefresh={fetchPayments}
            refreshing={loading}
            emptyMessage={t("adminPayments.emptyMessage")}
          />
        )}
      </div>
    </section>
  );
}

// ===============================
// Admin Layout
// ===============================

function AdminLayout() {
  const { t } = useTranslation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <AdminSidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </aside>

      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="admin-hamburger"
              aria-label={t("adminLayout.toggleSidebar")}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <FiMenu />
            </button>

            <div className="topbar-badge">
              {t("adminLayout.portalTitle")}
            </div>
          </div>

         <div className="topbar-right">
  <LanguageSwitcher />

  <div className="admin-user-compact">
    <div className="admin-avatar-circle sm">A</div>
    <span>{t("adminLayout.administrator")}</span>
  </div>
</div>
        </header>

        <main className="admin-body-content">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cases" element={<AdminCases />} />
            <Route path="cases/:caseId" element={<CaseDetails />} />
            <Route path="lawyers" element={<Lawyers />} />
            <Route path="documents" element={<Documents />} />
            <Route path="payments" element={<Payments />} />
            <Route
              path="lawyers/:lawyerId"
              element={<AdminLawyerDetails />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ===============================
// Customer Dashboard
// ===============================


function CustomerDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [customerName, setCustomerName] = useState(
    localStorage.getItem("customerName") ||
    t("customerDashboard.customer")
  );

  const [cases, setCases] = useState([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const [casesError, setCasesError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const customer = await getCustomerJson("/api/customers/me");

        if (!active) return;

        setCustomerName(
          customer.name || t("customerDashboard.customer")
        );

        localStorage.setItem("customerId", String(customer.id));
        localStorage.setItem("customerName", customer.name || "");
        localStorage.setItem("customerEmail", customer.email || "");
        localStorage.setItem("customerPhone", customer.phone || "");

        const caseData = await getCustomerJson("/api/cases/mine");

        if (!active) return;

        setCases(Array.isArray(caseData) ? caseData : []);
      } catch (error) {
        if (!active) return;

        if (error.status === 401 || error.status === 403) {
          localStorage.removeItem("customerToken");
          localStorage.removeItem("customerId");
          localStorage.removeItem("customerName");
          localStorage.removeItem("customerEmail");
          localStorage.removeItem("customerPhone");

          navigate("/login", { replace: true });
          return;
        }

        console.error("Customer dashboard error:", error);
        setCasesError(
          error.message || "Unable to load your dashboard information."
        );
      } finally {
        if (active) setCheckingSession(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate, t]);

  const getStatus = (customerCase) =>
    String(customerCase.status || "").toUpperCase();

  const totalCases = cases.length;

  const activeCases = cases.filter((item) =>
    ["IN_PROGRESS", "UNDER_REVIEW"].includes(getStatus(item))
  ).length;

  const resolvedCases = cases.filter(
    (item) => getStatus(item) === "COMPLETED"
  ).length;

  const pendingCases = cases.filter((item) =>
    ["PENDING", "SUBMITTED"].includes(getStatus(item))
  ).length;

  const formatSubmittedDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString(
      i18n.language === "sv" ? "sv-SE" : "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusLabel = (status) => {
    const normalized = String(status || "UNKNOWN").toUpperCase();

    return t(`customerUpdates.statuses.${normalized}`, {
      defaultValue: normalized.replaceAll("_", " "),
    });
  };

  const caseColumns = [
    {
      key: "caseId",
      header: "customerCases.columns.caseId",
      accessor: "caseId",
      render: (item) => (
        <span className="case-id-tag">
          {item.caseId || "—"}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "customerCases.columns.submitted",
      accessor: "submittedAt",
      render: (item) => formatSubmittedDate(item.submittedAt),
    },
    {
      key: "status",
      header: "customerCases.columns.status",
      accessor: "status",
      render: (item) => (
        <span className={`status-badge ${statusClass(item.status)}`}>
          {getStatusLabel(item.status)}
        </span>
      ),
    },
    {
      key: "action",
      header: "customerCases.columns.action",
      sortable: false,
      render: (item) => (
        <Link
          to={`/customer/my-cases/${encodeURIComponent(item.caseId)}`}
          className="admin-view-case-button"
        >
          {t("customerCases.viewDetails")}
        </Link>
      ),
    },
  ];

  const caseFilters = [
    {
      key: "status",
      label: "customerCases.filters.caseStatus",
      options: [
        { label: "customerCases.filters.pending", value: "PENDING" },
        { label: "customerCases.filters.active", value: "IN_PROGRESS" },
        { label: "customerCases.filters.completed", value: "COMPLETED" },
      ],
      predicate: (item, selectedValue) => {
        const status = getStatus(item);

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

  if (checkingSession) {
    return (
      <main className="portal-page">
        <div className="loading-card">
          <div className="loading-spinner" />
          <p>{t("customerDashboard.loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="customer-dashboard-page">
      <CustomerPageHeader />

      <div className="customer-dashboard-container">
        {/* Welcome Section */}
        <section className="customer-dashboard-welcome">
          <div>


            <h1>{t("customerDashboard.welcome", { name: customerName })}</h1>

            <p>{t("customerDashboard.description")}</p>
          </div>

          <button
            type="button"
            className="btn-primary-navy"
            onClick={() => navigate("/customer/start-case")}
          >
            {t("customerDashboard.startNewCase")}
          </button>
        </section>

        {/* Statistics */}
        <section className="customer-dashboard-stats">
          <article className="customer-stat-card">
            <div className="customer-stat-icon"><FiFolder /></div>
            <div>
              <span>{t("customerDashboard.totalCases")}</span>
              <strong>{cases.length}</strong>
            </div>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon"><FiRefreshCw /></div>
            <div>
              <span>{t("customerDashboard.activeCases")}</span>
              <strong>{activeCases}</strong>
            </div>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon"><FiCheckCircle /></div>
            <div>
              <span>{t("customerDashboard.resolvedCases")}</span>
              <strong>{resolvedCases}</strong>
            </div>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon"><FiClock /></div>
            <div>
              <span>{t("customerDashboard.pendingCases")}</span>
              <strong>{pendingCases}</strong>
            </div>
          </article>
        </section>

        {/* Legal Matters */}
        <section className="customer-dashboard-matters">
          <div className="customer-matters-heading">
            <div className="customer-matters-title">
              <span className="customer-matters-icon"><FiFolder /></span>

              <div>
                <h2>{t("customerDashboard.myCasesTitle")}</h2>
                <p>{t("customerDashboard.mattersDescription")}</p>
              </div>
            </div>

            <span className="customer-matters-count">
              {t("customerDashboard.mattersCount", { count: totalCases })}
            </span>
          </div>

          {casesError && (
            <div className="alert-banner alert-error" role="alert">
              {casesError}
            </div>
          )}

          {!casesError && (
            <DataTable
              title={t("customerDashboard.myCasesTitle")}
              showHeading={false}
              columns={caseColumns}
              data={cases}
              rowKey="caseId"
              searchFields={[
                "caseId",
                "caseType",
                "description",
                "status",
              ]}
              filters={caseFilters}
              searchable={true}
              exportable={true}
              pagination={true}
              pageSize={10}
              loading={false}
              emptyMessage={t("customerDashboard.emptyTable")}
            />
          )}
        </section>


      </div>
    </main>
  );
}


// ===============================
// Authentication Helpers
// ===============================

function getLoggedInRole() {
  if (localStorage.getItem("adminToken")) return "admin";
  if (localStorage.getItem("lawyerToken")) return "lawyer";
  if (localStorage.getItem("customerToken")) return "customer";

  return null;
}

function getDashboardForRole(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "lawyer") return "/lawyer/dashboard";
  if (role === "customer") return "/customer/dashboard";

  return "/login";
}

// Redirect logged-in users away from public pages.
function PublicOnlyRoute() {
  const role = getLoggedInRole();

  if (role) {
    return <Navigate to={getDashboardForRole(role)} replace />;
  }

  return <Outlet />;
}

// Allow access only to the matching role.
function ProtectedRoleRoute({ role }) {
  const loggedInRole = getLoggedInRole();

  if (!loggedInRole) {
    return <Navigate to="/login" replace />;
  }

  if (loggedInRole !== role) {
    return <Navigate to={getDashboardForRole(loggedInRole)} replace />;
  }

  return <Outlet />;
}

// ===============================
// Main App
// ===============================

function App() {
  return (
    <BrowserRouter>
      <ScrollTop />

      <Routes>
        {/* Home page: accessible to everyone, including logged-in users */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication pages: available only when logged out */}
        <Route element={<PublicOnlyRoute />}>
          {/* Universal login for all roles */}
          <Route path="/login" element={<LoginSelection />} />

          {/* Old login URLs redirect to universal login */}
          <Route
            path="/customer/login"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="/lawyer/login"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="/admin/login"
            element={<Navigate to="/login" replace />}
          />

          {/* Registration pages */}
          <Route
            path="/lawyer/register"
            element={<LawyerRegister />}
          />

          <Route
            path="/customer/register"
            element={<CustomerRegister />}
          />
        </Route>

        <Route path="/payment" element={<Payment />} />

        <Route
          path="/external-invoice-payment"
          element={<ExternalInvoicePayment />}
        />

        {/* Admin-only pages */}
        <Route element={<ProtectedRoleRoute role="admin" />}>
          <Route path="/admin/*" element={<AdminLayout />} />
        </Route>

        {/* Password Recovery */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Contact page */}
        <Route path="/contact" element={<ContactPage />} />

        {/* Lawyer-only pages */}
        <Route element={<ProtectedRoleRoute role="lawyer" />}>
          <Route
            path="/lawyer/dashboard"
            element={<LawyerDashboard />}
          />
        </Route>

        {/* Customer-only pages */}
        <Route element={<ProtectedRoleRoute role="customer" />}>
          <Route
            path="/customer/dashboard"
            element={<CustomerDashboard />}
          />

          <Route
            path="/customer/start-case"
            element={<StartCase />}
          />

          <Route
            path="/customer/my-cases"
            element={<CustomerCases />}
          />
          <Route
            path="/customer/my-cases/:caseId"
            element={<CustomerCaseDetails />}
          />



          <Route
            path="/customer/documents"
            element={<CustomerDocuments />}
          />

          <Route
            path="/customer/updates"
            element={<CustomerUpdates />}
          />
        </Route>

        {/* Unknown URLs */}
        <Route
          path="*"
          element={
            <Navigate
              to={getDashboardForRole(getLoggedInRole())}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


