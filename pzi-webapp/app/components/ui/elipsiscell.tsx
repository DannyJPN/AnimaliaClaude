import { MRT_Cell, MRT_ColumnDef } from "material-react-table";

export function EllipsisCell<TData extends Record<string, any>>({
  cell,
}: {
  cell: MRT_Cell<TData, unknown>;
}) {
  const value = cell.getValue<string>();

  const title =
    value === null || value === undefined || value === "" ? undefined : value;

  return (
    <div className="truncate" title={title}>
      {value}
    </div>
  );
}

export function withEllipsisCell<T extends Record<string, any>>(
  columns: MRT_ColumnDef<T>[]
): MRT_ColumnDef<T>[] {
  return columns.map((col) => {
    if (col.Cell) return col;

    return {
      ...col,
      Cell: (cellProps: { cell: MRT_Cell<T, unknown> }) => (
        <EllipsisCell {...cellProps} />
      ),
    };
  });
}