import { getNestedValue } from "./tableSorting";

export function searchTableData(data = [], searchTerm = "", searchFields = []) {
  const term = searchTerm.trim().toLowerCase();

  if (!term) return data;

  return data.filter((item) =>
    searchFields.some((field) =>
      String(getNestedValue(item, field) ?? "")
        .toLowerCase()
        .includes(term)
    )
  );
}