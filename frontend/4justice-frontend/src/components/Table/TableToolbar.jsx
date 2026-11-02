
import { useState } from "react";

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
  const [showFilters, setShowFilters] = useState(false);

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
            <span className="table-search-icon">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search records..."
              aria-label="Search records"
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
              <span>▽</span>
              Filter
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
                    <span>{filter.label}</span>

                    <select
                      value={filterValues[filter.key] || "ALL"}
                      onChange={(event) =>
                        onFilterChange(filter.key, event.target.value)
                      }
                    >
                      <option value="ALL">
                        {filter.allLabel || `All ${filter.label}`}
                      </option>

                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
                  Done
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
            <span>{refreshing ? "↻" : "⟳"}</span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        )}

        {exportable && (
          <button
            type="button"
            className="table-export-button"
            onClick={onExport}
          >
            ↓ Export CSV
          </button>
        )}
      </div>
    </div>
  );
}

export default TableToolbar;
