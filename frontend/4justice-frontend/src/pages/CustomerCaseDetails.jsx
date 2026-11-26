
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  customerRequest,
  downloadCustomerDocument,
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import {
  CustomerPageHeader,
  formatStatus,
} from "./CustomerCases";

import {
  FiFolder,
  FiFileText,
  FiUploadCloud,
  FiMenu,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

import { FaBalanceScale } from "react-icons/fa";

export default function CustomerCaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { t, i18n } = useTranslation();

  const [customerCase, setCustomerCase] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [notice, setNotice] = useState("");

  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // =========================================
  // LOAD CASE DETAILS
  // =========================================

  useEffect(() => {
    let active = true;

    const fetchCaseDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getCustomerJson(
          `/api/cases/mine/${encodeURIComponent(caseId)}`
        );

        if (active) {
          setCustomerCase(data);
        }
      } catch (requestError) {
        if (!active) return;

        if (isCustomerAuthError(requestError)) {
          navigate("/login", { replace: true });
          return;
        }

        setError(
          requestError.message ||
            t("customerCaseDetails.errors.loadCase")
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCaseDetails();

    return () => {
      active = false;
    };
  }, [caseId, navigate, t]);

  // =========================================
  // LOAD CUSTOMER DOCUMENTS FOR THIS CASE
  // =========================================

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    setDocumentError("");

    try {
      const data = await getCustomerJson(
        "/api/customers/me/documents"
      );

      const allDocuments = Array.isArray(data) ? data : [];

      const caseDocuments = allDocuments.filter(
        (doc) => String(doc.caseId) === String(caseId)
      );

      setDocuments(caseDocuments);
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/login", { replace: true });
        return;
      }

      setDocumentError(
        requestError.message ||
          t("customerCaseDetails.errors.loadDocuments")
      );
    } finally {
      setDocumentsLoading(false);
    }
  }, [caseId, navigate, t]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (value) => {
    if (!value) {
      return t("customerCaseDetails.labels.dateUnavailable");
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("customerCaseDetails.labels.dateUnavailable");
    }

    return date.toLocaleString(
      i18n.language.startsWith("sv") ? "sv-SE" : "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getStatusClass = (status) =>
    String(status || "PENDING")
      .toLowerCase()
      .replaceAll("_", "-");

  // =========================================
  // UPLOAD MULTIPLE DOCUMENTS
  // =========================================

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);

    if (files.length === 0 || busy) return;

    setDocumentError("");
    setNotice("");
    setUploadProgress("");

    const allowedExtensions = new Set([
      "pdf",
      "doc",
      "docx",
      "jpg",
      "jpeg",
      "png",
      "csv",
      "xls",
      "xlsx",
    ]);

    const validFiles = [];
    const failures = [];

    // Validate every selected file.
    files.forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!allowedExtensions.has(extension)) {
        failures.push(
          `${file.name}: ${t(
            "customerCaseDetails.errors.unsupportedFileFormat"
          )}`
        );
        return;
      }

      if (file.size === 0) {
        failures.push(
          `${file.name}: ${t(
            "customerCaseDetails.errors.emptyFile"
          )}`
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        failures.push(
          `${file.name}: ${t(
            "customerCaseDetails.errors.fileTooLarge"
          )}`
        );
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length === 0) {
      setDocumentError(failures.join("\n"));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setBusy(true);

    let successCount = 0;

    try {
      // Upload files sequentially to the existing case.
      for (let index = 0; index < validFiles.length; index++) {
        const file = validFiles[index];

        setUploadProgress(
          t("customerCaseDetails.uploadProgress", {
            current: index + 1,
            total: validFiles.length,
            fileName: file.name,
          })
        );

        const formData = new FormData();
        formData.append("file", file);

        try {
          await customerRequest(
            `/api/customers/me/cases/${encodeURIComponent(caseId)}/documents`,
            {
              method: "POST",
              body: formData,
            }
          );

          successCount++;
        } catch (requestError) {
          if (isCustomerAuthError(requestError)) {
            navigate("/login", { replace: true });
            return;
          }

          failures.push(
            `${file.name}: ${
              requestError.message ||
              t("customerCaseDetails.errors.uploadFailed")
            }`
          );
        }
      }

      if (successCount > 0) {
        await loadDocuments();

        setNotice(
          t("customerCaseDetails.uploadSuccessCount", {
            count: successCount,
          })
        );
      }

      if (failures.length > 0) {
        setDocumentError(failures.join("\n"));
      }
    } finally {
      setBusy(false);
      setUploadProgress("");
      setIsDragging(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpload = (event) => {
    uploadFiles(event.target.files);
  };

  // =========================================
  // DRAG AND DROP
  // =========================================

  const handleDragOver = (event) => {
    event.preventDefault();

    if (!busy) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();

    // Ignore movement between children of the upload area.
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (busy) return;

    uploadFiles(event.dataTransfer.files);
  };

  // =========================================
  // VIEW DOCUMENT
  // =========================================

  const handleView = async (doc) => {
    setDocumentError("");

    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      setDocumentError(
        t("customerCaseDetails.errors.popupBlocked")
      );
      return;
    }

    setActiveDocumentId(doc.id);

    try {
      const blob = await downloadCustomerDocument(doc.id);
      const url = URL.createObjectURL(blob);

      newTab.location.href = url;

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (requestError) {
      newTab.close();

      if (isCustomerAuthError(requestError)) {
        navigate("/login", { replace: true });
        return;
      }

      setDocumentError(
        requestError.message ||
          t("customerCaseDetails.errors.viewDocument")
      );
    } finally {
      setActiveDocumentId(null);
    }
  };

  // =========================================
  // DOWNLOAD DOCUMENT
  // =========================================

  const handleDownload = async (doc) => {
    setDocumentError("");
    setActiveDocumentId(doc.id);

    try {
      const blob = await downloadCustomerDocument(doc.id);
      const url = URL.createObjectURL(blob);

      const link = window.document.createElement("a");

      link.href = url;
      link.download = doc.fileName || `document-${doc.id}`;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/login", { replace: true });
        return;
      }

      setDocumentError(
        requestError.message ||
          t("customerCaseDetails.errors.downloadDocument")
      );
    } finally {
      setActiveDocumentId(null);
    }
  };

  // =========================================
  // DELETE DOCUMENT
  // =========================================

  const handleDelete = async () => {
    if (!documentToDelete) return;

    const doc = documentToDelete;

    setBusy(true);
    setDocumentError("");
    setNotice("");

    try {
      await customerRequest(
        `/api/cases/documents/${encodeURIComponent(doc.id)}`,
        {
          method: "DELETE",
        }
      );

      setDocuments((previous) =>
        previous.filter((item) => item.id !== doc.id)
      );

      setDocumentToDelete(null);

      setNotice(
        t("customerCaseDetails.success.documentDeleted")
      );
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/login", { replace: true });
        return;
      }

      setDocumentError(
        requestError.message ||
          t("customerCaseDetails.errors.deleteDocument")
      );
    } finally {
      setBusy(false);
    }
  };

  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="portal-page customer-case-details-page">
      <CustomerPageHeader />

      <div className="customer-case-container">

        {/* DELETE CONFIRMATION */}

        {documentToDelete && (
          <div className="customer-case-delete-overlay">
            <div
              className="customer-case-delete-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="case-delete-title"
            >
              <h3 id="case-delete-title">
                {t("customerCaseDetails.confirmDelete.title")}
              </h3>

              <p>
                {t("customerCaseDetails.confirmDelete.message")}{" "}
                <strong>{documentToDelete.fileName}</strong>?
              </p>

              <div className="customer-case-delete-actions">
                <button
                  type="button"
                  className="customer-case-cancel-btn"
                  disabled={busy}
                  onClick={() => setDocumentToDelete(null)}
                >
                  {t("customerCaseDetails.confirmDelete.cancel")}
                </button>

                <button
                  type="button"
                  className="customer-case-delete-btn"
                  disabled={busy}
                  onClick={handleDelete}
                >
                  {busy
                    ? t("customerCaseDetails.confirmDelete.deleting")
                    : t("customerCaseDetails.confirmDelete.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE HEADING */}

        <div className="customer-case-heading">
          <div className="customer-case-heading-content">
            <div>
              <span className="customer-case-eyebrow">
                {t("customerCaseDetails.labels.eyebrow")}
              </span>

              <h1>{t("customerCaseDetails.title")}</h1>

              <p>
                {t("customerCaseDetails.description")}
              </p>
            </div>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="customer-case-state-card">
            <div className="customer-case-loader" />

            <h3>
              {t("customerCaseDetails.labels.loadingTitle")}
            </h3>

            <p>
              {t("customerCaseDetails.pleaseWait")}
            </p>
          </div>
        )}

        {/* CASE ERROR */}

        {!loading && error && (
          <div className="customer-case-error">
            <div className="customer-case-state-icon">!</div>

            <h3>
              {t("customerCaseDetails.labels.loadErrorTitle")}
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => navigate(0)}
            >
              {t("customerCaseDetails.labels.tryAgain")}
            </button>
          </div>
        )}

        {/* CASE CONTENT */}

        {!loading && !error && customerCase && (
          <div className="customer-case-content">

            {/* CASE OVERVIEW */}

            <section className="customer-case-overview">
              <div className="customer-case-overview-top">
                <div>
                  <span className="customer-case-label">
                    {t("customerCaseDetails.labels.caseReference")}
                  </span>

                  <h2>{customerCase.caseId}</h2>

                  <span className="customer-case-reference-note">
                    {t("customerCaseDetails.labels.referenceNote")}
                  </span>
                </div>

                <div
                  className={`customer-case-status ${getStatusClass(
                    customerCase.status
                  )}`}
                >
                  <span className="customer-case-status-dot" />

                  {formatStatus(customerCase.status, t)}
                </div>
              </div>

              <div className="customer-case-overview-footer">
                <span>
                  {t("customerCaseDetails.labels.legalSupport")}
                </span>

                <span>
                  {t("customerCaseDetails.labels.caseInformation")}
                </span>
              </div>
            </section>

            {/* INFORMATION CARDS */}

            <section className="customer-case-info-grid">
              <article className="customer-case-info-card">
                <div className="customer-case-card-icon blue">
                  <span><FaBalanceScale /></span>
                </div>

                <div>
                  <span className="customer-case-label">
                    {t("customerCaseDetails.labels.caseType")}
                  </span>

                  <h3>
                    {customerCase.caseType ||
                      t("customerCaseDetails.legalMatter")}
                  </h3>
                </div>
              </article>

              <article className="customer-case-info-card">
                <div className="customer-case-card-icon purple">
                  <span><FiUser /></span>
                </div>

                <div>
                  <span className="customer-case-label">
                    {t("customerCaseDetails.labels.assignedLawyerLabel")}
                  </span>

                  <h3>
                    {customerCase.lawyerName ||
                      t("customerCases.pendingAllocation", {
                        defaultValue: t("customerCaseDetails.notAssigned"),
                      })}
                  </h3>

                  {!customerCase.lawyerName && (
                    <p>
                      {t("customerCaseDetails.labels.lawyerPending")}
                    </p>
                  )}
                </div>
              </article>

              <article className="customer-case-info-card">
                <div className="customer-case-card-icon green">
                  <span><FiCalendar /></span>
                </div>

                <div>
                  <span className="customer-case-label">
                    {t("customerCaseDetails.labels.submittedDateLabel")}
                  </span>

                  <h3>{formatDate(customerCase.submittedAt)}</h3>
                </div>
              </article>
            </section>

            {/* CASE DESCRIPTION */}

            <section className="customer-case-description-card">
              <div className="customer-case-section-heading">
                <div>
                  <span className="customer-case-eyebrow">
                    {t("customerCaseDetails.labels.caseOverview")}
                  </span>

                  <h2>
                    {t("customerCaseDetails.labels.caseDescription")}
                  </h2>
                </div>

                <span className="customer-case-description-icon">
                  <FiMenu />
                </span>
              </div>

              <div className="customer-case-description-body">
                {customerCase.description ||
                  t("customerCaseDetails.labels.noCaseDescription")}
              </div>
            </section>

            {/* CUSTOMER DOCUMENTS */}

            <section className="customer-case-documents">

              <div className="customer-case-documents-heading">
                <div>
                  <span className="customer-case-eyebrow">
                    {t("customerCaseDetails.labels.yourCaseFiles")}
                  </span>

                  <h2>
                    {t("customerCaseDetails.labels.customerDocuments")}
                  </h2>

                  <p>
                    {t("customerCaseDetails.labels.documentsDescription")}
                  </p>
                </div>

                <span className="customer-case-document-count">
                  {documents.length}{" "}
                  {documents.length === 1
                    ? t("customerCaseDetails.labels.file")
                    : t("customerCaseDetails.labels.files")}
                </span>
              </div>

              {/* DOCUMENT MESSAGES */}

              {documentError && (
                <div
                  className="customer-case-document-error"
                  role="alert"
                >
                  {documentError}
                </div>
              )}

              {notice && (
                <div
                  className="customer-case-document-success"
                  role="status"
                >
                  {notice}
                </div>
              )}

              {/* DOCUMENT LIST */}

              {documentsLoading ? (
                <div className="customer-case-documents-empty">
                  {t("customerCaseDetails.labels.loadingDocuments")}
                </div>
              ) : documents.length === 0 ? (
                <div className="customer-case-documents-empty">
                  <span className="customer-case-empty-icon">
                    <FiFolder />
                  </span>

                  <h3>
                    {t("customerCaseDetails.labels.noDocumentsTitle")}
                  </h3>

                  <p>
                    {t("customerCaseDetails.labels.noDocumentsDescription")}
                  </p>
                </div>
              ) : (
                <div className="customer-case-document-list">
                  {documents.map((doc) => (
                    <article
                      className="customer-case-document-item"
                      key={doc.id}
                    >
                      <div className="customer-case-document-info">
                        <span className="customer-case-file-icon">
                          <FiFileText />
                        </span>

                        <div>
                          <strong title={doc.fileName}>
                            {doc.fileName ||
                              `${t("customerCaseDetails.labels.documentFallback")} ${doc.id}`}
                          </strong>

                          <small>
                            {doc.fileType ||
                              t("customerCaseDetails.legalMatter")}
                          </small>
                        </div>
                      </div>

                      <div className="customer-case-document-actions">
                        <button
                          type="button"
                          disabled={busy || activeDocumentId !== null}
                          onClick={() => handleView(doc)}
                        >
                          {t("customerCaseDetails.labels.view")}
                        </button>

                        <button
                          type="button"
                          disabled={busy || activeDocumentId !== null}
                          onClick={() => handleDownload(doc)}
                        >
                          {t("customerCaseDetails.download")}
                        </button>

                        <button
                          type="button"
                          className="delete"
                          disabled={busy || activeDocumentId !== null}
                          onClick={() => setDocumentToDelete(doc)}
                        >
                          {t("customerCaseDetails.labels.delete")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* MULTIPLE DOCUMENT UPLOAD */}

              <div
                className={`customer-case-upload-area ${
                  isDragging ? "is-dragging" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xls,.xlsx"
                  multiple
                  onChange={handleUpload}
                  hidden
                />

                <div className="customer-case-upload-icon">
                  <FiUploadCloud />
                </div>

                <div className="customer-case-upload-text">
                  <strong>
                    {isDragging
                      ? t("customerCaseDetails.labels.dropFiles")
                      : t("customerCaseDetails.labels.addDocuments")}
                  </strong>

                  <span>
                    {t("customerCaseDetails.labels.dragDropFiles")}
                  </span>

                  <span>
                    {t("customerCaseDetails.labels.uploadFormats")}
                  </span>

                  {uploadProgress && (
                    <span className="customer-case-upload-progress">
                      {uploadProgress}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {busy
                    ? t("customerCaseDetails.uploading")
                    : `+ ${t("customerCaseDetails.labels.selectFiles")}`}
                </button>
              </div>

            </section>

            {/* FOOTER NOTE */}

            <div className="customer-case-help-note">
              <div className="customer-case-help-icon">i</div>

              <p>
                {t("customerCaseDetails.labels.helpNote")}
              </p>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

