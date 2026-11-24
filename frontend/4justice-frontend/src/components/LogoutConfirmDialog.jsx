import { useTranslation } from "react-i18next";

export default function LogoutConfirmDialog({
  open,
  onCancel,
  onConfirm,
  loading = false,
}) {
  const { t } = useTranslation();

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

        <h2 id="logout-dialog-title">
          {t("logoutDialog.title")}
        </h2>

        <p>
          {t("logoutDialog.description")}
        </p>

        <div className="logout-dialog-actions">
          <button
            type="button"
            className="logout-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            {t("common.cancel")}
          </button>

          <button
            type="button"
            className="logout-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? t("logoutDialog.signingOut")
              : t("logoutDialog.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}