import { MRT_RowVirtualizer, MRT_TableInstance } from "material-react-table";
import { useEffect } from "react";

export function useDefaultTableRedirectsString<TItem extends { id: string }>(
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
  useEffect(() => {
    if (props.selectedChildKey === 'new') {
      return;
    }

    const properKeySelected = props.selectedChildKey
      && props.items.some((ck) => ck.id === props.selectedChildKey);

    if (properKeySelected) {
      return;
    }

    let timeout = setTimeout(() => {
      if (props.items.length === 0) {
        props.openNewItemForm();
      } else {
        props.openDefaultItem()
      }
    }, 10);

    return () => {
      clearTimeout(timeout);
    }
  }, dependencies);

  useEffect(() => {
    if (!props.selectedChildKey || props.selectedChildKey === 'new') {
      return;
    }

    setTimeout(() => {
      const selectedRowIndex = props.table.getRowModel().rows.findIndex((row) => props.selectedChildKey === row.original.id);
      props.rowVirtualizerRef.current?.scrollToIndex(selectedRowIndex);

      setTimeout(() => {
        document.querySelector('.row-selected')?.querySelector('td')?.focus();
      }, 25);
    }, 25);
  }, []);
}
