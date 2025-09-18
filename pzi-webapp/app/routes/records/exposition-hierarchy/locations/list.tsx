import { NoSsr } from "@mui/material";
import { ArrowLeftRightIcon } from "lucide-react";
import { MaterialReactTable } from "material-react-table";
import { useState } from "react";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { encodeColumnFilters, getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { columnDefVisibility } from "~/routes/exemplar-list/controls";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, LISTS_EDIT } from "~/shared/permissions";
import { columnDef, LOCATIONS_TABLE_ID } from "../../organization-hierarchy/locations/controls";
import { Location } from "../../organization-hierarchy/locations/models";
import { ExpHierarchyBreadcrumbsProps, ExpositionHierarchyGridHeader } from "../controls";
import { ExpositionSet } from "../models";
import { MoveLocations } from "./controls/move-locations";
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
  const userName = await getUserName(request);
  const expositionSetId = Number(params.parentId);
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [LISTS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const tableSettings = await fetchTableSettings(userName!, LOCATIONS_TABLE_ID, {
    columnOrder: columnDef.map((c) => c.accessorKey as string),
    columnVisibility: columnDefVisibility,
  });

  const [fetchError, listResult] = await fetchODataList<Location>(
    `Locations?$count=true&orderby=id desc&$filter=expositionSetId eq ${expositionSetId}&$expand=OrganizationLevel($select=id,name),ExpositionSet($select=id,name)`
  );

  const [setError, setResult] = await fetchODataList<ExpositionSet>(
    `ExpositionSets?$filter=id eq ${expositionSetId}&$expand=ExpositionArea($select=id,name)`
  );

  return data({
    items: listResult!.items,
    expositionSetId: expositionSetId,
    expositionSet: setResult?.items[0],
    expositionArea: setResult?.items[0].expositionArea,
    hasEditPermission,
    ...tableSettings,
  });
}

const postTableSettings = createPostTableSettingsHandler(LOCATIONS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const breadcrumbProps: ExpHierarchyBreadcrumbsProps = {
    levels: {
      area: {
        id: loaderData.expositionArea!.id,
        name: loaderData.expositionSet?.name
      },
      set: {
        id: loaderData.expositionSet!.id,
        name: loaderData.expositionSet?.name
      },
      location: undefined,

      currentPage: { nameMain: 'Lokace' }
    }
  }

  const goToDetail = (id: number) => {
    navigate(`/records/exposition-hierarchy/sets/${loaderData.expositionSetId}/locations/${id}${location.search}`, { replace: true });
  }

  const goToChildren = (id: number) => {
    navigate(`/records/exposition-hierarchy/locations/${id}/species`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/exposition-hierarchy/sets/${loaderData.expositionSetId}/locations/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<Location>({
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

          onDoubleClick: () => {
            goToChildren(row.original.id);
          },

          onFocus: () => {
            goToDetail(row.original.id);
          },
        };
      },
    }
  });

  useDefaultTableRedirects<Location>({
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

  const selectedIds = Object.keys(table.getState().rowSelection).map((rid) => parseInt(rid));
  const [moveItemsVisible, setMoveItemsVisible] = useState(false);

  const showFilteredSpecimens = () => {
    const filtersToApply = [
      {
        id: 'locationId',
        value: selectedIds.map(i => i.toString())
      }
    ];

    const filterParam = encodeColumnFilters(filtersToApply);

    navigate(`/exemplar-list?columnFilters=${encodeURIComponent(filterParam)}`);
  };

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/exposition-hierarchy/sets/${loaderData.expositionSetId}/locations/export-xls`,
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
                <>
                  <Tooltip content="Přesunou vybrané záznamy">
                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={!loaderData.hasEditPermission || selectedIds.length === 0}
                      onPress={() => {
                        setMoveItemsVisible(true);
                      }}>
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
        <MoveLocations
          selectedIds={selectedIds}
          currentParentId={loaderData.expositionSetId}
          onClose={() => {
            setMoveItemsVisible(false);
          }} />
      )}
    </div>
  </>)
}
