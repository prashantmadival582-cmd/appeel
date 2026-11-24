
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../api/api";
import AdminDetailLayout from "../components/Admin/AdminDetailLayout";

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #dfe8f2",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 18px rgba(20, 55, 90, 0.045)",
    marginBottom: "12px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#21486c",
    margin: "0 0 12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
    gap: "24px",
  },
  detail: {
    padding: "8px 0",
    borderBottom: "1px solid #edf1f6",
    minWidth: 0,
  },
  label: {
    display: "block",
    fontSize: "11px",
    color: "#71839a",
    marginBottom: "6px",
  },
  value: {
    fontSize: "13px",
    color: "#203d5a",
    overflowWrap: "anywhere",
    lineHeight: 1.6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d7e1ed",
    borderRadius: "6px",
    padding: "9px 11px",
    fontSize: "13px",
    color: "#203d5a",
    background: "#fff",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d7e1ed",
    borderRadius: "6px",
    padding: "9px 11px",
    fontSize: "13px",
    color: "#203d5a",
    background: "#fff",
  },
  button: {
    border: "1px solid #123e65",
    borderRadius: "6px",
    padding: "10px 15px",
    background: "#123e65",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },
  secondaryButton: {
    border: "1px solid #d5e0ec",
    borderRadius: "6px",
    padding: "9px 13px",
    background: "#fff",
    color: "#294d6e",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },
  actionPanel: {
    background: "#f6faff",
    border: "1px solid #dce9f7",
    borderRadius: "10px",
    padding: "14px",
    marginTop: "18px",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  alert: {
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    marginBottom: "12px",
  },
};

const formatStatus = (status) =>
  (status || "PENDING")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getTranslatedStatus = (status, t) =>
  t(`adminCaseDetails.statuses.${status}`, {
    defaultValue: formatStatus(status),
  });

const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getErrorMessage = (data, fallback) =>
  data?.message || data?.error || fallback;

function DetailItem({ label, children }) {
  return (
    <div style={styles.detail} className="case-detail-row">
      <span style={styles.label}>{label}</span>
      <div style={styles.value}>{children || "—"}</div>
    </div>
  );
}

export default function AdminCaseDetails() {
  const { caseId } = useParams();
  const { t } = useTranslation();

  const [caseData, setCaseData] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [documents, setDocuments] = useState([]);

  // External invoice state
const [externalInvoices, setExternalInvoices] = useState([]);
const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceMessage, setInvoiceMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [selectedLawyer, setSelectedLawyer] = useState("");

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [lawyerSaving, setLawyerSaving] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [documentError, setDocumentError] = useState("");

  // Fetch case details
  const fetchCaseDetails = useCallback(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(t("adminCaseDetails.errors.loadCase"));
    }

    const data = await response.json();

    setCaseData(data);
    setSelectedStatus(data.status || "PENDING");
    setSelectedLawyer(data.lawyer?.id ? String(data.lawyer.id) : "");

    setCustomerForm({
      name: data.customer?.name || data.customerName || "",
      email: data.customer?.email || data.customerEmail || "",
      phone: data.customer?.phone || "",
      password: "",
    });
  }, [caseId, t]);

  // Fetch case documents
  const fetchDocuments = useCallback(async () => {
    try {
      setDocumentError("");

      const response = await fetch(
        `${API_BASE_URL}/api/cases/${encodeURIComponent(caseId)}/documents`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error(t("adminCaseDetails.errors.loadDocuments"));
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setDocuments([]);
      setDocumentError(
        err.message || t("adminCaseDetails.errors.loadDocuments")
      );
    }
  }, [caseId, t]);

  // Fetch external invoices for this case
  const fetchExternalInvoices = useCallback(async () => {
    setInvoiceLoading(true);
    setInvoiceError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}/external-invoices`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load external invoices.")
        );
      }

      setExternalInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setInvoiceError(
        err.message || "Unable to load external invoices."
      );
    } finally {
      setInvoiceLoading(false);
    }
  }, [caseId]);

  // Fetch lawyers
  const fetchLawyers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lawyers`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(t("adminCaseDetails.errors.loadLawyers"));
      }

      const data = await response.json();
      setLawyers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((current) => current || err.message);
    }
  }, [t]);

  // Load page data
  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        fetchCaseDetails(),
        fetchDocuments(),
        fetchLawyers(),
        fetchExternalInvoices(),
      ]);
    } catch (err) {
      setError(err.message || t("adminCaseDetails.errors.loadCase"));
    } finally {
      setLoading(false);
    }
  }, [
    fetchCaseDetails,
    fetchDocuments,
    fetchLawyers,
    fetchExternalInvoices,
    t,
  ]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // Customer form change
  const handleCustomerChange = (event) => {
    const { name, value } = event.target;

    setCustomerForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Cancel customer editing
  const handleCancelCustomerEdit = () => {
    setCustomerForm({
      name: caseData?.customer?.name || caseData?.customerName || "",
      email: caseData?.customer?.email || caseData?.customerEmail || "",
      phone: caseData?.customer?.phone || "",
      password: "",
    });

    setEditingCustomer(false);
    setCustomerMessage("");
    setCustomerError("");
  };

  // Update customer details and optional password
  const handleCustomerUpdate = async (event) => {
    event.preventDefault();
    setCustomerSaving(true);
    setCustomerMessage("");
    setCustomerError("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}/customer`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: customerForm.name.trim(),
            email: customerForm.email.trim(),
            phone: customerForm.phone.trim(),
            ...(customerForm.password.trim()
              ? { password: customerForm.password }
              : {}),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            t("adminCaseDetails.errors.updateCustomer")
          )
        );
      }

      setCaseData(data);

      setCustomerForm({
        name: data.customer?.name || data.customerName || "",
        email: data.customer?.email || data.customerEmail || "",
        phone: data.customer?.phone || "",
        password: "",
      });

      setEditingCustomer(false);
      setCustomerMessage(
        t("adminCaseDetails.success.customerUpdated")
      );
    } catch (err) {
      setCustomerError(
        err.message || t("adminCaseDetails.errors.updateCustomer")
      );
    } finally {
      setCustomerSaving(false);
    }
  };

  // Update case status
  const handleStatusUpdate = async (event) => {
    event.preventDefault();
    setStatusSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}/status?status=${encodeURIComponent(selectedStatus)}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            t("adminCaseDetails.errors.updateStatus")
          )
        );
      }

      setCaseData((current) => ({
        ...current,
        ...data,
        status: data.status || selectedStatus,
      }));

      setSelectedStatus(data.status || selectedStatus);
      setMessage(t("adminCaseDetails.success.statusUpdated"));
    } catch (err) {
      setError(
        err.message || t("adminCaseDetails.errors.updateStatus")
      );
    } finally {
      setStatusSaving(false);
    }
  };

  // Assign lawyer
  const handleAssignLawyer = async (event) => {
    event.preventDefault();

    if (!selectedLawyer) {
      setError(t("adminCaseDetails.errors.selectLawyer"));
      return;
    }

    setLawyerSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}/assign-lawyer/${encodeURIComponent(selectedLawyer)}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            t("adminCaseDetails.errors.assignLawyer")
          )
        );
      }

      await fetchCaseDetails();

      setMessage(t("adminCaseDetails.success.lawyerAssigned"));
    } catch (err) {
      setError(
        err.message || t("adminCaseDetails.errors.assignLawyer")
      );
    } finally {
      setLawyerSaving(false);
    }
  };

  // Send external invoice to customer
  const handleSendExternalInvoice = async (event) => {
    event.preventDefault();

    const amount = Number(invoiceAmount);

    if (!invoiceAmount || !Number.isFinite(amount) || amount <= 0) {
      setInvoiceError("Please enter a valid invoice amount greater than zero.");
      return;
    }

    if (!customerForm.email?.trim()) {
      setInvoiceError("Customer email address is missing.");
      return;
    }

    setInvoiceSending(true);
    setInvoiceError("");
    setInvoiceMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}/external-invoices`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to send the external invoice.")
        );
      }

      setInvoiceAmount("");
      setInvoiceMessage(
        `External invoice ${data.invoiceReference} was created and sent to ${data.customerEmail}.`
      );

      await fetchExternalInvoices();
    } catch (err) {
      setInvoiceError(
        err.message || "Unable to send the external invoice."
      );
    } finally {
      setInvoiceSending(false);
    }
  };

  // View or download document
  const openDocument = async (documentId, mode) => {
    setDocumentError("");

    // Open a blank tab immediately to avoid popup blocking.
    let newTab = null;

    if (mode === "view") {
      newTab = window.open("about:blank", "_blank");

      if (!newTab) {
        setDocumentError(
          t("adminCaseDetails.errors.allowPopups")
        );
        return;
      }
    }

    setOpeningDocumentId(documentId);

    try {
      const endpoint = mode === "view" ? "view" : "download";

      const response = await fetch(
        `${API_BASE_URL}/api/cases/documents/${encodeURIComponent(documentId)}/${endpoint}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error(
          t("adminCaseDetails.errors.openDocument")
        );
      }

      console.log("Document endpoint:", response.url);
      console.log(
        "HTTP Content-Type:",
        response.headers.get("content-type")
      );
      console.log(
        "HTTP Content-Disposition:",
        response.headers.get("content-disposition")
      );

      const blob = await response.blob();

      console.log("Blob type:", blob.type);
      console.log("Blob size:", blob.size);

      const objectUrl = URL.createObjectURL(blob);

      if (mode === "view") {
        newTab.location.href = objectUrl;

        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 60000);
      } else {
        const link = window.document.createElement("a");
        link.href = objectUrl;
        link.download = `document-${documentId}`;

        window.document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      }
    } catch (err) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }

      setDocumentError(
        err.message || t("adminCaseDetails.errors.openDocument")
      );
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const layoutTitle =
    caseData?.caseType || t("adminCaseDetails.title");

  const layoutSubtitle = t("adminCaseDetails.subtitle", {
    caseId: caseData?.caseId || caseId,
  });

  // Loading screen
  if (loading) {
    return (
      <AdminDetailLayout
        title={t("adminCaseDetails.title")}
        subtitle={t("adminCaseDetails.loadingSubtitle", { caseId })}
        backTo="/admin/cases"
        backLabel={t("adminCaseDetails.backToCases")}
      >
        <div className="admin-detail-loading">
          {t("adminCaseDetails.loading")}
        </div>
      </AdminDetailLayout>
    );
  }

  // Case not found
  if (!caseData) {
    return (
      <AdminDetailLayout
        title={t("adminCaseDetails.title")}
        subtitle={t("adminCaseDetails.caseIdSubtitle", { caseId })}
        backTo="/admin/cases"
        backLabel={t("adminCaseDetails.backToCases")}
      >
        <div className="admin-detail-card">
          <p style={{ color: "#b42332", marginTop: "10px" }}>
            {error || t("adminCaseDetails.errors.caseNotFound")}
          </p>

          <button
            type="button"
            style={styles.button}
            className="case-action-button"
            onClick={loadPage}
          >
            {t("adminCaseDetails.tryAgain")}
          </button>
        </div>
      </AdminDetailLayout>
    );
  }

  const customer = caseData.customer || {};
  const assignedLawyer = caseData.lawyer;

  return (
    <AdminDetailLayout
      title={layoutTitle}
      subtitle={layoutSubtitle}
      backTo="/admin/cases"
      backLabel={t("adminCaseDetails.backToCases")}
      status={caseData.status}
    >
      {error && (
        <div
          role="alert"
          style={{
            ...styles.alert,
            background: "#fff0f0",
            color: "#a52632",
            border: "1px solid #f4cccc",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            ...styles.alert,
            background: "#eaf7ef",
            color: "#217348",
            border: "1px solid #ccebd8",
          }}
        >
          {message}
        </div>
      )}

      <section
        style={styles.card}
        className="case-details-card admin-detail-card"
      >
        <h2 style={styles.sectionTitle}>
          {t("adminCaseDetails.caseInformation")}
        </h2>

        <div style={styles.grid}>
          <div style={{ minWidth: 0 }}>
            {customerMessage && (
              <div
                role="status"
                style={{
                  ...styles.alert,
                  background: "#eaf7ef",
                  color: "#217348",
                }}
              >
                {customerMessage}
              </div>
            )}

            {customerError && (
              <div
                role="alert"
                style={{
                  ...styles.alert,
                  background: "#fff0f0",
                  color: "#a52632",
                }}
              >
                {customerError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <h3 style={{ ...styles.sectionTitle, margin: 0 }}>
                {t("adminCaseDetails.clientInformation")}
              </h3>

              {!editingCustomer && (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  className="case-secondary-button"
                  onClick={() => {
                    setCustomerMessage("");
                    setCustomerError("");
                    setEditingCustomer(true);
                  }}
                >
                  {t("adminCaseDetails.editDetails")}
                </button>
              )}
            </div>

            {editingCustomer ? (
              <form onSubmit={handleCustomerUpdate}>
                <div style={styles.detail} className="case-detail-row">
                  <label style={styles.label} htmlFor="customer-name">
                    {t("adminCaseDetails.customerName")}
                  </label>

                  <input
                    id="customer-name"
                    style={styles.input}
                    name="name"
                    value={customerForm.name}
                    onChange={handleCustomerChange}
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>

                <div style={styles.detail} className="case-detail-row">
                  <label style={styles.label} htmlFor="customer-email">
                    {t("adminCaseDetails.emailAddress")}
                  </label>

                  <input
                    id="customer-email"
                    style={styles.input}
                    name="email"
                    type="email"
                    value={customerForm.email}
                    onChange={handleCustomerChange}
                    required
                    maxLength={150}
                    autoComplete="email"
                  />
                </div>

                <div style={styles.detail} className="case-detail-row">
                  <label style={styles.label} htmlFor="customer-phone">
                    {t("adminCaseDetails.phoneNumber")}
                  </label>

                  <input
                    id="customer-phone"
                    style={styles.input}
                    name="phone"
                    type="tel"
                    value={customerForm.phone}
                    onChange={handleCustomerChange}
                    maxLength={20}
                    autoComplete="tel"
                  />
                </div>

                {/* Optional customer password update */}
                <div style={styles.detail} className="case-detail-row">
                  <label style={styles.label} htmlFor="customer-password">
                    New Password
                  </label>

                  <input
                    id="customer-password"
                    style={styles.input}
                    name="password"
                    type="password"
                    value={customerForm.password}
                    onChange={handleCustomerChange}
                    minLength={8}
                    maxLength={100}
                    autoComplete="new-password"
                    placeholder="Enter new password (optional)"
                  />

                  <small
                    style={{
                      display: "block",
                      color: "#71839a",
                      fontSize: "11px",
                      marginTop: "5px",
                    }}
                  >
                    Leave blank to keep the current password.
                  </small>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "9px",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="submit"
                    style={styles.button}
                    className="case-action-button"
                    disabled={customerSaving}
                  >
                    {customerSaving
                      ? t("adminCaseDetails.saving")
                      : t("adminCaseDetails.saveChanges")}
                  </button>

                  <button
                    type="button"
                    style={styles.secondaryButton}
                    className="case-secondary-button"
                    onClick={handleCancelCustomerEdit}
                    disabled={customerSaving}
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <DetailItem label={t("adminCaseDetails.customerName")}>
                  {customer.name || caseData.customerName}
                </DetailItem>

                <DetailItem label={t("adminCaseDetails.emailAddress")}>
                  {customer.email || caseData.customerEmail}
                </DetailItem>

                <DetailItem label={t("adminCaseDetails.phoneNumber")}>
                  {customer.phone || t("adminCaseDetails.notProvided")}
                </DetailItem>
              </>
            )}

            <DetailItem label={t("adminCaseDetails.caseType")}>
              {caseData.caseType}
            </DetailItem>

            <DetailItem label={t("adminCaseDetails.caseDescription")}>
              {caseData.description}
            </DetailItem>
          </div>

          {/* Assigned lawyer and documents */}
          <div
            style={{
              borderLeft: "1px solid #e8eef5",
              paddingLeft: "22px",
              minWidth: 0,
            }}
          >
            <div style={{ marginBottom: "22px" }}>
              <h3 style={styles.sectionTitle}>
                {t("adminCaseDetails.assignedLawyer")}
              </h3>

              <DetailItem label={t("adminCaseDetails.currentAssignment")}>
                {assignedLawyer
                  ? assignedLawyer.name ||
                    assignedLawyer.fullName ||
                    assignedLawyer.email ||
                    `Lawyer #${assignedLawyer.id}`
                  : t("adminCaseDetails.notAssigned")}
              </DetailItem>

              {assignedLawyer?.email && (
                <DetailItem label={t("adminCaseDetails.lawyerEmail")}>
                  {assignedLawyer.email}
                </DetailItem>
              )}
            </div>

            <div>
              <h3 style={styles.sectionTitle}>
                {t("adminCaseDetails.documents", {
                  count: documents.length,
                })}
              </h3>

              {documentError && (
                <div
                  role="alert"
                  style={{
                    ...styles.alert,
                    background: "#fff0f0",
                    color: "#a52632",
                  }}
                >
                  {documentError}

                  <button
                    type="button"
                    style={{
                      ...styles.secondaryButton,
                      marginLeft: "8px",
                    }}
                    className="case-secondary-button"
                    onClick={fetchDocuments}
                  >
                    {t("adminCaseDetails.retry")}
                  </button>
                </div>
              )}

              {documents.length === 0 ? (
                <div style={{ ...styles.value, color: "#71839a" }}>
                  {t("adminCaseDetails.noDocuments")}
                </div>
              ) : (
                documents.map((doc) => {
                  const documentId = doc.id || doc.documentId;

                  const documentName =
                    doc.fileName ||
                    doc.filename ||
                    doc.originalFilename ||
                    doc.name ||
                    `Document ${documentId}`;

                  return (
                    <div
                      key={documentId}
                      className="case-document-item"
                      style={{
                        border: "1px solid #e5edf5",
                        borderRadius: "8px",
                        padding: "11px",
                        marginBottom: "9px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          overflowWrap: "anywhere",
                          marginBottom: "9px",
                        }}
                      >
                        {documentName}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          className="case-secondary-button"
                          disabled={openingDocumentId === documentId}
                          onClick={() => openDocument(documentId, "view")}
                        >
                          {openingDocumentId === documentId
                            ? t("adminCaseDetails.opening")
                            : t("adminCaseDetails.view")}
                        </button>

                        <button
                          type="button"
                          style={styles.secondaryButton}
                          className="case-secondary-button"
                          disabled={openingDocumentId === documentId}
                          onClick={() =>
                            openDocument(documentId, "download")
                          }
                        >
                          {t("adminCaseDetails.download")}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="admin-detail-section-divider" />

        {/* Quick actions */}
        <div
          style={styles.actionPanel}
          className="case-quick-actions"
        >
          <h2 style={styles.sectionTitle}>
            {t("adminCaseDetails.quickActions")}
          </h2>

          <div style={styles.actionGrid}>
            <form onSubmit={handleStatusUpdate}>
              <label style={styles.label} htmlFor="case-status">
                {t("adminCaseDetails.updateStatus")}
              </label>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "9px",
                }}
              >
                <select
                  id="case-status"
                  style={{ ...styles.select, flex: "1 1 140px" }}
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value)
                  }
                >
                  {[
                    "PENDING",
                    "IN_PROGRESS",
                    "ASSIGNED",
                    "COMPLETED",
                    "RESOLVED",
                    "CLOSED",
                    "REJECTED",
                    "CANCELLED",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {getTranslatedStatus(status, t)}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  style={styles.button}
                  className="case-action-button"
                  disabled={
                    statusSaving || selectedStatus === caseData.status
                  }
                >
                  {statusSaving
                    ? t("adminCaseDetails.saving")
                    : t("adminCaseDetails.saveStatus")}
                </button>
              </div>
            </form>

            <form onSubmit={handleAssignLawyer}>
              <label style={styles.label} htmlFor="assign-lawyer">
                {t("adminCaseDetails.assignLawyer")}
              </label>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "9px",
                }}
              >
                <select
                  id="assign-lawyer"
                  style={{ ...styles.select, flex: "1 1 140px" }}
                  value={selectedLawyer}
                  onChange={(event) =>
                    setSelectedLawyer(event.target.value)
                  }
                >
                  <option value="">
                    {t("adminCaseDetails.selectLawyer")}
                  </option>

                  {lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {lawyer.name ||
                        lawyer.fullName ||
                        lawyer.email ||
                        `Lawyer #${lawyer.id}`}
                      {lawyer.availability
                        ? ` (${getTranslatedStatus(
                            lawyer.availability,
                            t
                          )})`
                        : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  style={styles.button}
                  className="case-action-button"
                  disabled={lawyerSaving || !selectedLawyer}
                >
                  {lawyerSaving
                    ? t("adminCaseDetails.assigning")
                    : t("adminCaseDetails.assign")}
                </button>
              </div>
            </form>
          </div>

          {/* External Invoices */}
          <div className="admin-detail-section-divider" />

          <div style={{ marginTop: "20px" }}>
            <h2 style={styles.sectionTitle}>
              External Invoices
            </h2>

            <p style={{ ...styles.value, color: "#71839a", marginBottom: "16px" }}>
              Create and send additional payment invoices to the customer.
            </p>

            {invoiceMessage && (
              <div
                role="status"
                style={{
                  ...styles.alert,
                  background: "#eaf7ef",
                  color: "#217348",
                  border: "1px solid #ccebd8",
                }}
              >
                {invoiceMessage}
              </div>
            )}

            {invoiceError && (
              <div
                role="alert"
                style={{
                  ...styles.alert,
                  background: "#fff0f0",
                  color: "#a52632",
                  border: "1px solid #f4cccc",
                }}
              >
                {invoiceError}
              </div>
            )}

            <form
              onSubmit={handleSendExternalInvoice}
              style={{
                ...styles.actionPanel,
                marginTop: "12px",
              }}
            >
              <div style={styles.actionGrid}>
                <div>
                  <label style={styles.label} htmlFor="external-invoice-amount">
                    Invoice Amount (SEK)
                  </label>

                  <input
                    id="external-invoice-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter invoice amount"
                    style={styles.input}
                    value={invoiceAmount}
                    onChange={(event) => {
                      setInvoiceAmount(event.target.value);
                      setInvoiceError("");
                    }}
                    required
                    disabled={invoiceSending}
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    Customer Email
                  </label>

                  <div style={{ ...styles.value, padding: "9px 0" }}>
                    {customerForm.email || "Email address unavailable"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <button
                  type="submit"
                  style={styles.button}
                  className="case-action-button"
                  disabled={invoiceSending || !customerForm.email}
                >
                  {invoiceSending
                    ? "Creating and Sending..."
                    : "Send External Invoice"}
                </button>
              </div>

              <p style={{ ...styles.value, color: "#71839a", marginTop: "12px" }}>
                The customer will receive an email containing a PayPal Sandbox
                payment link.
              </p>
            </form>

            {/* Invoice history */}

            {/* Invoice history accordion */}
            <div className="invoice-history-section">
              <div className="invoice-history-heading">
                <h3 style={{ ...styles.sectionTitle, margin: 0 }}>
                  Invoice History ({externalInvoices.length})
                </h3>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  className="case-secondary-button"
                  onClick={fetchExternalInvoices}
                  disabled={invoiceLoading}
                >
                  {invoiceLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {invoiceLoading ? (
                <p style={styles.value}>Loading external invoices...</p>
              ) : externalInvoices.length === 0 ? (
                <p className="invoice-history-empty">
                  No external invoices have been created for this case.
                </p>
              ) : (
                <div className="invoice-accordion-list">
                  {externalInvoices.map((invoice) => {
                    const isExpanded = expandedInvoiceId === invoice.id;

                    return (
                      <div className="invoice-accordion-item" key={invoice.id}>
                        <button
                          type="button"
                          className="invoice-accordion-trigger"
                          aria-expanded={isExpanded}
                          aria-controls={`invoice-details-${invoice.id}`}
                          onClick={() =>
                            setExpandedInvoiceId((current) =>
                              current === invoice.id ? null : invoice.id
                            )
                          }
                        >
                          <div className="invoice-accordion-summary">
                            <strong className="invoice-reference">
                              {invoice.invoiceReference}
                            </strong>

                            <span className="invoice-summary-amount">
                              {invoice.currency}{" "}
                              {Number(invoice.amount).toFixed(2)}
                            </span>

                            <span
                              className={`invoice-status ${
                                invoice.status === "SUCCESS"
                                  ? "invoice-status-success"
                                  : "invoice-status-pending"
                              }`}
                            >
                              {invoice.status || "PENDING"}
                            </span>
                          </div>

                          <span
                            className={`invoice-accordion-arrow ${
                              isExpanded ? "expanded" : ""
                            }`}
                            aria-hidden="true"
                          >
                            ▼
                          </span>
                        </button>

                        {isExpanded && (
                          <div
                            id={`invoice-details-${invoice.id}`}
                            className="invoice-accordion-content"
                          >
                            <div style={styles.grid}>
                              <div>
                                <DetailItem label="Invoice Amount">
                                  {invoice.currency}{" "}
                                  {Number(invoice.amount).toFixed(2)}
                                </DetailItem>

                                <DetailItem label="Customer Email">
                                  {invoice.customerEmail}
                                </DetailItem>

                                <DetailItem label="Created At">
                                  {invoice.createdAt
                                    ? new Date(invoice.createdAt).toLocaleString()
                                    : "—"}
                                </DetailItem>
                              </div>

                              <div>
                                <DetailItem label="Case ID">
                                  {invoice.caseId}
                                </DetailItem>

                                <DetailItem label="Invoice ID">
                                  #{invoice.id}
                                </DetailItem>

                                <DetailItem label="Paid At">
                                  {invoice.paidAt
                                    ? new Date(invoice.paidAt).toLocaleString()
                                    : "Not paid yet"}
                                </DetailItem>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </AdminDetailLayout>
  );
}
