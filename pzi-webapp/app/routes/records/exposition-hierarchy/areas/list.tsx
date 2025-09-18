import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { useEffect, useState } from "react";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { Card } from "~/components/ui/card";
import { encodeColumnFilters } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { ExpHierarchyBreadcrumbsProps, ExpositionHierarchyGridHeader } from "../controls";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { ExpositionArea } from "../models";
import { AREAS_TABLE_ID, columnDef, defaultVisibility } from "./grid-definition";
import { Button } from "~/components/ui/button";
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
  const userName = await getUserName(request);

  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [RECORDS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const queryClauses = [
    'ExpositionAreas?$count=true',
    '$orderby=name'
  ];

  const [fetchError, listResult] = await fetchODataList<ExpositionArea>(
    queryClauses.join('&')
  );

  const tableSettings = await fetchTableSettings(userName!, AREAS_TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: defaultVisibility
  });

  return data({
    items: listResult!.items,
    hasEditPermission,
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(AREAS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { isDownloading, downloadFile } = useFileDownload();
  const selectedChildKey = params.actionParam;

  const breadcrumbProps: ExpHierarchyBreadcrumbsProps = {
    levels: {
      area: undefined,
      set: undefined,
      location: undefined,

      currentPage: { nameMain: 'Oblasti' }
    }
  }

  const goToDetail = (id: number) => {
    navigate(`/records/exposition-hierarchy/areas/${id}${location.search}`, { replace: true });
  }

  const goToChildren = (id: number) => {
    navigate(`/records/exposition-hierarchy/areas/${id}/sets`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/exposition-hierarchy/areas/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<ExpositionArea>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: columnDef,
    data: loaderData.items,

    tableOptions: {
      enableRowSelection: true,

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

  useDefaultTableRedirects<ExpositionArea>({
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
        id: 'expositionAreaId',
        value: selectedIds.map(i => i.toString())
      }
    ];

    const filterParam = encodeColumnFilters(filtersToApply);

    navigate(`/exemplar-list?columnFilters=${encodeURIComponent(filterParam)}`);
  };

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/exposition-hierarchy/areas/export-xls`,
      searchParams
    );

    await downloadFile(url);
  };

  return (<>
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <ExpositionHierarchyGridHeader
              table={table}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              breadcrumbProps={breadcrumbProps}
              onNewItem={openNewItemForm}
              onExport={handleExport}
              isExporting={isDownloading}
              additionalButtons={
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
  </>)
}
