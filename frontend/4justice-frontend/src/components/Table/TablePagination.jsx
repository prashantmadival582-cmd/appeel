import { useTranslation } from "react-i18next";

function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  const { t } = useTranslation();

  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="reusable-table-pagination">
      <div className="table-pagination-info">
        {t("tablePagination.showing")}{" "}
        <strong>{start}</strong>–<strong>{end}</strong>{" "}
        {t("tablePagination.of")}{" "}
        <strong>{totalItems}</strong>{" "}
        {t("tablePagination.records")}
      </div>

      <div className="table-pagination-controls">
        <label>
          {t("tablePagination.rows")}:
          <select
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value))
            }
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          {t("tablePagination.previous")}
        </button>

        <span>
          {t("tablePagination.page")} {currentPage}{" "}
          {t("tablePagination.of")} {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t("tablePagination.next")}
        </button>
      </div>
    </div>
  );
}

export default TablePagination;