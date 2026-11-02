import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

  const [caseData, setCaseData] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [selectedLawyer, setSelectedLawyer] = useState("");

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
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

  const fetchCaseDetails = useCallback(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Unable to load case details.");
    }

    const data = await response.json();

    setCaseData(data);
    setSelectedStatus(data.status || "PENDING");
    setSelectedLawyer(data.lawyer?.id ? String(data.lawyer.id) : "");

    setCustomerForm({
      name: data.customer?.name || data.customerName || "",
      email: data.customer?.email || data.customerEmail || "",
      phone: data.customer?.phone || "",
    });
  }, [caseId]);

  const fetchDocuments = useCallback(async () => {
    try {
      setDocumentError("");

      const response = await fetch(
        `${API_BASE_URL}/api/cases/${encodeURIComponent(caseId)}/documents`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error("Unable to load case documents.");
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setDocuments([]);
      setDocumentError(err.message || "Unable to load documents.");
    }
  }, [caseId]);

  const fetchLawyers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lawyers`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Unable to load lawyers.");
      }

      const data = await response.json();
      setLawyers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((current) => current || err.message);
    }
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        fetchCaseDetails(),
        fetchDocuments(),
        fetchLawyers(),
      ]);
    } catch (err) {
      setError(err.message || "Unable to load this case.");
    } finally {
      setLoading(false);
    }
  }, [fetchCaseDetails, fetchDocuments, fetchLawyers]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;

    setCustomerForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCancelCustomerEdit = () => {
    setCustomerForm({
      name: caseData?.customer?.name || caseData?.customerName || "",
      email: caseData?.customer?.email || caseData?.customerEmail || "",
      phone: caseData?.customer?.phone || "",
    });

    setEditingCustomer(false);
    setCustomerMessage("");
    setCustomerError("");
  };

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
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to update customer details.")
        );
      }

      setCaseData(data);

      setCustomerForm({
        name: data.customer?.name || data.customerName || "",
        email: data.customer?.email || data.customerEmail || "",
        phone: data.customer?.phone || "",
      });

      setEditingCustomer(false);
      setCustomerMessage("Customer details updated successfully.");
    } catch (err) {
      setCustomerError(err.message || "Unable to update customer details.");
    } finally {
      setCustomerSaving(false);
    }
  };

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
          getErrorMessage(data, "Unable to update case status.")
        );
      }

      setCaseData((current) => ({
        ...current,
        ...data,
        status: data.status || selectedStatus,
      }));

      setSelectedStatus(data.status || selectedStatus);
      setMessage("Case status updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update case status.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleAssignLawyer = async (event) => {
    event.preventDefault();

    if (!selectedLawyer) {
      setError("Please select a lawyer before assigning.");
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
        throw new Error(getErrorMessage(data, "Unable to assign lawyer."));
      }

      await fetchCaseDetails();
      setMessage("Lawyer assigned successfully.");
    } catch (err) {
      setError(err.message || "Unable to assign lawyer.");
    } finally {
      setLawyerSaving(false);
    }
  };

const openDocument = async (documentId, mode) => {
  setDocumentError("");

  // Open a blank tab immediately to avoid popup blocking.
  let newTab = null;

  if (mode === "view") {
    newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      setDocumentError("Please allow pop-ups to view this document.");
      return;
    }
  }

  setOpeningDocumentId(documentId);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/cases/documents/${encodeURIComponent(documentId)}/download`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Unable to open this document.");
    }

    const blob = await response.blob();
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

    setDocumentError(err.message || "Unable to open document.");
  } finally {
    setOpeningDocumentId(null);
  }
};


  const layoutTitle = caseData?.caseType || "Case Details";
  const layoutSubtitle = `Manage case information and allocation · ID: ${caseData?.caseId || caseId}`;

  if (loading) {
    return (
      <AdminDetailLayout
        title="Case Details"
        subtitle={`Loading case information · ID: ${caseId}`}
        backTo="/admin/cases"
        backLabel="Back to Cases"
      >
        <div className="admin-detail-loading">
          Loading case details...
        </div>
      </AdminDetailLayout>
    );
  }

  if (!caseData) {
    return (
      <AdminDetailLayout
        title="Case Details"
        subtitle={`Case ID: ${caseId}`}
        backTo="/admin/cases"
        backLabel="Back to Cases"
      >
        <div className="admin-detail-card">
          <p style={{ color: "#b42332", marginTop: "10px" }}>
            {error || "Case details could not be found."}
          </p>

          <button
            type="button"
            style={styles.button}
            className="case-action-button"
            onClick={loadPage}
          >
            Try Again
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
      backLabel="Back to Cases"
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

      {/* One combined card for all case sections */}
      <section
        style={styles.card}
        className="case-details-card admin-detail-card"
      >
        {/* Case and customer information */}
        <h2 style={styles.sectionTitle}>Case Information</h2>

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
                Client Information
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
                  Edit Details
                </button>
              )}
            </div>

            {editingCustomer ? (
              <form onSubmit={handleCustomerUpdate}>
                <div style={styles.detail} className="case-detail-row">
                  <label style={styles.label} htmlFor="customer-name">
                    Customer Name
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
                    Email Address
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
                    Phone Number
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
                    {customerSaving ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    style={styles.secondaryButton}
                    className="case-secondary-button"
                    onClick={handleCancelCustomerEdit}
                    disabled={customerSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <DetailItem label="Customer Name">
                  {customer.name || caseData.customerName}
                </DetailItem>

                <DetailItem label="Email Address">
                  {customer.email || caseData.customerEmail}
                </DetailItem>

                <DetailItem label="Phone Number">
                  {customer.phone || "Not provided"}
                </DetailItem>
              </>
            )}

            <DetailItem label="Case Type">
              {caseData.caseType}
            </DetailItem>

            <DetailItem label="Case Description">
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
              <h3 style={styles.sectionTitle}>Assigned Lawyer</h3>

              <DetailItem label="Current Assignment">
                {assignedLawyer
                  ? assignedLawyer.name ||
                    assignedLawyer.fullName ||
                    assignedLawyer.email ||
                    `Lawyer #${assignedLawyer.id}`
                  : "Not assigned"}
              </DetailItem>

              {assignedLawyer?.email && (
                <DetailItem label="Lawyer Email">
                  {assignedLawyer.email}
                </DetailItem>
              )}
            </div>

            <div>
              <h3 style={styles.sectionTitle}>
                Documents ({documents.length})
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
                    Retry
                  </button>
                </div>
              )}

              {documents.length === 0 ? (
                <div style={{ ...styles.value, color: "#71839a" }}>
                  No documents uploaded
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
                            ? "Opening..."
                            : "View"}
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
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Divider between case information and quick actions */}
        <div className="admin-detail-section-divider" />

        {/* Quick actions */}
        <div
          style={styles.actionPanel}
          className="case-quick-actions"
        >
          <h2 style={styles.sectionTitle}>Quick Actions</h2>

          <div style={styles.actionGrid}>
            <form onSubmit={handleStatusUpdate}>
              <label style={styles.label} htmlFor="case-status">
                Update Status
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
                      {formatStatus(status)}
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
                  {statusSaving ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>

            <form onSubmit={handleAssignLawyer}>
              <label style={styles.label} htmlFor="assign-lawyer">
                Assign Lawyer
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
                  <option value="">Select a lawyer</option>

                  {lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {lawyer.name ||
                        lawyer.fullName ||
                        lawyer.email ||
                        `Lawyer #${lawyer.id}`}
                      {lawyer.availability
                        ? ` (${formatStatus(lawyer.availability)})`
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
                  {lawyerSaving ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AdminDetailLayout>
  );
}