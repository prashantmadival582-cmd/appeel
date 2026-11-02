
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from "../api/api";

import DataTable from "../components/Table/DataTable";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";

function LawyerDashboard() {
  const navigate = useNavigate();

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





  // Reusable DataTable columns
  const lawyerCaseColumns = [
    {
      key: "caseId",
      header: "Case ID",
      accessor: "caseId",
      render: (item) => (
        <span className="case-id-tag">{item.caseId}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Name",
      accessor: "customerName",
      render: (item) => (
        <strong>{item.customerName || "Customer"}</strong>
      ),
    },
    {
      key: "caseType",
      header: "Matter Category",
      accessor: "caseType",
      render: (item) => (
        <span className="table-type-badge">
          {item.caseType || "General"}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      accessor: "description",
      render: (item) => (
        <span className="text-truncate">
          {item.description || "No description"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      render: (item) => (
        <span className={getStatusClass(item.status)}>
          {formatStatus(item.status)}
        </span>
      ),
    },
    {
      key: "updateStatus",
      header: "Update Status",
      sortable: false,
      render: (item) => (
        <div className="status-update-inline">
          <select
            value={item.status || "PENDING"}
            disabled={updatingCaseId === item.caseId}
            onChange={(event) =>
              updateStatus(item.caseId, event.target.value)
            }
            aria-label={`Update status for case ${item.caseId}`}
            className="modern-select-sm"
          >
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {updatingCaseId === item.caseId && (
            <small>Saving...</small>
          )}
        </div>
      ),
    },
    {
      key: "documents",
      header: "Documents",
      sortable: false,
      render: (item) => (
        <button
          type="button"
          className="btn-download-sm"
          disabled={documentLoadingCase === item.caseId}
          onClick={() => toggleDocuments(item.caseId)}
        >
          {documentLoadingCase === item.caseId
            ? "Loading..."
            : expandedCase === item.caseId
              ? "Hide Files"
              : `Files (${documentsByCase[item.caseId]?.length ?? "View"})`}
        </button>
      ),
    },
  ];

  // Searchable fields
  const lawyerCaseSearchFields = [
    "caseId",
    "customerName",
    "caseType",
    "description",
    "status",
  ];

  // Status filter
  const lawyerCaseFilters = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" },
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
              ? "Your session is invalid or expired. Please log in again."
              : "Unable to fetch lawyer details."
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
              ? "Your lawyer session is not valid. Please log in again."
              : "Unable to fetch assigned cases."
          );
        }

        const assignedCases = await casesResponse.json();
        setCases(Array.isArray(assignedCases) ? assignedCases : []);
      } catch (err) {
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerData();
  }, [lawyerId, lawyerToken, navigate]);

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
          (await response.text()) || "Failed to update availability."
        );
      }

      const updatedLawyer = await response.json();
      setAvailability(updatedLawyer.availability || status);
    } catch (err) {
      alert(err.message || "Unable to update availability.");
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
          (await response.text()) || "Failed to update case status."
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
      alert(err.message || "Failed to update case status.");
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
            `Unable to load documents (${response.status}).`
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
        throw new Error("Invalid document list received from the server.");
      }

      setDocumentsByCase((previous) => ({
        ...previous,
        [caseId]: documentList,
      }));
    } catch (err) {
      console.error("Failed to fetch case documents:", err);

      setDocumentErrors((previous) => ({
        ...previous,
        [caseId]: err.message || "Unable to load documents.",
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
      throw new Error("Document ID is missing.");
    }

    const token = localStorage.getItem("lawyerToken");

    if (!token) {
      throw new Error("Lawyer session expired. Please log in again.");
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
        `Document request failed (${response.status}): ` +
          (message || response.statusText)
      );
    }

    const blob = await response.blob();

    console.log("Received document size:", blob.size, "bytes");

    if (blob.size === 0) {
      throw new Error("The server returned an empty document.");
    }

    return blob;
  };

  // Download a document.
  const handleDownload = async (file) => {
    const docId = file?.id ?? file?.documentId;
    if (!docId) {
      alert("Document ID is missing.");
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
      alert(err.message || "Unable to download the document.");
    } finally {
      setDownloadingId(null);
    }
  };

  // View a document in a new tab.
  const handleViewDocument = async (file) => {
    const docId = file?.id ?? file?.documentId;
    if (!docId) {
      alert("Document ID is missing.");
      return;
    }

    // Open synchronously during the click to avoid popup blocking.
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      alert("Pop-up blocked. Allow pop-ups for localhost:5173 and try again.");
      return;
    }

    let objectUrl = null;

    try {
      setViewingId(docId);
      console.log("VIEW CLICKED:", file);

      newTab.document.title = "Loading document";
      newTab.document.body.innerHTML =
        "<p style='font-family:Arial;padding:24px'>Loading document...</p>";

      const blob = await getDocumentBlob(docId);
      const fileType =
        file.fileType || file.contentType || blob.type || "application/octet-stream";

      objectUrl = window.URL.createObjectURL(
        new Blob([blob], { type: fileType })
      );

      newTab.location.replace(objectUrl);

      // Give the browser time to load the document before cleanup.
      window.setTimeout(() => {
        if (objectUrl) {
          window.URL.revokeObjectURL(objectUrl);
        }
      }, 300000);
    } catch (err) {
      console.error("DOCUMENT VIEW ERROR:", err);

      if (!newTab.closed) {
        newTab.document.body.innerHTML =
          "<p style='font-family:Arial;padding:24px;color:#b91c1c'>" +
          "Unable to open this document. Return to the dashboard and check the error." +
          "</p>";
      }

      alert(err.message || "Unable to open the document.");
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

  const formatStatus = (status) =>
    status?.replaceAll("_", " ") || "Unknown";

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

  return (
    <main className="portal-page">
      <header className="customer-portal-navbar lawyer-navbar">
        <div className="portal-nav-container">
          <Link to="/lawyer/dashboard" className="portal-brand">
            <span className="brand-icon">⚖️</span>
            <span className="brand-title">APPEEL</span>
            <span className="brand-portal-pill lawyer">
              Lawyer Portal
            </span>
          </Link>

          
<div className="portal-nav-links open">
  <Link
    to="/"
    className="portal-nav-link"
  >
    ⌂ Home
  </Link>

 <button
  type="button"
  className="btn-logout-nav"
  onClick={() => setLogoutDialogOpen(true)}
>
  Sign Out
</button>
</div>

        </div>
      </header>

      <div className="portal-container">
        <div className="portal-page-header">
          <div>

            <h1>
              Welcome, {lawyer?.name || lawyer?.email || "Counsel"}
            </h1>

            <p className="portal-subheading">
              Manage your assigned legal cases, review client evidence,
              and update case's.
            </p>
          </div>

          <div className="lawyer-availability-badge-box">
            <span className="chip-label">Allocation Status</span>

            <div className="availability-selector-wrap">
              <select
                id="availability"
                value={availability}
                onChange={(event) => updateAvailability(event.target.value)}
                disabled={availabilityLoading || loading}
                className={`availability-select ${availability.toLowerCase()}`}
              >
                <option value="AVAILABLE">🟢 Available for Cases</option>
                <option value="BUSY">🔴 Currently Busy</option>
              </select>

              {availabilityLoading && (
                <small className="saving-indicator">Saving...</small>
              )}
            </div>
          </div>
        </div>

        <section className="stats-metric-grid">
          <div className="metric-card">
            <div className="metric-icon total">📁</div>
            <div className="metric-info">
              <span className="metric-label">Assigned Matters</span>
              <strong className="metric-value">
                {loading ? "-" : totalCases}
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon active">⚖️</div>
            <div className="metric-info">
              <span className="metric-label">Active / In Progress</span>
              <strong className="metric-value">
                {loading ? "-" : activeCases}
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon completed">✅</div>
            <div className="metric-info">
              <span className="metric-label">Resolved Cases</span>
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
              <span className="metric-label">Accepting Cases</span>
              <strong className="metric-value">
                {availability === "AVAILABLE"
                  ? "Yes (Available)"
                  : "No (Busy)"}
              </strong>
            </div>
          </div>
        </section>

        <section className="portal-card">
          <div className="card-header-simple">
            <div className="header-icon-title">
              <span className="header-icon">📂</span>
              <div>
                <h3>Assigned Client Matters</h3>
                <p>
                  Update case progression and inspect client documentation
                </p>
              </div>
            </div>

            <span className="results-badge">
              {cases.length} {cases.length === 1 ? "matter" : "matters"}
            </span>
          </div>

          {loading && (
            <div className="loading-card">
              <div className="loading-spinner" />
              <p>Loading assigned cases...</p>
            </div>
          )}

          {error && (
            <div className="alert-banner alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  className="btn-outline-navy btn-sm"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </button>
              </div>
            </div>
          )}

          {!loading && !error && cases.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-icon">📂</div>
              <h2>No cases currently assigned</h2>
              <p>
                When administrators allocate incoming cases to your
                specialization, they will appear here.
              </p>
            </div>
          )}

          
  {!error && (
    <DataTable
      title="Assigned Client Matters"
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
      emptyMessage="No cases are currently assigned to you."
    />
  )}

        </section>

        {expandedCase !== null && (
          <section className="portal-card vault-drawer">
            <div className="card-header-simple">
              <div className="header-icon-title">
                <span className="header-icon">📄</span>
                <div>
                  <h3>Matter Files: {expandedCase}</h3>
                  <p>Customer uploaded evidence and filed documents</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-close-sm"
                onClick={() => setExpandedCase(null)}
              >
                ✕ Close
              </button>
            </div>

            {documentLoadingCase === expandedCase && (
              <div className="loading-card">
                <div className="loading-spinner" />
                <p>Loading documents...</p>
              </div>
            )}

            {!documentLoadingCase && documentErrors[expandedCase] && (
              <div className="alert-banner alert-error" role="alert">
                <span className="alert-icon">⚠️</span>
                <span>{documentErrors[expandedCase]}</span>
                <button
                  type="button"
                  className="btn-outline-navy btn-sm"
                  onClick={() => fetchCaseDocuments(expandedCase)}
                >
                  Retry
                </button>
              </div>
            )}

            {!documentLoadingCase &&
              !documentErrors[expandedCase] &&
              (documentsByCase[expandedCase] || []).length === 0 && (
                <div className="vault-empty">
                  <span>
                    No documents found for case {expandedCase}.
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
                          <span className="file-type-icon">📄</span>
                          <div className="file-text-meta">
                            <span className="file-name" title={file.fileName || file.name}>
                              {file.fileName || file.name || "Unnamed document"}
                            </span>
                            <span className="file-sub">
                              {file.fileType || file.contentType || "File"}
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
                            {viewingId === docId ? "Opening..." : "View"}
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
                              ? "Downloading..."
                              : "↓ Download"}
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
