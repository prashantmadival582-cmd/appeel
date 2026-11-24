
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  customerRequest,
  downloadCustomerDocument,
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import { CustomerPageHeader } from "./CustomerCases";
import DataTable from "../components/Table/DataTable";
import { FiFileText, FiFolder, FiAlertTriangle, FiLock } from "react-icons/fi";

export default function CustomerDocuments() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);

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

      setError(
        requestError.message || t("customerDocuments.errors.load")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate, t]);

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
        label: "customerDocuments.filters.caseId",
        allLabel: "customerDocuments.filters.allCases",
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
      setError(t("customerDocuments.errors.allowPopups"));
      return;
    }

    setDownloadingId(doc.id);

    try {
      const blob = await downloadCustomerDocument(doc.id);
      const url = URL.createObjectURL(blob);

      newTab.location.href = url;

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (viewError) {
      newTab.close();

      if (isCustomerAuthError(viewError)) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(
        viewError.message || t("customerDocuments.errors.view")
      );
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

      setError(
        downloadError.message || t("customerDocuments.errors.download")
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================================
  // DELETE DOCUMENT
  // =========================================

  const handleDelete = async () => {
    if (!documentToDelete) return;

    const doc = documentToDelete;

    setError("");
    setDownloadingId(doc.id);

    try {
      await customerRequest(
        `/api/cases/documents/${encodeURIComponent(doc.id)}`,
        { method: "DELETE" }
      );

      setDocuments((previous) =>
        previous.filter((item) => item.id !== doc.id)
      );

      setDocumentToDelete(null);
    } catch (deleteError) {
      if (isCustomerAuthError(deleteError)) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setError(
        deleteError.message || t("customerDocuments.errors.delete")
      );
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
      header: "customerDocuments.columns.documentName",
      accessor: "fileName",
      sortable: true,
      render: (doc) => (
        <div className="customer-doc-table-file">
          <span className="customer-doc-table-icon"><FiFileText /></span>

          <div className="customer-doc-table-file-info">
            <strong title={doc.fileName}>
              {doc.fileName || t("customerDocuments.untitledDocument")}
            </strong>

            <small>
              {t("customerDocuments.caseDocument")}
            </small>
          </div>
        </div>
      ),
    },
    {
      key: "caseId",
      header: "customerDocuments.columns.caseId",
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
      header: "customerDocuments.columns.action",
      sortable: false,
      render: (doc) => (
        <div className="customer-doc-actions">
          <button
            type="button"
            className="customer-doc-action-btn"
            disabled={downloadingId === doc.id}
            onClick={() => handleView(doc)}
          >
            {downloadingId === doc.id
              ? t("customerDocuments.opening")
              : t("customerDocuments.view")}
          </button>

          <button
            type="button"
            className="customer-doc-action-btn"
            disabled={downloadingId === doc.id}
            onClick={() => handleDownload(doc)}
          >
            {downloadingId === doc.id
              ? t("customerDocuments.pleaseWait")
              : `↓ ${t("customerDocuments.download")}`}
          </button>

          <button
            type="button"
            className="customer-doc-action-btn"
            disabled={downloadingId === doc.id}
            onClick={() => setDocumentToDelete(doc)}
          >
            {t("customerDocuments.delete")}
          </button>
        </div>
      ),
    },
  ];

  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="portal-page">

      {/* DELETE CONFIRMATION MODAL */}

      {documentToDelete && (
        <div className="customer-delete-overlay">
          <div
            className="customer-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="customer-delete-icon">!</div>

            <h2 id="delete-modal-title">
              {t("customerDocuments.deleteModal.title")}
            </h2>

            <p>
              {t("customerDocuments.deleteModal.confirmText")}{" "}
              <strong>{documentToDelete.fileName}</strong>?
              {" "}
              {t("customerDocuments.deleteModal.warning")}
            </p>

            <div className="customer-delete-actions">
              <button
                type="button"
                className="customer-delete-cancel"
                disabled={downloadingId !== null}
                onClick={() => setDocumentToDelete(null)}
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                className="customer-delete-confirm"
                disabled={downloadingId !== null}
                onClick={handleDelete}
              >
                {downloadingId === documentToDelete.id
                  ? t("customerDocuments.deleting")
                  : t("customerDocuments.deleteDocument")}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerPageHeader
        title={t("customerDocuments.title")}
        activeTab="documents"
      />

      <div className="portal-container customer-documents-container">

        {/* PAGE HEADING */}

        <div className="portal-page-header customer-documents-heading">
          <div>
            <span className="customer-documents-eyebrow">
              {t("customerDocuments.eyebrow")}
            </span>

            <h1>{t("customerDocuments.heading")}</h1>

            <p className="portal-subheading">
              {t("customerDocuments.description")}
            </p>
          </div>

          <div className="customer-documents-summary">
            <span className="customer-documents-summary-icon"><FiFolder /></span>

            <div>
              <strong>{documents.length}</strong>
              <span>
                {documents.length === 1
                  ? t("customerDocuments.document")
                  : t("customerDocuments.documents")}
              </span>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>
          </div>
        )}

        {/* DOCUMENT TABLE */}

        <section className="customer-document-table-card">
          <div className="customer-document-table-heading">
            <div>
              <h2>{t("customerDocuments.allDocuments")}</h2>
              <p>{t("customerDocuments.tableDescription")}</p>
            </div>
          </div>

          <DataTable
            title="customerDocuments.heading"
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
            emptyMessage="customerDocuments.emptyMessage"
          />
        </section>

        {/* SECURITY NOTE */}

        <div className="customer-documents-note">
          <span><FiLock /></span>
          <p>
            {t("customerDocuments.securityNote")}
          </p>
        </div>

      </div>
    </main>
  );
}
