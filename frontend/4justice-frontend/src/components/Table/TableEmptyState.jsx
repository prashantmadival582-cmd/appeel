import { useTranslation } from "react-i18next";
import { FiFolder } from "react-icons/fi";

function TableEmptyState({
  message = "table.empty",
  colSpan = 1,
}) {
  const { t } = useTranslation();

  return (
    <tr>
      <td colSpan={colSpan} className="reusable-table-empty">
        <div className="table-empty-content">
          <span className="table-empty-icon"><FiFolder /></span>
          <p>{t(message, { defaultValue: message })}</p>
        </div>
      </td>
    </tr>
  );
}

export default TableEmptyState;