
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  customerRequest,
  downloadCustomerDocument,
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import DataTable from "../components/Table/DataTable";


import LogoutConfirmDialog from "../components/LogoutConfirmDialog";

// =========================================================
// SHARED HELPERS
// =========================================================

export const formatStatus = (status = "UNKNOWN") =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const statusClass = (status = "") => {
  const normalized = status
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(" ", "-");

  if (normalized.includes("review")) return "under-review";
  if (normalized.includes("progress")) return "in-progress";
  if (normalized.includes("complete")) return "completed";
  if (normalized.includes("submit") || normalized.includes("pending")) {
    return "pending";
  }

  return normalized;
};

export const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
};

// =========================================================
// CUSTOMER CASES LIST
// =========================================================

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
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(requestError.message || "Unable to load your cases.");
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
            customerCase.status || ""
          )}`}
        >
          {formatStatus(customerCase.status || "UNKNOWN")}
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
      <CustomerPageHeader title="My Cases" activeTab="cases" />

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
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
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
                "caseType",
                "description",
                "lawyerName",
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
            <div className="empty-icon">📁</div>
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
// CUSTOMER CASE DETAILS
// =========================================================

export function CustomerCaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [customerCase, setCustomerCase] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadedCaseId, setLoadedCaseId] = useState("");

  const loading = loadedCaseId !== caseId;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCase = async () => {
    const [caseInfo, caseDocuments] = await Promise.all([
      getCustomerJson(
        `/api/cases/mine/${encodeURIComponent(caseId)}`
      ),
      getCustomerJson(
        `/api/customers/me/cases/${encodeURIComponent(caseId)}/documents`
      ),
    ]);

    setCustomerCase(caseInfo);
    setDocuments(Array.isArray(caseDocuments) ? caseDocuments : []);
  };

  useEffect(() => {
    let active = true;

    setError("");
    setNotice("");

    Promise.all([
      getCustomerJson(
        `/api/cases/mine/${encodeURIComponent(caseId)}`
      ),
      getCustomerJson(
        `/api/customers/me/cases/${encodeURIComponent(caseId)}/documents`
      ),
    ])
      .then(([caseInfo, caseDocuments]) => {
        if (!active) return;

        setCustomerCase(caseInfo);
        setDocuments(Array.isArray(caseDocuments) ? caseDocuments : []);
      })
      .catch((requestError) => {
        if (!active) return;

        if (isCustomerAuthError(requestError)) {
          navigate("/customer/login", { replace: true });
          return;
        }

        setError(requestError.message || "Unable to load case details.");
      })
      .finally(() => {
        if (active) {
          setLoadedCaseId(caseId);
        }
      });

    return () => {
      active = false;
    };
  }, [caseId, navigate]);

  // -------------------------------------------------------
  // DOCUMENT UPLOAD
  // -------------------------------------------------------

  const handleUpload = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const file = form.elements.caseDocument.files[0];

    if (!file) {
      setError("Please select a document to upload.");
      return;
    }

    const allowedTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ]);

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "doc", "docx", "png", "jpg", "jpeg"].includes(extension)) {
      setError("Please upload a PDF, DOC, DOCX, PNG, JPG, or JPEG file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be 10 MB or less.");
      return;
    }

    if (file.type && !allowedTypes.has(file.type)) {
      setError("The selected file type is not supported.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await customerRequest(
        `/api/customers/me/cases/${encodeURIComponent(caseId)}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      form.reset();
      await loadCase();

      setNotice("Document uploaded successfully.");
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(requestError.message || "Unable to upload document.");
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------
  // DOCUMENT DOWNLOAD
  // -------------------------------------------------------

  const handleDownload = async (doc) => {
    setBusy(true);
    setError("");

    try {
      const blob = await downloadCustomerDocument(doc.id);
      const url = URL.createObjectURL(blob);

      const link = window.document.createElement("a");
      link.href = url;
      link.download = doc.fileName || `document-${doc.id}`;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(requestError.message || "Unable to download document.");
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------
  // PROGRESS TIMELINE
  // -------------------------------------------------------

  const currentStatus = String(
    customerCase?.status || "PENDING"
  ).toUpperCase();

  const reviewStatuses = [
    "UNDER_REVIEW",
    "IN_PROGRESS",
    "ASSIGNED",
    "COMPLETED",
    "RESOLVED",
    "CLOSED",
  ];

  const progressStatuses = [
    "IN_PROGRESS",
    "COMPLETED",
    "RESOLVED",
    "CLOSED",
  ];

  const completedStatuses = [
    "COMPLETED",
    "RESOLVED",
    "CLOSED",
  ];

  const reviewComplete = reviewStatuses.includes(currentStatus);
  const progressComplete = progressStatuses.includes(currentStatus);
  const resolutionComplete = completedStatuses.includes(currentStatus);

  // -------------------------------------------------------
  // PAGE
  // -------------------------------------------------------

  return (
    <main className="portal-page">
      <CustomerPageHeader title="Case Details" activeTab="cases" />

   

      <div className="portal-container customer-case-details-container">

        {/* PAGE HEADING */}
        <div className="customer-case-details-heading">
          <div>
            <Link
              to="/customer/my-cases"
              className="case-back-link"
            >
              ← Back to My Cases
            </Link>

            <h1>Case Details</h1>
            <p>
              View your case progress and manage its documents.
            </p>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="loading-card">
            <div className="loading-spinner" />
            <p>Loading case details...</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* UNIFIED CASE CARD */}
        {!loading && customerCase && (
          <section className="customer-case-unified-card">

            {/* CASE HEADER */}
            <div className="customer-case-card-header">
              <div>
                <span className="badge-tag">LEGAL MATTER</span>

                <h2>
                  {customerCase.caseType || "Legal Matter"}
                </h2>

                <span className="case-sub-id">
                  Case ID: {customerCase.caseId || caseId}
                </span>
              </div>

              <span
                className={`status-badge large ${statusClass(
                  currentStatus
                )}`}
              >
                {formatStatus(currentStatus)}
              </span>
            </div>

            {/* MAIN CONTENT */}
            <div className="customer-case-unified-grid">

              {/* LEFT: CASE INFORMATION */}
              <div className="customer-case-info-column">

                {/* TIMELINE */}
                <div className="case-timeline-section">
                  <h4 className="timeline-title">
                    Progress Timeline
                  </h4>

                  <div className="timeline-steps">

                    <div className="step-point completed">
                      <div className="point-circle">✓</div>
                      <span>Submitted</span>
                    </div>

                    <div
                      className={`step-point ${reviewComplete ? "completed" : "active"
                        }`}
                    >
                      <div className="point-circle">
                        {reviewComplete ? "✓" : "2"}
                      </div>
                      <span>Review &amp; Lawyer</span>
                    </div>

                    <div
                      className={`step-point ${progressComplete ? "completed" : ""
                        }`}
                    >
                      <div className="point-circle">
                        {progressComplete ? "✓" : "3"}
                      </div>
                      <span>In Progress</span>
                    </div>

                    <div
                      className={`step-point ${resolutionComplete ? "completed" : ""
                        }`}
                    >
                      <div className="point-circle">
                        {resolutionComplete ? "✓" : "4"}
                      </div>
                      <span>Resolution</span>
                    </div>

                  </div>
                </div>

                {/* CASE METADATA */}
                <div className="customer-case-meta-row">

                  <div className="customer-case-meta-item">
                    <span>Assigned Counsel</span>
                    <strong>
                      {customerCase.lawyerName || "Not yet assigned"}
                    </strong>
                  </div>

                  <div className="customer-case-meta-item">
                    <span>Submission Date</span>
                    <strong>
                      {formatDate(customerCase.submittedAt)}
                    </strong>
                  </div>

                </div>

                {/* DESCRIPTION */}
                <div className="customer-case-description">
                  <h3>Matter Overview &amp; Instructions</h3>

                  <p>
                    {customerCase.description ||
                      "No description provided."}
                  </p>
                </div>

              </div>

              {/* RIGHT: DOCUMENTS */}
              <div className="customer-case-documents-column">

                <div className="customer-case-documents-heading">
                  <div>
                    <h3>Case Documents</h3>
                    <p>Upload and access your case files.</p>
                  </div>

                  <span className="customer-document-count">
                    {documents.length}
                  </span>
                </div>

                {/* UPLOAD SUCCESS */}
                {notice && (
                  <div
                    className="alert-banner alert-success"
                    role="status"
                  >
                    <span className="alert-icon">✓</span>
                    <span>{notice}</span>
                  </div>
                )}

                {/* UPLOAD FORM */}
                <form
                  className="document-upload-dropzone"
                  onSubmit={handleUpload}
                >
                  <label
                    htmlFor="case-document"
                    className="upload-label"
                  >
                    <span className="upload-icon">☁️</span>

                    <strong className="upload-prompt">
                      Select a document
                    </strong>

                    <span className="upload-limits">
                      PDF, DOC, DOCX, PNG, JPG · Max 10 MB
                    </span>
                  </label>

                  <input
                    id="case-document"
                    name="caseDocument"
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    disabled={busy}
                    className="file-input-hidden"
                  />

                  <button
                    type="submit"
                    className="btn-primary-block"
                    disabled={busy}
                  >
                    {busy ? "Uploading..." : "Upload Document"}
                  </button>
                </form>

                {/* DOCUMENT LIST */}
                <div className="documents-vault-list">
                  <h4 className="vault-header">
                    Uploaded Files ({documents.length})
                  </h4>

                  {documents.length === 0 ? (
                    <div className="vault-empty">
                      No files uploaded to this case yet.
                    </div>
                  ) : (
                    <ul className="file-items-list">
                      {documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="file-item-row"
                        >
                          <div className="file-info-group">
                            <span className="file-type-icon">
                              📄
                            </span>

                            <div className="file-text-meta">
                              <span
                                className="file-name"
                                title={doc.fileName}
                              >
                                {doc.fileName || `Document ${doc.id}`}
                              </span>

                              <span className="file-sub">
                                Document #{doc.id}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn-download-sm"
                            disabled={busy}
                            onClick={() => handleDownload(doc)}
                          >
                            {busy ? "Please wait..." : "Download ↓"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// =========================================================
// CUSTOMER NAVIGATION HEADER
// =========================================================

export function CustomerPageHeader({
  title,
  activeTab = "",
}) {
  const navigate = useNavigate();

const [mobileOpen, setMobileOpen] = useState(false);
const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await customerRequest("/api/customers/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Customer logout failed:", error);
    } finally {
      [
        "customerToken",
        "customerId",
        "customerName",
        "customerEmail",
        "customerPhone",
      ].forEach((key) => localStorage.removeItem(key));

      navigate("/customer/login", { replace: true });
    }
  };

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="customer-portal-navbar">
      <div className="portal-nav-container">

        <div className="portal-brand-wrap">
          <Link
            to="/customer/dashboard"
            className="portal-brand"
            onClick={closeMobileMenu}
          >
            <span className="brand-icon">⚖️</span>
            <span className="brand-title">APPEEL</span>
          </Link>
        </div>

        <button
          type="button"
          className="portal-mobile-btn"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>

        <nav
          className={`portal-nav-links ${mobileOpen ? "open" : ""
            }`}
        >
          <Link
            to="/"
            className="portal-nav-link"
            onClick={closeMobileMenu}
          >
            ⌂ Home
          </Link>

          <Link
            to="/customer/dashboard"
            className={`portal-nav-link ${activeTab === "dashboard" ? "active" : ""
              }`}
            onClick={closeMobileMenu}
          >
            Dashboard
          </Link>

          <Link
            to="/customer/my-cases"
            className={`portal-nav-link ${activeTab === "cases" ? "active" : ""
              }`}
            onClick={closeMobileMenu}
          >
            My Cases
          </Link>

          <Link
            to="/customer/documents"
            className={`portal-nav-link ${activeTab === "documents" ? "active" : ""
              }`}
            onClick={closeMobileMenu}
          >
            Documents
          </Link>

          <Link
            to="/customer/updates"
            className={`portal-nav-link ${activeTab === "updates" ? "active" : ""
              }`}
            onClick={closeMobileMenu}
          >
            Updates
          </Link>

          <div className="portal-nav-separator" />
          <button
            type="button"
            className="btn-logout-nav"
            onClick={() => setLogoutDialogOpen(true)}
          >
            Sign Out
          </button>
        </nav>
      </div>


      <LogoutConfirmDialog
  open={logoutDialogOpen}
  loading={loggingOut}
  onCancel={() => setLogoutDialogOpen(false)}
  onConfirm={handleLogout}
/>
    </header>
  );
}
