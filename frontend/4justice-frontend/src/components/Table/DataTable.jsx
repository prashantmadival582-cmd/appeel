
import useTable from "../../hooks/useTable";
import TableToolbar from "./TableToolbar";
import TablePagination from "./TablePagination";
import TableEmptyState from "./TableEmptyState";
import { exportTableToCSV } from "../../utils/tableExport";
import "../../App.css";

function DataTable({
  title,
  showHeading = true,
  columns = [],
  data = [],
  rowKey = "id",
  searchFields = [],
  filters = [],
  searchable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  emptyMessage = "No records found.",
  loading = false,
  onRefresh,
  refreshing = false,
  
}) {
  const table = useTable({
    data,
    columns,
    searchFields,
    filters,
    initialPageSize: pageSize,
  });

  const getNestedValue = (object, path) => {
    if (!object || !path) return undefined;

    // Support function accessors
    if (typeof path === "function") {
      return path(object);
    }

    // Support nested string paths
    if (typeof path !== "string") {
      return undefined;
    }

    return path.split(".").reduce(
      (value, key) => value?.[key],
      object
    );
  };

  const getCellValue = (column, item) => {
    if (column.render) {
      return column.render(item);
    }

    const value = getNestedValue(
      item,
      column.accessor || column.key
    );

    return column.format
      ? column.format(value, item)
      : value ?? "-";
  };


  const exportCSV = () => {
    const filename = `${(title || "table")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.csv`;

    exportTableToCSV(table.filteredData, columns, filename);
  };

  return (
    <div className="reusable-table-container">
      {title && showHeading && (
        <div className="reusable-table-heading">
          <h3>{title}</h3>
          <span>{table.totalItems} records</span>
        </div>
      )}

<TableToolbar
  search={table.search}
  onSearchChange={table.setSearch}
  filters={filters}

  filterValues={table.filterValues}
  onFilterChange={table.updateFilter}
  
  onExport={exportCSV}
  searchable={searchable}
  exportable={exportable}
  onRefresh={onRefresh}
  refreshing={refreshing}
/>

      <div className="table-responsive">
        <table className="admin-table reusable-data-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const sortKey =
                  column.sortKey || column.accessor || column.key;

                const isSorted = table.sortConfig.key === sortKey;

                return (
                  <th
                    key={column.key}
                    onClick={() =>
                      column.sortable !== false &&
                      table.requestSort(sortKey)
                    }
                    className={
                      column.sortable !== false
                        ? "sortable-column"
                        : ""
                    }
                  >
                    {column.header ?? column.label ?? column.key}

                    {column.sortable !== false && isSorted && (
                      <span className="sort-indicator">
                        {table.sortConfig.direction === "asc"
                          ? " ↑"
                          : " ↓"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="reusable-table-empty"
                >
                  Loading records...
                </td>
              </tr>
            ) : table.paginatedData.length === 0 ? (
              <TableEmptyState
                message={emptyMessage}
                colSpan={columns.length}
              />
            ) : (
              table.paginatedData.map((item, index) => (
                <tr key={item[rowKey] ?? index}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {getCellValue(column, item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && (
        <TablePagination
          currentPage={table.currentPage}
          totalPages={table.totalPages}
          pageSize={table.pageSize}
          totalItems={table.totalItems}
          onPageChange={table.setCurrentPage}
          onPageSizeChange={table.setPageSize}
        />
      )}
    </div>
  );
}

export default DataTable;
