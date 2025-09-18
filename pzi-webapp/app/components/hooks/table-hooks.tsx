import { MRT_ColumnDef, MRT_RowData, MRT_RowVirtualizer, MRT_TableInstance, MRT_TableOptions, MRT_VisibilityState, useMaterialReactTable } from "material-react-table";
import { useEffect, useRef, useState } from "react";
import { SetURLSearchParams } from "react-router";
import { useTableSearchParams, type Options } from "tanstack-table-search-params";
import { handleTableSettingsChange, PostTableSettingsHandler } from "~/lib/table-settings";
import { MRT_Localization_CS } from 'material-react-table/locales/cs'

export function useConfiguredTable<TItem extends MRT_RowData>(props: {
  searchParams: URLSearchParams,
  setSearchParams: (newSearchparams: URLSearchParams) => void,
  currentColumnVisibility: MRT_VisibilityState,
  currentColumnOrder: string[],
  postTableSettings: PostTableSettingsHandler,

  columns: MRT_ColumnDef<TItem>[],
  data: TItem[]

  tableOptions: Partial<MRT_TableOptions<TItem>>,

  stateAndOnChangesOptions?: Options
}) {
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(props.currentColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(props.currentColumnOrder);

  const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer>(null);

  const stateAndOnChanges = useTableSearchParams(
    {
      replace: (url) => {
        const newSearchParams = new URLSearchParams(url);
        props.setSearchParams(newSearchParams);
      },
      query: props.searchParams,
      pathname: '',
    },
    props.stateAndOnChangesOptions
  );

  const gridOptions: MRT_TableOptions<TItem> = {
    columns: props.columns,
    data: props.data,

    enableRowSelection: true,
    enablePagination: false,
    enableFullScreenToggle: false,
    enableGlobalFilter: false,
    enableStickyHeader: true,
    enableTableFooter: false,
    enableRowVirtualization: true,
    enableDensityToggle: false,
    enableColumnOrdering: true,

    muiTablePaperProps: {
      sx: {
        border: 0,
        borderRadius: 0,
        boxShadow: 0
      }
    },

    muiTableHeadRowProps: {
      sx: {
        backgroundColor: 'hsl(var(--secondary))'
      }
    },

    muiTableHeadCellProps: {
      className: 'min-h-[48px]',
      sx: {
        paddingTop: '0.7rem',
        "&:focus-visible": {
          outline: '2px solid gray',
          outlineOffset: '-2px',
        }
      }
    },

    muiTableBodyCellProps: {
      sx: {
        "&:focus-visible": {
          outline: '2px solid gray',
          outlineOffset: '-2px',
        }
      }
    },

    muiTableContainerProps: {
      sx: {
        height: 'calc(100vh - 160px)'
      }
    },

    initialState: {
      density: 'compact',
      columnVisibility: columnVisibility,
      columnOrder: columnOrder
    },

    rowVirtualizerInstanceRef,

    renderTopToolbar: () => (<></>),
    renderBottomToolbar: () => (<></>),

    getRowId: (row) => row.id.toString(),

    localization: MRT_Localization_CS,

    ...props.tableOptions,
    ...stateAndOnChanges
  };

  const table = useMaterialReactTable(gridOptions);

  useEffect(() => {
    handleTableSettingsChange(
      columnVisibility, table.getState().columnVisibility,
      columnOrder, table.getState().columnOrder,
      (newVisibility, newOrder) => {
        setColumnVisibility(newVisibility);
        setColumnOrder(newOrder);
        props.postTableSettings(newVisibility, newOrder, table.getState().pagination.pageSize);
      }
    );
  }, [table.getState().columnVisibility, table.getState().columnOrder]);

  return {
    table,
    rowVirtualizerInstanceRef
  };
}

export function useDefaultTableRedirects<TItem extends { id: number }>(
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
      && props.items.some((ck) => ck.id.toString() === props.selectedChildKey);

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
      const selectedRowIndex = props.table.getRowModel().rows.findIndex((row) => props.selectedChildKey === `${row.original.id}`);
      props.rowVirtualizerRef.current?.scrollToIndex(selectedRowIndex);

      setTimeout(() => {
        document.querySelector('.row-selected')?.querySelector('td')?.focus();
      }, 25);
    }, 25);
  }, []);
}
