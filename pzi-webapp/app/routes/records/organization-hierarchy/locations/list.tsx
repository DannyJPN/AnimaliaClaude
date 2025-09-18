import { NoSsr } from "@mui/material";
import { ArrowLeftRightIcon } from "lucide-react";
import { MaterialReactTable } from "material-react-table";
import { useState } from "react";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { OrganizationHierarchyGridHeader, OrgHierarchyBreadcrumbsProps } from "~/components/records/organization-hierarchy/header-controls";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { encodeColumnFilters, getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, LISTS_EDIT } from "~/shared/permissions";
import { OrganizationLevelItem } from "../models";
import { columnDef, columnDefVisibility, LOCATIONS_TABLE_ID } from "./controls";
import { MoveLocations } from "./controls/move-locations";
import { Location } from "./models";
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
  const districtId = Number(params.parentId);
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [LISTS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const [fetchError, listResult] = await fetchODataList<Location>(
    `Locations?$count=true&orderby=id desc&$filter=organizationLevelId eq ${districtId}&$expand=OrganizationLevel($select=name),ExpositionSet($select=id,name)`
  );

  const items = (listResult?.items || []);

  const tableSettings = await fetchTableSettings(userName!, LOCATIONS_TABLE_ID, {
    columnOrder: columnDef.map((c) => c.accessorKey as string),
    columnVisibility: columnDefVisibility,
  });

  const [org, orgResult] = await fetchODataList<{ id: number, name: string }>(
    "OrganizationLevels?$orderby=name&$filter=level eq 'district'"
  );

  const [districtIdFetchError, districtResult] = await fetchODataList<OrganizationLevelItem>(
    `OrganizationLevels?$filter=id eq ${districtId}`
  );

  const [workplaceFetchError, workplaceResult] = await fetchODataList<OrganizationLevelItem>(
    `OrganizationLevels?$filter=id eq ${districtResult?.items[0].parentId}`
  );

  const [departmentFetchError, departmentResult] = await fetchODataList<OrganizationLevelItem>(
    `OrganizationLevels?$filter=id eq ${workplaceResult?.items[0].parentId}`
  );

  return data({
    items,
    districtId: districtId,
    districtInfo: districtResult?.items[0],
    workplaceInfo: workplaceResult?.items[0],
    departmentInfo: departmentResult?.items[0],
    hasEditPermission,
    org: (orgResult?.items || []).map((i) => {
      return { key: i.id, text: i.name } as SelectItemType<number, string>;
    }),
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

  const breadcrumbProps: OrgHierarchyBreadcrumbsProps = {
    levels: {
      department: {
        id: loaderData.departmentInfo!.id,
        name: loaderData.departmentInfo!.name
      },
      workplace: {
        id: loaderData.workplaceInfo!.id,
        name: loaderData.workplaceInfo!.name
      },
      district: {
        id: loaderData.districtInfo!.id,
        name: loaderData.districtInfo!.name
      },
      species: undefined,
      currentPage: { nameMain: 'Lokace' }
    }
  }

  const goToDetail = (id: number) => {
    navigate(`/records/org-hierarchy/districts/${loaderData.districtId}/locations/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/org-hierarchy/districts/${loaderData.districtId}/locations/new${location.search}`, { replace: true });
  };

  const goToChildren = (id: number) => {
    navigate(`/records/org-hierarchy/locations/${id}/species`, { replace: true });
  }

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
      `/records/org-hierarchy/districts/${loaderData.districtId}/locations/export-xls`,
      searchParams
    );

    await downloadFile(url);
  };

  return (<>
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <OrganizationHierarchyGridHeader
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
          currentParentId={loaderData.districtId}
          onClose={() => {
            setMoveItemsVisible(false);
          }} />
      )}
    </div>
  </>)
}
