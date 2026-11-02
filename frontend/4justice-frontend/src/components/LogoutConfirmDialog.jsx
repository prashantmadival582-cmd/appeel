
export default function LogoutConfirmDialog({
  open,
  onCancel,
  onConfirm,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div
      className="logout-dialog-overlay"
      onClick={onCancel}
    >
      <div
        className="logout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="logout-dialog-icon">
          ↪
        </div>

        <h2 id="logout-dialog-title">Confirm Sign Out</h2>

        <p>
          Are you sure you want to sign out of your account?
        </p>

        <div className="logout-dialog-actions">
          <button
            type="button"
            className="logout-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="logout-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Signing Out..." : "Yes, Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
