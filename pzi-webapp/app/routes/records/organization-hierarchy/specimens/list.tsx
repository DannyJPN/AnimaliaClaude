import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName } from "~/.server/user-session";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { cn } from "~/lib/utils";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { Card } from "~/components/ui/card";
import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { OrganizationHierarchyGridHeader, OrgHierarchyBreadcrumbsProps } from "~/components/records/organization-hierarchy/header-controls";
import { EnumerationType, SelectItemType } from "~/shared/models";
import { columnDef, columnDefVisibility, SPECIMENS_TABLE_ID } from "../../taxonomy-hierarchy/specimens/grid-columns";
import { TaxonomySpecimenItem, TaxonomySpeciesInfoItem, TaxonomySpecimenItemWithFlatRelatedData } from "../../taxonomy-hierarchy/specimens/models";
import { flattenODataResult } from "../../taxonomy-hierarchy/specimens/helpers";
import { useFileDownload } from "~/components/hooks/use-file-download";

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
  const locationId = Number(params.locationId);
  const speciesId = Number(params.speciesId);

  const userName = await getUserName(request);

  const queryClauses = [
    'specimens?$count=true',
    `$filter=placementLocationId eq ${locationId} and speciesId eq ${speciesId}`,
    '$orderby=accessionNumber'
  ];

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenItem>(
    queryClauses.join('&')
  );

  const [parentSpeciesFetchError, parentSpeciesResult] = await fetchODataList<TaxonomySpeciesInfoItem & { classificationTypeCode?: string }>(
    `species?$filter=id eq ${speciesId}`
  );

  const [workplaceFetchError, locationsResult] = await fetchODataList<{ id: number, name: string, organizationLevelId: number }>(
    `Locations?$filter=id eq ${locationId}&$select=id,name,organizationLevelId`
  );

  const [OrganizationLevelsFetchError, OrganizationLevelsResult] = await fetchODataList<{ id: number, name: string, parent?: { id: number, name: string, parent?: { id: number, name: string } } }>(
    `OrganizationLevels?$filter=id eq ${locationsResult?.items[0].organizationLevelId}&expand=parent($expand=parent($select=id,name);$select=id,name)&$select=id,name`
  );

  const [genderTypesError, genderTypesResult] = await fetchODataList<EnumerationType>(
    'gendertypes?$orderby=sort'
  );

  const [rearingTypesError, rearingTypesResult] = await fetchODataList<EnumerationType>(
    'rearings?$orderby=sort'
  );

  const [birthMethodsError, birthMethodsResult] = await fetchODataList<EnumerationType>(
    'birthmethods?$orderby=sort'
  );

  const specimensWithRelatedData: TaxonomySpecimenItemWithFlatRelatedData[] = (listResult?.items || []).map(flattenODataResult);

  const tableSettings = await fetchTableSettings(userName!, SPECIMENS_TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: columnDefVisibility
  });

  return data({
    locationId: locationId,
    speciesId: speciesId,
    items: specimensWithRelatedData,
    organizationLevelsResult: OrganizationLevelsResult?.items[0],
    locations: locationsResult?.items[0],
    species: parentSpeciesResult?.items[0],
    genderTypes: (genderTypesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    rearingTypes: (rearingTypesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    birthMethodTypes: (birthMethodsResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(SPECIMENS_TABLE_ID);

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
      species: loaderData.species
        ? { id: loaderData.species.id, nameMain: loaderData.species.nameLat, nameSub: loaderData.species.nameCz, }
        : undefined,
      currentPage: { nameMain: 'Exempláře' }
    }
  };

  const goToDetail = (id: number) => {
    navigate(`/records/org-hierarchy/locations/${loaderData.locationId}/species/${loaderData.speciesId}/specimens/${id}${locationUse.search}`, { replace: true });
  }

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<TaxonomySpecimenItemWithFlatRelatedData>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: columnDef,
    data: loaderData.items,

    tableOptions: {
      enableRowSelection: false,
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
        };
      },
    }
  });

  useDefaultTableRedirects<TaxonomySpecimenItemWithFlatRelatedData>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => { },
    openDefaultItem: () => {
      goToDetail(loaderData.items[0].id);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  const handleExport = async () => {
    const url = getExportXlsUrl(`
                /records/org-hierarchy/locations/${loaderData.locationId}
                /species/${loaderData.speciesId}
                /specimens/export-xls`, searchParams
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