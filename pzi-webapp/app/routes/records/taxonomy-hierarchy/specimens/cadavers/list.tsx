import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { RECORDS_EDIT, DOCUMENTATION_DEPARTMENT, hasOneOfPermissions } from "~/shared/permissions";
import { Card } from "~/components/ui/card";
import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { cadaversColumnDef, cadaversColumnDefVisibility, flattenCadaver, SPECIMEN_CADAVERS_TABLE_ID } from "../grid-columns";
import { fetchSpecimenSubViewParents } from "../helpers";
import { TaxonomySpecimenCadaverItem, TaxonomySpecimenCadaverItemWithRelations } from "../models";
import { SpecimenChildRecordsGridHeader } from "../controls";
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

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenCadaverItem>(
    `cadavers?$count=true&$orderby=date&$filter=specimenId eq ${parentId}`
  );

  const [parentResult, parentPhylaResult, parentFamilyResult] = await fetchSpecimenSubViewParents(parentId);

  const [locationsError, locationsResult] = await fetchODataList<{ keyword: string }>(
    'cadaverpartners?$orderby=id&$select=keyword'
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenCadaver);

  const tableSettings = await fetchTableSettings(userName!, SPECIMEN_CADAVERS_TABLE_ID, {
    columnOrder: cadaversColumnDef.map(c => c.accessorKey!),
    columnVisibility: cadaversColumnDefVisibility
  });

  return data({
    specimenId: parentId,
    specimenInfo: parentResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    phylumInfo: parentPhylaResult?.items[0],
    items: itemsWithRelatedData,
    hasEditPermission,
    locations: (locationsResult?.items || []).map(({ keyword }) => {
      return {
        key: keyword,
        text: keyword
      } as SelectItemType<string, string>;
    }),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(SPECIMEN_CADAVERS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();
  const selectedChildKey = params.actionParam;


  const goToDetail = (id: number) => {
    navigate(`/records/specimens/${loaderData.specimenId}/cadavers/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/specimens/${loaderData.specimenId}/cadavers/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<TaxonomySpecimenCadaverItemWithRelations>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: cadaversColumnDef,
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

          onKeyDown: (evt: React.KeyboardEvent) => {
            if (evt.key === 'Enter') {
              evt.stopPropagation();
              evt.preventDefault();
            }
          }
        };
      },
    }
  });

  useDefaultTableRedirects<TaxonomySpecimenCadaverItem>({
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

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/specimens/${loaderData.specimenId}/export-cadavers-xls`,
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
              familyInfo={loaderData.familyInfo}
              specimenInfo={loaderData.specimenInfo}
              phylumInfo={loaderData.phylumInfo}
              currentPageName="Kadaver"
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              onNewItem={openNewItemForm}
              noNewItem={!loaderData.hasEditPermission}
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
