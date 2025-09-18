import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { OrganizationHierarchyGridHeader, OrgHierarchyBreadcrumbsProps } from "~/components/records/organization-hierarchy/header-controls";
import { Card } from "~/components/ui/card";
import { encodeColumnFilters, getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType, SelectItemType } from "~/shared/models";
import { columnDef, columnDefVisibility, TABLE_ID } from "../../taxonomy-hierarchy/species/grid-definitions";
import { TaxonomySpeciesItem } from "../../taxonomy-hierarchy/species/models";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Tooltip } from "~/components/ui/tooltip";

export type OrgSpeciesResultItem = TaxonomySpeciesItem & {};

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
  const locationId = Number(params.parentId);
  const userName = await getUserName(request);

  const queryClauses = [
    'Species?$count=true',
    `$filter=specimens/any(s:s/placementLocationId eq ${locationId})`,
    '$orderby=code'
  ];

  const [fetchError, listResult] = await fetchODataList<OrgSpeciesResultItem>(
    queryClauses.join('&')
  );

  const [workplaceFetchError, locationsResult] = await fetchODataList<{ id: number, name: string, organizationLevelId: number }>(
    `Locations?$filter=id eq ${locationId}&$select=id,name,organizationLevelId`
  );

  const [OrganizationLevelsFetchError, OrganizationLevelsResult] = await fetchODataList<{ id: number, name: string, parent?: { id: number, name: string, parent?: { id: number, name: string } } }>(
    `OrganizationLevels?$filter=id eq ${locationsResult?.items[0].organizationLevelId}&expand=parent($expand=parent($select=id,name);$select=id,name)&$select=id,name`
  );

  const [rdbCodesError, rdbCodesResult] = await fetchODataList<EnumerationType>(
    'rdbcodes?$orderby=sort'
  );

  const [citeCodesError, citeCodesResult] = await fetchODataList<EnumerationType>(
    'speciescitetypes?$orderby=sort'
  );

  const [euCodesError, euCodesResult] = await fetchODataList<EnumerationType>(
    'eucodes?$orderby=sort'
  );

  const [protectionTypesError, protectionTypesResult] = await fetchODataList<EnumerationType>(
    'speciesprotectiontypes?$orderby=sort'
  );

  const tableSettings = await fetchTableSettings(userName!, TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: columnDefVisibility
  });

  return data({
    locationId,
    items: listResult?.items || [],
    locations: locationsResult?.items[0],
    organizationLevelsResult: OrganizationLevelsResult?.items[0],
    rdbCodes: (rdbCodesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    citeCodes: (citeCodesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    euCodes: (euCodesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    protectionTypes: (protectionTypesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const locationUse = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const orgLevel = loaderData.organizationLevelsResult;

  const breadcrumbProps: OrgHierarchyBreadcrumbsProps = {
    levels: {
      department: orgLevel?.parent?.parent
        ? { id: orgLevel.parent.parent.id, name: orgLevel.parent.parent.name }
        : undefined,
      workplace: orgLevel?.parent
        ? { id: orgLevel.parent.id, name: orgLevel.parent.name }
        : undefined,
      district: orgLevel
        ? { id: orgLevel.id, name: orgLevel.name }
        : undefined,
      location: loaderData.locations
        ? { id: loaderData.locations.id, name: loaderData.locations.name }
        : undefined,
      species: undefined,
      currentPage: { nameMain: 'Druhy' }
    }
  };

  const goToDetail = (id: number) => {
    navigate(`/records/org-hierarchy/locations/${loaderData.locationId}/species/${id}${locationUse.search}`, { replace: true });
  }

  const goToChildren = (id: number) => {
    navigate(`/records/org-hierarchy/locations/${loaderData.locationId}/species/${id}/specimens`, { replace: true });
  }

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<OrgSpeciesResultItem>({
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

  useDefaultTableRedirects<OrgSpeciesResultItem>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => { },
    openDefaultItem: () => {
      goToDetail(loaderData.items[0].id);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const selectedIds = Object.keys(table.getState().rowSelection).map((rid) => parseInt(rid));
    setSelectedIds(selectedIds);
  }, [table.getState().rowSelection]);

  const showFilteredSpecimens = () => {
    const filtersToApply = [
      {
        id: 'speciesId',
        value: selectedIds.map(i => i.toString())
      }
    ];

    const filterParam = encodeColumnFilters(filtersToApply);

    navigate(`/exemplar-list?columnFilters=${encodeURIComponent(filterParam)}`);
  };

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/org-hierarchy/locations/${loaderData.locationId}/species/export-xls`,
      searchParams
    );

    await downloadFile(url);
  };

  return (
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <OrganizationHierarchyGridHeader
              table={table}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              breadcrumbProps={breadcrumbProps}
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