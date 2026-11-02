import { getNestedValue } from "./tableSorting";

export function exportTableToCSV(data = [], columns = [], filename = "table.csv") {
  const exportColumns = columns.filter(
    (column) => column.exportable !== false
  );

  if (!exportColumns.length) return;

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const headers = exportColumns.map((column) =>
    escapeCSV(column.header)
  );

  const rows = data.map((item) =>
    exportColumns.map((column) => {
      const value = getNestedValue(
        item,
        column.accessor || column.key
      );

      const exportValue = column.exportValue
        ? column.exportValue(value, item)
        : value;

      return escapeCSV(exportValue);
    })
  );

  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}