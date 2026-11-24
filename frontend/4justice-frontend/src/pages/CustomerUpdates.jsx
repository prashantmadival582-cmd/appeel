
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  getCustomerJson,
  isCustomerAuthError,
} from "../api/customerApi";

import {
  CustomerPageHeader,
  formatStatus,
  statusClass,
} from "./CustomerCases";

import DataTable from "../components/Table/DataTable";
import { FiAlertTriangle, FiBell } from "react-icons/fi";

export default function CustomerUpdates() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // TRANSLATE STATUS

  const translateStatus = (status) =>
    t(
      `customerUpdates.statuses.${String(
        status || "UNKNOWN"
      ).toUpperCase()}`,
      {
        defaultValue: formatStatus(status, t),
      }
    );

  // FETCH CUSTOMER CASES

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
  navigate("/login", { replace: true });
  return;
}

        setError(
          requestError.message || t("customerUpdates.errors.load")
        );
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
  }, [navigate, refreshKey, t]);

  // REFRESH

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
  };

  // STATUS FILTERS

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
        label: "customerUpdates.filters.status",
        allLabel: "customerUpdates.filters.allStatuses",
        options: uniqueStatuses.map((status) => ({
          value: status,
          label: translateStatus(status),
        })),
      },
    ];
  }, [cases, t]);

  // TABLE HEADER STYLE

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

  // TABLE COLUMNS

  const columns = [
    {
      key: "caseId",
      header: "customerUpdates.columns.caseId",
      sortable: true,
      headerStyle,
      render: (customerCase) => customerCase.caseId,
    },
    {
      key: "status",
      header: "customerUpdates.columns.currentStatus",
      sortable: true,
      headerStyle,
      render: (customerCase) => (
        <span
          className={`status-badge ${statusClass(
            customerCase.status
          )}`}
        >
          {translateStatus(customerCase.status)}
        </span>
      ),
    },
    {
      key: "action",
      header: "customerUpdates.columns.action",
      sortable: false,
      headerStyle,
      render: (customerCase) => (
        <Link
          to={`/customer/my-cases/${encodeURIComponent(
            customerCase.caseId
          )}`}
          className="case-action-btn"
        >
          {t("customerUpdates.viewTimeline")} →
        </Link>
      ),
    },
  ];

  // PAGE

  return (
    <main className="portal-page">
      <CustomerPageHeader
        title={t("customerUpdates.title")}
        activeTab="updates"
      />

      <div className="portal-container">
        <div className="portal-page-header">
          <div>
            <h1>{t("customerUpdates.heading")}</h1>

            <p className="portal-subheading">
              {t("customerUpdates.description")}
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon"><FiAlertTriangle /></span>
            <span>{error}</span>
          </div>
        )}

        {!error && (
          <div className="customer-updates-table-wrapper">
            <DataTable
              title="customerUpdates.tableTitle"
              columns={columns}
              data={cases}
              rowKey="caseId"
              searchFields={["caseId", "status"]}
              filters={filters}
              searchable={true}
              exportable={true}
              pagination={true}
              pageSize={8}
              loading={loading}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              emptyMessage="customerUpdates.emptyMessage"
            />
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div className="empty-state-card">
            <div className="empty-icon"><FiBell /></div>

            <h2>{t("customerUpdates.emptyTitle")}</h2>

            <p>{t("customerUpdates.emptyDescription")}</p>

            <Link
              className="btn-primary-navy"
              to="/customer/start-case"
            >
              {t("customerUpdates.startCase")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
