import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList, filterByStatusesClause } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions, getVisibleTaxonomyStatusesList } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { RecordsPageGridHeader } from "~/components/records/records-pages-controls";
import { Card } from "~/components/ui/card";
import { encodeColumnFilters, getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { columnDef, defaultVisibility, TABLE_ID } from "./controls";
import { TaxonomyPhylumItem } from "./models";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
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

export async function loader({ request }: LoaderFunctionArgs) {
  const statuses = await getVisibleTaxonomyStatusesList(request);
  const userName = await getUserName(request);
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [RECORDS_EDIT, DOCUMENTATION_DEPARTMENT]);
  const zooStatusClause = filterByStatusesClause(statuses);

  const queryClauses = [
    'TaxonomyPhyla?$count=true',
    '$orderby=code'
  ];

  if (zooStatusClause) {
    queryClauses.push(`$filter=${zooStatusClause}`);
  }

  const [fetchError, listResult] = await fetchODataList<TaxonomyPhylumItem>(
    queryClauses.join('&')
  );

  const tableSettings = await fetchTableSettings(userName!, TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: defaultVisibility
  });

  return data({
    items: listResult!.items,
    hasEditPermission,
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const breadcrumbProps = {
    hierarchyType: 'Z' as const,

    levels: {
      type: 'Z' as const,
      currentPage: {
        nameLat: 'Phyla',
        nameCz: 'Kmen',
      }
    }
  };

  const goToDetail = (id: number) => {
    navigate(`/records/phyla/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/phyla/new${location.search}`, { replace: true });
  };

  const goToChildren = (id: number) => {
    navigate(`/records/phyla/${id}/classes`, { replace: true });
  }

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<TaxonomyPhylumItem>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: columnDef,
    data: loaderData.items,

    tableOptions: {
      enableRowSelection: true,
      enablePagination: false,

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
            goToDetail(row.original.id);
          },

          onFocus: () => {
            goToDetail(row.original.id);
          },

          onDoubleClick: () => {
            goToChildren(row.original.id);
          },

          onKeyDown: (evt: React.KeyboardEvent) => {
            if (evt.key === 'Enter') {
              evt.stopPropagation();
              evt.preventDefault();
              goToChildren(row.original.id);
            }
          }
        };
      },
    }
  });

  useDefaultTableRedirects<TaxonomyPhylumItem>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => {
      openNewItemForm();
    },
    openDefaultItem: () => {
      goToDetail(loaderData.items[0].id);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  useEffect(() => {
    const selectedIds = Object.keys(table.getState().rowSelection).map((rid) => parseInt(rid));
    setSelectedIds(selectedIds);
  }, [table.getState().rowSelection]);

  const showFilteredSpecimens = () => {
    const filtersToApply = [
      {
        id: 'phylumId',
        value: selectedIds.map(i => i.toString())
      }
    ];

    const filterParam = encodeColumnFilters(filtersToApply);

    navigate(`/exemplar-list?columnFilters=${encodeURIComponent(filterParam)}`);
  };

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/phyla/export-xls`,
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
    </div>
  );
}
