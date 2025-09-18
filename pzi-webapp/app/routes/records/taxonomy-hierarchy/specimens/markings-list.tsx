import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { Card } from "~/components/ui/card";
import { enumerationsToSelects } from "~/lib/mappers";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType, SelectItemType } from "~/shared/models";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { SpecimenChildRecordsGridHeader } from "./controls";
import { flattenMarking, markingsColumnDef, markingsColumnDefVisibility, SPECIMEN_MARKINGS_TABLE_ID } from "./grid-columns";
import { fetchSpecimenSubViewParents } from "./helpers";
import { TaxonomySpecimenMarkingItem, TaxonomySpecimenMarkingItemWithRelations } from "./models";
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

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenMarkingItem>(
    `markings?$count=true&$orderby=markingDate&$filter=specimenId eq ${parentId}&$expand=markingType($select=code,displayName)`
  );

  const [parentResult, parentPhylaResult, parentFamilyResult] = await fetchSpecimenSubViewParents(parentId);

  const [markingTypesError, markingTypesResult] = await fetchODataList<EnumerationType>(
    'markingtypes?$orderby=sort'
  );

  const [colorTypesError, colorTypesResult] = await fetchODataList<{ code: string, colorEn: string }>(
    `colortypes?orderby=sort`
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenMarking);

  const tableSettings = await fetchTableSettings(userName!, SPECIMEN_MARKINGS_TABLE_ID, {
    columnOrder: markingsColumnDef.map(c => c.accessorKey!),
    columnVisibility: markingsColumnDefVisibility
  });

  return data({
    specimenId: parentId,
    specimenInfo: parentResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    phylumInfo: parentPhylaResult?.items[0],
    items: itemsWithRelatedData,
    hasEditPermission,
    markingTypes: enumerationsToSelects(markingTypesResult?.items),
    colorTypes: (colorTypesResult?.items || []).map((ct) => {
      return { key: ct.colorEn, text: ct.colorEn };
    }) as SelectItemType<string, string>[],
    ...tableSettings
  });
}


const postTableSettings = createPostTableSettingsHandler(SPECIMEN_MARKINGS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const goToDetail = (id: number) => {
    navigate(`/records/specimens/${loaderData.specimenId}/markings/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/specimens/${loaderData.specimenId}/markings/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<TaxonomySpecimenMarkingItemWithRelations>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: markingsColumnDef,
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

  useDefaultTableRedirects<TaxonomySpecimenMarkingItemWithRelations>({
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
      `/records/specimens/${loaderData.specimenId}/export-markings-xls`,
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
              phylumInfo={loaderData.phylumInfo}
              familyInfo={loaderData.familyInfo}
              specimenInfo={loaderData.specimenInfo}
              currentPageName="Značení"
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
