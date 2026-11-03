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




import DataTable from "./components/Table/DataTable";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


import AdminSidebar from "./components/Admin/AdminSidebar";

import LandingPage from "./components/home/LandingPage";
import ContactPage from "./components/home/ContactPage";
import ScrollTop from "./components/ScrollTop";

import AdminCases from "./pages/AdminCases";
import AdminLogin from "./pages/AdminLogin";
import CaseDetails from "./pages/CaseDetails";
import LawyerRegister from "./pages/LawyerRegister";
import LawyerLogin from "./pages/LawyerLogin";
import LawyerDashboard from "./pages/LawyerDashboard";
import LoginSelection from "./pages/LoginSelection";
import AdminLawyerDetails from "./pages/AdminLawyerDetails";

import CustomerRegister from "./pages/CustomerRegister";
import CustomerLogin from "./pages/CustomerLogin";
import StartCase from "./pages/StartCase";
import Payment from "./pages/Payment";
import {
  CustomerCaseDetails,
  CustomerCases,
  CustomerPageHeader,
} from "./pages/CustomerCases";
import CustomerDocuments from "./pages/CustomerDocuments";
import CustomerUpdates from "./pages/CustomerUpdates";


import API_BASE_URL from "./api/api";
import {
  getCustomerJson,
} from "./api/customerApi";

import "./App.css";


// ===============================
// Admin Dashboard
// ===============================

function Dashboard() {
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
          <span className="admin-eyebrow"><b>SYSTEM OVERVIEW</b></span>
          <p>Real-time statistics across active legal matters, lawyer's, and customer workflows.</p>
        </div>
      </div>

      <div className="stats-metric-grid">
        <div className="metric-card">
          <div className="metric-icon total">📁</div>
          <div className="metric-info">
            <span className="metric-label">Total Cases</span>
            <strong className="metric-value">{loading ? "..." : dashboardData.totalCases}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon active">⏳</div>
          <div className="metric-info">
            <span className="metric-label">Pending / Unallocated</span>
            <strong className="metric-value">{loading ? "..." : dashboardData.pendingCases}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon completed">👥</div>
          <div className="metric-info">
            <span className="metric-label"> Lawyer's</span>
            <strong className="metric-value">{loading ? "..." : dashboardData.totalLawyers}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon status-icon">💳</div>
          <div className="metric-info">
            <span className="metric-label">Payments</span>
            <strong className="metric-value">{loading ? "..." : dashboardData.totalPayments}</strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header-simple">
          <div className="header-icon-title">
            <span className="header-icon">⚡</span>
            <div>
              <h3>Fast Navigation &amp; Allocation</h3>
              <p>Quick access to operational queues</p>
            </div>
          </div>
          <NavLink to="/admin/cases" className="btn-primary-navy">
            Manage All Cases →
          </NavLink>
        </div>
        <div className="admin-quick-actions-grid">

          {/* 1. Cases */}
          <NavLink to="/admin/cases" className="admin-quick-card">
            <span className="quick-icon">📁</span>
            <h4>Review Incoming Cases</h4>
            <p>Allocate pending submissions to vetted attorneys.</p>
            <span className="quick-card-link">Manage Cases →</span>
          </NavLink>

          {/* 2. Lawyers */}
          <NavLink to="/admin/lawyers" className="admin-quick-card">
            <span className="quick-icon">👥</span>
            <h4>Lawyer Availability</h4>
            <p>Inspect lawyer specialties and availability statuses.</p>
            <span className="quick-card-link">Manage Lawyers →</span>
          </NavLink>

          {/* 3. Documents */}
          <NavLink to="/admin/documents" className="admin-quick-card">
            <span className="quick-icon">📄</span>
            <h4>Document Repository</h4>
            <p>Verify customer evidence and manage uploaded legal documents.</p>
            <span className="quick-card-link">Manage Documents →</span>
          </NavLink>

          {/* 4. Payments */}
          <NavLink to="/admin/payments" className="admin-quick-card">
            <span className="quick-icon">💳</span>
            <h4>Payment Management</h4>
            <p>Monitor payment references, gateway transactions and payment statuses.</p>
            <span className="quick-card-link">View Payments →</span>
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
        throw new Error("Failed to load lawyers.");
      }

      const data = await response.json();
      setLawyers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLawyers();
  }, []);

  const availableCount = lawyers.filter(
    (lawyer) => lawyer.availability?.toUpperCase() === "AVAILABLE"
  ).length;

  const lawyerColumns = [
    {
      key: "name",
      header: "Lawyer Name",
      accessor: "name",
      render: (lawyer) => (
        <div className="admin-lawyer-name-cell">
          <span className="admin-lawyer-avatar">
            {lawyer.name?.charAt(0).toUpperCase() || "L"}
          </span>
          <span className="admin-lawyer-name">{lawyer.name || "—"}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", accessor: "email" },
    {
      key: "specialization",
      header: "Specialization",
      accessor: "specialization",
      render: (lawyer) => (
        <span className="table-type-badge">
          {lawyer.specialization || "Not specified"}
        </span>
      ),
    },
    {
      key: "availability",
      header: "Availability",
      accessor: "availability",
      render: (lawyer) => (
        <span
          className={`admin-lawyer-availability ${lawyer.availability?.toUpperCase() === "AVAILABLE"
              ? "is-available"
              : "is-busy"
            }`}
        >
          {lawyer.availability || "BUSY"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortable: false,
      render: (lawyer) => (
        <Link
          to={`/admin/lawyers/${lawyer.id}`}
          className="admin-view-case-button"
        >
          View Details
        </Link>
      ),
    },
  ];

  const lawyerFilters = [
    {
      key: "availability",
      label: "Availability",
      options: [
        { label: "Available", value: "AVAILABLE" },
        { label: "Busy", value: "BUSY" },
      ],
    },
  ];

  return (
    <section className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">LAWYERS NETWORK</span>

        </div>


      </div>

      <div className="admin-card">
        {error ? (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button
              type="button"
              className="btn-download-sm"
              onClick={fetchLawyers}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Try Again"}
            </button>
          </div>
        ) : (
          <DataTable
            title="Lawyer Management"
            showHeading={false}
            columns={lawyerColumns}
            data={lawyers}
            rowKey="id"
            searchFields={["name", "email", "specialization", "availability"]}
            filters={lawyerFilters}
            searchable={true}
            exportable={true}
            pagination={true}
            pageSize={10}
            loading={loading}
            onRefresh={fetchLawyers}
            refreshing={loading}
            emptyMessage="No lawyers registered yet."
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
          throw new Error(
            "Admin session required. Please log in as admin."
          );
        }
        throw new Error("Failed to load documents.");
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
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
            "You are not authorized to download this document."
          );
        }
        throw new Error("Unable to download document.");
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
      window.alert(err.message || "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  }


 
  async function viewDocument(documentId) {
    // Open a blank tab immediately to avoid popup blocking.
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      window.alert("Please allow pop-ups to view this document.");
      return;
    }

    try {
      setDownloadingId(documentId);

      const response = await fetch(
        `${API_BASE_URL}/api/cases/documents/${documentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to view document.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      newTab.location.href = url;

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err) {
      if (!newTab.closed) {
        newTab.close();
      }

      window.alert(err.message || "Unable to view document.");
    } finally {
      setDownloadingId(null);
    }
  }





  const documentColumns = [
    {
      key: "caseId",
      header: "Case ID",
      accessor: "caseId",
      render: (doc) => (
        <span className="case-id-tag">
          {doc.caseId || "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortable: false,
      render: (doc) => (
        <div className="document-actions">
          <button
            type="button"
            className="btn-table-action"
            disabled={downloadingId === doc.id}
            onClick={() => viewDocument(doc.id)}
          >
            {downloadingId === doc.id ? "Opening..." : "View"}
          </button>

          <button
            type="button"
            className="btn-download-sm"
            disabled={downloadingId === doc.id}
            onClick={() => downloadDocument(doc.id, doc.fileName)}
          >
            {downloadingId === doc.id ? "Processing..." : "↓ Download"}
          </button>
        </div>
      ),
    },
  ];
  // Get the document file format
  const getDocumentFormat = (doc) => {
    const fileType = doc.fileType || "";
    const fileName = doc.fileName || "";

    // Use fileType if it contains a recognizable extension
    const normalizedType = fileType
      .split("/")
      .pop()
      .split(".")
      .pop()
      .toUpperCase();

    if (["PDF", "DOC", "DOCX", "JPG", "JPEG", "PNG"].includes(normalizedType)) {
      return normalizedType;
    }

    // Otherwise, extract the extension from the file name
    const extension = fileName.split(".").pop().toUpperCase();

    return extension && extension !== fileName.toUpperCase()
      ? extension
      : "UNKNOWN";
  };

  // Document filters
  const documentFilters = [
    {
      key: "fileFormat",
      label: "File Format",
      options: [
        { label: "All Formats", value: "ALL" },
        ...[
          ...new Set(documents.map((doc) => getDocumentFormat(doc))),
        ]
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
      label: "Case Reference",
      options: [
        { label: "All Cases", value: "ALL" },
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
          <span className="admin-eyebrow">Document Vault Repository</span>

        </div>


      </div>

      <div className="admin-card">
        {error ? (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button
              type="button"
              className="btn-download-sm"
              onClick={fetchDocuments}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Try Again"}
            </button>
          </div>
        ) : (
          <DataTable
            title="Document Vault"
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
            emptyMessage="No case documents uploaded to the repository yet."
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
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchPayments() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Admin session missing. Please log in again.");
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
          "Admin authorization failed. Please sign in again."
        );
      }

      if (!response.ok) {
        throw new Error("Unable to load payment records.");
      }

      const data = await response.json();

      const sortedPayments = (Array.isArray(data) ? [...data] : []).sort(
        (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)
      );

      setPayments(sortedPayments);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
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
    })} ${currency || "Currency not set"}`;
  }

  function getStatusClass(status) {
    const value = String(status || "").toUpperCase();

    if (value === "SUCCESS") return "available";
    if (value === "PENDING") return "pending";

    return "busy";
  }

  // Payment table columns
  const paymentColumns = [
    {
      key: "paymentId",
      header: "Payment Reference",
      accessor: "paymentId",
      render: (payment) => (
        <div className="file-text-meta">
          <strong>{payment.paymentId || "—"}</strong>

        </div>
      ),
    },
    {
      key: "caseId",
      header: "Case ID",
      accessor: "caseId",
      render: (payment) => (
        <span className="case-id-tag">
          {payment.caseId || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      accessor: "amount",
      render: (payment) => (
        <strong>{formatAmount(payment)}</strong>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      accessor: "provider",
      render: (payment) => (
        <span className="table-type-badge">
          {payment.provider ||
            (payment.paypalOrderId
              ? "PAYPAL"
              : payment.razorpayOrderId
                ? "RAZORPAY"
                : "Not recorded")}
        </span>
      ),
    },
    {
      key: "gatewayOrderId",
      header: "Gateway Order ID",
      sortable: false,
      accessor: (payment) =>
        payment.paypalOrderId || payment.razorpayOrderId || "—",
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      render: (payment) => (
        <span className={`status-badge ${getStatusClass(payment.status)}`}>
          ● {payment.status || "UNKNOWN"}
        </span>
      ),
    },
  ];

  // Payment status filter
  const paymentFilters = [
    {
      key: "status",
      label: "Payment Status",
      options: [
        { label: "Successful", value: "SUCCESS" },
        { label: "Pending", value: "PENDING" },
        { label: "Failed", value: "FAILED" },
      ],
    },
  ];

  return (
    <section className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Payments &amp; Billing</span>
        </div>
      </div>

      <div className="admin-card">
        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button
              type="button"
              className="btn-download-sm"
              onClick={fetchPayments}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Try Again"}
            </button>
          </div>
        )}

        {!error && (
          <DataTable
            title="Payments & Billing"
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
            emptyMessage="No payment records found."
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
              aria-label="Toggle admin sidebar"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <div className="topbar-badge">Administration Portal</div>
          </div>

          <div className="topbar-right">
            <div className="admin-user-compact">
              <div className="admin-avatar-circle sm">A</div>
              <span>Administrator</span>
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

  const [customerName, setCustomerName] = useState(
    localStorage.getItem("customerName") || "Customer"
  );

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    getCustomerJson("/api/customers/me")
      .then((customer) => {
        if (!active) return;

        setCustomerName(customer.name || "Customer");

        localStorage.setItem("customerId", String(customer.id));
        localStorage.setItem("customerName", customer.name || "");
        localStorage.setItem("customerEmail", customer.email || "");
        localStorage.setItem("customerPhone", customer.phone || "");
      })
      .catch((error) => {
        if (!active) return;

        if (error.status === 401) {
          localStorage.removeItem("customerToken");
          localStorage.removeItem("customerId");
          localStorage.removeItem("customerName");
          localStorage.removeItem("customerEmail");
          localStorage.removeItem("customerPhone");

          navigate("/customer/login", { replace: true });
          return;
        }

        console.error("Unable to verify customer session:", error);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (checkingSession) {
    return (
      <main className="portal-page">
        <div className="portal-container">
          <div className="loading-card">
            <div className="loading-spinner" />
            <p>Loading your customer portal...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <CustomerPageHeader
        title="Customer Dashboard"
        activeTab="dashboard"
      />

      <div className="portal-container">

        {/* Welcome Section */}
        <section className="customer-welcome-banner">
          <div className="welcome-content">
            <span className="auth-badge">YOUR LEGAL SPACE</span>

            <h1>Welcome, {customerName}</h1>

            <p>
              Manage your legal matters, securely share documents,
              and follow the progress of your cases from one place.
            </p>

            <div className="welcome-cta-group">
              <button
                type="button"
                className="btn-primary-navy"
                onClick={() => navigate("/customer/start-case")}
              >
                + Start a New Case
              </button>

              <button
                type="button"
                className="btn-outline-navy"
                onClick={() => navigate("/customer/my-cases")}
              >
                View My Cases →
              </button>
            </div>
          </div>
        </section>

        {/* Workspace Section */}
        <div className="customer-hub-heading">
          <h2>Your Legal Workspace</h2>
          <p>
            Everything you need to manage your legal matters.
          </p>
        </div>

        <div className="customer-hub-grid">

          {/* My Cases */}
          <article className="hub-card">
            <div className="hub-card-icon">📁</div>

            <h3>My Cases</h3>

            <p>
              View your submitted cases, assigned lawyers,
              and case progress.
            </p>

            <button
              type="button"
              className="hub-card-btn"
              onClick={() => navigate("/customer/my-cases")}
            >
              View Cases →
            </button>
          </article>

          {/* Document Vault */}
          <article className="hub-card">
            <div className="hub-card-icon">📄</div>

            <h3>Document Vault</h3>

            <p>
              Access your uploaded contracts, evidence,
              and other legal documents.
            </p>

            <button
              type="button"
              className="hub-card-btn"
              onClick={() => navigate("/customer/documents")}
            >
              View Documents →
            </button>
          </article>

          {/* Activity Updates */}
          <article className="hub-card">
            <div className="hub-card-icon">🔔</div>

            <h3>Activity Updates</h3>

            <p>
              Check the latest updates about your cases
              and legal representation.
            </p>

            <button
              type="button"
              className="hub-card-btn"
              onClick={() => navigate("/customer/updates")}
            >
              Check Updates →
            </button>
          </article>

        </div>

        {/* Billing Information */}
        <div className="portal-card customer-payment-banner">
          <div className="payment-banner-content">
            <div className="banner-icon-title">
              <span className="banner-icon">💳</span>

              <div>
                <h3>Transparent Legal Billing</h3>
                <p>
                  Review your case-related fees and payment
                  information through a clear billing process.
                </p>
              </div>
            </div>

            <span className="status-badge available">
              Secured Account
            </span>
          </div>
        </div>

        {/* Support Section */}
        <div className="support-banner">
          <div>
            <h3>Need Assistance with Your Case?</h3>

            <p>
              Our client services team is ready to help
              with your questions and filing requirements.
            </p>
          </div>

          <Link to="/" className="btn-outline-navy">
            Visit APPEEL Home →
          </Link>
        </div>

      </div>
    </main>
  );
}



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
          <Route path="/login" element={<LoginSelection />} />

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/lawyer/register" element={<LawyerRegister />} />
          <Route path="/lawyer/login" element={<LawyerLogin />} />

          <Route
            path="/customer/register"
            element={<CustomerRegister />}
          />

          <Route
            path="/customer/login"
            element={<CustomerLogin />}
          />
        </Route>

        <Route path="/payment" element={<Payment />} />

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



        {/* contact page */}
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
