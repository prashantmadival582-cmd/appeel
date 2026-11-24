
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
import { FiFolder, FiFileText, FiUploadCloud, FiMenu, FiCalendar, FiUser } from "react-icons/fi";
import { FaBalanceScale } from "react-icons/fa";

export default function CustomerCaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
          requestError.message || "Unable to load case details."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCaseDetails();

    return () => {
      active = false;
    };
  }, [caseId, navigate]);

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
        requestError.message || "Unable to load case documents."
      );
    } finally {
      setDocumentsLoading(false);
    }
  }, [caseId, navigate]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) =>
    String(status || "PENDING")
      .toLowerCase()
      .replaceAll("_", "-");

  // =========================================
  // UPLOAD ANOTHER DOCUMENT
  // =========================================


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
          `${file.name}: Unsupported file format.`
        );
        return;
      }

      if (file.size === 0) {
        failures.push(`${file.name}: The file is empty.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        failures.push(
          `${file.name}: File size must be 10 MB or less.`
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
          `Uploading ${index + 1} of ${validFiles.length}: ${file.name}`
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
              requestError.message || "Upload failed."
            }`
          );
        }
      }

      if (successCount > 0) {
        await loadDocuments();

        setNotice(
          `${successCount} document(s) uploaded successfully.`
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
        "Please allow pop-ups in your browser to view documents."
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
        requestError.message || "Unable to view document."
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
        requestError.message || "Unable to download document."
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
      setNotice("Document deleted successfully.");
    } catch (requestError) {
      if (isCustomerAuthError(requestError)) {
        navigate("/login", { replace: true });
        return;
      }

      setDocumentError(
        requestError.message || "Unable to delete document."
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
              <h3 id="case-delete-title">Delete document?</h3>

              <p>
                Are you sure you want to delete{" "}
                <strong>{documentToDelete.fileName}</strong>?
              </p>

              <div className="customer-case-delete-actions">
                <button
                  type="button"
                  className="customer-case-cancel-btn"
                  disabled={busy}
                  onClick={() => setDocumentToDelete(null)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="customer-case-delete-btn"
                  disabled={busy}
                  onClick={handleDelete}
                >
                  {busy ? "Deleting..." : "Delete"}
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
                YOUR LEGAL MATTERS
              </span>

              <h1>Case Details</h1>

              <p>
                View your submitted case information and track its progress.
              </p>
            </div>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="customer-case-state-card">
            <div className="customer-case-loader" />
            <h3>Loading your case</h3>
            <p>Please wait while we retrieve your case information.</p>
          </div>
        )}

        {/* CASE ERROR */}

        {!loading && error && (
          <div className="customer-case-error">
            <div className="customer-case-state-icon">!</div>
            <h3>Unable to load case details</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => navigate(0)}
            >
              Try Again
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
                    CASE REFERENCE
                  </span>

                  <h2>{customerCase.caseId}</h2>

                  <span className="customer-case-reference-note">
                    Your unique legal case reference
                  </span>
                </div>

                <div
                  className={`customer-case-status ${getStatusClass(
                    customerCase.status
                  )}`}
                >
                  <span className="customer-case-status-dot" />
                  {formatStatus(customerCase.status)}
                </div>
              </div>

              <div className="customer-case-overview-footer">
                <span>APPEEL LEGAL SUPPORT</span>
                <span>Case information</span>
              </div>
            </section>

            {/* INFORMATION CARDS */}

            <section className="customer-case-info-grid">
              <article className="customer-case-info-card">
                <div className="customer-case-card-icon blue">
                  <span><FaBalanceScale /></span>
                </div>

                <div>
                  <span className="customer-case-label">CASE TYPE</span>
                  <h3>
                    {customerCase.caseType || "General Legal Matter"}
                  </h3>
                </div>
              </article>

              <article className="customer-case-info-card">
                <div className="customer-case-card-icon purple">
                  <span><FiUser /></span>
                </div>

                <div>
                  <span className="customer-case-label">
                    ASSIGNED LAWYER
                  </span>

                  <h3>
                    {customerCase.lawyerName || "Pending Allocation"}
                  </h3>

                  {!customerCase.lawyerName && (
                    <p>Lawyer assignment is pending.</p>
                  )}
                </div>
              </article>

              <article className="customer-case-info-card">
                <div className="customer-case-card-icon green">
                  <span><FiCalendar /></span>
                </div>

                <div>
                  <span className="customer-case-label">
                    SUBMITTED DATE
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
                    CASE OVERVIEW
                  </span>

                  <h2>Case Description</h2>
                </div>

                <span className="customer-case-description-icon">
                  <FiMenu />
                </span>
              </div>

              <div className="customer-case-description-body">
                {customerCase.description ||
                  "No case description is currently available."}
              </div>
            </section>

            {/* =================================
                CUSTOMER DOCUMENTS
            ================================= */}

            <section className="customer-case-documents">

              <div className="customer-case-documents-heading">
                <div>
                  <span className="customer-case-eyebrow">
                    YOUR CASE FILES
                  </span>

                  <h2>Customer Documents</h2>

                  <p>
                    View and manage the documents uploaded for this case.
                  </p>
                </div>

                <span className="customer-case-document-count">
                  {documents.length}{" "}
                  {documents.length === 1 ? "File" : "Files"}
                </span>
              </div>

              {/* DOCUMENT MESSAGES */}

              {documentError && (
                <div className="customer-case-document-error" role="alert">
                  {documentError}
                </div>
              )}

              {notice && (
                <div className="customer-case-document-success" role="status">
                  {notice}
                </div>
              )}

              {/* DOCUMENT LIST */}

              {documentsLoading ? (
                <div className="customer-case-documents-empty">
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="customer-case-documents-empty">
                  <span className="customer-case-empty-icon"><FiFolder /></span>
                  <h3>No documents uploaded yet</h3>
                  <p>
                    Add documents related to this legal case using the
                    upload button below.
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
                            {doc.fileName || `Document ${doc.id}`}
                          </strong>

                          <small>
                            {doc.fileType || "Case document"}
                          </small>
                        </div>
                      </div>

                      <div className="customer-case-document-actions">
                        <button
                          type="button"
                          disabled={busy || activeDocumentId !== null}
                          onClick={() => handleView(doc)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          disabled={busy || activeDocumentId !== null}
                          onClick={() => handleDownload(doc)}
                        >
                          Download
                        </button>

                        <button
                          type="button"
                          className="delete"
                          disabled={busy || activeDocumentId !== null}
                          onClick={() => setDocumentToDelete(doc)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* UPLOAD DOCUMENT */}


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
          ? "Drop your documents here"
          : "Add documents to your case"}
      </strong>

      <span>
        Drag and drop files here, or select multiple files.
      </span>

      <span>
        PDF, DOC, DOCX, JPG, JPEG, PNG, CSV, XLS and XLSX ·
        Maximum 10 MB per file
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
      {busy ? "Uploading..." : "+ Select Files"}
    </button>
  </div>

            </section>

            {/* FOOTER NOTE */}

            <div className="customer-case-help-note">
              <div className="customer-case-help-icon">i</div>

              <p>
                Your case information and documents are available in your
                personal dashboard. For assistance, please contact the
                APPEEL support team.
              </p>
            </div>



          </div>
        )}
      </div>
    </main>
  );
}
