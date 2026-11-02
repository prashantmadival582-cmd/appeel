
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api/api";
import { FaEye } from "react-icons/fa";
import DataTable from "../components/Table/DataTable";

// Search fields used by the reusable DataTable
const caseSearchFields = [
  "caseId",
  "customerName",
  "caseType",
  "status",
  "lawyer.name",
];

// Custom status filter, including the Unassigned option
const caseFilters = [
  {
    key: "caseStatus",
    label: "Case Status",
    options: [
      { label: "All Statuses", value: "ALL" },
      { label: "Unassigned Only", value: "UNASSIGNED" },
      { label: "Pending", value: "PENDING" },
      { label: "Under Review", value: "UNDER_REVIEW" },
      { label: "In Progress", value: "IN_PROGRESS" },
      { label: "Completed", value: "COMPLETED" },
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
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Admin access denied. Please log in again."
            : `Failed to fetch cases (${response.status}).`
        );
      }

      const data = await response.json();

      const sortedCases = (Array.isArray(data) ? [...data] : []).sort(
        (a, b) => Number(b.id || 0) - Number(a.id || 0)
      );

      setCases(sortedCases);
    } catch (err) {
      console.error("Cases error:", err);
      setError(err.message || "Unable to load cases from the server.");
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
        throw new Error(`Failed to fetch lawyers (${response.status}).`);
      }

      const data = await response.json();
      setLawyers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lawyers error:", err);
      setMessage(
        err.message || "Unable to load lawyers. Please refresh the page."
      );
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

  // DataTable columns
  const caseColumns = [
    {
      key: "caseId",
      header: "Case ID",
      accessor: "caseId",
      render: (item) => (
        <span className="case-id-tag">{item.caseId}</span>
      ),
    },
    {
      key: "caseType",
      header: "Case Type",
      accessor: "caseType",
      render: (item) => (
        <span className="table-type-badge">
          {item.caseType || "Not specified"}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "Applied Date",
      accessor: "submittedAt",
      format: (value) =>
        value
          ? new Date(value).toLocaleDateString("en-GB")
          : "N/A",
    },
    {
      key: "actions",
      header: "Actions",
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
            View Details
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="admin-page-content">
      {/* Page Header */}
      <div className="admin-page-header">
        

        <div className="admin-header-stats"></div>
      </div>

      {/* Success and Error Messages */}
      {message && (
        <div
          className={`alert-banner ${
            messageType === "success" ? "alert-success" : "alert-error"
          }`}
          role={messageType === "error" ? "alert" : "status"}
        >
          <span className="alert-icon">
            {messageType === "success" ? "✓" : "⚠️"}
          </span>
          <span>{message}</span>
        </div>
      )}

      {/* Cases Table */}
      <div className="admin-card">
        <DataTable
          title="ALL LEAGAL CASES"
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
          emptyMessage="No legal cases match your search or filter."
        />
      </div>
    </section>
  );
}

export default AdminCases;
