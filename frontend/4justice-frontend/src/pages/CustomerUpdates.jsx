
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCustomerJson, isCustomerAuthError } from "../api/customerApi";
import { CustomerPageHeader, formatStatus, statusClass } from "./CustomerCases";

import DataTable from "../components/Table/DataTable";

export default function CustomerUpdates() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    getCustomerJson("/api/cases/mine")
      .then((data) => {
        if (active) {
          setCases(Array.isArray(data) ? data : []);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!active) return;

        if (isCustomerAuthError(requestError)) {
          navigate("/customer/login", { replace: true });
          return;
        }

        setError(requestError.message || "Unable to load case updates.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
  };

  // Build status filter options from the available cases.
  const filters = useMemo(() => {
    const uniqueStatuses = [
      ...new Set(
        cases
          .map((customerCase) => customerCase.status)
          .filter(Boolean)
      ),
    ];

    return [
      {
        key: "status",
        label: "Status",
        allLabel: "All Statuses",
        options: uniqueStatuses.map((status) => ({
          value: status,
          label: formatStatus(status),
        })),
      },
    ];
  }, [cases]);

 const headerStyle = {
  color: "#12334f",
  backgroundColor: "#eaf0f6",
  fontSize: "13px",
  fontWeight: 700,
  display: "inline-block",
  padding: "4px 0",
  visibility: "visible",
  opacity: 1,
};

const columns = [
  {
    key: "caseId",
    header: "Case ID",
    sortable: true,
    render: (customerCase) => customerCase.caseId,
  },
  {
    key: "status",
    header: "Current Status",
    sortable: true,
    render: (customerCase) => (
      <span className={`status-badge ${statusClass(customerCase.status)}`}>
        {formatStatus(customerCase.status)}
      </span>
    ),
  },
  {
    key: "action",
    header: "Action",
    sortable: false,
    render: (customerCase) => (
      <Link
        to={`/customer/my-cases/${encodeURIComponent(customerCase.caseId)}`}
        className="case-action-btn"
      >
        View Timeline →
      </Link>
    ),
  },
];

  return (
    <main className="portal-page">
      <CustomerPageHeader title="Case Updates" activeTab="updates" />

      <div className="portal-container">
        <div className="portal-page-header">
          <div>
            <h1>Activity &amp; Progress Updates</h1>
            <p className="portal-subheading">
              Stay fully informed on status changes, counsel assignments,
              and milestones across all your matters.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!error && (
         <div className="customer-updates-table-wrapper">
  <DataTable
    title="Your Case Updates"
    columns={columns}
    data={cases}
    rowKey="caseId"
    searchFields={[
      "caseId",
      "status",
    ]}
    filters={filters}
    searchable
    exportable
    pagination
    pageSize={8}
    loading={loading}
    onRefresh={handleRefresh}
    refreshing={refreshing}
    emptyMessage="No case updates found."
  />
</div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div className="empty-state-card">
            <div className="empty-icon">🔔</div>
            <h2>No updates yet</h2>
            <p>
              Once you submit a case, its milestone progress updates
              will appear right here.
            </p>
            <Link className="btn-primary-navy" to="/customer/start-case">
              Start a Case
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
