import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API_BASE_URL from "../api/api";
import DataTable from "../components/Table/DataTable";
import AdminDetailLayout from "../components/Admin/AdminDetailLayout";

function AdminLawyerDetails() {
  const { lawyerId } = useParams();
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
          throw new Error("Unable to load lawyer information.");
        }

        if (!casesRes.ok) {
          throw new Error("Unable to load assigned cases.");
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
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lawyerId, token]);

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
        throw new Error(message || "Unable to update lawyer.");
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

      setSuccess("Changes saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // Assigned cases table columns
  const caseColumns = [
    {
      key: "caseId",
      header: "Case ID",
      accessor: "caseId",
      render: (item) => item.caseId ?? item.id ?? "—",
    },
    {
      key: "customer",
      header: "Customer",
      accessor: "customerName",
      render: (item) =>
        item.customerName ??
        item.customer?.name ??
        item.customer?.email ??
        "—",
    },
    {
      key: "caseType",
      header: "Case Type",
      accessor: "caseType",
      render: (item) => item.caseType ?? item.type ?? "—",
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      render: (item) => (
        <span className="admin-case-status">
          {item.status ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      sortable: false,
      render: (item) => {
        const caseId = item.caseId ?? item.id;

        return caseId != null ? (
          <Link
            to={`/admin/cases/${encodeURIComponent(caseId)}`}
            className="admin-view-case-button"
          >
            View
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
      label: "Status",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" },
      ],
    },
  ];

  return (
    <AdminDetailLayout
      title="Lawyer Details"
      subtitle={`Manage lawyer information and assigned cases · ID: ${lawyerId}`}
      backTo="/admin/lawyers"
      backLabel="Back to Lawyers"
      status={lawyer.availability}
    >
      {loading ? (
        <div className="admin-detail-loading">
          Loading lawyer details...
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
                <h2>Lawyer Information</h2>
                <p>Update the lawyer's profile information.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-detail-form-grid">

                <div className="admin-form-field">
                  <label htmlFor="lawyer-name">Full Name</label>
                  <input
                    id="lawyer-name"
                    name="name"
                    value={lawyer.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="lawyer-email">Email</label>
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
                    Specialization
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
                  <label htmlFor="lawyer-phone">Phone Number</label>
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
                    New Password (optional)
                  </label>
                  <input
                    id="lawyer-password"
                    name="password"
                    type="password"
                    value={lawyer.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current password"
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
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <Link
                  to="/admin/lawyers"
                  className="admin-detail-cancel-btn"
                >
                  Cancel
                </Link>
              </div>
            </form>

            {/* Divider */}
            <div className="admin-detail-section-divider" />

            {/* Assigned Cases */}
            <div className="admin-detail-card-heading admin-assigned-cases-heading">
              <div>
                <h2>Assigned Cases</h2>
                <p>
                  Cases assigned to {lawyer.name || "this lawyer"}.
                </p>
              </div>

              <span className="admin-case-count">
                {cases.length} {cases.length === 1 ? "case" : "cases"}
              </span>
            </div>

            <DataTable
              title="Assigned Cases"
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
              emptyMessage="No cases assigned to this lawyer."
            />

          </section>
        </>
      )}
    </AdminDetailLayout>
  );
}

export default AdminLawyerDetails;