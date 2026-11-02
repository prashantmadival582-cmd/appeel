
import { useMemo, useState } from "react";
import { sortTableData } from "../utils/tableSorting";
import { filterTableData } from "../utils/tableFiltering";
import { searchTableData } from "../utils/tableSearch";

export default function useTable({
  data = [],
  searchFields = [],
  filters = [],
  initialPageSize = 10,
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    Number(initialPageSize) > 0 ? Number(initialPageSize) : 10
  );

  const searchedData = useMemo(
    () => searchTableData(data, search, searchFields),
    [data, search, searchFields]
  );

  const filteredData = useMemo(
    () => filterTableData(searchedData, filters, filterValues),
    [searchedData, filters, filterValues]
  );

  const sortedData = useMemo(
    () =>
      sortTableData(
        filteredData,
        sortConfig.key,
        sortConfig.direction
      ),
    [filteredData, sortConfig]
  );

  const totalItems = sortedData.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / pageSize)
  );

  const safePage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const paginatedData = useMemo(
    () =>
      sortedData.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
      ),
    [sortedData, safePage, pageSize]
  );

  const requestSort = (key) => {
    if (!key) return;

    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc"
          ? "desc"
          : "asc",
    }));

    setCurrentPage(1);
  };

  const updateFilter = (key, value) => {
    setFilterValues((previous) => {
      if (previous[key] === value) return previous;

      return {
        ...previous,
        [key]: value,
      };
    });

    setCurrentPage(1);
  };

  const updateSearch = (value) => {
    setSearch((previous) => {
      if (previous === value) return previous;
      return value;
    });

    setCurrentPage(1);
  };

  const updatePageSize = (value) => {
    const nextSize = Number(value);

    if (!Number.isFinite(nextSize) || nextSize <= 0) return;

    setPageSize(nextSize);
    setCurrentPage(1);
  };

  return {
    search,
    setSearch: updateSearch,
    filterValues,
    updateFilter,
    sortConfig,
    requestSort,
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize: updatePageSize,
    totalPages,
    searchedData,
    filteredData,
    sortedData,
    paginatedData,
    totalItems,
  };
}
