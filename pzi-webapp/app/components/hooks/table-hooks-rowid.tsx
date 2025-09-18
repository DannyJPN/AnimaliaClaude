import { MRT_RowData, MRT_RowVirtualizer, MRT_TableInstance } from "material-react-table";
import { useEffect } from "react";

// Default redirects and scroll-to-selected behavior using MaterialReactTable row.id
// Works with any row shape as long as getRowId is configured on the table
export function useDefaultTableRedirectsByRowId<TItem extends MRT_RowData>(
  props: {
    items: TItem[],
    selectedChildKey: string | undefined,
    table: MRT_TableInstance<TItem>,
    rowVirtualizerRef: React.RefObject<MRT_RowVirtualizer>,
    openNewItemForm: () => void,
    openDefaultItem: () => void
  },
  dependencies: unknown[]
) {
  // Ensure a valid selected key; otherwise open new or default
  useEffect(() => {
    if (props.selectedChildKey === 'new') {
      return;
    }

    const rows = props.table.getRowModel().rows;
    const properKeySelected = props.selectedChildKey
      && rows.some((row) => row.id === props.selectedChildKey);

    if (properKeySelected) {
      return;
    }

    const timeout = setTimeout(() => {
      if (props.items.length === 0) {
        props.openNewItemForm();
      } else {
        props.openDefaultItem();
      }
    }, 10);

    return () => clearTimeout(timeout);
  }, dependencies);

  // Scroll to selected and focus
  useEffect(() => {
    if (!props.selectedChildKey || props.selectedChildKey === 'new') {
      return;
    }

    setTimeout(() => {
      const rows = props.table.getRowModel().rows;
      const selectedRowIndex = rows.findIndex((row) => props.selectedChildKey === row.id);
      props.rowVirtualizerRef.current?.scrollToIndex(selectedRowIndex);

      setTimeout(() => {
        document.querySelector('.row-selected')?.querySelector('td')?.focus();
      }, 25);
    }, 25);
  }, []);
}
