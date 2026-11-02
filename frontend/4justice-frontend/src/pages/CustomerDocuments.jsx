
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  downloadCustomerDocument,
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import { CustomerPageHeader } from "./CustomerCases";
import DataTable from "../components/Table/DataTable";

export default function CustomerDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const navigate = useNavigate();

  // =========================================
  // LOAD DOCUMENTS
  // =========================================

  const loadDocuments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getCustomerJson("/api/customers/me/documents");
      setDocuments(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(requestError.message || "Unable to load documents.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // =========================================
  // CASE ID FILTER OPTIONS
  // =========================================

  const filters = useMemo(() => {
    const caseIds = [
      ...new Set(
        documents
          .map((doc) => doc.caseId)
          .filter(Boolean)
          .map(String)
      ),
    ];

    return [
      {
        key: "caseId",
        label: "Case ID",
        allLabel: "All Cases",
        options: caseIds.map((caseId) => ({
          value: caseId,
          label: caseId,
        })),
      },
    ];
  }, [documents]);

  // =========================================
  // VIEW DOCUMENT
  // =========================================

  const handleView = async (doc) => {
    setError("");

    // Open a blank tab immediately to avoid popup blocking.
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      setError("Please allow pop-ups to view this document.");
      return;
    }

    setDownloadingId(doc.id);

    try {
      const blob = await downloadCustomerDocument(doc.id);
      const url = URL.createObjectURL(blob);

      newTab.location.href = url;

      // Keep the URL available while the new tab loads.
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (viewError) {
      newTab.close();

      if (isCustomerAuthError(viewError)) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(viewError.message || "Unable to view document.");
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================================
  // DOWNLOAD DOCUMENT
  // =========================================

  const handleDownload = async (doc) => {
    setError("");
    setDownloadingId(doc.id);

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
    } catch (downloadError) {
      if (isCustomerAuthError(downloadError)) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(downloadError.message || "Unable to download document.");
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================================
  // TABLE COLUMNS
  // =========================================

  const columns = [
    {
      key: "fileName",
      header: "Document Name",
      accessor: "fileName",
      sortable: true,
      render: (doc) => (
        <div className="customer-doc-table-file">
          <span className="customer-doc-table-icon">📄</span>

          <div className="customer-doc-table-file-info">
            <strong title={doc.fileName}>
              {doc.fileName || "Untitled document"}
            </strong>
            <small>Case document</small>
          </div>
        </div>
      ),
    },
    {
      key: "caseId",
      header: "Case ID",
      accessor: "caseId",
      sortable: true,
      render: (doc) => (
        <span className="customer-doc-case-id">
          {doc.caseId || "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortable: false,
      render: (doc) => (
        <div className="customer-doc-actions">
  <button
    type="button"
    className="customer-doc-action-btn"
    disabled={downloadingId === doc.id}
    onClick={() => handleView(doc)}
  >
    {downloadingId === doc.id ? "Opening..." : "View"}
  </button>

  <button
    type="button"
    className="customer-doc-action-btn"
    disabled={downloadingId === doc.id}
    onClick={() => handleDownload(doc)}
  >
    {downloadingId === doc.id ? "Please wait..." : "↓ Download"}
  </button>
</div>
      ),
    },
  ];

  return (
    <main className="portal-page">
      <CustomerPageHeader
        title="My Documents"
        activeTab="documents"
      />

      <div className="portal-container customer-documents-container">

        {/* PAGE HEADING */}

        <div className="portal-page-header customer-documents-heading">
          <div>
            <span className="customer-documents-eyebrow">
              SECURE DOCUMENT CENTER
            </span>

            <h1>Document Vault</h1>

            <p className="portal-subheading">
              Securely access, review, and download documents associated
              with your legal cases.
            </p>
          </div>

          <div className="customer-documents-summary">
            <span className="customer-documents-summary-icon">📁</span>

            <div>
              <strong>{documents.length}</strong>
              <span>
                {documents.length === 1 ? "Document" : "Documents"}
              </span>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* DOCUMENT TABLE */}

        <section className="customer-document-table-card">
          <div className="customer-document-table-heading">
            <div>
              <h2>All Documents</h2>
              <p>Your uploaded case files in one place.</p>
            </div>
          </div>

          <DataTable
            title="Document Vault"
            showHeading={false}
            columns={columns}
            data={documents}
            rowKey="id"
            searchFields={[
              "fileName",
              "caseId",
            ]}
            filters={filters}
            searchable={true}
            exportable={true}
            pagination={true}
            pageSize={8}
            loading={loading}
            onRefresh={() => loadDocuments(true)}
            refreshing={refreshing}
            emptyMessage="No documents found. Upload documents to your legal cases to see them here."
          />
        </section>

        {/* SECURITY NOTE */}

        <div className="customer-documents-note">
          <span>🔒</span>
          <p>
            Your case documents are securely associated with your account.
            You can view or download them whenever you need access.
          </p>
        </div>

      </div>
    </main>
  );
}
