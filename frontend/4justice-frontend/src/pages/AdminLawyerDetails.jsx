
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../api/api";
import DataTable from "../components/Table/DataTable";
import AdminDetailLayout from "../components/Admin/AdminDetailLayout";

function AdminLawyerDetails() {
  const { lawyerId } = useParams();
  const { t } = useTranslation();
  const token = localStorage.getItem("adminToken");

  const [lawyer, setLawyer] = useState({
    name: "",
    email: "",
    specialization: "",
    phone: "",
    availability: "AVAILABLE",
    password: "",
  });

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load lawyer details and assigned cases
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [lawyerRes, casesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/lawyers/${lawyerId}`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/api/admin/lawyers/${lawyerId}/cases`, {
            headers,
          }),
        ]);

        if (!lawyerRes.ok) {
          throw new Error(
            t("adminLawyerDetails.errors.loadLawyer")
          );
        }

        if (!casesRes.ok) {
          throw new Error(
            t("adminLawyerDetails.errors.loadCases")
          );
        }

        const lawyerData = await lawyerRes.json();
        const casesData = await casesRes.json();

        setLawyer({
          name: lawyerData.name ?? "",
          email: lawyerData.email ?? "",
          specialization: lawyerData.specialization ?? "",
          phone: lawyerData.phone ?? "",
          availability: lawyerData.availability ?? "AVAILABLE",
          password: "",
        });

        setCases(Array.isArray(casesData) ? casesData : []);
      } catch (err) {
        setError(
          err.message || t("adminLawyerDetails.errors.general")
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lawyerId, token, t]);

  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setLawyer((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
  };

  // Update lawyer information
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { password, ...basicInfo } = lawyer;

      const payload = password.trim()
        ? { ...basicInfo, password }
        : basicInfo;

      const response = await fetch(
        `${API_BASE_URL}/api/lawyers/${lawyerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || t("adminLawyerDetails.errors.updateLawyer")
        );
      }

      const responseText = await response.text();
      const updated = responseText ? JSON.parse(responseText) : {};

      setLawyer((prev) => ({
        ...prev,
        name: updated.name ?? prev.name,
        email: updated.email ?? prev.email,
        specialization: updated.specialization ?? prev.specialization,
        phone: updated.phone ?? prev.phone,
        availability: updated.availability ?? prev.availability,
        password: "",
      }));

      setSuccess(t("adminLawyerDetails.success"));
    } catch (err) {
      setError(
        err.message || t("adminLawyerDetails.errors.saveChanges")
      );
    } finally {
      setSaving(false);
    }
  };

  // Assigned cases table columns
  const caseColumns = [
    {
      key: "caseId",
      header: "adminLawyerDetails.columns.caseId",
      accessor: "caseId",
      render: (item) => item.caseId ?? item.id ?? "—",
    },
    {
      key: "customer",
      header: "adminLawyerDetails.columns.customer",
      accessor: "customerName",
      render: (item) =>
        item.customerName ??
        item.customer?.name ??
        item.customer?.email ??
        "—",
    },
    {
      key: "caseType",
      header: "adminLawyerDetails.columns.caseType",
      accessor: "caseType",
      render: (item) => item.caseType ?? item.type ?? "—",
    },
    {
      key: "status",
      header: "adminLawyerDetails.columns.status",
      accessor: "status",
      render: (item) => (
        <span className="admin-case-status">
          {item.status
            ? t(`adminLawyerDetails.statuses.${item.status}`, {
                defaultValue: item.status,
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "adminLawyerDetails.columns.action",
      sortable: false,
      render: (item) => {
        const caseId = item.caseId ?? item.id;

        return caseId != null ? (
          <Link
            to={`/admin/cases/${encodeURIComponent(caseId)}`}
            className="admin-view-case-button"
          >
            {t("adminLawyerDetails.view")}
          </Link>
        ) : (
          "—"
        );
      },
    },
  ];

  const caseSearchFields = [
    "caseId",
    "id",
    "customerName",
    "customer.name",
    "customer.email",
    "caseType",
    "type",
    "status",
  ];

  const caseFilters = [
    {
      key: "status",
      label: "adminLawyerDetails.filters.status",
      options: [
        {
          label: "adminLawyerDetails.filters.pending",
          value: "PENDING",
        },
        {
          label: "adminLawyerDetails.filters.underReview",
          value: "UNDER_REVIEW",
        },
        {
          label: "adminLawyerDetails.filters.inProgress",
          value: "IN_PROGRESS",
        },
        {
          label: "adminLawyerDetails.filters.completed",
          value: "COMPLETED",
        },
      ],
    },
  ];

  return (
    <AdminDetailLayout
      title={t("adminLawyerDetails.title")}
      subtitle={t("adminLawyerDetails.subtitle", {
        lawyerId,
      })}
      backTo="/admin/lawyers"
      backLabel={t("adminLawyerDetails.backToLawyers")}
      status={lawyer.availability}
    >
      {loading ? (
        <div className="admin-detail-loading">
          {t("adminLawyerDetails.loading")}
        </div>
      ) : (
        <>
          {error && (
            <div className="admin-message admin-message-error">
              {error}
            </div>
          )}

          {success && (
            <div className="admin-message admin-message-success">
              {success}
            </div>
          )}

          {/* Combined Lawyer Details and Assigned Cases */}
          <section className="admin-detail-card admin-lawyer-combined-card">

            {/* Lawyer Information */}
            <div className="admin-detail-card-heading">
              <div>
                <h2>{t("adminLawyerDetails.informationTitle")}</h2>
                <p>{t("adminLawyerDetails.informationDescription")}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-detail-form-grid">

                <div className="admin-form-field">
                  <label htmlFor="lawyer-name">
                    {t("adminLawyerDetails.fullName")}
                  </label>
                  <input
                    id="lawyer-name"
                    name="name"
                    value={lawyer.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="lawyer-email">
                    {t("adminLawyerDetails.email")}
                  </label>
                  <input
                    id="lawyer-email"
                    name="email"
                    type="email"
                    value={lawyer.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="lawyer-specialization">
                    {t("adminLawyerDetails.specialization")}
                  </label>
                  <input
                    id="lawyer-specialization"
                    name="specialization"
                    value={lawyer.specialization}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="lawyer-phone">
                    {t("adminLawyerDetails.phone")}
                  </label>
                  <input
                    id="lawyer-phone"
                    name="phone"
                    value={lawyer.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="lawyer-password">
                    {t("adminLawyerDetails.newPassword")}
                  </label>
                  <input
                    id="lawyer-password"
                    name="password"
                    type="password"
                    value={lawyer.password}
                    onChange={handleChange}
                    placeholder={t(
                      "adminLawyerDetails.passwordPlaceholder"
                    )}
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

              </div>

              <div className="admin-detail-actions">
                <button
                  type="submit"
                  className="admin-detail-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? t("adminLawyerDetails.saving")
                    : t("adminLawyerDetails.saveChanges")}
                </button>

                <Link
                  to="/admin/lawyers"
                  className="admin-detail-cancel-btn"
                >
                  {t("common.cancel")}
                </Link>
              </div>
            </form>

            {/* Divider */}
            <div className="admin-detail-section-divider" />

            {/* Assigned Cases */}
            <div className="admin-detail-card-heading admin-assigned-cases-heading">
              <div>
                <h2>{t("adminLawyerDetails.assignedCases")}</h2>
                <p>
                  {t("adminLawyerDetails.assignedCasesDescription", {
                    name:
                      lawyer.name ||
                      t("adminLawyerDetails.thisLawyer"),
                  })}
                </p>
              </div>

              <span className="admin-case-count">
                {t("adminLawyerDetails.caseCount", {
                  count: cases.length,
                })}
              </span>
            </div>

            <DataTable
              title="adminLawyerDetails.assignedCases"
              showHeading={false}
              columns={caseColumns}
              data={cases}
              rowKey="caseId"
              searchFields={caseSearchFields}
              filters={caseFilters}
              searchable={true}
              exportable={true}
              pagination={true}
              pageSize={10}
              emptyMessage="adminLawyerDetails.emptyCases"
            />

          </section>
        </>
      )}
    </AdminDetailLayout>
  );
}

export default AdminLawyerDetails;
