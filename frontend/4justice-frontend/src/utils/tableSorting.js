export function getNestedValue(object, path) {
  if (!path) return undefined;

  return path.split(".").reduce(
    (value, key) => value?.[key],
    object
  );
}

export function sortTableData(data = [], key, direction = "asc") {
  if (!key) return [...data];

  return [...data].sort((a, b) => {
    const first = getNestedValue(a, key);
    const second = getNestedValue(b, key);

    if (first == null) return 1;
    if (second == null) return -1;

    let comparison;

    if (
      typeof first === "number" &&
      typeof second === "number"
    ) {
      comparison = first - second;
    } else {
      comparison = String(first).localeCompare(
        String(second),
        undefined,
        { numeric: true, sensitivity: "base" }
      );
    }

    return direction === "desc" ? -comparison : comparison;
  });
}