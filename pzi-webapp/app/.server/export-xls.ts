import { Row } from '@tanstack/table-core';
import exceljs from "exceljs";
import { MRT_FilterFns, MRT_RowData, MRT_SortingFns } from "material-react-table";
import { decodeTableParametersFromRequest } from "~/lib/table-params-encoder-decoder";
import { TableSettings } from "~/shared/models";
import { fetchTableSettings } from './table-settings';
import { getUserName } from './user-session';

export function prepareXlsColumnDefinition(
  columnDef: { accessorKey?: string, header: string }[],
  tableSettings: TableSettings
) {
  const columnOrder = tableSettings.columnOrder || [];
  const columnVisibility = tableSettings.columnVisibility || {};

  const xlsColumns = columnOrder
    .filter((columnName) => {
      return columnVisibility[columnName] !== false
        && columnName !== 'mrt-row-actions'
        && columnName !== 'mrt-row-select'
        && columnDef.some((c) => c.accessorKey === columnName);
    })
    .map((columnName) => {
      const col = columnDef.find(c => c.accessorKey === columnName)!;

      return {
        header: col.header,
        key: col.accessorKey
      };
    });

  return xlsColumns;
}

export function filterAndSortRows<TItem extends MRT_RowData>(
  request: Request,
  items: TItem[]
) {
  const tableParams = decodeTableParametersFromRequest(request);

  const itemsAsRows = items.map((item) => {
    const row: Row<TItem> = {
      getValue: (columnId) => {
        return item[columnId];
      },
      original: item
    } as Row<TItem>;

    return row;
  });

  const filteredRows = itemsAsRows
    .filter((row) => {
      if (!tableParams.columnFilters || tableParams.columnFilters.length === 0) {
        return true;
      }

      return tableParams.columnFilters.every((cf) => {
        const cfVal = cf.value?.at(0) || '';

        return MRT_FilterFns.fuzzy(row, cf.id, cfVal, () => { });
      });
    });

  if (tableParams.sorting && tableParams.sorting.length > 0) {
    filteredRows.sort((r1, r2) => {
      const sort = MRT_SortingFns.text(r1, r2, tableParams.sorting[0].id);

      return tableParams.sorting[0].desc
        ? -1 * sort
        : sort;
    });
  }

  return filteredRows.map(fr => fr.original);
}

export async function exportToXls<TItem extends MRT_RowData>(
  request: Request,
  items: TItem[],
  allColumnDef: { accessorKey?: string, header: string, accessorFn?: (originalRow: TItem) => unknown; }[],
  defaultColumnVisibility: Record<string, boolean>,
  tableId: string,
  exportName: string,
  serverSideDataProcessing: boolean = false
) {
  const userName = await getUserName(request);

  const tableSettings = await fetchTableSettings(userName!, tableId, {
    columnOrder: allColumnDef.map(c => c.accessorKey!),
    columnVisibility: defaultColumnVisibility
  });

  const xlsColumns = prepareXlsColumnDefinition(allColumnDef, tableSettings);

  const workBook = new exceljs.Workbook();
  const workSheet = workBook.addWorksheet('Data');

  workSheet.columns = xlsColumns;


  const filteredAndSortedItems = serverSideDataProcessing
    ? items
    : filterAndSortRows(request, items);

  const mappedItems = filteredAndSortedItems.map((item) => {
    const mappedItem: Record<string, unknown> = {};

    for (const col of allColumnDef) {
      mappedItem[col.accessorKey!] = col.accessorFn
        ? col.accessorFn(item)
        : item[col.accessorKey!];
    }

    return mappedItem;
  });

  for (const item of mappedItems) {
    workSheet.addRow(item);
  }

  const xlsxBuffer = await workBook.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${exportName}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
