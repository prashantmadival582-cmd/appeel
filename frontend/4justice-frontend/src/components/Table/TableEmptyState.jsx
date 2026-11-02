function TableEmptyState({
  message = "No records found.",
  colSpan = 1,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="reusable-table-empty">
        <div className="table-empty-content">
          <span className="table-empty-icon">📂</span>
          <p>{message}</p>
        </div>
      </td>
    </tr>
  );
}

export default TableEmptyState;