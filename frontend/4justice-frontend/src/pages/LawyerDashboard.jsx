import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../api/api";

import DataTable from "../components/Table/DataTable";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";
import appeelLogo from "../assets/appeel-logo.png";

import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  FiFolder,
  FiRefreshCw,
  FiCheckCircle,
  FiFileText,
  FiAlertTriangle,
  FiX,
  FiHome,
} from "react-icons/fi";

function LawyerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [availability, setAvailability] = useState("BUSY");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [documentsByCase, setDocumentsByCase] = useState({});
  const [expandedCase, setExpandedCase] = useState(null);
  const [documentLoadingCase, setDocumentLoadingCase] = useState(null);
  const [documentErrors, setDocumentErrors] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [updatingCaseId, setUpdatingCaseId] = useState(null);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const formatStatus = (status) => {
    if (!status) return t("lawyerDashboard.statuses.UNKNOWN");

    return t(`lawyerDashboard.statuses.${status}`, {
      defaultValue: status.replaceAll("_", " "),
    });
  };

  const getStatusClass = (status = "") => {
    const value = status.toUpperCase();

    if (value.includes("PENDING") || value.includes("SUBMITTED")) {
      return "status-badge pending";
    }

    if (value.includes("PROGRESS")) {
      return "status-badge in-progress";
    }

    if (value.includes("REVIEW")) {
      return "status-badge under-review";
    }

    if (value.includes("COMPLETED")) {
      return "status-badge completed";
    }

    return "status-badge";
  };

  const lawyerCaseColumns = [
    {
      key: "caseId",
      header: "lawyerDashboard.columns.caseId",
      accessor: "caseId",
      render: (item) => (
        <span className="case-id-tag">{item.caseId}</span>
      ),
    },
    {
      key: "customerName",
      header: "lawyerDashboard.columns.customerName",
      accessor: "customerName",
      render: (item) => (
        <strong>
          {item.customerName || t("lawyerDashboard.fallback.customer")}
        </strong>
      ),
    },
    {
      key: "caseType",
      header: "lawyerDashboard.columns.matterCategory",
      accessor: "caseType",
      render: (item) => (
        <span className="table-type-badge">
          {item.caseType || t("lawyerDashboard.fallback.general")}
        </span>
      ),
    },

    {
      key: "status",
      header: "lawyerDashboard.columns.status",
      accessor: "status",
      render: (item) => (
        <span className={getStatusClass(item.status)}>
          {formatStatus(item.status)}
        </span>
      ),
    },
    {
      key: "updateStatus",
      header: "lawyerDashboard.columns.updateStatus",
      sortable: false,
      render: (item) => (
        <div className="status-update-inline">
          <select
            value={item.status || "PENDING"}
            disabled={updatingCaseId === item.caseId}
            onChange={(event) =>
              updateStatus(item.caseId, event.target.value)
            }
            aria-label={t("lawyerDashboard.updateStatusFor", {
              caseId: item.caseId,
            })}
            className="modern-select-sm"
          >
            <option value="PENDING">
              {t("lawyerDashboard.statuses.PENDING")}
            </option>
            <option value="UNDER_REVIEW">
              {t("lawyerDashboard.statuses.UNDER_REVIEW")}
            </option>
            <option value="IN_PROGRESS">
              {t("lawyerDashboard.statuses.IN_PROGRESS")}
            </option>
            <option value="COMPLETED">
              {t("lawyerDashboard.statuses.COMPLETED")}
            </option>
          </select>

          {updatingCaseId === item.caseId && (
            <small>{t("lawyerDashboard.saving")}</small>
          )}
        </div>
      ),
    },
    {
      key: "documents",
      header: "lawyerDashboard.columns.documents",
      sortable: false,
      render: (item) => (
        <button
          type="button"
          className="btn-download-sm"
          disabled={documentLoadingCase === item.caseId}
          onClick={() => toggleDocuments(item.caseId)}
        >
          {documentLoadingCase === item.caseId
            ? t("lawyerDashboard.loading")
            : expandedCase === item.caseId
              ? t("lawyerDashboard.hideFiles")
              : t("lawyerDashboard.files", {
                  count: documentsByCase[item.caseId]?.length ?? null,
                  defaultValue:
                    documentsByCase[item.caseId]?.length != null
                      ? t("lawyerDashboard.filesCount", {
                          count: documentsByCase[item.caseId].length,
                        })
                      : t("lawyerDashboard.viewFiles"),
                })}
        </button>
      ),
    },
  ];

  const lawyerCaseSearchFields = [
    "caseId",
    "customerName",
    "caseType",
    "status",
  ];

  const lawyerCaseFilters = [
    {
      key: "status",
      label: "lawyerDashboard.filters.status",
      options: [
        {
          label: "lawyerDashboard.statuses.PENDING",
          value: "PENDING",
        },
        {
          label: "lawyerDashboard.statuses.SUBMITTED",
          value: "SUBMITTED",
        },
        {
          label: "lawyerDashboard.statuses.UNDER_REVIEW",
          value: "UNDER_REVIEW",
        },
        {
          label: "lawyerDashboard.statuses.IN_PROGRESS",
          value: "IN_PROGRESS",
        },
        {
          label: "lawyerDashboard.statuses.COMPLETED",
          value: "COMPLETED",
        },
      ],
    },
  ];

  let lawyer = null;

  try {
    const storedLawyer = localStorage.getItem("loggedInLawyer");
    lawyer = storedLawyer ? JSON.parse(storedLawyer) : null;
  } catch {
    localStorage.removeItem("loggedInLawyer");
  }

  const lawyerId = lawyer?.id;
  const lawyerToken = localStorage.getItem("lawyerToken");

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("lawyerToken") || ""}`,
  });

  // Load lawyer details and assigned cases.
  useEffect(() => {
    if (!lawyerId || !lawyerToken) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchLawyerData = async () => {
      try {
        setLoading(true);
        setError("");

        const lawyerResponse = await fetch(
          `${API_BASE_URL}/api/lawyers/${lawyerId}`,
          { headers: authHeaders() }
        );

        if (!lawyerResponse.ok) {
          throw new Error(
            lawyerResponse.status === 401 ||
              lawyerResponse.status === 403
              ? t("lawyerDashboard.errors.invalidSession")
              : t("lawyerDashboard.errors.fetchLawyer")
          );
        }

        const lawyerData = await lawyerResponse.json();
        setAvailability(lawyerData.availability || "BUSY");

        const casesResponse = await fetch(
          `${API_BASE_URL}/api/lawyers/my-cases`,
          { headers: authHeaders() }
        );

        if (!casesResponse.ok) {
          throw new Error(
            casesResponse.status === 401 ||
              casesResponse.status === 403
              ? t("lawyerDashboard.errors.invalidLawyerSession")
              : t("lawyerDashboard.errors.fetchCases")
          );
        }

        const assignedCases = await casesResponse.json();

const sortedCases = Array.isArray(assignedCases)
  ? [...assignedCases].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime()
    )
  : [];

setCases(sortedCases);
      } catch (err) {
        setError(err.message || t("lawyerDashboard.errors.loadDashboard"));
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerData();
  }, [lawyerId, lawyerToken, navigate, t]);

  // Update lawyer availability.
  const updateAvailability = async (status) => {
    try {
      setAvailabilityLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/lawyers/${lawyerId}/availability?status=${encodeURIComponent(status)}`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          (await response.text()) ||
            t("lawyerDashboard.errors.updateAvailability")
        );
      }

      const updatedLawyer = await response.json();
      setAvailability(updatedLawyer.availability || status);
    } catch (err) {
      alert(err.message || t("lawyerDashboard.errors.updateAvailability"));
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Update assigned case status.
  const updateStatus = async (caseId, status) => {
    try {
      setUpdatingCaseId(caseId);

      const response = await fetch(
        `${API_BASE_URL}/api/lawyers/cases/${encodeURIComponent(caseId)}/status?status=${encodeURIComponent(status)}`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          (await response.text()) ||
            t("lawyerDashboard.errors.updateCaseStatus")
        );
      }

      const updatedCase = await response.json();

      setCases((previousCases) =>
        previousCases.map((item) =>
          item.caseId === caseId
            ? { ...item, status: updatedCase.status || status }
            : item
        )
      );
    } catch (err) {
      alert(err.message || t("lawyerDashboard.errors.updateCaseStatus"));
    } finally {
      setUpdatingCaseId(null);
    }
  };

  // Fetch documents for a case.
  const fetchCaseDocuments = async (caseId) => {
    try {
      setDocumentLoadingCase(caseId);

      setDocumentErrors((previous) => ({
        ...previous,
        [caseId]: "",
      }));

      const response = await fetch(
        `${API_BASE_URL}/api/cases/${encodeURIComponent(caseId)}/documents`,
        { headers: authHeaders() }
      );

      if (!response.ok) {
        throw new Error(
          (await response.text()) ||
            t("lawyerDashboard.errors.loadDocumentsWithStatus", {
              status: response.status,
            })
        );
      }

      const data = await response.json();

      console.log("Documents received for case:", caseId, data);

      const documentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.documents)
          ? data.documents
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.content)
              ? data.content
              : null;

      if (!documentList) {
        throw new Error(t("lawyerDashboard.errors.invalidDocumentList"));
      }

      setDocumentsByCase((previous) => ({
        ...previous,
        [caseId]: documentList,
      }));
    } catch (err) {
      console.error("Failed to fetch case documents:", err);

      setDocumentErrors((previous) => ({
        ...previous,
        [caseId]:
          err.message || t("lawyerDashboard.errors.loadDocuments"),
      }));
    } finally {
      setDocumentLoadingCase(null);
    }
  };

  // Expand or collapse a case's documents.
  const toggleDocuments = async (caseId) => {
    if (expandedCase === caseId) {
      setExpandedCase(null);
      return;
    }

    setExpandedCase(caseId);
    await fetchCaseDocuments(caseId);
  };

  // Download document bytes from the backend.
  const getDocumentBlob = async (documentId) => {
    if (documentId == null) {
      throw new Error(t("lawyerDashboard.errors.missingDocumentId"));
    }

    const token = localStorage.getItem("lawyerToken");

    if (!token) {
      throw new Error(t("lawyerDashboard.errors.expiredSession"));
    }

    const url =
      `${API_BASE_URL}/api/cases/documents/` +
      `${encodeURIComponent(documentId)}/download`;

    console.log("Requesting document:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Document HTTP status:", response.status);
    console.log(
      "Document Content-Type:",
      response.headers.get("content-type")
    );

    if (!response.ok) {
      const message = await response.text();

      throw new Error(
        t("lawyerDashboard.errors.documentRequestFailed", {
          status: response.status,
          message: message || response.statusText,
        })
      );
    }

    const blob = await response.blob();

    console.log("Received document size:", blob.size, "bytes");

    if (blob.size === 0) {
      throw new Error(t("lawyerDashboard.errors.emptyDocument"));
    }

    return blob;
  };

  // Download a document.
  const handleDownload = async (file) => {
    const docId = file?.id ?? file?.documentId;

    if (!docId) {
      alert(t("lawyerDashboard.errors.missingDocumentId"));
      return;
    }

    try {
      setDownloadingId(docId);
      console.log("DOWNLOAD CLICKED:", file);

      const blob = await getDocumentBlob(docId);
      const objectUrl = window.URL.createObjectURL(blob);

      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = file.fileName || file.name || "case-document";

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (err) {
      console.error("DOCUMENT DOWNLOAD ERROR:", err);
      alert(err.message || t("lawyerDashboard.errors.downloadDocument"));
    } finally {
      setDownloadingId(null);
    }
  };

  // View a document in a new tab.
  const handleViewDocument = async (file) => {
    const docId = file?.id ?? file?.documentId;

    if (!docId) {
      alert(t("lawyerDashboard.errors.missingDocumentId"));
      return;
    }

    // Open synchronously during the click to avoid popup blocking.
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      alert(t("lawyerDashboard.errors.popupBlocked"));
      return;
    }

    let objectUrl = null;

    try {
      setViewingId(docId);
      console.log("VIEW CLICKED:", file);

      newTab.document.title = t("lawyerDashboard.openingDocument");
      newTab.document.body.innerHTML =
        `<p style='font-family:Arial;padding:24px'>${t(
          "lawyerDashboard.loadingDocument"
        )}</p>`;

      const blob = await getDocumentBlob(docId);
      const fileType =
        file.fileType ||
        file.contentType ||
        blob.type ||
        "application/octet-stream";

      objectUrl = window.URL.createObjectURL(
        new Blob([blob], { type: fileType })
      );

      newTab.location.replace(objectUrl);

      window.setTimeout(() => {
        if (objectUrl) {
          window.URL.revokeObjectURL(objectUrl);
        }
      }, 300000);
    } catch (err) {
      console.error("DOCUMENT VIEW ERROR:", err);

      if (!newTab.closed) {
        newTab.document.body.textContent = t(
          "lawyerDashboard.errors.documentViewFailed"
        );
      }

      alert(err.message || t("lawyerDashboard.errors.openDocument"));
    } finally {
      setViewingId(null);
    }
  };

  // Sign out.
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch(`${API_BASE_URL}/api/lawyers/logout`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("loggedInLawyer");
      localStorage.removeItem("lawyerToken");

      navigate("/login", { replace: true });
    }
  };

  const totalCases = cases.length;

  const activeCases = cases.filter((item) =>
    ["IN_PROGRESS", "UNDER_REVIEW", "PENDING"].includes(item.status)
  ).length;

  const completedCases = cases.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  return (
    <main className="portal-page lawyer-dashboard">
      <header className="customer-portal-navbar lawyer-navbar">
        <div className="portal-nav-container">
          <Link to="/lawyer/dashboard" className="portal-brand">
            <div className="portal-brand-content">
              <img
                src={appeelLogo}
                alt="APPEEL"
                className="portal-brand-logo appeel-logo"
              />

            </div>
            <span className="brand-portal-pill lawyer">
              {t("lawyerDashboard.lawyerPortal")}
            </span>
          </Link>

          <div className="portal-nav-links open">
            <Link to="/" className="portal-nav-link">
              <FiHome /> {t("lawyerDashboard.home")}
            </Link>

              <LanguageSwitcher />

            <button
              type="button"
              className="btn-logout-nav"
              onClick={() => setLogoutDialogOpen(true)}
            >
              {t("lawyerDashboard.signOut")}
            </button>
          </div>
        </div>
      </header>

      <div className="portal-container">
        <div className="portal-page-header">
          <div>
            <h1>
              {t("lawyerDashboard.welcome")},{" "}
              {lawyer?.name || lawyer?.email || t("lawyerDashboard.counsel")}
            </h1>

            <p className="portal-subheading">
              {t("lawyerDashboard.subtitle")}
            </p>
          </div>

          <div className="lawyer-availability-badge-box">
            <span className="chip-label">
              {t("lawyerDashboard.allocationStatus")}
            </span>

            <div className="availability-selector-wrap">
              <select
                id="availability"
                value={availability}
                onChange={(event) => updateAvailability(event.target.value)}
                disabled={availabilityLoading || loading}
                className={`availability-select ${availability.toLowerCase()}`}
              >
                <option value="AVAILABLE">
                  🟢 {t("lawyerDashboard.availableForCases")}
                </option>
                <option value="BUSY">
                  🔴 {t("lawyerDashboard.currentlyBusy")}
                </option>
              </select>

              {availabilityLoading && (
                <small className="saving-indicator">
                  {t("lawyerDashboard.saving")}
                </small>
              )}
            </div>
          </div>
        </div>

        <section className="stats-metric-grid">
          <div className="metric-card">
            <div className="metric-icon total"><FiFolder /></div>
            <div className="metric-info">
              <span className="metric-label">
                {t("lawyerDashboard.assignedMatters")}
              </span>
              <strong className="metric-value">
                {loading ? "-" : totalCases}
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon active"><FiRefreshCw /></div>
            <div className="metric-info">
              <span className="metric-label">
                {t("lawyerDashboard.activeInProgress")}
              </span>
              <strong className="metric-value">
                {loading ? "-" : activeCases}
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon completed"><FiCheckCircle /></div>
            <div className="metric-info">
              <span className="metric-label">
                {t("lawyerDashboard.resolvedCases")}
              </span>
              <strong className="metric-value">
                {loading ? "-" : completedCases}
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon status-icon">
              <span className={`pulse-dot ${availability.toLowerCase()}`} />
            </div>
            <div className="metric-info">
              <span className="metric-label">
                {t("lawyerDashboard.acceptingCases")}
              </span>
              <strong className="metric-value">
                {availability === "AVAILABLE"
                  ? t("lawyerDashboard.yesAvailable")
                  : t("lawyerDashboard.noBusy")}
              </strong>
            </div>
          </div>
        </section>

        <section className="portal-card">
          <div className="card-header-simple">
            <div className="header-icon-title">
              <span className="header-icon"><FiFolder /></span>
              <div>
                <h3>{t("lawyerDashboard.assignedClientMatters")}</h3>
                <p>{t("lawyerDashboard.caseTableDescription")}</p>
              </div>
            </div>

            <span className="results-badge">
              {t("lawyerDashboard.matterCount", {
                count: cases.length,
              })}
            </span>
          </div>

          {loading && (
            <div className="loading-card">
              <div className="loading-spinner" />
              <p>{t("lawyerDashboard.loadingAssignedCases")}</p>
            </div>
          )}

          {error && (
            <div className="alert-banner alert-error" role="alert">
              <span className="alert-icon"><FiAlertTriangle /></span>
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  className="btn-outline-navy btn-sm"
                  onClick={() => window.location.reload()}
                >
                  {t("lawyerDashboard.reload")}
                </button>
              </div>
            </div>
          )}

          {!loading && !error && cases.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-icon"><FiFolder /></div>
              <h2>{t("lawyerDashboard.noCasesAssigned")}</h2>
              <p>{t("lawyerDashboard.noCasesDescription")}</p>
            </div>
          )}

          {!error && (
            <DataTable
              title="lawyerDashboard.assignedClientMatters"
              showHeading={false}
              columns={lawyerCaseColumns}
              data={cases}
              rowKey="caseId"
              searchFields={lawyerCaseSearchFields}
              filters={lawyerCaseFilters}
              searchable={true}
              exportable={true}
              pagination={true}
              pageSize={10}
              loading={loading}
              emptyMessage="lawyerDashboard.noCasesForTable"
            />
          )}
        </section>

        {expandedCase !== null && (
          <section className="portal-card vault-drawer">
            <div className="card-header-simple">
              <div className="header-icon-title">
                <span className="header-icon"><FiFileText /></span>
                <div>
                  <h3>
                    {t("lawyerDashboard.matterFiles", {
                      caseId: expandedCase,
                    })}
                  </h3>
                  <p>{t("lawyerDashboard.documentDescription")}</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-close-sm"
                onClick={() => setExpandedCase(null)}
              >
                <FiX /> {t("lawyerDashboard.close")}
              </button>
            </div>

            {documentLoadingCase === expandedCase && (
              <div className="loading-card">
                <div className="loading-spinner" />
                <p>{t("lawyerDashboard.loadingDocuments")}</p>
              </div>
            )}

            {!documentLoadingCase && documentErrors[expandedCase] && (
              <div className="alert-banner alert-error" role="alert">
                <span className="alert-icon"><FiAlertTriangle /></span>
                <span>{documentErrors[expandedCase]}</span>
                <button
                  type="button"
                  className="btn-outline-navy btn-sm"
                  onClick={() => fetchCaseDocuments(expandedCase)}
                >
                  {t("lawyerDashboard.retry")}
                </button>
              </div>
            )}

            {!documentLoadingCase &&
              !documentErrors[expandedCase] &&
              (documentsByCase[expandedCase] || []).length === 0 && (
                <div className="vault-empty">
                  <span>
                    {t("lawyerDashboard.noDocumentsForCase", {
                      caseId: expandedCase,
                    })}
                  </span>
                </div>
              )}

            {!documentLoadingCase &&
              !documentErrors[expandedCase] &&
              (documentsByCase[expandedCase] || []).length > 0 && (
                <ul className="file-items-list">
                  {(documentsByCase[expandedCase] || []).map((file, index) => {
                    const docId = file.id ?? file.documentId ?? index;

                    return (
                      <li className="file-item-row" key={docId}>
                        <div className="file-info-group">
                          <span className="file-type-icon"><FiFileText /></span>
                          <div className="file-text-meta">
                            <span
                              className="file-name"
                              title={file.fileName || file.name}
                            >
                              {file.fileName ||
                                file.name ||
                                t("lawyerDashboard.unnamedDocument")}
                            </span>
                            <span className="file-sub">
                              {file.fileType ||
                                file.contentType ||
                                t("lawyerDashboard.file")}
                            </span>
                          </div>
                        </div>

                        <div className="file-action-buttons">
                          <button
                            type="button"
                            className="btn-download-sm"
                            disabled={
                              downloadingId === docId ||
                              viewingId === docId
                            }
                            onClick={() => handleViewDocument(file)}
                          >
                            {viewingId === docId
                              ? t("lawyerDashboard.opening")
                              : t("lawyerDashboard.view")}
                          </button>

                          <button
                            type="button"
                            className="btn-download-sm"
                            disabled={
                              downloadingId === docId ||
                              viewingId === docId
                            }
                            onClick={() => handleDownload(file)}
                          >
                            {downloadingId === docId
                              ? t("lawyerDashboard.downloading")
                              : `↓ ${t("lawyerDashboard.download")}`}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
          </section>
        )}
      </div>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        loading={loggingOut}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </main>
  );
}

export default LawyerDashboard;