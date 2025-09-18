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
import { EnumerationType } from "~/shared/models";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { SpecimenChildRecordsGridHeader } from "./controls";
import { movementsColumnDef, movementsColumnDefVisibility, SPECIMEN_MOVEMENTS_TABLE_ID } from "./grid-columns";
import { fetchSpecimenSubViewParents, flattenODataMovementsResult } from "./helpers";
import { TaxonomySpecimenMovementItem, TaxonomySpecimenMovementItemWithFlatRelatedData } from "./models";
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

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenMovementItem>(
    `movements?$count=true&$orderby=date&$filter=specimenId eq ${parentId}&$expand=incrementReason,decrementReason,contract($select=id,number),partner`
  );

  const [parentResult, parentPhylaResult, parentFamilyResult] = await fetchSpecimenSubViewParents(parentId);

  const [incrementReasonsError, incrementReasonsResult] = await fetchODataList<EnumerationType>(
    'incrementreasons?$orderby=sort'
  );

  const [decrementReasonsError, decrementReasonsResult] = await fetchODataList<EnumerationType>(
    'decrementreasons?$orderby=sort'
  );

  const movementsWithRelatedData = (listResult?.items || []).map(flattenODataMovementsResult);

  const tableSettings = await fetchTableSettings(userName!, SPECIMEN_MOVEMENTS_TABLE_ID, {
    columnOrder: movementsColumnDef.map(c => c.accessorKey!),
    columnVisibility: movementsColumnDefVisibility
  });

  return data({
    specimenId: parentId,
    specimenInfo: parentResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    phylumInfo: parentPhylaResult?.items[0],
    items: movementsWithRelatedData,
    hasEditPermission,
    incrementReasons: enumerationsToSelects(incrementReasonsResult?.items),
    decrementReasons: enumerationsToSelects(decrementReasonsResult?.items),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(SPECIMEN_MOVEMENTS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const goToDetail = (id: number) => {
    navigate(`/records/specimens/${loaderData.specimenId}/movements/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/specimens/${loaderData.specimenId}/movements/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<TaxonomySpecimenMovementItemWithFlatRelatedData>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: movementsColumnDef,
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

  useDefaultTableRedirects<TaxonomySpecimenMovementItemWithFlatRelatedData>({
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
      `/records/specimens/${loaderData.specimenId}/export-movements-xls`,
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
              currentPageName="Pohyby"
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
