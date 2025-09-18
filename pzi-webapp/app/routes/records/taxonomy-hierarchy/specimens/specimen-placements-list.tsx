import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { Card } from "~/components/ui/card";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { SpecimenChildRecordsGridHeader } from "./controls";
import { fetchSpecimenSubViewParents } from "./helpers";
import { SpecimenPlacementItem } from "./models";
import { OrganizationLevelItem } from "../../organization-hierarchy/models";
import { flattenSpecimenPlacement, SPECIMEN_PLACEMENTS_TABLE_ID, specimenPlacementsColumnDef, specimenPlacementsColumnDefVisibility } from "./grid-columns";
import { SelectItemType } from "~/shared/models";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
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
  const parentId = Number(params.parentId);
  const userName = await getUserName(request);
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [RECORDS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const [fetchError, listResult] = await fetchODataList<SpecimenPlacementItem>(
    `SpecimenPlacements?$count=true&$orderby=validSince&$filter=specimenId eq ${parentId}&$expand=location($select=id,name),organizationLevel($select=id,name)`
  );

  const [parentResult, parentPhylaResult, parentFamilyResult] = await fetchSpecimenSubViewParents(parentId);

  const [locationsError, locationsResult] = await fetchODataList<{ id: number; name: string }>(
    'locations?$select=id,name&$orderby=name'
  );

  const [orgLevelsError, orgLevelsResult] = await fetchODataList<OrganizationLevelItem>(
    'OrganizationLevels?$orderby=name'
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenSpecimenPlacement);

  const tableSettings = await fetchTableSettings(userName!, SPECIMEN_PLACEMENTS_TABLE_ID, {
    columnOrder: specimenPlacementsColumnDef.map(c => c.accessorKey!),
    columnVisibility: specimenPlacementsColumnDefVisibility
  });

  return data({
    specimenId: parentId,
    specimenInfo: parentResult?.items[0],
    phylaInfo: parentPhylaResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    items: itemsWithRelatedData,
    hasEditPermission,
    locations: (locationsResult?.items || []).map(i => ({ key: i.id, text: i.name } as SelectItemType<number, string>)),
    organizationLevels: (orgLevelsResult?.items || []).map(i => ({ key: i.id, text: i.name } as SelectItemType<number, string>)),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(SPECIMEN_PLACEMENTS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const goToDetail = (id: number) => {
    navigate(`/records/specimens/${loaderData.specimenId}/specimen-placements/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/specimens/${loaderData.specimenId}/specimen-placements/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<SpecimenPlacementItem>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: specimenPlacementsColumnDef,
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

  useDefaultTableRedirects<SpecimenPlacementItem>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => {
      openNewItemForm();
    },
    openDefaultItem: () => {
      if (loaderData.items && loaderData.items.length > 0) {
        goToDetail(loaderData.items[0].id);
      }
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/specimens/${loaderData.specimenId}/export-specimen-placements-xls`,
      searchParams
    );

    await downloadFile(url);
  };

  return (
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <SpecimenChildRecordsGridHeader
              table={table}
              phylumInfo={loaderData.phylaInfo}
              familyInfo={loaderData.familyInfo}
              specimenInfo={loaderData.specimenInfo}
              currentPageName="Umístění"
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              noNewItem={!loaderData.hasEditPermission}
              onNewItem={openNewItemForm}
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
