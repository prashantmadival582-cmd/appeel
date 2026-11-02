import { getNestedValue } from "./tableSorting";

export function filterTableData(data = [], filters = [], filterValues = {}) {
  return data.filter((item) =>
    filters.every((filter) => {
      const selectedValue = filterValues[filter.key];

      if (!selectedValue || selectedValue === "ALL") {
        return true;
      }

      if (filter.predicate) {
        return filter.predicate(item, selectedValue);
      }

      return (
        String(getNestedValue(item, filter.key) ?? "") ===
        String(selectedValue)
      );
    })
  );
}