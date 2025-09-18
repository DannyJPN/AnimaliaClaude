import { NoSsr } from "@mui/material";
import { ArrowLeftRightIcon } from "lucide-react";
import { MaterialReactTable, MRT_RowVirtualizer, MRT_TableOptions, MRT_VisibilityState, useMaterialReactTable } from "material-react-table";
import { MRT_Localization_CS } from 'material-react-table/locales/cs';
import { useEffect, useRef, useState } from "react";
import { ActionFunctionArgs, data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { useTableSearchParams } from "tanstack-table-search-params";
import { fetchODataList, filterByStatusesClause } from "~/.server/odata-api";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions, getVisibleTaxonomyStatusesList } from "~/.server/user-session";
import { RecordsPageGridHeader } from "~/components/records/records-pages-controls";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { encodeColumnFilters, getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler, handleTableSettingsChange } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { TaxonomyPhylumInfoItem } from "../models";
import { columnDef, defaultVisibility, TABLE_ID } from "./controls";
import { MoveClasses } from "./controls/move-classes";
import { TaxonomyClassItem } from "./models";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Tooltip } from "~/components/ui/tooltip";

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.actionStatus
    && args.actionStatus === 200
    && args.actionResult
    && args.actionResult.success) {
    return true;
  }

  return false;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);
  const userName = await getUserName(request);
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [RECORDS_EDIT, DOCUMENTATION_DEPARTMENT]);
  const statuses = await getVisibleTaxonomyStatusesList(request);
  const zooStatusClause = filterByStatusesClause(statuses);

  const filterClauses = [
    `$filter=taxonomyPhylumId eq ${parentId}`
  ];

  if (zooStatusClause) {
    filterClauses.push(zooStatusClause);
  }

  const [fetchError, listResult] = await fetchODataList<TaxonomyClassItem>(
    `taxonomyclasses?$count=true&$orderby=code&${filterClauses.join(' and ')}`
  );

  const [phylumFetchError, phylumResult] = await fetchODataList<TaxonomyPhylumInfoItem>(
    `taxonomyphyla?$filter=id eq ${parentId}`
  );

  const tableSettings = await fetchTableSettings(userName!, TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: defaultVisibility
  });

  return data({
    phylumId: parentId,
    phylumInfo: phylumResult?.items[0],
    items: listResult!.items,
    hasEditPermission,
    ...tableSettings
  });
}

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomyClassItem>(
    request,
    (formData) => {
      const postData: Partial<TaxonomyClassItem> = Object.fromEntries(formData);
      return postData;
    },
    'api/taxonomyclasses',
    pziConfig
  );
}

const postTableSettings = createPostTableSettingsHandler(TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();
  const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer>(null);
  const selectedChildKey = params.actionParam;

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(loaderData.columnVisibility || {});
  const [columnOrder, setColumnOrder] = useState<string[]>(loaderData.columnOrder || []);

  const breadcrumbProps = {
    hierarchyType: 'Z' as const,
    levels: {
      type: 'Z' as const,
      phylum: loaderData.phylumInfo ? {
        id: loaderData.phylumInfo.id,
        nameLat: loaderData.phylumInfo.nameLat,
        nameCz: loaderData.phylumInfo.nameCz
      } : undefined,
      currentPage: {
        nameLat: 'Classis',
        nameCz: 'Třída'
      }
    }
  };

  const stateAndOnChanges = useTableSearchParams(
    {
      replace: (url) => {
        const newSearchParams = new URLSearchParams(url);
        setSearchParams(newSearchParams);
      },
      query: searchParams,
      pathname: '',
    }
  );

  const [moveItemsVisible, setMoveItemsVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const gridOptions: MRT_TableOptions<TaxonomyClassItem> = {
    columns: columnDef,
    data: loaderData.items,

    enableRowSelection: true,
    enablePagination: false,
    enableFullScreenToggle: false,
    enableGlobalFilter: false,
    enableStickyHeader: true,
    enableTableFooter: false,
    enableRowVirtualization: true,
    enableDensityToggle: false,
    enableColumnOrdering: true,
    localization: MRT_Localization_CS,

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
      columnVisibility,
      columnOrder
    },

    rowVirtualizerInstanceRef,

    renderTopToolbar: () => (<></>),
    renderBottomToolbar: () => (<></>),

    muiTableBodyRowProps: ({ row }) => {
      const rowSelected = selectedChildKey === `${row.original.id}`;

      return {
        className: cn(
          'pzi-table-item-row cursor-pointer',
          rowSelected ? 'row-selected bg-accent' : ''
        ),
        sx: {
          backgroundColor: rowSelected ? 'hsl(var(--secondary))' : '',
        },

        onClick: () => {
          navigate(`/records/phyla/${loaderData.phylumId}/classes/${row.original.id}${location.search}`, { replace: true });
        },

        onFocus: () => {
          navigate(`/records/phyla/${loaderData.phylumId}/classes/${row.original.id}${location.search}`, { replace: true });
        },

        onDoubleClick: () => {
          navigate(`/records/classes/${row.original.id}/orders/`, { replace: true });
        },
        onKeyDown: (evt: React.KeyboardEvent) => {
          if (evt.key === 'Enter') {
            evt.stopPropagation();
            evt.preventDefault();
            navigate(`/records/classes/${row.original.id}/orders/`, { replace: true });
          }
        }
      };
    },

    getRowId: (row) => row.id.toString(),

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
        postTableSettings(newVisibility, newOrder);
      }
    );
  }, [table.getState().columnVisibility, table.getState().columnOrder]);

  const openNewItemForm = () => {
    navigate(`/records/phyla/${loaderData.phylumId}/classes/new${location.search}`, { replace: true });
  };

  useEffect(() => {
    if (selectedChildKey === 'new') {
      return;
    }

    const properKeySelected = selectedChildKey
      && loaderData.items.some((ck) => ck.id.toString() === selectedChildKey);

    if (properKeySelected) {
      return;
    }

    let timeout = setTimeout(() => {
      if (loaderData.items.length === 0) {
        openNewItemForm();
      } else {
        navigate(`/records/phyla/${loaderData.phylumId}/classes/${loaderData.items[0].id}${location.search}`, { replace: true });
      }
    }, 10);

    return () => {
      clearTimeout(timeout);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  useEffect(() => {
    if (!selectedChildKey || selectedChildKey === 'new') {
      return;
    }

    setTimeout(() => {
      const selectedRowIndex = table.getRowModel().rows.findIndex((row) => selectedChildKey === `${row.original.id}`);
      rowVirtualizerInstanceRef.current?.scrollToIndex(selectedRowIndex);

      setTimeout(() => {
        document.querySelector('.row-selected')?.querySelector('td')?.focus();
      }, 25);
    }, 25);
  }, []);

  useEffect(() => {
    const selectedIds = Object.keys(table.getState().rowSelection).map((rid) => parseInt(rid));
    setSelectedIds(selectedIds);
  }, [table.getState().rowSelection]);

  const showFilteredSpecimens = () => {
    const filtersToApply = [
      {
        id: 'classId',
        value: selectedIds.map(i => i.toString())
      }
    ];

    const filterParam = encodeColumnFilters(filtersToApply);

    navigate(`/exemplar-list?columnFilters=${encodeURIComponent(filterParam)}`);
  };

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/phyla/${loaderData.phylumId}/classes/export-xls`,
      searchParams
    );

    await downloadFile(url);
  };

  return (
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <RecordsPageGridHeader
              table={table}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              breadcrumbProps={breadcrumbProps}
              noNewItem={!loaderData.hasEditPermission}
              onNewItem={openNewItemForm}
              onExport={handleExport}
              isExporting={isDownloading}
              additionalButtons={
                <>
                  <Tooltip content="Přesunou vybrané záznamy">
                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={!loaderData.hasEditPermission || selectedIds.length === 0}
                      onPress={() => setMoveItemsVisible(true)}>
                      <ArrowLeftRightIcon className="size-3" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Zobrazit exempláře">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-center"
                      isDisabled={selectedIds.length === 0}
                      onPress={showFilteredSpecimens}>
                      <span className="min-w-[12px]">E</span>
                    </Button>
                  </Tooltip>
                </>
              }
            />
            <MaterialReactTable table={table} />
          </NoSsr>
        </Card>
      </div>

      <div className="w-full md:w-1/2 mt-2 md:mt-0">
        <Outlet context={loaderData} />
      </div>

      {moveItemsVisible && (
        <MoveClasses
          selectedIds={selectedIds}
          currentParentId={loaderData.phylumId}
          onClose={() => setMoveItemsVisible(false)} />
      )}
    </div>
  );
}
