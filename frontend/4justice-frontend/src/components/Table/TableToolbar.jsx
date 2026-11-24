
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch, FiFilter, FiRefreshCw } from "react-icons/fi";

function TableToolbar({
  search,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onExport,
  onRefresh,
  refreshing = false,
  exportable = true,
  searchable = true,
}) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const translateText = (value) => {
    if (typeof value !== "string") return value;
    return t(value, { defaultValue: value });
  };

  const activeFilterCount = filters.filter(
    (filter) =>
      filterValues[filter.key] &&
      filterValues[filter.key] !== "ALL"
  ).length;

  return (
    <div className="reusable-table-toolbar">
      <div className="table-toolbar-left">
        {searchable && (
          <div className="table-search-box">
            <span className="table-search-icon"><FiSearch /></span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("tableToolbar.searchPlaceholder")}
              aria-label={t("tableToolbar.searchLabel")}
            />
          </div>
        )}

        {filters.length > 0 && (
          <div className="table-filter-wrapper">
            <button
              type="button"
              className="table-filter-button"
              onClick={() => setShowFilters((previous) => !previous)}
              aria-expanded={showFilters}
            >
              <span><FiFilter /></span>
              {t("tableToolbar.filter")}

              {activeFilterCount > 0 && (
                <span className="table-filter-count">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="table-filter-dropdown">
                {filters.map((filter) => (
                  <label key={filter.key} className="table-filter-group">
                    <span>{translateText(filter.label)}</span>

                    <select
                      value={filterValues[filter.key] || "ALL"}
                      onChange={(event) =>
                        onFilterChange(filter.key, event.target.value)
                      }
                    >
                      <option value="ALL">
                        {filter.allLabel
                          ? translateText(filter.allLabel)
                          : t("tableToolbar.all", {
                              label: translateText(filter.label),
                            })}
                      </option>

                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {translateText(option.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}

                <button
                  type="button"
                  className="table-filter-close"
                  onClick={() => setShowFilters(false)}
                >
                  {t("tableToolbar.done")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="table-toolbar-right">
        {onRefresh && (
          <button
            type="button"
            className="table-refresh-button"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <span><FiRefreshCw /></span>
            {refreshing
              ? t("tableToolbar.refreshing")
              : t("tableToolbar.refresh")}
          </button>
        )}


      </div>
    </div>
  );
}

export default TableToolbar;
