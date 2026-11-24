
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import API_BASE_URL from "../api/api";
import { FaEye } from "react-icons/fa";
import { FiAlertTriangle, FiCheck } from "react-icons/fi";
import DataTable from "../components/Table/DataTable";

// Search fields used by the reusable DataTable
const caseSearchFields = [
  "caseId",
  "customerName",
  "caseType",
  "status",
  "lawyer.name",
];

// Filter labels are translation keys.
// Keep the values unchanged because they are used by the backend data.
const caseFilters = [
  {
    key: "caseStatus",
    label: "adminCases.filters.caseStatus",
    options: [
      { label: "adminCases.filters.allStatuses", value: "ALL" },
      { label: "adminCases.filters.unassignedOnly", value: "UNASSIGNED" },
      { label: "adminCases.filters.pending", value: "PENDING" },
      { label: "adminCases.filters.underReview", value: "UNDER_REVIEW" },
      { label: "adminCases.filters.inProgress", value: "IN_PROGRESS" },
      { label: "adminCases.filters.completed", value: "COMPLETED" },
    ],
    predicate: (item, selectedValue) => {
      if (selectedValue === "UNASSIGNED") {
        return !item.lawyer;
      }

      if (selectedValue === "ALL") {
        return true;
      }

      return item.status === selectedValue;
    },
  },
];

function AdminCases() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all legal cases
  const fetchCases = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE_URL}/api/admin/cases`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setError(
          response.status === 401 || response.status === 403
            ? t("adminCases.errors.accessDenied")
            : t("adminCases.errors.fetchFailed", {
                status: response.status,
              })
        );
        return;
      }

      const data = await response.json();

      const sortedCases = (Array.isArray(data) ? [...data] : []).sort(
        (a, b) => Number(b.id || 0) - Number(a.id || 0)
      );

      setCases(sortedCases);
    } catch (err) {
      console.error("Cases error:", err);
      setError(t("adminCases.errors.unableToLoadCases"));
    } finally {
      setLoading(false);
    }
  };

  // Fetch lawyers for dashboard statistics
  const fetchLawyers = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE_URL}/api/lawyers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setMessage(
          t("adminCases.errors.fetchLawyersFailed", {
            status: response.status,
          })
        );
        setMessageType("error");
        return;
      }

      const data = await response.json();
      setLawyers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lawyers error:", err);
      setMessage(t("adminCases.errors.unableToLoadLawyers"));
      setMessageType("error");
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchCases();
    fetchLawyers();
  }, []);

  // Refresh both cases and lawyers
  const handleRefresh = async () => {
    setMessage("");
    setMessageType("");

    await Promise.all([fetchCases(), fetchLawyers()]);
  };

  // Count available lawyers
  const availableLawyers = lawyers.filter(
    (lawyer) => lawyer.availability?.toUpperCase() === "AVAILABLE"
  );

  // Retain the existing calculation for dashboard statistics
  void availableLawyers;

  // DataTable columns
  const caseColumns = [
    {
      key: "caseId",
      header: "adminCases.columns.caseId",
      accessor: "caseId",
      render: (item) => (
        <span className="case-id-tag">{item.caseId}</span>
      ),
    },
    {
      key: "caseType",
      header: "adminCases.columns.caseType",
      accessor: "caseType",
      render: (item) => (
        <span className="table-type-badge">
          {item.caseType || t("adminCases.notSpecified")}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "adminCases.columns.appliedDate",
      accessor: "submittedAt",
      format: (value) =>
        value
          ? new Date(value).toLocaleDateString(
              i18n.language === "sv" ? "sv-SE" : "en-GB"
            )
          : t("adminCases.notAvailable"),
    },
    {
      key: "actions",
      header: "adminCases.columns.actions",
      sortable: false,
      render: (item) => (
        <div className="case-actions-group">
          <button
            type="button"
            className="btn-table-action"
            onClick={() =>
              navigate(
                `/admin/cases/${encodeURIComponent(item.caseId)}`
              )
            }
          >
            <FaEye aria-hidden="true" />
            {t("adminCases.viewDetails")}
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="admin-page-content">
      <div className="admin-page-header">
        <div className="admin-header-stats"></div>
      </div>

      {error && (
        <div className="alert-banner alert-error" role="alert">
          <span className="alert-icon"><FiAlertTriangle /></span>
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div
          className={`alert-banner ${
            messageType === "success" ? "alert-success" : "alert-error"
          }`}
          role={messageType === "error" ? "alert" : "status"}
        >
          <span className="alert-icon">
            {messageType === "success" ? <FiCheck /> : <FiAlertTriangle />}
          </span>
          <span>{message}</span>
        </div>
      )}

      <div className="admin-card">
        <DataTable
          title="adminCases.tableTitle"
          columns={caseColumns}
          data={cases}
          rowKey="caseId"
          searchFields={caseSearchFields}
          filters={caseFilters}
          searchable={true}
          exportable={true}
          pagination={true}
          pageSize={10}
          loading={loading}
          onRefresh={handleRefresh}
          refreshing={loading}
          emptyMessage="adminCases.emptyMessage"
        />
      </div>
    </section>
  );
}

export default AdminCases;
